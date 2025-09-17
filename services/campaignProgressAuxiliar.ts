import { supabase } from '../lib/supabase';

/**
 * Serviço de progresso para a nova estrutura com tabela auxiliar
 */

export interface CriterionProgress {
  criterion: any;
  currentProgress: number;
  targetValue: number;
  isThisCriterionMet: boolean;
  percentage: number;
  policyType: string;
  targetType: string;
  matchingPolicies: any[];
}

export interface CampaignProgressAuxiliar {
  campaignId: string;
  currentValue: number;
  progressPercentage: number;
  totalPolicies: number;
  isCompleted: boolean;
  criteriaDetails?: CriterionProgress[];
}

/**
 * Calcular progresso de uma campanha usando a tabela auxiliar
 */
export const calculateCampaignProgressAuxiliar = async (campaignId: string): Promise<CampaignProgressAuxiliar | null> => {
  try {
    // 1. Buscar dados da campanha (incluindo critérios!)
    const { data: campaign, error: campaignError } = await supabase
      .from('goals')
      .select('id, title, type, target, status, end_date, acceptance_status, accepted_at, criteria')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (campaignError || !campaign) {
      console.error('❌ Erro ao buscar campanha:', campaignError);
      return null;
    }

    // ✅ REGRA IMPORTANTE: Só calcular progresso se a campanha foi aceita
    if (campaign.acceptance_status !== 'accepted') {
      return {
        campaignId,
        currentValue: 0,
        progressPercentage: 0,
        totalPolicies: 0,
        isCompleted: false,
        criteriaDetails: []
      };
    }

    // 2. Buscar apólices vinculadas através da tabela de links (somente após aceitar)
    const { data: linkedData, error: linkError } = await supabase
      .from('policy_campaign_links')
      .select(`
        policy_id,
        created_at,
        policies!inner(
          id,
          policy_number,
          premium_value,
          type,
          status,
          created_at
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .eq('policies.status', 'active');

    if (linkError) {
      console.error('❌ Erro ao buscar apólices vinculadas:', linkError);
      return null;
    }

    // 🎯 FILTRO RIGOROSO: Só contar apólices VINCULADAS à campanha APÓS aceitar
    const acceptedAt = campaign.accepted_at ? new Date(campaign.accepted_at) : new Date();
    const linkedPolicies = (linkedData || []).filter((link: any) => {
      const linkCreatedAt = new Date(link.created_at);
      
      // ✅ REGRA FUNDAMENTAL: Só apólices VINCULADAS após aceitar
      const isValidTiming = linkCreatedAt >= acceptedAt;
      
      if (!isValidTiming) {
        } else {
        }
      
      return isValidTiming;
    });
    
    // 3. Calcular progresso baseado em TODOS os critérios (lógica AND)
    let currentValue = 0;
    let progressPercentage = 0;
    let isCompleted = false;

    linkedPolicies.forEach((link: any, index) => {
      const policy = link.policies;
      });

    // Verificar se há critérios específicos para análise detalhada
    let criteriaResults = [];
    let parsedCriteria = null;
    
    // Processar critérios (podem vir como string JSON ou array direto)
    if (campaign.criteria) {
      if (typeof campaign.criteria === 'string') {
        try {
          parsedCriteria = JSON.parse(campaign.criteria);
          } catch (error) {
          }
      } else if (Array.isArray(campaign.criteria)) {
        parsedCriteria = campaign.criteria;
        } else {
        }
    } else {
      }
    
    if (parsedCriteria && Array.isArray(parsedCriteria)) {
      if (true) { // Substituindo if (Array.isArray(parsedCriteria))
          // Verificar cada critério individualmente
          criteriaResults = parsedCriteria.map((criterion: any, index: number) => {
            const policyTypeMap: { [key: string]: string } = {
              'auto': 'Seguro Auto',
              'residencial': 'Seguro Residencial'
            };
            
            const targetPolicyType = policyTypeMap[criterion.policy_type] || criterion.policy_type;
            
            // Filtrar apólices que atendem este critério
            const matchingPolicies = linkedPolicies.filter((link: any) => {
              const policy = link.policies;
              const isCorrectType = policy.type === targetPolicyType;
              const meetsMinValue = !criterion.min_value_per_policy || 
                                   policy.premium_value >= criterion.min_value_per_policy;
              return isCorrectType && meetsMinValue;
            });
            
            let currentProgress = 0;
            let targetValue = criterion.target_value || 0;
            let isThisCriterionMet = false;
            
            if (criterion.target_type === 'quantity') {
              // Meta por quantidade de apólices
              currentProgress = matchingPolicies.length;
              isThisCriterionMet = currentProgress >= targetValue;
              } else if (criterion.target_type === 'value') {
              // Meta por valor total
              currentProgress = matchingPolicies.reduce((sum: number, link: any) => 
                sum + (link.policies?.premium_value || 0), 0);
              isThisCriterionMet = currentProgress >= targetValue;
              }
            
            return {
              criterion,
              currentProgress,
              targetValue,
              isThisCriterionMet,
              percentage: targetValue > 0 ? (currentProgress / targetValue) * 100 : 0,
              policyType: targetPolicyType,
              targetType: criterion.target_type,
              matchingPolicies
            };
          });
          
          // TODOS os critérios devem ser atendidos (lógica AND)
          isCompleted = criteriaResults.every(result => result.isThisCriterionMet);
          
          // Progresso geral = média dos progressos individuais
          const totalPercentage = criteriaResults.reduce((sum, result) => sum + result.percentage, 0);
          progressPercentage = criteriaResults.length > 0 ? totalPercentage / criteriaResults.length : 0;
          
          // Valor atual = soma de todos os valores (para display)
          currentValue = linkedPolicies.reduce((sum: number, link: any) => 
            sum + (link.policies?.premium_value || 0), 0);
            
          }
    } else if (parsedCriteria) {
      }
    
    // Fallback para campanhas sem critérios específicos
    if (criteriaResults.length === 0) {
      if (campaign.type === 'valor') {
        currentValue = linkedPolicies.reduce((sum: number, link: any) => {
          return sum + (link.policies?.premium_value || 0);
        }, 0);
        progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
        isCompleted = progressPercentage >= 100;
        } else if (campaign.type === 'apolices') {
        currentValue = linkedPolicies.length;
        progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
        isCompleted = progressPercentage >= 100;
        }
    }

    return {
      campaignId,
      currentValue,
      progressPercentage: Math.min(progressPercentage, 999), // Máximo 999%
      totalPolicies: linkedPolicies.length,
      isCompleted,
      criteriaDetails: criteriaResults.length > 0 ? criteriaResults : undefined
    };

  } catch (error) {
    console.error('❌ Erro no cálculo de progresso auxiliar:', error);
    return null;
  }
};

/**
 * Atualizar progresso de uma campanha no banco
 */
export const updateCampaignProgressAuxiliar = async (campaignId: string): Promise<boolean> => {
  try {
    const progressData = await calculateCampaignProgressAuxiliar(campaignId);
    
    if (!progressData) {
      return false;
    }

    // Buscar status atual da campanha
    const { data: currentCampaign, error: fetchError } = await supabase
      .from('goals')
      .select('status, end_date, progress_percentage')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (fetchError) {
      console.error('Erro ao buscar campanha atual:', fetchError);
      return false;
    }

    // Preparar dados para atualização
    const updateData: any = {
      current_value: progressData.currentValue,
      progress_percentage: progressData.progressPercentage,
      last_updated: new Date().toISOString()
    };

    // Verificar mudança de status
    const wasCompleted = currentCampaign.status === 'completed';
    const isNowCompleted = progressData.isCompleted;

    if (isNowCompleted && !wasCompleted) {
      updateData.status = 'completed';
      updateData.achieved_at = new Date().toISOString();
      updateData.achieved_value = progressData.currentValue;
      } else if (!isNowCompleted && wasCompleted) {
      updateData.status = 'active';
      updateData.achieved_at = null;
      updateData.achieved_value = null;
      }

    // Verificar expiração e atualizar status baseado nas regras
    const now = new Date();
    const endDate = new Date(currentCampaign.end_date || '');
    const isExpired = endDate < now;
    
    if (isExpired && currentCampaign.status === 'active') {
      if (isNowCompleted) {
        // Expirou mas atingiu a meta = completed
        updateData.status = 'completed';
        updateData.achieved_at = new Date().toISOString();
        updateData.achieved_value = progressData.currentValue;
        } else {
        // Expirou e não atingiu a meta = cancelled (não atingida)
        updateData.status = 'cancelled';
        }
    } else if (!isExpired && isNowCompleted && currentCampaign.status === 'active') {
      // Não expirou e atingiu a meta = completed
      updateData.status = 'completed';
      updateData.achieved_at = new Date().toISOString();
      updateData.achieved_value = progressData.currentValue;
      }

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', campaignId)
      .eq('record_type', 'campaign');

    if (updateError) {
      console.error('Erro ao atualizar progresso:', updateError);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Erro ao atualizar progresso auxiliar:', error);
    return false;
  }
};

/**
 * Atualizar progresso de todas as campanhas de um usuário
 */
export const updateAllUserCampaignProgressAuxiliar = async (userId: string): Promise<void> => {
  try {
    // Buscar campanhas ativas do usuário
    const { data: campaigns, error } = await supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', userId)
      .eq('record_type', 'campaign')
      .eq('is_active', true)
      .in('status', ['active', 'completed']);

    if (error) {
      console.error('Erro ao buscar campanhas:', error);
      return;
    }

    if (campaigns && campaigns.length > 0) {
      // Atualizar em paralelo
      const updatePromises = campaigns.map(campaign => {
        return updateCampaignProgressAuxiliar(campaign.id);
      });

      await Promise.all(updatePromises);
      } else {
      }

  } catch (error) {
    console.error('Erro ao atualizar campanhas do usuário:', error);
  }
};

/**
 * Buscar detalhes dos critérios de uma campanha
 */
export const getCampaignCriteriaDetails = async (campaignId: string): Promise<CriterionProgress[]> => {
  try {
    const progress = await calculateCampaignProgressAuxiliar(campaignId);
    return progress?.criteriaDetails || [];
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes dos critérios:', error);
    return [];
  }
};
