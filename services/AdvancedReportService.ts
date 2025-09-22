import { supabase } from '../lib/supabase';

export interface ReportConfig {
    reportType: 'campaigns_detailed' | 'performance_by_broker' | 'audit_complete' | 'category_analysis' | 'ai_insights' | 'custom_analysis';
    reportName: string;
    reportDescription?: string;
    filters?: {
        dateRange?: { start: string; end: string };
        status?: string[];
        categories?: string[];
        brokers?: string[];
    };
    includeAI?: boolean;
    formats?: ('csv' | 'pdf' | 'markdown')[];
}

export interface GeneratedReport {
    id: string;
    report_type: string;
    report_name: string;
    report_description?: string;
    status: 'processing' | 'completed' | 'failed' | 'expired';
    progress_percentage: number;
    data_json?: any;
    ai_analysis?: any;
    insights?: string;
    created_by: string;
    created_at: string;
    completed_at?: string;
    expires_at: string;
    filters?: any;
    date_range?: any;
    csv_file_path?: string;
    pdf_file_path?: string;
    markdown_file_path?: string;
}

export class AdvancedReportService {
    /**
     * Gera relatório com IA Mistral
     */
    static async generateReportWithAI(config: ReportConfig): Promise<string> {
        try {

            // 1. Criar registro do relatório
            const { data: report, error: createError } = await supabase
                .from('generated_reports')
                .insert({
                    report_type: config.reportType,
                    report_name: config.reportName,
                    report_description: config.reportDescription,
                    status: 'processing',
                    progress_percentage: 0,
                    created_by: (await supabase.auth.getUser()).data.user?.id,
                    filters: config.filters,
                    date_range: config.filters?.dateRange
                })
                .select()
                .single();

            if (createError) {
                throw createError;
            }

            // 2. Processar em background
            this.processReportInBackground(report.id, config);

            return report.id;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Processa relatório em background
     */
    private static async processReportInBackground(reportId: string, config: ReportConfig): Promise<void> {
        try {

            // Atualizar progresso: 10%
            await this.updateReportProgress(reportId, 10, 'Coletando dados...');

            // 1. Coletar dados consolidados
            const consolidatedData = await this.collectConsolidatedData(config);
            
            // Atualizar progresso: 30%
            await this.updateReportProgress(reportId, 30, 'Processando dados...');

            // 2. Processar dados
            const processedData = await this.processData(consolidatedData, config);
            
            // Atualizar progresso: 50%
            await this.updateReportProgress(reportId, 50, 'Gerando arquivos...');

            // 4. Gerar arquivos
            const filePaths = await this.generateFiles(processedData, config, reportId);
            
            // Atualizar progresso: 90%
            await this.updateReportProgress(reportId, 90, 'Finalizando...');

            // 3. Finalizar relatório
            await this.finalizeReport(reportId, {
                data_json: processedData,
                ...filePaths
            });

        } catch (error) {
            await this.updateReportStatus(reportId, 'failed');
        }
    }

    /**
     * Coleta dados consolidados da tabela master_campaigns_data
     */
    private static async collectConsolidatedData(config: ReportConfig): Promise<any[]> {
        try {

            // Buscar dados da tabela master_campaigns_data
            let query = supabase
                .from('master_campaigns_data')
                .select('*');

            // Aplicar filtros
            if (config.filters?.dateRange) {
                query = query
                    .gte('goal_start_date', config.filters.dateRange.start)
                    .lte('goal_end_date', config.filters.dateRange.end);
            }

            if (config.filters?.status) {
                query = query.in('goal_status', config.filters.status);
            }

            if (config.filters?.categories) {
                query = query.in('goal_target_category_id', config.filters.categories);
            }

            const { data, error } = await query.order('unified_created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            throw error;
        }
    }

    /**
     * Processa dados para o relatório
     */
    private static async processData(data: any[], config: ReportConfig): Promise<any> {
        try {

            switch (config.reportType) {
                case 'campaigns_detailed':
                    return this.processCampaignsDetailed(data);
                case 'performance_by_broker':
                    return this.processPerformanceByBroker(data);
                case 'audit_complete':
                    return this.processAuditComplete(data);
                case 'category_analysis':
                    return this.processCategoryAnalysis(data);
                default:
                    return data;
            }

        } catch (error) {
            throw error;
        }
    }

    /**
     * Processa dados para relatório de campanhas detalhado
     */
    private static processCampaignsDetailed(data: any[]): any {
        // Agrupar por campanha (goal_id)
        const campaignMap = new Map();
        
        data.forEach(item => {
            const goalId = item.goal_id;
            if (!goalId) return;
            
            if (!campaignMap.has(goalId)) {
                campaignMap.set(goalId, {
                    id: item.goal_id,
                    title: item.goal_title,
                    type: item.goal_campaign_type,
                    status: item.goal_status,
                    start_date: item.goal_start_date,
                    end_date: item.goal_end_date,
                    target_value: item.goal_target,
                    current_value: item.goal_current_value,
                    progress_percentage: item.goal_progress_percentage,
                    creator: {
                        name: item.user_name,
                        email: item.user_email,
                        cpd: item.user_cpd
                    },
                    policies: [],
                    total_policies: 0,
                    total_value: 0
                });
            }
            
            const campaign = campaignMap.get(goalId);
            if (item.policy_id) {
                campaign.policies.push({
                    id: item.policy_id,
                    number: item.policy_number,
                    type: item.policy_type,
                    premium_value: item.policy_premium_value,
                    cpd_number: item.policy_cpd_number,
                    registration_date: item.policy_registration_date
                });
                campaign.total_policies++;
                campaign.total_value += parseFloat(item.policy_premium_value || 0);
            }
        });
        
        const campaigns = Array.from(campaignMap.values());
        
        return {
            summary: {
                total_campaigns: campaigns.length,
                active_campaigns: campaigns.filter(c => c.status === 'active').length,
                completed_campaigns: campaigns.filter(c => c.status === 'completed').length,
                total_policies: campaigns.reduce((sum, c) => sum + c.total_policies, 0),
                total_value: campaigns.reduce((sum, c) => sum + c.total_value, 0)
            },
            campaigns: campaigns
        };
    }

    /**
     * Processa dados para relatório de performance
     */
    private static processPerformanceByBroker(data: any[]): any {
        const performanceMap = new Map();

        data.forEach(item => {
            const cpd = item.user_cpd || item.policy_cpd_number;
            if (!cpd || cpd === 'N/A') return;

            if (!performanceMap.has(cpd)) {
                performanceMap.set(cpd, {
                    cpd: cpd,
                    name: item.user_name || 'N/A',
                    email: item.user_email || 'N/A',
                    campaigns_created: 0,
                    total_policies: 0,
                    total_value: 0,
                    auto_policies: 0,
                    auto_value: 0,
                    residential_policies: 0,
                    residential_value: 0
                });
            }

            const perf = performanceMap.get(cpd);
            
            // Contar campanhas criadas (por goal_id único)
            if (item.goal_id && !perf.campaigns_created) {
                perf.campaigns_created = 1;
            }
            
            // Contar apólices
            if (item.policy_id) {
                perf.total_policies++;
                perf.total_value += parseFloat(item.policy_premium_value || 0);
                
                if (item.policy_type === 'Seguro Auto') {
                    perf.auto_policies++;
                    perf.auto_value += parseFloat(item.policy_premium_value || 0);
                } else if (item.policy_type === 'Seguro Residencial') {
                    perf.residential_policies++;
                    perf.residential_value += parseFloat(item.policy_premium_value || 0);
                }
            }
        });

        const performance = Array.from(performanceMap.values()).sort((a, b) => b.total_value - a.total_value);

        return {
            summary: {
                total_brokers: performance.length,
                total_campaigns: performance.reduce((sum, p) => sum + p.campaigns_created, 0),
                total_policies: performance.reduce((sum, p) => sum + p.total_policies, 0),
                total_value: performance.reduce((sum, p) => sum + p.total_value, 0)
            },
            performance: performance
        };
    }

    /**
     * Processa dados para relatório de auditoria
     */
    private static async processAuditComplete(data: any[]): Promise<any> {
        // Usar dados da master_campaigns_data para auditoria
        const auditData = data.filter(item => item.policy_id && item.link_id);
        
        return {
            summary: {
                total_audits: auditData.length,
                total_policies: auditData.length,
                total_value: auditData.reduce((sum, item) => sum + parseFloat(item.policy_premium_value || 0), 0)
            },
            audits: auditData.map(item => ({
                id: item.audit_id || item.link_id,
                policy_id: item.policy_id,
                policy_number: item.policy_number,
                policy_type: item.policy_type,
                premium_value: item.policy_premium_value,
                cpd_number: item.policy_cpd_number,
                campaign_id: item.goal_id,
                campaign_title: item.goal_title,
                linked_at: item.link_linked_at,
                is_active: item.link_is_active,
                ai_confidence: item.link_ai_confidence,
                ai_reasoning: item.link_ai_reasoning
            }))
        };
    }

    /**
     * Processa dados para análise por categoria
     */
    private static processCategoryAnalysis(data: any[]): any {
        const categoryMap = new Map();

        data.forEach(item => {
            const category = item.goal_target_category_id || 'Sem Categoria';

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category_id: category,
                    category_name: category === 'Sem Categoria' ? 'Sem Categoria' : `Categoria ${category}`,
                    total_campaigns: 0,
                    active_campaigns: 0,
                    completed_campaigns: 0,
                    total_policies: 0,
                    total_value: 0,
                    participating_brokers: new Set()
                });
            }

            const cat = categoryMap.get(category);
            
            // Contar campanhas únicas
            if (item.goal_id) {
                cat.total_campaigns++;
                if (item.goal_status === 'active') cat.active_campaigns++;
                if (item.goal_status === 'completed') cat.completed_campaigns++;
            }
            
            // Contar apólices
            if (item.policy_id) {
                cat.total_policies++;
                cat.total_value += parseFloat(item.policy_premium_value || 0);
            }
            
            // Contar corretores únicos
            if (item.user_cpd) {
                cat.participating_brokers.add(item.user_cpd);
            }
        });

        const categories = Array.from(categoryMap.values()).map(cat => ({
            ...cat,
            participating_brokers: cat.participating_brokers.size
        })).sort((a, b) => b.total_value - a.total_value);

        return {
            summary: {
                total_categories: categories.length,
                total_campaigns: categories.reduce((sum, c) => sum + c.total_campaigns, 0),
                total_policies: categories.reduce((sum, c) => sum + c.total_policies, 0),
                total_value: categories.reduce((sum, c) => sum + c.total_value, 0)
            },
            categories: categories
        };
    }

    /**
     * Gera arquivos do relatório
     */
    private static async generateFiles(data: any, config: ReportConfig, reportId: string): Promise<any> {
        const filePaths: any = {};

        try {
            // Gerar CSV
            if (config.formats?.includes('csv')) {
                const csvContent = this.generateCSV(data, config);
                filePaths.csv_file_path = await this.saveFile(csvContent, `${reportId}.csv`, 'text/csv');
            }

            // Gerar Markdown
            if (config.formats?.includes('markdown')) {
                const markdownContent = this.generateMarkdown(data, config);
                filePaths.markdown_file_path = await this.saveFile(markdownContent, `${reportId}.md`, 'text/markdown');
            }

            // Gerar PDF (implementar conforme necessário)
            if (config.formats?.includes('pdf')) {
                // Implementar geração de PDF
                filePaths.pdf_file_path = `reports/${reportId}.pdf`;
            }

            return filePaths;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera conteúdo CSV
     */
    private static generateCSV(data: any, config: ReportConfig): string {
        try {

            switch (config.reportType) {
                case 'campaigns_detailed':
                    return this.generateCampaignsCSV(data);
                case 'performance_by_broker':
                    return this.generatePerformanceCSV(data);
                case 'audit_complete':
                    return this.generateAuditCSV(data);
                case 'category_analysis':
                    return this.generateCategoryCSV(data);
                default:
                    return this.generateDefaultCSV(data);
            }
        } catch (error) {
            return 'Erro ao gerar CSV';
        }
    }

    /**
     * Gera CSV para relatório de campanhas
     */
    private static generateCampaignsCSV(data: any): string {
        const headers = [
            'ID Campanha',
            'Título',
            'Tipo',
            'Status',
            'Data Início',
            'Data Fim',
            'Meta (R$)',
            'Valor Atual (R$)',
            'Progresso (%)',
            'Criador',
            'CPD Criador',
            'Total Apólices',
            'Valor Total (R$)'
        ];

        const rows = data.campaigns.map((campaign: any) => [
            campaign.id,
            campaign.title,
            campaign.type,
            campaign.status,
            campaign.start_date,
            campaign.end_date,
            campaign.target_value,
            campaign.current_value,
            campaign.progress_percentage,
            campaign.creator.name,
            campaign.creator.cpd,
            campaign.total_policies,
            campaign.total_value
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Gera CSV para relatório de performance
     */
    private static generatePerformanceCSV(data: any): string {
        const headers = [
            'CPD',
            'Nome',
            'Email',
            'Campanhas Criadas',
            'Total Apólices',
            'Valor Total (R$)',
            'Apólices Auto',
            'Valor Auto (R$)',
            'Apólices Residencial',
            'Valor Residencial (R$)'
        ];

        const rows = data.performance.map((perf: any) => [
            perf.cpd,
            perf.name,
            perf.email,
            perf.campaigns_created,
            perf.total_policies,
            perf.total_value,
            perf.auto_policies,
            perf.auto_value,
            perf.residential_policies,
            perf.residential_value
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Gera CSV para relatório de auditoria
     */
    private static generateAuditCSV(data: any): string {
        const headers = [
            'ID Auditoria',
            'ID Apólice',
            'Número Apólice',
            'Tipo Apólice',
            'Valor Prêmio (R$)',
            'CPD',
            'ID Campanha',
            'Título Campanha',
            'Data Vinculação',
            'Ativo',
            'Confiança IA',
            'Raciocínio IA'
        ];

        const rows = data.audits.map((audit: any) => [
            audit.id,
            audit.policy_id,
            audit.policy_number,
            audit.policy_type,
            audit.premium_value,
            audit.cpd_number,
            audit.campaign_id,
            audit.campaign_title,
            audit.linked_at,
            audit.is_active,
            audit.ai_confidence,
            audit.ai_reasoning
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Gera CSV para relatório de categoria
     */
    private static generateCategoryCSV(data: any): string {
        const headers = [
            'ID Categoria',
            'Nome Categoria',
            'Total Campanhas',
            'Campanhas Ativas',
            'Campanhas Concluídas',
            'Total Apólices',
            'Valor Total (R$)',
            'Corretores Participantes'
        ];

        const rows = data.categories.map((cat: any) => [
            cat.category_id,
            cat.category_name,
            cat.total_campaigns,
            cat.active_campaigns,
            cat.completed_campaigns,
            cat.total_policies,
            cat.total_value,
            cat.participating_brokers
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Gera CSV padrão
     */
    private static generateDefaultCSV(data: any): string {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Converte array para CSV
     */
    private static arrayToCSV(data: any[][]): string {
        return data.map(row => 
            row.map(cell => {
                const cellStr = String(cell || '');
                // Escapar aspas e vírgulas
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');
    }

    /**
     * Gera CSV da tabela completa
     */
    private static generateGeneralCSV(data: any[]): string {
        if (data.length === 0) {
            return 'Nenhum dado encontrado na tabela master_campaigns_data';
        }

        // Usar todas as colunas da tabela
        const headers = [
            'ID',
            'Goal ID',
            'Goal User ID',
            'Goal Title',
            'Goal Target',
            'Goal Unit',
            'Goal Type',
            'Goal Start Date',
            'Goal End Date',
            'Goal Status',
            'Goal Is Active',
            'Goal Current Value',
            'Goal Progress Percentage',
            'Goal Last Updated',
            'Goal Achieved At',
            'Goal Achieved Value',
            'Goal Is Notified',
            'Goal Previous Goal ID',
            'Goal Next Goal ID',
            'Goal Description',
            'Goal Created At',
            'Goal Updated At',
            'Goal Created By',
            'Goal Campaign Type',
            'Goal Target Type',
            'Goal Target Category ID',
            'Goal Parent Campaign ID',
            'Goal Acceptance Status',
            'Goal Accepted At',
            'Goal Accepted By',
            'Goal Record Type',
            'Policy ID',
            'Policy User ID',
            'Policy Number',
            'Policy Type',
            'Policy Premium Value',
            'Policy Registration Date',
            'Policy Contract Type',
            'Policy CPD Number',
            'Policy City',
            'Policy Ticket Code',
            'Policy Status',
            'Policy Created At',
            'Policy Updated At',
            'Policy Created By',
            'Link ID',
            'Link Policy ID',
            'Link Campaign ID',
            'Link User ID',
            'Link Linked At',
            'Link Linked By',
            'Link Linked Automatically',
            'Link Is Active',
            'Link Unlinked At',
            'Link Unlinked By',
            'Link Unlink Reason',
            'Link Created At',
            'Link Updated At',
            'Link AI Confidence',
            'Link AI Reasoning',
            'Audit ID',
            'Audit Policy ID',
            'Audit User ID',
            'Audit Policy Number',
            'Audit Policy Type',
            'Audit Contract Type',
            'Audit Premium Value',
            'Audit CPD Number',
            'Audit CPD Name',
            'Audit Linked Campaigns Count',
            'Audit Created At',
            'Audit Updated At',
            'User ID',
            'User Name',
            'User Email',
            'User CPD',
            'User Created At',
            'User Updated At',
            'Unified Created At',
            'Unified Updated At',
            'Unified Source'
        ];

        const rows = data.map(item => [
            item.id,
            item.goal_id,
            item.goal_user_id,
            item.goal_title,
            item.goal_target,
            item.goal_unit,
            item.goal_type,
            item.goal_start_date,
            item.goal_end_date,
            item.goal_status,
            item.goal_is_active,
            item.goal_current_value,
            item.goal_progress_percentage,
            item.goal_last_updated,
            item.goal_achieved_at,
            item.goal_achieved_value,
            item.goal_is_notified,
            item.goal_previous_goal_id,
            item.goal_next_goal_id,
            item.goal_description,
            item.goal_created_at,
            item.goal_updated_at,
            item.goal_created_by,
            item.goal_campaign_type,
            item.goal_target_type,
            item.goal_target_category_id,
            item.goal_parent_campaign_id,
            item.goal_acceptance_status,
            item.goal_accepted_at,
            item.goal_accepted_by,
            item.goal_record_type,
            item.policy_id,
            item.policy_user_id,
            item.policy_number,
            item.policy_type,
            item.policy_premium_value,
            item.policy_registration_date,
            item.policy_contract_type,
            item.policy_cpd_number,
            item.policy_city,
            item.policy_ticket_code,
            item.policy_status,
            item.policy_created_at,
            item.policy_updated_at,
            item.policy_created_by,
            item.link_id,
            item.link_policy_id,
            item.link_campaign_id,
            item.link_user_id,
            item.link_linked_at,
            item.link_linked_by,
            item.link_linked_automatically,
            item.link_is_active,
            item.link_unlinked_at,
            item.link_unlinked_by,
            item.link_unlink_reason,
            item.link_created_at,
            item.link_updated_at,
            item.link_ai_confidence,
            item.link_ai_reasoning,
            item.audit_id,
            item.audit_policy_id,
            item.audit_user_id,
            item.audit_policy_number,
            item.audit_policy_type,
            item.audit_contract_type,
            item.audit_premium_value,
            item.audit_cpd_number,
            item.audit_cpd_name,
            item.audit_linked_campaigns_count,
            item.audit_created_at,
            item.audit_updated_at,
            item.user_id,
            item.user_name,
            item.user_email,
            item.user_cpd,
            item.user_created_at,
            item.user_updated_at,
            item.unified_created_at,
            item.unified_updated_at,
            item.unified_source
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    /**
     * Gera conteúdo Markdown
     */
    private static generateMarkdown(data: any, config: ReportConfig): string {
        return `# ${config.reportName}

## Resumo
- Total de campanhas: ${data.summary.total_campaigns}
- Valor total: R$ ${data.summary.total_value?.toLocaleString('pt-BR') || 0}

## Dados Detalhados
${JSON.stringify(data, null, 2)}
        `;
    }

    /**
     * Salva arquivo
     */
    private static async saveFile(content: string, filename: string, mimeType: string): Promise<string> {
        // Implementar salvamento de arquivo
        return `reports/${filename}`;
    }

    /**
     * Atualiza progresso do relatório
     */
    private static async updateReportProgress(reportId: string, progress: number, message?: string): Promise<void> {
        try {
            await supabase
                .from('generated_reports')
                .update({
                    progress_percentage: progress,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId);

        } catch (error) {
        }
    }

    /**
     * Atualiza status do relatório
     */
    private static async updateReportStatus(reportId: string, status: string): Promise<void> {
        try {
            await supabase
                .from('generated_reports')
                .update({
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId);

        } catch (error) {
        }
    }

    /**
     * Finaliza relatório
     */
    private static async finalizeReport(reportId: string, data: any): Promise<void> {
        try {
            await supabase
                .from('generated_reports')
                .update({
                    ...data,
                    status: 'completed',
                    progress_percentage: 100,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Busca relatórios gerados
     */
    static async getGeneratedReports(): Promise<GeneratedReport[]> {
        try {
            const { data, error } = await supabase
                .from('generated_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (error) {
            throw error;
        }
    }

    /**
     * Baixa arquivo do relatório
     */
    static async downloadReportFile(reportId: string, format: 'csv' | 'pdf' | 'markdown'): Promise<void> {
        try {

            // Buscar dados do relatório
            const { data: report, error } = await supabase
                .from('generated_reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (error) throw error;
            if (!report) throw new Error('Relatório não encontrado');

            // Gerar CSV diretamente
            if (format === 'csv' && report.data_json) {
                const csvContent = this.generateCSV(report.data_json, {
                    reportType: report.report_type as any,
                    reportName: report.report_name,
                    formats: ['csv']
                });
                
                // Download direto
                this.downloadCSV(csvContent, `${report.report_name}.csv`);
            }
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera relatório com progresso e salva na tabela generated_reports
     */
    static async generateReportWithProgress(reportType: string): Promise<string> {
        try {

            const reportNames = {
                'campaigns_detailed': 'Relatório de Campanhas Detalhado',
                'performance_by_broker': 'Relatório de Performance por Corretor',
                'audit_complete': 'Relatório de Auditoria Completa',
                'category_analysis': 'Relatório por Categoria',
                'general_complete': 'Relatório Geral - Tabela Completa'
            };

            const reportDescriptions = {
                'campaigns_detailed': 'Relatório detalhado de todas as campanhas com dados consolidados',
                'performance_by_broker': 'Análise de performance por corretor com métricas de vendas',
                'audit_complete': 'Auditoria completa com timeline de todas as operações',
                'category_analysis': 'Análise de performance por categoria de corretor',
                'general_complete': 'Exportação completa de todos os dados da tabela master_campaigns_data'
            };

            // 1. Criar registro do relatório
            const { data: report, error: createError } = await supabase
                .from('generated_reports')
                .insert({
                    report_type: reportType,
                    report_name: `${reportNames[reportType as keyof typeof reportNames]} - ${new Date().toLocaleDateString('pt-BR')}`,
                    report_description: reportDescriptions[reportType as keyof typeof reportDescriptions],
                    status: 'processing',
                    progress_percentage: 0,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (createError) {
                throw createError;
            }

            // 2. Processar em background com progresso
            this.processReportWithProgress(report.id, reportType);

            return report.id;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Processa relatório em background com atualizações de progresso
     */
    private static async processReportWithProgress(reportId: string, reportType: string): Promise<void> {
        try {

            // Atualizar progresso: 10%
            await this.updateReportProgress(reportId, 10, 'Coletando dados...');

            // 1. Coletar dados consolidados
            const { data, error } = await supabase
                .from('master_campaigns_data')
                .select('*')
                .order('unified_created_at', { ascending: false });

            if (error) throw error;

            // Atualizar progresso: 30%
            await this.updateReportProgress(reportId, 30, 'Processando dados...');

            // 2. Processar dados
            let processedData;
            if (reportType === 'general_complete') {
                processedData = data || [];
            } else {
                processedData = await this.processData(data || [], {
                    reportType: reportType as any,
                    reportName: `Relatório ${reportType}`,
                    formats: ['csv']
                });
            }
            
            // Atualizar progresso: 50%
            await this.updateReportProgress(reportId, 50, 'Gerando arquivos...');

            // 3. Gerar CSV
            let csvContent;
            if (reportType === 'general_complete') {
                csvContent = this.generateGeneralCSV(data || []);
            } else {
                csvContent = this.generateCSV(processedData, {
                    reportType: reportType as any,
                    reportName: `Relatório ${reportType}`,
                    formats: ['csv']
                });
            }
            
            // Atualizar progresso: 70%
            await this.updateReportProgress(reportId, 70, 'Salvando relatório...');

            // 4. Salvar dados e finalizar
            await this.finalizeReport(reportId, {
                data_json: processedData,
                csv_file_path: `reports/${reportId}.csv`
            });

            // Atualizar progresso: 100%
            await this.updateReportProgress(reportId, 100, 'Relatório concluído!');

        } catch (error) {
            await this.updateReportStatus(reportId, 'failed');
        }
    }

    /**
     * Gera e baixa CSV diretamente
     */
    static async generateAndDownloadCSV(reportType: string): Promise<void> {
        try {

            // Buscar dados da master_campaigns_data
            const { data, error } = await supabase
                .from('master_campaigns_data')
                .select('*')
                .order('unified_created_at', { ascending: false });

            if (error) throw error;

            // Para relatório geral, baixar tabela completa
            if (reportType === 'general_complete') {
                const csvContent = this.generateGeneralCSV(data || []);
                const fileName = `tabela_completa_${new Date().toISOString().split('T')[0]}.csv`;
                this.downloadCSV(csvContent, fileName);
                return;
            }

            // Processar dados para outros relatórios
            const processedData = await this.processData(data || [], {
                reportType: reportType as any,
                reportName: `Relatório ${reportType}`,
                formats: ['csv']
            });

            // Gerar CSV
            const csvContent = this.generateCSV(processedData, {
                reportType: reportType as any,
                reportName: `Relatório ${reportType}`,
                formats: ['csv']
            });

            // Download
            const fileName = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadCSV(csvContent, fileName);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Faz download do CSV
     */
    private static downloadCSV(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Exclui um relatório
     */
    static async deleteReport(reportId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('generated_reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;

        } catch (error) {
            throw error;
        }
    }
}
