import { supabase } from '../lib/supabase';

/**
 * Serviço para calcular o progresso das campanhas baseado nas apólices vinculadas
 */

export interface CampaignProgressData {
  campaignId: string;
  currentValue: number;
  progressPercentage: number;
  totalPolicies: number;
  linkedPolicies: number;
  isCompleted: boolean;
}

/**
 * Calcula o progresso de uma campanha específica
 */
export const calculateCampaignProgress = async (campaignId: string): Promise<CampaignProgressData | null> => {
  try {
    // 1. Buscar a campanha master
    const { data: campaign, error: campaignError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (campaignError || !campaign) {
      console.error('Erro ao buscar campanha:', campaignError);
      return null;
    }

    // 2. Buscar todas as apólices vinculadas a esta campanha
    const { data: linkedPolicies, error: policiesError } = await supabase
      .from('goals')
      .select('*')
      .eq('campaign_master_id', campaignId)
      .eq('record_type', 'policy_link')
      .eq('is_policy_linked', true)
      .order('vinculada_em', { ascending: false });

    if (policiesError) {
      console.error('Erro ao buscar apólices vinculadas:', policiesError);
      return null;
    }

    const policies = linkedPolicies || [];

    // 3. Calcular progresso baseado no tipo da campanha
    let currentValue = 0;
    let progressPercentage = 0;

    console.log(`🔍 Calculando progresso para campanha ${campaignId}:`);
    console.log(`   📋 Tipo: ${campaign.type}, Meta: ${campaign.target}`);
    console.log(`   📄 Apólices encontradas: ${policies.length}`);

    if (campaign.type === 'valor') {
      // Somar valores das apólices
      currentValue = policies.reduce((sum, policy) => {
        const value = policy.policy_premium_value || 0;
        console.log(`   💰 Apólice ${policy.policy_number}: R$ ${value}`);
        return sum + value;
      }, 0);
      
      progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
      console.log(`   📊 Total: R$ ${currentValue} / R$ ${campaign.target} = ${progressPercentage.toFixed(2)}%`);
    } else if (campaign.type === 'apolices') {
      // Contar número de apólices
      currentValue = policies.length;
      progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
      console.log(`   📊 Total: ${currentValue} / ${campaign.target} apólices = ${progressPercentage.toFixed(2)}%`);
    }

    const isCompleted = progressPercentage >= 100;

    return {
      campaignId,
      currentValue,
      progressPercentage: Math.min(progressPercentage, 999), // Máximo 999%
      totalPolicies: policies.length,
      linkedPolicies: policies.length,
      isCompleted
    };

  } catch (error) {
    console.error('Erro no cálculo de progresso:', error);
    return null;
  }
};

/**
 * Atualiza o progresso da campanha no banco de dados
 */
export const updateCampaignProgress = async (campaignId: string): Promise<boolean> => {
  try {
    const progressData = await calculateCampaignProgress(campaignId);
    
    if (!progressData) {
      return false;
    }

    // Buscar estado atual da campanha para comparar
    const { data: currentCampaign, error: fetchError } = await supabase
      .from('goals')
      .select('status, achieved_at, progress_percentage, end_date')
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

    // Lógica de mudança de status baseada no progresso
    const wasCompleted = currentCampaign.status === 'completed';
    const isNowCompleted = progressData.progressPercentage >= 100;

    if (isNowCompleted && !wasCompleted) {
      // Campanha acabou de ser completada
      updateData.status = 'completed';
      updateData.achieved_at = new Date().toISOString();
      updateData.achieved_value = progressData.currentValue;
      console.log(`🎉 Campanha ${campaignId} COMPLETADA! Meta atingida!`);
    } else if (!isNowCompleted && wasCompleted) {
      // Campanha perdeu o status de completada (caso raro, mas possível)
      updateData.status = 'active';
      updateData.achieved_at = null;
      updateData.achieved_value = null;
      console.log(`⚠️ Campanha ${campaignId} voltou para ATIVA (meta não atingida)`);
    }

    // Verificar se campanha expirou
    const now = new Date();
    const endDate = new Date(currentCampaign.end_date || '');
    const isExpired = endDate < now;

    if (isExpired && !isNowCompleted && currentCampaign.status === 'active') {
      // Campanha expirou sem atingir a meta
      updateData.status = 'cancelled'; // Ou 'expired' se preferir
      console.log(`⏰ Campanha ${campaignId} EXPIROU sem atingir a meta`);
    }

    const { error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', campaignId)
      .eq('record_type', 'campaign');

    if (error) {
      console.error('Erro ao atualizar progresso da campanha:', error);
      return false;
    }

    console.log(`✅ Progresso atualizado para campanha ${campaignId}: ${progressData.progressPercentage.toFixed(1)}% (Status: ${updateData.status || currentCampaign.status})`);
    console.log(`   📊 Valor atual: ${progressData.currentValue}, Meta: ${progressData.campaignId}, Apólices vinculadas: ${progressData.totalPolicies}`);
    return true;

  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    return false;
  }
};

/**
 * Calcula progresso de todas as campanhas ativas de um usuário
 */
export const updateAllUserCampaignProgress = async (userId: string): Promise<void> => {
  try {
    // Buscar todas as campanhas ativas do usuário
    const { data: campaigns, error } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('record_type', 'campaign')
      .eq('is_active', true)
      .in('status', ['active', 'completed']);

    if (error) {
      console.error('Erro ao buscar campanhas do usuário:', error);
      return;
    }

    if (campaigns && campaigns.length > 0) {
      // Atualizar progresso de cada campanha
      const updatePromises = campaigns.map(campaign => 
        updateCampaignProgress(campaign.id)
      );

      await Promise.all(updatePromises);
      console.log(`✅ Progresso atualizado para ${campaigns.length} campanhas do usuário ${userId}`);
    }

  } catch (error) {
    console.error('Erro ao atualizar progresso das campanhas do usuário:', error);
  }
};

/**
 * Verifica e atualiza campanhas expiradas que não atingiram a meta
 */
export const checkAndUpdateExpiredCampaigns = async (userId?: string): Promise<void> => {
  try {
    let query = supabase
      .from('goals')
      .select('id, title, end_date, progress_percentage')
      .eq('record_type', 'campaign')
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString().split('T')[0]); // Campanhas com data de fim no passado

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: expiredCampaigns, error } = await query;

    if (error) {
      console.error('Erro ao buscar campanhas expiradas:', error);
      return;
    }

    if (expiredCampaigns && expiredCampaigns.length > 0) {
      // Atualizar campanhas expiradas para "cancelled" se não atingiram 100%
      const expiredIds = expiredCampaigns
        .filter(campaign => (campaign.progress_percentage || 0) < 100)
        .map(campaign => campaign.id);

      if (expiredIds.length > 0) {
        const { error: updateError } = await supabase
          .from('goals')
          .update({ 
            status: 'cancelled',
            last_updated: new Date().toISOString()
          })
          .in('id', expiredIds);

        if (updateError) {
          console.error('Erro ao atualizar campanhas expiradas:', updateError);
        } else {
          console.log(`⏰ ${expiredIds.length} campanhas marcadas como expiradas`);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar campanhas expiradas:', error);
  }
};

/**
 * Calcula progresso para campanhas compostas (múltiplos critérios)
 */
/**
 * Função de debug para verificar o estado das campanhas e apólices
 */
export const debugCampaignData = async (campaignId: string): Promise<void> => {
  try {
    console.log(`🔍 === DEBUG CAMPANHA ${campaignId} ===`);
    
    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (campaignError) {
      console.error('❌ Erro ao buscar campanha:', campaignError);
      return;
    }

    console.log('📋 Campanha:', {
      id: campaign.id,
      title: campaign.title,
      type: campaign.type,
      target: campaign.target,
      current_value: campaign.current_value,
      progress_percentage: campaign.progress_percentage,
      status: campaign.status
    });

    // Buscar apólices vinculadas
    const { data: policies, error: policiesError } = await supabase
      .from('goals')
      .select('*')
      .eq('campaign_master_id', campaignId)
      .eq('record_type', 'policy_link');

    if (policiesError) {
      console.error('❌ Erro ao buscar apólices:', policiesError);
      return;
    }

    console.log(`📄 Apólices encontradas: ${policies?.length || 0}`);
    policies?.forEach((policy, index) => {
      console.log(`   ${index + 1}. ${policy.policy_number} - R$ ${policy.policy_premium_value} (is_linked: ${policy.is_policy_linked})`);
    });

    // Buscar todas as apólices do usuário (para comparação)
    const { data: allPolicies, error: allPoliciesError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', campaign.user_id)
      .eq('record_type', 'policy_link');

    if (!allPoliciesError) {
      console.log(`📊 Total de apólices do usuário: ${allPolicies?.length || 0}`);
    }

    console.log('🔍 === FIM DEBUG ===');
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
};

export const calculateCompositeCampaignProgress = async (campaignId: string): Promise<CampaignProgressData | null> => {
  try {
    // Buscar a campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (campaignError || !campaign) {
      return null;
    }

    // Se não é campanha composta, usar cálculo normal
    if (campaign.campaign_type !== 'composite' || !campaign.criteria) {
      return calculateCampaignProgress(campaignId);
    }

    // Buscar apólices vinculadas
    const { data: linkedPolicies, error: policiesError } = await supabase
      .from('goals')
      .select('*')
      .eq('campaign_master_id', campaignId)
      .eq('record_type', 'policy_link')
      .eq('is_policy_linked', true);

    if (policiesError) {
      return null;
    }

    const policies = linkedPolicies || [];
    const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : [];
    
    // Calcular progresso para cada critério
    let totalProgress = 0;
    let completedCriteria = 0;

    for (const criterion of criteria) {
      // Filtrar apólices que atendem este critério
      const matchingPolicies = policies.filter(policy => {
        // Verificar tipo de apólice
        if (criterion.policy_type) {
          const policyTypeMap: { [key: string]: string } = {
            'Seguro Auto': 'auto',
            'Seguro Residencial': 'residencial'
          };
          
          if (policyTypeMap[policy.policy_type || ''] !== criterion.policy_type) {
            return false;
          }
        }

        // Verificar tipo de contrato
        if (criterion.contract_type && policy.policy_contract_type !== criterion.contract_type) {
          return false;
        }

        // Verificar valor mínimo
        if (criterion.min_value_per_policy && (policy.policy_premium_value || 0) < criterion.min_value_per_policy) {
          return false;
        }

        return true;
      });

      // Calcular progresso deste critério
      let criterionProgress = 0;
      if (criterion.target_type === 'valor') {
        const currentValue = matchingPolicies.reduce((sum, p) => sum + (p.policy_premium_value || 0), 0);
        criterionProgress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;
      } else {
        criterionProgress = criterion.target_value > 0 ? (matchingPolicies.length / criterion.target_value) * 100 : 0;
      }

      totalProgress += Math.min(criterionProgress, 100);
      if (criterionProgress >= 100) {
        completedCriteria++;
      }
    }

    // Progresso geral é a média dos critérios
    const overallProgress = criteria.length > 0 ? totalProgress / criteria.length : 0;
    const isCompleted = completedCriteria === criteria.length && criteria.length > 0;

    return {
      campaignId,
      currentValue: policies.length, // Total de apólices vinculadas
      progressPercentage: Math.min(overallProgress, 999),
      totalPolicies: policies.length,
      linkedPolicies: policies.length,
      isCompleted
    };

  } catch (error) {
    console.error('Erro no cálculo de progresso composto:', error);
    return null;
  }
};
