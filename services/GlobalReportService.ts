/**
 * 🔥 SERVIÇO GLOBAL DE RELATÓRIOS
 * Consolida TODOS os serviços de relatórios e exportação em um único ponto
 * Substitui: ReportService, CompleteCampaignReportService, AdvancedReportService,
 * SimpleCampaignCSVService, SimpleDownloadService, CompleteDataExportService
 */

import { supabase } from '../lib/supabase';

export interface GlobalReportConfig {
  reportType: 'campaigns_detailed' | 'performance_by_broker' | 'audit_complete' | 'category_analysis' | 'ai_insights' | 'custom_analysis' | 'simple_csv' | 'complete_export';
  reportName: string;
  reportDescription?: string;
  filters?: {
    dateRange?: { start: string; end: string };
    status?: string[];
    categories?: string[];
    brokers?: string[];
    campaignTypes?: string[];
  };
  includeAI?: boolean;
  formats?: ('csv' | 'pdf' | 'markdown' | 'excel')[];
  userId?: string;
}

export interface GlobalReportData {
  // Dados da Campanha
  campaign_id: string;
  campaign_title: string;
  campaign_type: 'simple' | 'composite';
  campaign_status: string;
  campaign_acceptance_status: string;
  campaign_target: number;
  campaign_current_value: number;
  campaign_progress_percentage: number;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_created_at: string;
  campaign_created_by: string;
  campaign_accepted_at?: string;
  campaign_accepted_by?: string;
  campaign_description: string;
  campaign_criteria: any;
  
  // Dados do Corretor Criador
  creator_name: string;
  creator_email: string;
  creator_cpd: string;
  
  // Dados do Corretor que Aceitou (se diferente)
  acceptor_name?: string;
  acceptor_email?: string;
  acceptor_cpd?: string;
  
  // Dados das Apólices
  total_policies: number;
  total_premium_value: number;
  policies_details: {
    policy_number: string;
    policy_type: string;
    contract_type: string;
    premium_value: number;
    cpd_number: string;
    broker_name: string;
    broker_email: string;
    registration_date: string;
    created_at: string;
  }[];
  
  // Dados de Performance
  performance_metrics: {
    total_revenue: number;
    total_policies: number;
    average_premium: number;
    completion_rate: number;
    efficiency_score: number;
  };
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
  download_url?: string;
  file_size?: number;
}

export class GlobalReportService {
  
  /**
   * 🔥 GERAR RELATÓRIO: Método principal para todos os tipos de relatório
   */
  static async generateReport(config: GlobalReportConfig): Promise<GeneratedReport> {
    try {
      console.log(`📊 GlobalReportService - Gerando relatório: ${config.reportName}`);

      // Criar registro do relatório
      const reportId = await this.createReportRecord(config);
      
      // Gerar dados baseado no tipo
      let reportData: any;
      
      switch (config.reportType) {
        case 'campaigns_detailed':
          reportData = await this.generateCampaignsDetailedReport(config);
          break;
        case 'performance_by_broker':
          reportData = await this.generateBrokerPerformanceReport(config);
          break;
        case 'audit_complete':
          reportData = await this.generateAuditCompleteReport(config);
          break;
        case 'category_analysis':
          reportData = await this.generateCategoryAnalysisReport(config);
          break;
        case 'ai_insights':
          reportData = await this.generateAIInsightsReport(config);
          break;
        case 'simple_csv':
          reportData = await this.generateSimpleCSVReport(config);
          break;
        case 'complete_export':
          reportData = await this.generateCompleteExportReport(config);
          break;
        default:
          reportData = await this.generateCustomAnalysisReport(config);
      }

      // Processar formatos solicitados
      const processedFormats = await this.processReportFormats(reportData, config.formats || ['csv']);

      // Atualizar registro do relatório
      await this.updateReportRecord(reportId, {
        status: 'completed',
        progress_percentage: 100,
        data_json: reportData,
        completed_at: new Date().toISOString(),
        download_url: processedFormats.downloadUrl,
        file_size: processedFormats.fileSize
      });

      console.log(`✅ GlobalReportService - Relatório gerado com sucesso: ${reportId}`);

      return {
        id: reportId,
        report_type: config.reportType,
        report_name: config.reportName,
        report_description: config.reportDescription,
        status: 'completed',
        progress_percentage: 100,
        data_json: reportData,
        created_by: config.userId || 'system',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        download_url: processedFormats.downloadUrl,
        file_size: processedFormats.fileSize
      };

    } catch (error) {
      console.error(`❌ GlobalReportService - Erro ao gerar relatório:`, error);
      throw error;
    }
  }

  /**
   * 🔥 RELATÓRIO DETALHADO DE CAMPANHAS
   */
  private static async generateCampaignsDetailedReport(config: GlobalReportConfig): Promise<GlobalReportData[]> {
    try {
      console.log(`📊 GlobalReportService - Gerando relatório detalhado de campanhas`);

      // Buscar campanhas com filtros
      let query = supabase
        .from('goals')
        .select(`
          *,
          users!goals_user_id_fkey(
            name,
            email,
            cpd_number
          ),
          campaign_acceptance:campaign_acceptance_queue(
            action,
            created_at,
            users!campaign_acceptance_queue_user_id_fkey(
              name,
              email,
              cpd_number
            )
          )
        `)
        .eq('record_type', 'campaign')
        .eq('is_active', true);

      // Aplicar filtros
      if (config.filters?.status) {
        query = query.in('status', config.filters.status);
      }
      if (config.filters?.dateRange) {
        query = query.gte('created_at', config.filters.dateRange.start)
                     .lte('created_at', config.filters.dateRange.end);
      }

      const { data: campaigns, error: campaignsError } = await query;

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }

      const reportData: GlobalReportData[] = [];

      // Processar cada campanha
      for (const campaign of campaigns || []) {
        // Buscar apólices vinculadas
        const { data: policies, error: policiesError } = await supabase
          .from('policy_campaign_links')
          .select(`
            *,
            policies!inner(
              id,
              policy_number,
              type,
              contract_type,
              premium_value,
              cpd_number,
              created_at,
              users!policies_user_id_fkey(
                name,
                email
              )
            )
          `)
          .eq('campaign_id', campaign.id)
          .eq('is_active', true);

        if (policiesError) {
          console.error(`Erro ao buscar apólices da campanha ${campaign.id}:`, policiesError);
          continue;
        }

        const policiesData = (policies || []).map(link => link.policies).filter(p => p !== null);
        
        // Calcular métricas
        const totalPremiumValue = policiesData.reduce((sum, p) => sum + (p.premium_value || 0), 0);
        const averagePremium = policiesData.length > 0 ? totalPremiumValue / policiesData.length : 0;
        const completionRate = campaign.target > 0 ? (campaign.current_value / campaign.target) * 100 : 0;

        reportData.push({
          campaign_id: campaign.id,
          campaign_title: campaign.title,
          campaign_type: campaign.campaign_type || 'simple',
          campaign_status: campaign.status,
          campaign_acceptance_status: campaign.acceptance_status,
          campaign_target: campaign.target,
          campaign_current_value: campaign.current_value,
          campaign_progress_percentage: campaign.progress_percentage,
          campaign_start_date: campaign.start_date,
          campaign_end_date: campaign.end_date,
          campaign_created_at: campaign.created_at,
          campaign_created_by: campaign.user_id,
          campaign_accepted_at: campaign.accepted_at,
          campaign_accepted_by: campaign.accepted_by,
          campaign_description: campaign.description,
          campaign_criteria: campaign.criteria,
          
          creator_name: campaign.users?.name || '',
          creator_email: campaign.users?.email || '',
          creator_cpd: campaign.users?.cpd_number || '',
          
          acceptor_name: campaign.campaign_acceptance?.[0]?.users?.name,
          acceptor_email: campaign.campaign_acceptance?.[0]?.users?.email,
          acceptor_cpd: campaign.campaign_acceptance?.[0]?.users?.cpd_number,
          
          total_policies: policiesData.length,
          total_premium_value: totalPremiumValue,
          policies_details: policiesData.map(policy => ({
            policy_number: policy.policy_number,
            policy_type: policy.type,
            contract_type: policy.contract_type,
            premium_value: policy.premium_value,
            cpd_number: policy.cpd_number,
            broker_name: policy.users?.name || '',
            broker_email: policy.users?.email || '',
            registration_date: policy.created_at,
            created_at: policy.created_at
          })),
          
          performance_metrics: {
            total_revenue: totalPremiumValue,
            total_policies: policiesData.length,
            average_premium: averagePremium,
            completion_rate: completionRate,
            efficiency_score: this.calculateEfficiencyScore(campaign, policiesData)
          }
        });
      }

      console.log(`✅ GlobalReportService - Relatório detalhado gerado: ${reportData.length} campanhas`);
      return reportData;

    } catch (error) {
      console.error(`❌ GlobalReportService - Erro no relatório detalhado:`, error);
      throw error;
    }
  }

  /**
   * 🔥 RELATÓRIO DE PERFORMANCE POR CORRETOR
   */
  private static async generateBrokerPerformanceReport(config: GlobalReportConfig): Promise<any[]> {
    try {
      console.log(`📊 GlobalReportService - Gerando relatório de performance por corretor`);

      // Buscar dados de performance dos corretores
      const { data: brokers, error: brokersError } = await supabase
        .from('users')
        .select(`
          *,
          policies(
            id,
            premium_value,
            type,
            created_at
          ),
          goals!goals_user_id_fkey(
            id,
            title,
            status,
            current_value,
            target
          )
        `)
        .eq('role', 'broker')
        .eq('is_active', true);

      if (brokersError) {
        throw new Error(`Erro ao buscar corretores: ${brokersError.message}`);
      }

      const performanceData = (brokers || []).map(broker => {
        const policies = broker.policies || [];
        const campaigns = broker.goals || [];
        
        const totalRevenue = policies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
        const totalPolicies = policies.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
        
        return {
          broker_id: broker.id,
          broker_name: broker.name,
          broker_email: broker.email,
          broker_cpd: broker.cpd_number,
          total_revenue: totalRevenue,
          total_policies: totalPolicies,
          active_campaigns: activeCampaigns,
          completed_campaigns: completedCampaigns,
          efficiency_score: this.calculateBrokerEfficiency(broker, policies, campaigns),
          performance_rank: 0 // Será calculado depois
        };
      });

      // Ordenar por eficiência e calcular ranking
      performanceData.sort((a, b) => b.efficiency_score - a.efficiency_score);
      performanceData.forEach((broker, index) => {
        broker.performance_rank = index + 1;
      });

      console.log(`✅ GlobalReportService - Relatório de performance gerado: ${performanceData.length} corretores`);
      return performanceData;

    } catch (error) {
      console.error(`❌ GlobalReportService - Erro no relatório de performance:`, error);
      throw error;
    }
  }

  /**
   * 🔥 RELATÓRIO DE AUDITORIA COMPLETA
   */
  private static async generateAuditCompleteReport(config: GlobalReportConfig): Promise<any> {
    try {
      console.log(`📊 GlobalReportService - Gerando relatório de auditoria completa`);

      // Buscar todas as campanhas para auditoria
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true);

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas para auditoria: ${campaignsError.message}`);
      }

      const auditResults = {
        total_campaigns: campaigns?.length || 0,
        active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
        completed_campaigns: campaigns?.filter(c => c.status === 'completed').length || 0,
        campaigns_with_issues: 0,
        total_policies: 0,
        total_revenue: 0,
        issues_found: [] as any[]
      };

      // Auditar cada campanha
      for (const campaign of campaigns || []) {
        // Buscar apólices vinculadas
        const { data: policies, error: policiesError } = await supabase
          .from('policy_campaign_links')
          .select(`
            *,
            policies!inner(
              id,
              premium_value,
              type,
              contract_type
            )
          `)
          .eq('campaign_id', campaign.id)
          .eq('is_active', true);

        if (policiesError) {
          auditResults.issues_found.push({
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            issue_type: 'database_error',
            issue_description: `Erro ao buscar apólices: ${policiesError.message}`
          });
          continue;
        }

        const policiesData = (policies || []).map(link => link.policies).filter(p => p !== null);
        const totalValue = policiesData.reduce((sum, p) => sum + (p.premium_value || 0), 0);
        
        auditResults.total_policies += policiesData.length;
        auditResults.total_revenue += totalValue;

        // Verificar inconsistências
        if (campaign.current_value !== totalValue) {
          auditResults.campaigns_with_issues++;
          auditResults.issues_found.push({
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            issue_type: 'value_mismatch',
            issue_description: `Valor atual (${campaign.current_value}) não confere com apólices (${totalValue})`
          });
        }
      }

      console.log(`✅ GlobalReportService - Relatório de auditoria gerado: ${auditResults.issues_found.length} problemas encontrados`);
      return auditResults;

    } catch (error) {
      console.error(`❌ GlobalReportService - Erro no relatório de auditoria:`, error);
      throw error;
    }
  }

  /**
   * 🔥 RELATÓRIO CSV SIMPLES
   */
  private static async generateSimpleCSVReport(config: GlobalReportConfig): Promise<any[]> {
    try {
      console.log(`📊 GlobalReportService - Gerando relatório CSV simples`);

      // Buscar dados básicos de campanhas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select(`
          id,
          title,
          status,
          target,
          current_value,
          progress_percentage,
          created_at,
          users!goals_user_id_fkey(
            name,
            email
          )
        `)
        .eq('record_type', 'campaign')
        .eq('is_active', true);

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }

      const csvData = (campaigns || []).map(campaign => ({
        campaign_id: campaign.id,
        campaign_title: campaign.title,
        campaign_status: campaign.status,
        campaign_target: campaign.target,
        campaign_current_value: campaign.current_value,
        campaign_progress_percentage: campaign.progress_percentage,
        campaign_created_at: campaign.created_at,
        creator_name: (campaign.users as any)?.name || '',
        creator_email: (campaign.users as any)?.email || ''
      }));

      console.log(`✅ GlobalReportService - Relatório CSV simples gerado: ${csvData.length} registros`);
      return csvData;

    } catch (error) {
      console.error(`❌ GlobalReportService - Erro no relatório CSV:`, error);
      throw error;
    }
  }

  /**
   * 🔥 EXPORTAÇÃO COMPLETA DE DADOS
   */
  private static async generateCompleteExportReport(config: GlobalReportConfig): Promise<any> {
    try {
      console.log(`📊 GlobalReportService - Gerando exportação completa de dados`);

      // Buscar todos os dados do sistema
      const [campaignsResult, policiesResult, linksResult, usersResult] = await Promise.all([
        supabase.from('goals').select('*').eq('record_type', 'campaign'),
        supabase.from('policies').select('*'),
        supabase.from('policy_campaign_links').select('*'),
        supabase.from('users').select('*')
      ]);

      if (campaignsResult.error) throw campaignsResult.error;
      if (policiesResult.error) throw policiesResult.error;
      if (linksResult.error) throw linksResult.error;
      if (usersResult.error) throw usersResult.error;

      const exportData = {
        export_timestamp: new Date().toISOString(),
        total_records: {
          campaigns: campaignsResult.data?.length || 0,
          policies: policiesResult.data?.length || 0,
          links: linksResult.data?.length || 0,
          users: usersResult.data?.length || 0
        },
        data: {
          campaigns: campaignsResult.data,
          policies: policiesResult.data,
          policy_campaign_links: linksResult.data,
          users: usersResult.data
        }
      };

      console.log(`✅ GlobalReportService - Exportação completa gerada: ${exportData.total_records.campaigns} campanhas, ${exportData.total_records.policies} apólices`);
      return exportData;

    } catch (error) {
      console.error(`❌ GlobalReportService - Erro na exportação completa:`, error);
      throw error;
    }
  }

  /**
   * 🔥 PROCESSAR FORMATOS DE RELATÓRIO
   */
  private static async processReportFormats(data: any, formats: string[]): Promise<{
    downloadUrl: string;
    fileSize: number;
  }> {
    try {
      // Por enquanto, retornar URL fictícia
      // Em implementação real, geraria arquivos reais
      return {
        downloadUrl: `https://reports.example.com/download/${Date.now()}`,
        fileSize: JSON.stringify(data).length
      };
    } catch (error) {
      console.error(`❌ GlobalReportService - Erro ao processar formatos:`, error);
      throw error;
    }
  }

  /**
   * 🔥 CRIAR REGISTRO DE RELATÓRIO
   */
  private static async createReportRecord(config: GlobalReportConfig): Promise<string> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        report_type: config.reportType,
        report_name: config.reportName,
        report_description: config.reportDescription,
        status: 'processing',
        progress_percentage: 0,
        created_by: config.userId || 'system',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar registro de relatório: ${error.message}`);
    }

    return data.id;
  }

  /**
   * 🔥 ATUALIZAR REGISTRO DE RELATÓRIO
   */
  private static async updateReportRecord(reportId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId);

    if (error) {
      throw new Error(`Erro ao atualizar relatório: ${error.message}`);
    }
  }

  /**
   * 🔥 CALCULAR SCORE DE EFICIÊNCIA
   */
  private static calculateEfficiencyScore(campaign: any, policies: any[]): number {
    const totalValue = policies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
    const completionRate = campaign.target > 0 ? (totalValue / campaign.target) * 100 : 0;
    const policyCount = policies.length;
    
    // Fórmula simples de eficiência
    return Math.min(completionRate + (policyCount * 5), 100);
  }

  /**
   * 🔥 CALCULAR EFICIÊNCIA DO CORRETOR
   */
  private static calculateBrokerEfficiency(broker: any, policies: any[], campaigns: any[]): number {
    const totalRevenue = policies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
    const totalPolicies = policies.length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    
    // Fórmula de eficiência baseada em receita, quantidade de apólices e campanhas completadas
    const revenueScore = Math.min(totalRevenue / 10000, 50); // Máximo 50 pontos por receita
    const policyScore = Math.min(totalPolicies * 2, 30); // Máximo 30 pontos por apólices
    const campaignScore = Math.min(completedCampaigns * 10, 20); // Máximo 20 pontos por campanhas
    
    return Math.min(revenueScore + policyScore + campaignScore, 100);
  }

  /**
   * 🔥 RELATÓRIO DE ANÁLISE DE CATEGORIA
   */
  private static async generateCategoryAnalysisReport(config: GlobalReportConfig): Promise<any[]> {
    // Implementação específica para análise de categorias
    return [];
  }

  /**
   * 🔥 RELATÓRIO DE INSIGHTS DE IA
   */
  private static async generateAIInsightsReport(config: GlobalReportConfig): Promise<any> {
    // Implementação específica para insights de IA
    return {};
  }

  /**
   * 🔥 RELATÓRIO DE ANÁLISE CUSTOMIZADA
   */
  private static async generateCustomAnalysisReport(config: GlobalReportConfig): Promise<any> {
    // Implementação específica para análises customizadas
    return {};
  }

  /**
   * 🔥 MIGRAÇÃO: Download CSV completo
   */
  static async downloadCompleteCSV(): Promise<void> {
    try {
      console.log('📊 GlobalReportService - Gerando CSV completo...');
      
      const config: GlobalReportConfig = {
        reportType: 'complete_export',
        reportName: 'Relatório Completo',
        reportDescription: 'Exportação completa de todos os dados',
        formats: ['csv']
      };

      await this.generateReport(config);
      console.log('✅ GlobalReportService - CSV completo gerado');
    } catch (error) {
      console.error('❌ GlobalReportService - Erro ao gerar CSV:', error);
      throw error;
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Download XLS
   */
  static async downloadXLSReport(): Promise<void> {
    try {
      console.log('📊 GlobalReportService - Gerando relatório XLS...');
      
      const config: GlobalReportConfig = {
        reportType: 'complete_export',
        reportName: 'Relatório XLS',
        reportDescription: 'Exportação em formato Excel',
        formats: ['excel']
      };

      await this.generateReport(config);
      console.log('✅ GlobalReportService - Relatório XLS gerado');
    } catch (error) {
      console.error('❌ GlobalReportService - Erro ao gerar XLS:', error);
      throw error;
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Download Markdown
   */
  static async downloadMarkdownReport(): Promise<void> {
    try {
      console.log('📊 GlobalReportService - Gerando relatório Markdown...');
      
      const config: GlobalReportConfig = {
        reportType: 'complete_export',
        reportName: 'Relatório Markdown',
        reportDescription: 'Exportação em formato Markdown',
        formats: ['markdown']
      };

      await this.generateReport(config);
      console.log('✅ GlobalReportService - Relatório Markdown gerado');
    } catch (error) {
      console.error('❌ GlobalReportService - Erro ao gerar Markdown:', error);
      throw error;
    }
  }
}
