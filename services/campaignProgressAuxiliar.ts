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
 * ⚠️ SERVIÇO DESABILITADO - Usar UnifiedCampaignProgressServiceV2
 * Calcular progresso de uma campanha usando a tabela auxiliar
 */
export const calculateCampaignProgressAuxiliar = async (campaignId: string): Promise<CampaignProgressAuxiliar | null> => {
  console.warn('⚠️ campaignProgressAuxiliar está DESABILITADO - use UnifiedCampaignProgressServiceV2');
  return null;
  try {
    // 1. Buscar dados da campanha (incluindo critérios!)
    const { data: campaign, error: campaignError } = await supabase
      .from('goals')
      .select('id, title, type, target, status, end_date, acceptance_status, accepted_at, criteria')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .single();

    if (campaignError || !campaign) {
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
    console.log(`🔍 Debug - Buscando apólices vinculadas para campanha ${campaignId}`);
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
          created_at,
          contract_type
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .eq('policies.status', 'active');

    if (linkError) {
      console.error('❌ Debug - Erro ao buscar apólices vinculadas:', linkError);
      return null;
    }

    console.log(`📊 Debug - Encontradas ${linkedData?.length || 0} vinculações ativas`);

    // 🎯 FILTRO RIGOROSO: Só contar apólices criadas APÓS aceite da campanha
    const acceptedAt = campaign.accepted_at ? new Date(campaign.accepted_at) : new Date();

    const linkedPolicies = (linkedData || []).filter((link: any) => {
      const linkCreatedAt = new Date(link.created_at);
      const policyCreatedAt = new Date(link.policies?.created_at);

      // ✅ REGRA FUNDAMENTAL: Só apólices criadas APÓS aceitar a campanha
      const isValidTiming = policyCreatedAt >= acceptedAt;
      
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
              
              // Verificar tipo de contrato
              let meetsContractType = true;
              if (criterion.contract_type && criterion.contract_type !== 'ambos') {
                const policyContractType = policy.contract_type;
                console.log('🔍 Debug contract_type DETALHADO:', {
                  criterionContractType: criterion.contract_type,
                  policyContractType: policyContractType,
                  policyId: policy.id,
                  policyNumber: policy.policy_number,
                  comparisonNovo: criterion.contract_type === 'novo' && policyContractType !== 'Novo',
                  comparisonRenovacao: criterion.contract_type === 'renovacao_bradesco' && policyContractType !== 'Renovação Bradesco'
                });
                
                // CRITÉRIO MAIS RIGOROSO: Se é específico para um tipo, DEVE ser exato
                if (criterion.contract_type === 'novo' && policyContractType !== 'Novo') {
                  console.log('❌ REJEITANDO: Critério pede NOVO, mas apólice é:', policyContractType);
                  meetsContractType = false;
                }
                if (criterion.contract_type === 'renovacao_bradesco' && policyContractType !== 'Renovação Bradesco') {
                  console.log('❌ REJEITANDO: Critério pede RENOVAÇÃO, mas apólice é:', policyContractType);
                  meetsContractType = false;
                }
                
                console.log('🔍 meetsContractType FINAL:', meetsContractType);
              } else {
                console.log('⚠️ CampaignProgressAuxiliar - SEM FILTRO DE CONTRACT_TYPE:', {
                  criterionContractType: criterion.contract_type,
                  policyContractType: policy.contract_type
                });
              }
              
              return isCorrectType && meetsMinValue && meetsContractType;
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
          
          // 🔧 CORREÇÃO CRÍTICA: Progresso geral = 100% APENAS se TODOS os critérios = 100%
          // Se qualquer critério < 100%, progresso geral = menor progresso entre os critérios
          if (isCompleted) {
              // Se todos os critérios estão 100%, progresso geral = 100%
              progressPercentage = 100;
          } else {
              // Se nem todos estão 100%, progresso geral = MENOR progresso entre os critérios
              // Isso garante que a campanha só é considerada completa quando TODOS os critérios são atingidos
              const minProgress = Math.min(...criteriaResults.map(result => result.percentage));
              progressPercentage = minProgress;
              
              // Debug: Log para identificar o problema
              console.log('🔍 PROGRESS DEBUG:', {
                  campaignId,
                  criteriaResults: criteriaResults.map(r => ({ 
                      type: r.policyType, 
                      percentage: r.percentage, 
                      isMet: r.isThisCriterionMet 
                  })),
                  minProgress,
                  isCompleted,
                  finalProgress: progressPercentage
              });
          }
          
          // Valor atual = soma de todos os valores (para display)
          currentValue = linkedPolicies.reduce((sum: number, link: any) => 
            sum + (link.policies?.premium_value || 0), 0);
            
          }
    } else if (parsedCriteria) {
      }
    
    // 🔧 CORREÇÃO CRÍTICA: Fallback para campanhas tradicionais (sem critérios específicos)
    if (criteriaResults.length === 0) {
      console.log('🔍 Debug - Campanha tradicional sem critérios específicos');
      
      if (campaign.type === 'valor') {
        // Campanha por valor: somar valores das apólices vinculadas
        currentValue = linkedPolicies.reduce((sum: number, link: any) => {
          return sum + (link.policies?.premium_value || 0);
        }, 0);
        progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
        isCompleted = progressPercentage >= 100;
        
        console.log(`📊 Debug - Campanha por valor: ${currentValue}/${campaign.target} = ${progressPercentage.toFixed(1)}%`);
        } else if (campaign.type === 'apolices') {
        // Campanha por quantidade: contar número de apólices vinculadas
        currentValue = linkedPolicies.length;
        progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
        isCompleted = progressPercentage >= 100;
        
        console.log(`📊 Debug - Campanha por quantidade: ${currentValue}/${campaign.target} = ${progressPercentage.toFixed(1)}%`);
        } else {
        // Tipo não reconhecido - usar valor como fallback
        currentValue = linkedPolicies.reduce((sum: number, link: any) => {
          return sum + (link.policies?.premium_value || 0);
        }, 0);
        progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
        isCompleted = progressPercentage >= 100;
        
        console.log(`📊 Debug - Tipo não reconhecido (${campaign.type}), usando valor: ${currentValue}/${campaign.target} = ${progressPercentage.toFixed(1)}%`);
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
      return false;
    }

    // Preparar dados para atualização
    const updateData: any = {
      current_value: progressData.currentValue,
      progress_percentage: progressData.progressPercentage,
      last_updated: new Date().toISOString()
    };

    // 🔧 CORREÇÃO: Lógica mais rigorosa para mudança de status
    const wasCompleted = currentCampaign.status === 'completed';
    const isNowCompleted = progressData.isCompleted;
    const progressPercentage = progressData.progressPercentage || 0;

    // Só marcar como completed se TODOS os critérios foram atingidos (100%)
    if (isNowCompleted && progressPercentage >= 100 && !wasCompleted) {
      updateData.status = 'completed';
      updateData.achieved_at = new Date().toISOString();
      updateData.achieved_value = progressData.currentValue;
      console.log(`✅ Campanha ${campaignId} marcada como COMPLETED (${progressPercentage}%)`);
      } else if (!isNowCompleted && progressPercentage < 100 && wasCompleted) {
      // Se perdeu o status de completed, voltar para active
      updateData.status = 'active';
      updateData.achieved_at = null;
      updateData.achieved_value = null;
      console.log(`🔄 Campanha ${campaignId} voltou para ACTIVE (${progressPercentage}%)`);
      }

    // Verificar expiração e atualizar status baseado nas regras
    const now = new Date();
    const endDate = new Date(currentCampaign.end_date || '');
    const isExpired = endDate < now;
    
    // 🔧 CORREÇÃO: Lógica de expiração mais rigorosa
    if (isExpired && currentCampaign.status === 'active') {
      if (isNowCompleted && progressPercentage >= 100) {
        // Expirou mas atingiu a meta = completed
        updateData.status = 'completed';
        updateData.achieved_at = new Date().toISOString();
        updateData.achieved_value = progressData.currentValue;
        console.log(`✅ Campanha ${campaignId} expirou mas foi COMPLETED (${progressPercentage}%)`);
        } else {
        // Expirou e não atingiu a meta = cancelled (não atingida)
        updateData.status = 'cancelled';
        console.log(`❌ Campanha ${campaignId} expirou sem atingir meta (${progressPercentage}%)`);
        }
    } else if (!isExpired && isNowCompleted && progressPercentage >= 100 && currentCampaign.status === 'active') {
      // Não expirou e atingiu a meta = completed
      updateData.status = 'completed';
      updateData.achieved_at = new Date().toISOString();
      updateData.achieved_value = progressData.currentValue;
      console.log(`✅ Campanha ${campaignId} atingiu meta antes do prazo (${progressPercentage}%)`);
      }

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', campaignId)
      .eq('record_type', 'campaign');

    if (updateError) {
      return false;
    }

    return true;

  } catch (error) {
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
      return;
    }

    if (campaigns && campaigns.length > 0) {

      // Atualizar em paralelo
      const updatePromises = campaigns.map(campaign => {

        return updateCampaignProgressAuxiliar(campaign.id);
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result === true).length;

      } else {

      }

  } catch (error) {
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
    return [];
  }
};
