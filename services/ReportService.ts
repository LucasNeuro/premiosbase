import { supabase } from '../lib/supabase';

export interface CampaignReportData {
    // Dados da Campanha
    campaign_id: string;
    campaign_title: string;
    campaign_type: string;
    campaign_status: string;
    start_date: string;
    end_date: string;
    target_value: number;
    current_value: number;
    progress_percentage: number;
    
    // Dados do Corretor Criador
    creator_id: string;
    creator_name: string;
    creator_email: string;
    creator_cpd: string;
    
    // Dados do Corretor que Aceitou (se diferente)
    accepter_id?: string;
    accepter_name?: string;
    accepter_email?: string;
    accepter_cpd?: string;
    accepted_at?: string;
    
    // Dados das Apólices
    total_policies: number;
    total_premium_value: number;
    auto_policies: number;
    auto_premium_value: number;
    residential_policies: number;
    residential_premium_value: number;
    
    // Dados dos Participantes
    participating_brokers: number;
    participating_cpds: string;
    
    // Dados dos Prêmios
    total_prizes: number;
    prize_names: string;
    prize_values: string;
    
    // Metadados
    created_at: string;
    last_updated: string;
}

export class ReportService {
    /**
     * Busca dados consolidados da view
     */
    static async getConsolidatedData(): Promise<any[]> {
        try {

            const { data, error } = await supabase
                .from('v_campaigns_consolidated')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera relatório completo de todas as campanhas
     */
    static async generateCampaignsReport(): Promise<CampaignReportData[]> {
        try {

            // Buscar dados consolidados da view
            const consolidatedData = await this.getConsolidatedData();

            if (consolidatedData.length === 0) {
                return [];
            }

            // Converter dados consolidados para formato do relatório
            const reportData: CampaignReportData[] = consolidatedData.map(item => ({
                // Dados da Campanha
                campaign_id: item.campaign_id,
                campaign_title: item.campaign_title,
                campaign_type: item.campaign_type || 'simple',
                campaign_status: item.campaign_status,
                start_date: item.start_date || '',
                end_date: item.end_date || '',
                target_value: item.target_value,
                current_value: item.current_value || 0,
                progress_percentage: Math.round((item.progress_percentage || 0) * 100) / 100,
                
                // Dados do Corretor Criador
                creator_id: item.creator_id || '',
                creator_name: item.creator_name || 'N/A',
                creator_email: item.creator_email || 'N/A',
                creator_cpd: item.creator_cpd || 'N/A',
                
                // Dados do Corretor que Aceitou
                accepter_id: item.accepter_id || '',
                accepter_name: item.accepter_name || '',
                accepter_email: item.accepter_email || '',
                accepter_cpd: item.accepter_cpd || '',
                accepted_at: item.accepted_at || '',
                
                // Dados das Apólices
                total_policies: item.total_policies || 0,
                total_premium_value: item.total_premium_value || 0,
                auto_policies: item.auto_policies || 0,
                auto_premium_value: item.auto_premium_value || 0,
                residential_policies: item.residential_policies || 0,
                residential_premium_value: item.residential_premium_value || 0,
                
                // Dados dos Participantes
                participating_brokers: item.participating_brokers || 0,
                participating_cpds: item.participating_cpds || '',
                
                // Dados dos Prêmios
                total_prizes: item.total_prizes || 0,
                prize_names: item.prize_names || '',
                prize_values: item.prize_values || '',
                
                // Metadados
                created_at: item.created_at,
                last_updated: item.last_updated || item.created_at
            }));

            return reportData;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Converte dados do relatório para CSV
     */
    static convertToCSV(data: CampaignReportData[]): string {
        if (data.length === 0) {
            return 'Nenhum dado encontrado';
        }

        // Cabeçalhos do CSV
        const headers = [
            'ID da Campanha',
            'Título da Campanha',
            'Tipo da Campanha',
            'Status',
            'Data Início',
            'Data Fim',
            'Meta (R$)',
            'Valor Atual (R$)',
            'Progresso (%)',
            'ID Criador',
            'Nome do Criador',
            'Email do Criador',
            'CPD do Criador',
            'ID Aceitador',
            'Nome do Aceitador',
            'Email do Aceitador',
            'CPD do Aceitador',
            'Data de Aceitação',
            'Total de Apólices',
            'Valor Total (R$)',
            'Apólices Auto',
            'Valor Auto (R$)',
            'Apólices Residencial',
            'Valor Residencial (R$)',
            'Corretores Participantes',
            'CPDs Participantes',
            'Total de Prêmios',
            'Nomes dos Prêmios',
            'Valores dos Prêmios',
            'Data de Criação',
            'Última Atualização'
        ];

        // Converter dados para linhas CSV
        const rows = data.map(item => [
            item.campaign_id,
            item.campaign_title,
            item.campaign_type,
            item.campaign_status,
            item.start_date,
            item.end_date,
            item.target_value.toFixed(2),
            item.current_value.toFixed(2),
            item.progress_percentage.toFixed(2),
            item.creator_id,
            item.creator_name,
            item.creator_email,
            item.creator_cpd,
            item.accepter_id || '',
            item.accepter_name || '',
            item.accepter_email || '',
            item.accepter_cpd || '',
            item.accepted_at || '',
            item.total_policies.toString(),
            item.total_premium_value.toFixed(2),
            item.auto_policies.toString(),
            item.auto_premium_value.toFixed(2),
            item.residential_policies.toString(),
            item.residential_premium_value.toFixed(2),
            item.participating_brokers.toString(),
            item.participating_cpds,
            item.total_prizes.toString(),
            item.prize_names,
            item.prize_values,
            item.created_at,
            item.last_updated
        ]);

        // Combinar cabeçalhos e dados
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    /**
     * Gera relatório de performance por corretor
     */
    static async generatePerformanceReport(): Promise<any[]> {
        try {

            const consolidatedData = await this.getConsolidatedData();
            
            // Agrupar por CPD do criador
            const performanceMap = new Map();
            
            consolidatedData.forEach(item => {
                const cpd = item.creator_cpd;
                if (!cpd || cpd === 'N/A') return;
                
                if (!performanceMap.has(cpd)) {
                    performanceMap.set(cpd, {
                        cpd: cpd,
                        name: item.creator_name,
                        email: item.creator_email,
                        campaigns_created: 0,
                        campaigns_accepted: 0,
                        total_policies: 0,
                        total_value: 0,
                        auto_policies: 0,
                        auto_value: 0,
                        residential_policies: 0,
                        residential_value: 0
                    });
                }
                
                const perf = performanceMap.get(cpd);
                perf.campaigns_created++;
                if (item.acceptance_status === 'accepted') perf.campaigns_accepted++;
                perf.total_policies += item.total_policies || 0;
                perf.total_value += item.total_premium_value || 0;
                perf.auto_policies += item.auto_policies || 0;
                perf.auto_value += item.auto_premium_value || 0;
                perf.residential_policies += item.residential_policies || 0;
                perf.residential_value += item.residential_premium_value || 0;
            });
            
            return Array.from(performanceMap.values()).sort((a, b) => b.total_value - a.total_value);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera relatório de auditoria completa
     */
    static async generateAuditReport(): Promise<any[]> {
        try {

            const consolidatedData = await this.getConsolidatedData();
            
            // Buscar dados de auditoria das apólices
            const { data: auditData, error } = await supabase
                .from('policy_launch_audit')
                .select(`
                    *,
                    policy:policies(policy_number, type, premium_value, cpd_number, registration_date)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return auditData || [];
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera relatório por categoria
     */
    static async generateCategoryReport(): Promise<any[]> {
        try {

            const consolidatedData = await this.getConsolidatedData();
            
            // Agrupar por categoria
            const categoryMap = new Map();
            
            consolidatedData.forEach(item => {
                const category = item.category_name || 'Sem Categoria';
                
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, {
                        category_name: category,
                        category_description: item.category_description || '',
                        total_campaigns: 0,
                        active_campaigns: 0,
                        completed_campaigns: 0,
                        total_policies: 0,
                        total_value: 0,
                        participating_brokers: 0
                    });
                }
                
                const cat = categoryMap.get(category);
                cat.total_campaigns++;
                if (item.campaign_status === 'active') cat.active_campaigns++;
                if (item.campaign_status === 'completed') cat.completed_campaigns++;
                cat.total_policies += item.total_policies || 0;
                cat.total_value += item.total_premium_value || 0;
                cat.participating_brokers += item.participating_brokers || 0;
            });
            
            return Array.from(categoryMap.values()).sort((a, b) => b.total_value - a.total_value);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera e baixa o relatório CSV
     */
    static async downloadCampaignsReport(): Promise<void> {
        try {

            // Gerar dados do relatório
            const reportData = await this.generateCampaignsReport();
            
            // Converter para CSV
            const csvContent = this.convertToCSV(reportData);
            
            // Criar e baixar arquivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_campanhas_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Gera e baixa relatório de performance
     */
    static async downloadPerformanceReport(): Promise<void> {
        try {

            const reportData = await this.generatePerformanceReport();
            const csvContent = this.convertPerformanceToCSV(reportData);
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_performance_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Converte dados de performance para CSV
     */
    static convertPerformanceToCSV(data: any[]): string {
        if (data.length === 0) {
            return 'Nenhum dado encontrado';
        }

        const headers = [
            'CPD',
            'Nome do Corretor',
            'Email',
            'Campanhas Criadas',
            'Campanhas Aceitas',
            'Total de Apólices',
            'Valor Total (R$)',
            'Apólices Auto',
            'Valor Auto (R$)',
            'Apólices Residencial',
            'Valor Residencial (R$)'
        ];

        const rows = data.map(item => [
            item.cpd,
            item.name,
            item.email,
            item.campaigns_created.toString(),
            item.campaigns_accepted.toString(),
            item.total_policies.toString(),
            item.total_value.toFixed(2),
            item.auto_policies.toString(),
            item.auto_value.toFixed(2),
            item.residential_policies.toString(),
            item.residential_value.toFixed(2)
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }
}
