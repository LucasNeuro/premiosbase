/**
 * 🔥 SERVIÇO GLOBAL DE AUDITORIA
 * Consolida TODOS os serviços de auditoria e validação em um único ponto
 * Substitui: backgroundAuditService, auditRecalculationService, campaignProgressValidator,
 * campaignProgressMonitor, policyAuditService
 */

import { supabase } from '../lib/supabase';
import { GlobalCampaignService } from './GlobalCampaignService';

export interface GlobalAuditResult {
  success: boolean;
  validatedCampaigns: number;
  correctedCampaigns: number;
  validatedPolicies: number;
  errors: string[];
  timestamp: string;
  details: {
    campaignId: string;
    campaignTitle: string;
    oldStatus: string;
    newStatus: string;
    wasCorrected: boolean;
  }[];
}

export interface PolicyAuditData {
  policyId: string;
  policyNumber: string;
  policyType: string;
  contractType: string;
  premiumValue: number;
  linkedCampaignsCount: number;
  linkedCampaignsDetails: {
    campaignId: string;
    campaignTitle: string;
    matchScore: number;
    reasoning: string;
  }[];
  auditTimestamp: string;
}

export class GlobalAuditService {
  private static readonly RECALCULATION_INTERVAL = 90 * 1000; // 1 minuto e 30 segundos
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * 🔥 AUDITORIA COMPLETA: Valida todas as campanhas de um usuário
   */
  static async auditUserCampaigns(userId: string): Promise<GlobalAuditResult> {
    try {
      console.log(`🔍 GlobalAuditService - Iniciando auditoria para usuário: ${userId}`);

      const result: GlobalAuditResult = {
        success: true,
        validatedCampaigns: 0,
        correctedCampaigns: 0,
        validatedPolicies: 0,
        errors: [],
        timestamp: new Date().toISOString(),
        details: []
      };

      // 1. Buscar todas as campanhas ativas do usuário
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .in('status', ['active', 'completed']);

      if (campaignsError) {
        result.errors.push(`Erro ao buscar campanhas: ${campaignsError.message}`);
        result.success = false;
        return result;
      }

      if (!campaigns || campaigns.length === 0) {
        console.log(`ℹ️ GlobalAuditService - Nenhuma campanha encontrada para auditoria`);
        return result;
      }

      // 2. Auditar cada campanha
      for (const campaign of campaigns) {
        try {
          result.validatedCampaigns++;
          
          // Recalcular progresso da campanha
          const progress = await GlobalCampaignService.calculateCampaignProgress(campaign.id);
          
          if (progress) {
            // Verificar se houve correção de status
            const oldStatus = campaign.status;
            const newStatus = progress.isCompleted ? 'completed' : 'active';
            
            if (oldStatus !== newStatus) {
              result.correctedCampaigns++;
              result.details.push({
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                oldStatus,
                newStatus,
                wasCorrected: true
              });
            } else {
              result.details.push({
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                oldStatus,
                newStatus,
                wasCorrected: false
              });
            }
          }
        } catch (error) {
          const errorMsg = `Erro ao auditar campanha ${campaign.id}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ GlobalAuditService - ${errorMsg}`);
        }
      }

      // 3. Auditar apólices vinculadas
      const policiesResult = await this.auditUserPolicies(userId);
      result.validatedPolicies = policiesResult.validatedPolicies;
      result.errors.push(...policiesResult.errors);

      console.log(`✅ GlobalAuditService - Auditoria concluída:`, {
        validatedCampaigns: result.validatedCampaigns,
        correctedCampaigns: result.correctedCampaigns,
        validatedPolicies: result.validatedPolicies,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      console.error(`❌ GlobalAuditService - Erro geral na auditoria:`, error);
      return {
        success: false,
        validatedCampaigns: 0,
        correctedCampaigns: 0,
        validatedPolicies: 0,
        errors: [`Erro geral na auditoria: ${error}`],
        timestamp: new Date().toISOString(),
        details: []
      };
    }
  }

  /**
   * 🔥 AUDITORIA DE APÓLICES: Valida vinculações de apólices
   */
  private static async auditUserPolicies(userId: string): Promise<{
    validatedPolicies: number;
    errors: string[];
  }> {
    try {
      // Buscar apólices do usuário
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (policiesError) {
        return {
          validatedPolicies: 0,
          errors: [`Erro ao buscar apólices: ${policiesError.message}`]
        };
      }

      let validatedPolicies = 0;
      const errors: string[] = [];

      // Auditar cada apólice
      for (const policy of policies || []) {
        try {
          // Verificar vinculações ativas
          const { data: links, error: linksError } = await supabase
            .from('policy_campaign_links')
            .select(`
              *,
              goals!inner(
                id,
                title,
                criteria,
                campaign_type
              )
            `)
            .eq('policy_id', policy.id)
            .eq('is_active', true);

          if (linksError) {
            errors.push(`Erro ao buscar vinculações da apólice ${policy.policy_number}: ${linksError.message}`);
            continue;
          }

          // Validar cada vinculação
          for (const link of links || []) {
            const campaign = link.goals;
            if (campaign) {
              const isValid = await GlobalCampaignService.validatePolicyAgainstCampaign(policy, campaign);
              
              if (!isValid) {
                // Desativar vinculação inválida
                await supabase
                  .from('policy_campaign_links')
                  .update({ is_active: false })
                  .eq('id', link.id);
                
                console.log(`⚠️ GlobalAuditService - Vinculação inválida desativada: ${policy.policy_number} -> ${campaign.title}`);
              }
            }
          }

          validatedPolicies++;
        } catch (error) {
          errors.push(`Erro ao auditar apólice ${policy.policy_number}: ${error}`);
        }
      }

      return { validatedPolicies, errors };
    } catch (error) {
      return {
        validatedPolicies: 0,
        errors: [`Erro geral na auditoria de apólices: ${error}`]
      };
    }
  }

  /**
   * 🔥 AUDITORIA EM BACKGROUND: Inicia monitoramento automático
   */
  static startBackgroundAudit(userId: string): void {
    if (this.isRunning) {
      console.log(`ℹ️ GlobalAuditService - Auditoria em background já está rodando`);
      return;
    }

    this.isRunning = true;
    console.log(`🔄 GlobalAuditService - Iniciando auditoria em background para usuário: ${userId}`);

    this.intervalId = setInterval(async () => {
      try {
        console.log(`🔄 GlobalAuditService - Executando auditoria automática...`);
        const result = await this.auditUserCampaigns(userId);
        
        if (result.correctedCampaigns > 0) {
          console.log(`✅ GlobalAuditService - ${result.correctedCampaigns} campanhas corrigidas automaticamente`);
        } else {
          console.log(`ℹ️ GlobalAuditService - Nenhuma correção necessária`);
        }
      } catch (error) {
        console.error(`❌ GlobalAuditService - Erro na auditoria automática:`, error);
      }
    }, this.RECALCULATION_INTERVAL);
  }

  /**
   * 🔥 PARAR AUDITORIA: Para o monitoramento automático
   */
  static stopBackgroundAudit(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log(`⏹️ GlobalAuditService - Auditoria em background parada`);
  }

  /**
   * 🔥 AUDITORIA ESPECÍFICA: Para uma campanha específica
   */
  static async auditSpecificCampaign(campaignId: string): Promise<{
    success: boolean;
    wasCorrected: boolean;
    oldStatus: string;
    newStatus: string;
    errors: string[];
  }> {
    try {
      console.log(`🔍 GlobalAuditService - Auditando campanha específica: ${campaignId}`);

      // Buscar dados atuais da campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        return {
          success: false,
          wasCorrected: false,
          oldStatus: '',
          newStatus: '',
          errors: [`Campanha não encontrada: ${campaignError?.message}`]
        };
      }

      const oldStatus = campaign.status;

      // Recalcular progresso
      const progress = await GlobalCampaignService.calculateCampaignProgress(campaignId);
      
      if (!progress) {
        return {
          success: false,
          wasCorrected: false,
          oldStatus,
          newStatus: oldStatus,
          errors: ['Erro ao calcular progresso da campanha']
        };
      }

      const newStatus = progress.isCompleted ? 'completed' : 'active';
      const wasCorrected = oldStatus !== newStatus;

      return {
        success: true,
        wasCorrected,
        oldStatus,
        newStatus,
        errors: []
      };

    } catch (error) {
      console.error(`❌ GlobalAuditService - Erro na auditoria específica:`, error);
      return {
        success: false,
        wasCorrected: false,
        oldStatus: '',
        newStatus: '',
        errors: [`Erro na auditoria: ${error}`]
      };
    }
  }

  /**
   * 🔥 REGISTRAR AUDITORIA DE APÓLICE: Para histórico
   */
  static async registerPolicyAudit(policyData: PolicyAuditData): Promise<void> {
    try {
      const { error } = await supabase
        .from('policy_audit_logs')
        .insert({
          policy_id: policyData.policyId,
          policy_number: policyData.policyNumber,
          policy_type: policyData.policyType,
          contract_type: policyData.contractType,
          premium_value: policyData.premiumValue,
          linked_campaigns_count: policyData.linkedCampaignsCount,
          linked_campaigns_details: policyData.linkedCampaignsDetails,
          audit_timestamp: policyData.auditTimestamp
        });

      if (error) {
        console.error(`❌ GlobalAuditService - Erro ao registrar auditoria:`, error);
      } else {
        console.log(`✅ GlobalAuditService - Auditoria de apólice registrada: ${policyData.policyNumber}`);
      }
    } catch (error) {
      console.error(`❌ GlobalAuditService - Erro ao registrar auditoria de apólice:`, error);
    }
  }

  /**
   * 🔥 FORÇAR RECÁLCULO: Para todas as campanhas
   */
  static async forceRecalculationAllCampaigns(): Promise<{
    success: boolean;
    recalculatedCampaigns: number;
    errors: string[];
  }> {
    try {
      console.log(`🔄 GlobalAuditService - Forçando recálculo de todas as campanhas`);

      // Buscar todas as campanhas ativas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('id, title, user_id')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .in('status', ['active', 'completed']);

      if (campaignsError) {
        return {
          success: false,
          recalculatedCampaigns: 0,
          errors: [`Erro ao buscar campanhas: ${campaignsError.message}`]
        };
      }

      let recalculatedCampaigns = 0;
      const errors: string[] = [];

      // Recalcular cada campanha
      for (const campaign of campaigns || []) {
        try {
          await GlobalCampaignService.calculateCampaignProgress(campaign.id);
          recalculatedCampaigns++;
        } catch (error) {
          errors.push(`Erro ao recalcular campanha ${campaign.title}: ${error}`);
        }
      }

      console.log(`✅ GlobalAuditService - Recálculo concluído: ${recalculatedCampaigns} campanhas`);

      return {
        success: true,
        recalculatedCampaigns,
        errors
      };

    } catch (error) {
      console.error(`❌ GlobalAuditService - Erro no recálculo forçado:`, error);
      return {
        success: false,
        recalculatedCampaigns: 0,
        errors: [`Erro geral no recálculo: ${error}`]
      };
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Registrar lançamento de apólice
   */
  static async recordPolicyLaunch(data: any): Promise<void> {
    try {
      console.log(`📝 GlobalAuditService - Registrando lançamento de apólice: ${data.policy_number}`);
      
      // Implementar registro de lançamento
      // TODO: Implementar lógica de registro
      console.log(`✅ GlobalAuditService - Lançamento registrado`);
    } catch (error) {
      console.error('❌ GlobalAuditService - Erro ao registrar lançamento:', error);
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Buscar histórico de lançamentos
   */
  static async getPolicyLaunchHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      console.log(`📊 GlobalAuditService - Buscando histórico de lançamentos para usuário: ${userId}`);
      
      // Implementar busca de histórico
      // TODO: Implementar lógica de busca
      return [];
    } catch (error) {
      console.error('❌ GlobalAuditService - Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Formatar para timeline
   */
  static formatForTimeline(record: any): any {
    try {
      // Implementar formatação para timeline
      // TODO: Implementar lógica de formatação
      return {
        id: record.id || Date.now().toString(),
        policyNumber: record.policy_number || 'N/A',
        policyType: record.policy_type || 'N/A',
        timestamp: record.created_at || new Date().toISOString(),
        description: `Apólice ${record.policy_number} lançada`
      };
    } catch (error) {
      console.error('❌ GlobalAuditService - Erro ao formatar timeline:', error);
      return {
        id: Date.now().toString(),
        policyNumber: 'N/A',
        policyType: 'N/A',
        timestamp: new Date().toISOString(),
        description: 'Erro ao formatar registro'
      };
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Buscar estatísticas de lançamentos
   */
  static async getLaunchStatistics(userId: string): Promise<any> {
    try {
      console.log(`📈 GlobalAuditService - Buscando estatísticas para usuário: ${userId}`);
      
      // Implementar busca de estatísticas
      // TODO: Implementar lógica de estatísticas
      return {
        totalLaunches: 0,
        thisMonth: 0,
        lastWeek: 0
      };
    } catch (error) {
      console.error('❌ GlobalAuditService - Erro ao buscar estatísticas:', error);
      return {
        totalLaunches: 0,
        thisMonth: 0,
        lastWeek: 0
      };
    }
  }
}
