import { supabase } from '../lib/supabase';
import { updateCampaignProgressAuxiliar } from './campaignProgressAuxiliar';

/**
 * Serviço para corrigir status incorretos de campanhas
 * Este serviço deve ser executado para corrigir campanhas que foram marcadas como concluídas
 * mas não atingiram todos os critérios
 */

export interface CampaignStatusFix {
  campaignId: string;
  campaignTitle: string;
  oldStatus: string;
  newStatus: string;
  criteriaCount: number;
  completedCriteria: number;
  wasFixed: boolean;
}

/**
 * Corrigir status de uma campanha específica
 */
export const fixCampaignStatus = async (campaignId: string): Promise<CampaignStatusFix | null> => {
  try {
    // Buscar dados da campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (campaignError || !campaign) {
      console.error('❌ Erro ao buscar campanha:', campaignError);
      return null;
    }

    const oldStatus = campaign.status;
    let newStatus = oldStatus;
    let wasFixed = false;

    // Se a campanha está marcada como completed, verificar se realmente deveria estar
    if (campaign.status === 'completed') {
      // Recalcular progresso
      const success = await updateCampaignProgressAuxiliar(campaignId);
      
      if (success) {
        // Buscar status atualizado
        const { data: updatedCampaign, error: fetchError } = await supabase
          .from('goals')
          .select('status')
          .eq('id', campaignId)
          .eq('record_type', 'campaign')
          .single();

        if (!fetchError && updatedCampaign) {
          newStatus = updatedCampaign.status;
          wasFixed = oldStatus !== newStatus;
        }
      }
    }

    // Contar critérios e critérios completados
    let criteriaCount = 0;
    let completedCriteria = 0;

    if (campaign.criteria) {
      let parsedCriteria = null;
      
      if (typeof campaign.criteria === 'string') {
        try {
          parsedCriteria = JSON.parse(campaign.criteria);
        } catch (error) {
          console.error('Erro ao parsear critérios:', error);
        }
      } else if (Array.isArray(campaign.criteria)) {
        parsedCriteria = campaign.criteria;
      }

      if (Array.isArray(parsedCriteria)) {
        criteriaCount = parsedCriteria.length;
        
        // Buscar apólices vinculadas para calcular critérios completados
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

        if (!linkError && linkedData) {
          const acceptedAt = campaign.accepted_at ? new Date(campaign.accepted_at) : new Date();
          const linkedPolicies = linkedData.filter((link: any) => {
            const linkCreatedAt = new Date(link.created_at);
            return linkCreatedAt >= acceptedAt;
          });

          // Verificar cada critério
          for (const criterion of parsedCriteria) {
            const policyTypeMap: { [key: string]: string } = {
              'auto': 'Seguro Auto',
              'residencial': 'Seguro Residencial'
            };
            
            const targetPolicyType = policyTypeMap[criterion.policy_type] || criterion.policy_type;
            
            const matchingPolicies = linkedPolicies.filter((link: any) => {
              const policy = link.policies;
              const isCorrectType = policy.type === targetPolicyType;
              const meetsMinValue = !criterion.min_value_per_policy || 
                                   policy.premium_value >= criterion.min_value_per_policy;
              return isCorrectType && meetsMinValue;
            });
            
            let isCriterionMet = false;
            
            if (criterion.target_type === 'quantity') {
              isCriterionMet = matchingPolicies.length >= criterion.target_value;
            } else if (criterion.target_type === 'value') {
              const currentValue = matchingPolicies.reduce((sum: number, link: any) => 
                sum + (link.policies?.premium_value || 0), 0);
              isCriterionMet = currentValue >= criterion.target_value;
            }
            
            if (isCriterionMet) {
              completedCriteria++;
            }
          }
        }
      }
    }

    return {
      campaignId,
      campaignTitle: campaign.title,
      oldStatus,
      newStatus,
      criteriaCount,
      completedCriteria,
      wasFixed
    };

  } catch (error) {
    console.error('❌ Erro ao corrigir status da campanha:', error);
    return null;
  }
};

/**
 * Corrigir status de todas as campanhas de um usuário
 */
export const fixAllUserCampaignsStatus = async (userId: string): Promise<CampaignStatusFix[]> => {
  try {
    // Buscar todas as campanhas do usuário
    const { data: campaigns, error } = await supabase
      .from('goals')
      .select('id, title, status')
      .eq('user_id', userId)
      .eq('record_type', 'campaign')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Erro ao buscar campanhas do usuário:', error);
      return [];
    }

    const results: CampaignStatusFix[] = [];

    if (campaigns && campaigns.length > 0) {
      // Corrigir cada campanha
      for (const campaign of campaigns) {
        const result = await fixCampaignStatus(campaign.id);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Erro ao corrigir campanhas do usuário:', error);
    return [];
  }
};

/**
 * Corrigir status de todas as campanhas do sistema
 */
export const fixAllCampaignsStatus = async (): Promise<CampaignStatusFix[]> => {
  try {
    // Buscar todas as campanhas ativas
    const { data: campaigns, error } = await supabase
      .from('goals')
      .select('id, title, status, user_id')
      .eq('record_type', 'campaign')
      .eq('is_active', true)
      .eq('status', 'completed'); // Só verificar campanhas marcadas como completed

    if (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      return [];
    }

    const results: CampaignStatusFix[] = [];

    if (campaigns && campaigns.length > 0) {
      console.log(`🔍 Verificando ${campaigns.length} campanhas marcadas como concluídas...`);
      
      // Corrigir cada campanha
      for (const campaign of campaigns) {
        const result = await fixCampaignStatus(campaign.id);
        if (result) {
          results.push(result);
          if (result.wasFixed) {
            console.log(`✅ Corrigida: ${result.campaignTitle} (${result.oldStatus} → ${result.newStatus})`);
          }
        }
      }
    }

    const fixedCount = results.filter(r => r.wasFixed).length;
    console.log(`🎯 Correção concluída: ${fixedCount} campanhas corrigidas de ${results.length} verificadas`);

    return results;

  } catch (error) {
    console.error('❌ Erro ao corrigir todas as campanhas:', error);
    return [];
  }
};
