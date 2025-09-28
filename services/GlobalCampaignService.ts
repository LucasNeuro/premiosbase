/**
 * 🔥 SERVIÇO GLOBAL DE CAMPANHAS
 * Consolida TODOS os serviços de progresso de campanhas em um único ponto
 * Substitui: campaignProgressService, campaignProgressAuxiliar, unifiedCampaignProgressService, 
 * goalCalculationService, compositeCampaignService, RobustCalculationService
 */

import { supabase } from '../lib/supabase';

export interface GlobalCampaignProgress {
  campaignId: string;
  campaignTitle: string;
  campaignType: 'simple' | 'composite';
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  totalPolicies: number;
  linkedPolicies: number;
  criteriaProgress?: {
    criterionId: string;
    criterionType: string;
    targetValue: number;
    currentValue: number;
    progress: number;
    isCompleted: boolean;
    matchingPolicies: number;
  }[];
  lastCalculated: Date;
}

export interface CampaignCriteria {
  policy_type: 'auto' | 'residencial' | 'geral';
  contract_type: 'novo' | 'renovacao_bradesco' | 'ambos';
  min_value_per_policy?: number;
  target_type: 'value' | 'quantity';
  target_value: number;
}

export class GlobalCampaignService {
  
  /**
   * 🔥 MÉTODO PRINCIPAL: Calcula progresso de campanha de forma robusta
   */
  static async calculateCampaignProgress(campaignId: string): Promise<GlobalCampaignProgress | null> {
    try {
      console.log(`🔍 GlobalCampaignService - Calculando progresso da campanha: ${campaignId}`);

      // 1. Buscar dados da campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', campaignId)
        .eq('record_type', 'campaign')
        .single();

      if (campaignError || !campaign) {
        console.error(`❌ GlobalCampaignService - Campanha não encontrada:`, campaignError);
        return null;
      }

      // 2. Buscar apólices vinculadas
      const { data: linkedPolicies, error: policiesError } = await supabase
        .from('policy_campaign_links')
        .select(`
          *,
          policies!inner(
            id,
            policy_number,
            premium_value,
            type,
            contract_type,
            created_at
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('is_active', true);

      if (policiesError) {
        console.error(`❌ GlobalCampaignService - Erro ao buscar apólices:`, policiesError);
        return null;
      }

      const policies = (linkedPolicies || [])
        .map(link => link.policies)
        .filter(policy => policy !== null);

      console.log(`📊 GlobalCampaignService - ${policies.length} apólices encontradas`);

      // 3. Calcular progresso baseado no tipo de campanha
      let result: GlobalCampaignProgress;

      if (campaign.campaign_type === 'composite' && campaign.criteria && campaign.criteria.length > 0) {
        result = await this.calculateCompositeProgress(campaign, policies);
      } else {
        result = await this.calculateSimpleProgress(campaign, policies);
      }

      // 4. Atualizar progresso no banco
      await this.updateCampaignProgress(campaignId, result);

      console.log(`✅ GlobalCampaignService - Progresso calculado:`, {
        campaignId,
        currentValue: result.currentValue,
        progressPercentage: result.progressPercentage,
        isCompleted: result.isCompleted
      });

      return result;

    } catch (error) {
      console.error(`❌ GlobalCampaignService - Erro geral:`, error);
      return null;
    }
  }

  /**
   * 🔥 CÁLCULO SIMPLES: Para campanhas simples
   */
  private static async calculateSimpleProgress(campaign: any, policies: any[]): Promise<GlobalCampaignProgress> {
    const currentValue = policies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0);
    const progressPercentage = Math.min((currentValue / campaign.target) * 100, 100);
    const isCompleted = currentValue >= campaign.target;

    return {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      campaignType: 'simple',
      currentValue,
      targetValue: campaign.target,
      progressPercentage,
      isCompleted,
      totalPolicies: policies.length,
      linkedPolicies: policies.length,
      lastCalculated: new Date()
    };
  }

  /**
   * 🔥 CÁLCULO COMPOSTO: Para campanhas com critérios específicos
   */
  private static async calculateCompositeProgress(campaign: any, policies: any[]): Promise<GlobalCampaignProgress> {
    const criteria = campaign.criteria || [];
    const criteriaProgress = [];

    let totalCurrentValue = 0;
    let totalTargetValue = 0;
    let completedCriteria = 0;

    for (const criterion of criteria) {
      const matchingPolicies = this.filterPoliciesByCriteria(policies, criterion);
      const currentValue = criterion.target_type === 'value' 
        ? matchingPolicies.reduce((sum, p) => sum + (p.premium_value || 0), 0)
        : matchingPolicies.length;

      const progress = Math.min((currentValue / criterion.target_value) * 100, 100);
      const isCompleted = currentValue >= criterion.target_value;

      if (isCompleted) completedCriteria++;

      criteriaProgress.push({
        criterionId: `${criterion.policy_type}_${criterion.contract_type}`,
        criterionType: `${criterion.policy_type} - ${criterion.contract_type}`,
        targetValue: criterion.target_value,
        currentValue,
        progress,
        isCompleted,
        matchingPolicies: matchingPolicies.length
      });

      totalCurrentValue += currentValue;
      totalTargetValue += criterion.target_value;
    }

    const overallProgress = criteria.length > 0 ? (completedCriteria / criteria.length) * 100 : 0;
    const isCompleted = completedCriteria === criteria.length;

    return {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      campaignType: 'composite',
      currentValue: totalCurrentValue,
      targetValue: totalTargetValue,
      progressPercentage: overallProgress,
      isCompleted,
      totalPolicies: policies.length,
      linkedPolicies: policies.length,
      criteriaProgress,
      lastCalculated: new Date()
    };
  }

  /**
   * 🔥 FILTRO DE APÓLICES: Por critérios específicos
   */
  private static filterPoliciesByCriteria(policies: any[], criterion: CampaignCriteria): any[] {
    return policies.filter(policy => {
      // Verificar tipo de apólice
      if (criterion.policy_type && criterion.policy_type !== 'geral') {
        const policyTypeMap: { [key: string]: string } = {
          'auto': 'Seguro Auto',
          'residencial': 'Seguro Residencial'
        };
        const expectedType = policyTypeMap[criterion.policy_type];
        if (expectedType && policy.type !== expectedType) {
          return false;
        }
      }

      // Verificar tipo de contrato
      if (criterion.contract_type && criterion.contract_type !== 'ambos') {
        const contractTypeMap: { [key: string]: string } = {
          'novo': 'Novo',
          'renovacao_bradesco': 'Renovação Bradesco'
        };
        const expectedContractType = contractTypeMap[criterion.contract_type];
        if (expectedContractType && policy.contract_type !== expectedContractType) {
          return false;
        }
      }

      // Verificar valor mínimo por apólice
      if (criterion.min_value_per_policy && policy.premium_value < criterion.min_value_per_policy) {
        return false;
      }

      return true;
    });
  }

  /**
   * 🔥 ATUALIZAÇÃO: Salva progresso no banco
   */
  private static async updateCampaignProgress(campaignId: string, progress: GlobalCampaignProgress): Promise<void> {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          current_value: progress.currentValue,
          progress_percentage: progress.progressPercentage,
          status: progress.isCompleted ? 'completed' : 'active',
          last_updated: new Date().toISOString(),
          achieved_at: progress.isCompleted ? new Date().toISOString() : null,
          achieved_value: progress.isCompleted ? progress.currentValue : null,
        })
        .eq('id', campaignId);

      if (error) {
        console.error(`❌ GlobalCampaignService - Erro ao atualizar progresso:`, error);
        throw error;
      }

      console.log(`✅ GlobalCampaignService - Progresso atualizado no banco`);
    } catch (error) {
      console.error(`❌ GlobalCampaignService - Erro ao salvar progresso:`, error);
      throw error;
    }
  }

  /**
   * 🔥 ATUALIZAÇÃO EM LOTE: Para múltiplas campanhas
   */
  static async updateAllUserCampaigns(userId: string): Promise<void> {
    try {
      console.log(`🔄 GlobalCampaignService - Atualizando todas as campanhas do usuário: ${userId}`);

      // Buscar campanhas ativas do usuário
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('id, title, campaign_type')
        .eq('user_id', userId)
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .in('status', ['active', 'completed']);

      if (campaignsError) {
        console.error(`❌ GlobalCampaignService - Erro ao buscar campanhas:`, campaignsError);
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        console.log(`ℹ️ GlobalCampaignService - Nenhuma campanha encontrada para o usuário`);
        return;
      }

      // Atualizar cada campanha
      for (const campaign of campaigns) {
        try {
          await this.calculateCampaignProgress(campaign.id);
        } catch (error) {
          console.error(`❌ GlobalCampaignService - Erro ao atualizar campanha ${campaign.id}:`, error);
        }
      }

      console.log(`✅ GlobalCampaignService - Todas as campanhas atualizadas`);
    } catch (error) {
      console.error(`❌ GlobalCampaignService - Erro geral na atualização em lote:`, error);
    }
  }

  /**
   * 🔥 VALIDAÇÃO: Verifica se apólice atende critérios da campanha
   */
  static async validatePolicyAgainstCampaign(policyData: any, campaign: any): Promise<boolean> {
    try {
      const criteria = campaign.criteria || [];
      
      if (criteria.length === 0) {
        return true; // Campanha sem critérios específicos
      }

      // Verificar se a apólice atende a pelo menos um critério
      for (const criterion of criteria) {
        if (this.policyMeetsCriterion(policyData, criterion)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`❌ GlobalCampaignService - Erro na validação:`, error);
      return false;
    }
  }

  /**
   * 🔥 VALIDAÇÃO DE CRITÉRIO: Verifica se apólice atende critério específico
   */
  private static policyMeetsCriterion(policyData: any, criterion: CampaignCriteria): boolean {
    // Verificar tipo de apólice
    if (criterion.policy_type && criterion.policy_type !== 'geral') {
      const policyTypeMap: { [key: string]: string } = {
        'auto': 'Seguro Auto',
        'residencial': 'Seguro Residencial'
      };
      const expectedType = policyTypeMap[criterion.policy_type];
      if (expectedType && policyData.type !== expectedType) {
        return false;
      }
    }

    // Verificar tipo de contrato
    if (criterion.contract_type && criterion.contract_type !== 'ambos') {
      const contractTypeMap: { [key: string]: string } = {
        'novo': 'Novo',
        'renovacao_bradesco': 'Renovação Bradesco'
      };
      const expectedContractType = contractTypeMap[criterion.contract_type];
      if (expectedContractType && policyData.contract_type !== expectedContractType) {
        return false;
      }
    }

    // Verificar valor mínimo por apólice
    if (criterion.min_value_per_policy && policyData.premium_value < criterion.min_value_per_policy) {
      return false;
    }

    return true;
  }

  /**
   * Buscar detalhes dos critérios de uma campanha
   */
  static async getCampaignCriteriaDetails(campaignId: string): Promise<any[]> {
    try {
      const progress = await this.calculateCampaignProgress(campaignId);
      return progress?.criteriaProgress || [];
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao buscar detalhes dos critérios:', error);
      return [];
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Analisar compatibilidade de apólice com campanhas usando IA
   */
  static async analyzePolicyCompatibility(
    policyData: any,
    userId: string
  ): Promise<any[]> {
    try {
      console.log(`🔍 GlobalCampaignService - Analisando compatibilidade da apólice ${policyData.policy_number}`);
      
      // Buscar campanhas aceitas pelo usuário
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .eq('user_id', userId)
        .eq('acceptance_status', 'accepted');

      if (campaignsError) throw campaignsError;
      if (!campaigns || campaigns.length === 0) return [];

      const matches = [];
      
      for (const campaign of campaigns) {
        if (campaign.criteria && campaign.criteria.length > 0) {
          const isCompatible = await this.validatePolicyAgainstCampaign(policyData, campaign);
          if (isCompatible) {
            matches.push({
              campaign_id: campaign.id,
              campaign_title: campaign.title,
              match_score: 90,
              reasoning: 'Apólice compatível com critérios da campanha'
            });
          }
        }
      }

      console.log(`✅ GlobalCampaignService - ${matches.length} campanhas compatíveis encontradas`);
      return matches;
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro na análise de compatibilidade:', error);
      return [];
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Buscar campanhas compatíveis para uma apólice
   */
  static async getCompatibleCampaigns(
    policyData: any,
    userId: string
  ): Promise<any[]> {
    try {
      const { data: campaigns, error } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .eq('user_id', userId)
        .eq('acceptance_status', 'accepted');

      if (error) throw error;
      if (!campaigns) return [];

      const compatibleCampaigns = [];
      
      for (const campaign of campaigns) {
        if (campaign.criteria && campaign.criteria.length > 0) {
          const isCompatible = await this.validatePolicyAgainstCampaign(policyData, campaign);
          if (isCompatible) {
            compatibleCampaigns.push(campaign);
          }
        }
      }

      return compatibleCampaigns;
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao buscar campanhas compatíveis:', error);
      return [];
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Atualizar status de uma campanha
   */
  static async updateCampaignStatus(campaignId: string): Promise<void> {
    try {
      console.log(`🔄 GlobalCampaignService - Atualizando status da campanha: ${campaignId}`);

      const progress = await this.calculateCampaignProgress(campaignId);
      
      if (!progress) {
        console.error('❌ GlobalCampaignService - Não foi possível calcular progresso');
        return;
      }

      // Determinar novo status
      let newStatus = 'active';
      if (progress.isCompleted) {
        newStatus = 'completed';
      } else if (progress.progressPercentage > 0) {
        newStatus = 'active';
      }

      // Atualizar status no banco
      const { error } = await supabase
        .from('goals')
        .update({ 
          status: newStatus,
          progress_percentage: progress.progressPercentage,
          current_value: progress.currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;

      console.log(`✅ GlobalCampaignService - Status atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao atualizar status:', error);
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Atualizar status de todas as campanhas de um usuário
   */
  static async updateAllUserCampaignsStatus(userId: string): Promise<void> {
    try {
      console.log(`🔄 GlobalCampaignService - Atualizando status de todas as campanhas do usuário: ${userId}`);

      const { data: campaigns, error } = await supabase
        .from('goals')
        .select('id')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .eq('user_id', userId);

      if (error) throw error;
      if (!campaigns) return;

      for (const campaign of campaigns) {
        await this.updateCampaignStatus(campaign.id);
      }

      console.log(`✅ GlobalCampaignService - Status de ${campaigns.length} campanhas atualizado`);
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao atualizar status das campanhas:', error);
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Vincular apólice a campanha
   */
  static async linkPolicyToCampaign(
    policyId: string,
    campaignId: string,
    userId: string,
    linkedAutomatically: boolean = false,
    aiConfidence?: number,
    aiReasoning?: string
  ): Promise<boolean> {
    try {
      console.log(`🔗 GlobalCampaignService - Vinculando apólice ${policyId} à campanha ${campaignId}`);

      const { error } = await supabase
        .from('policy_campaign_links')
        .insert({
          policy_id: policyId,
          campaign_id: campaignId,
          user_id: userId,
          linked_automatically: linkedAutomatically,
          is_active: true,
          ai_confidence: aiConfidence || null,
          ai_reasoning: aiReasoning || null
        });

      if (error) throw error;

      console.log(`✅ GlobalCampaignService - Apólice vinculada com sucesso`);
      return true;
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao vincular apólice:', error);
      return false;
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Desvincular apólice de campanha
   */
  static async unlinkPolicyFromCampaign(
    policyId: string,
    campaignId: string
  ): Promise<boolean> {
    try {
      console.log(`🔓 GlobalCampaignService - Desvinculando apólice ${policyId} da campanha ${campaignId}`);

      const { error } = await supabase
        .from('policy_campaign_links')
        .update({ is_active: false })
        .eq('policy_id', policyId)
        .eq('campaign_id', campaignId);

      if (error) throw error;

      console.log(`✅ GlobalCampaignService - Apólice desvinculada com sucesso`);
      return true;
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao desvincular apólice:', error);
      return false;
    }
  }

  /**
   * 🔥 MIGRAÇÃO: Buscar vinculações de um usuário
   */
  static async getUserPolicyLinks(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('policy_campaign_links')
        .select(`
          *,
          policy:policies!policy_campaign_links_policy_id_fkey (
            id,
            policy_number,
            type,
            premium_value
          ),
          campaign:goals!policy_campaign_links_campaign_id_fkey (
            id,
            title,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ GlobalCampaignService - Erro ao buscar vinculações:', error);
      return [];
    }
  }
}
