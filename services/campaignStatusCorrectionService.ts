import { supabase } from '../lib/supabase';

export class CampaignStatusCorrectionService {
    /**
     * Força a correção do status de todas as campanhas
     */
    static async forceCorrectAllCampaignStatus(): Promise<{ corrected: number; errors: string[] }> {
        const errors: string[] = [];
        let corrected = 0;

        try {
            // 1. Buscar todas as campanhas
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted');

            if (campaignsError) {
                throw campaignsError;
            }
            // 2. Para cada campanha, recalcular o progresso e corrigir o status
            for (const campaign of campaigns || []) {
                try {
                    // Recalcular progresso baseado nos critérios
                    const correctProgress = await this.recalculateCampaignProgress(campaign);
                    
                    // Atualizar status no banco
                    const { error: updateError } = await supabase
                        .from('goals')
                        .update({
                            status: correctProgress.is_completed ? 'completed' : 'active',
                            progress_percentage: correctProgress.progress_percentage,
                            current_value: correctProgress.current_value,
                            achieved_at: correctProgress.is_completed ? new Date().toISOString() : null,
                            last_updated: new Date().toISOString()
                        })
                        .eq('id', campaign.id);

                    if (updateError) {
                        errors.push(`Erro ao atualizar ${campaign.title}: ${updateError.message}`);
                    } else {
                        corrected++;
                    }

                } catch (error) {
                    errors.push(`Erro ao processar ${campaign.title}: ${error}`);
                }
            }
            return { corrected, errors };

        } catch (error) {
            errors.push(`Erro geral: ${error}`);
            return { corrected, errors };
        }
    }

    /**
     * Recalcula o progresso de uma campanha baseado nos critérios
     */
    private static async recalculateCampaignProgress(campaign: any): Promise<any> {
        // Buscar todas as apólices vinculadas a esta campanha
        const { data: linkedPolicies, error: policiesError } = await supabase
            .from('policy_campaign_links')
            .select(`
                policies (
                    id,
                    type,
                    contract_type,
                    premium_value,
                    created_at
                )
            `)
            .eq('campaign_id', campaign.id)
            .eq('is_active', true);

        if (policiesError) throw policiesError;

        const allPolicies = linkedPolicies?.map(link => link.policies) || [];
        // Calcular progresso baseado nos critérios
        let allCriteriaCompleted = true;
        let criteriaProgress = [];

        // Processar critérios
        const criteria = campaign.criteria;
        if (criteria) {
            let criteriaArray = [];
            
            if (Array.isArray(criteria)) {
                criteriaArray = criteria;
            } else if (typeof criteria === 'object') {
                criteriaArray = Object.values(criteria);
            }
            for (let i = 0; i < criteriaArray.length; i++) {
                const criterion = criteriaArray[i];
                const matchingPolicies = allPolicies.filter(policy => {
                    const policyTypeMap: { [key: string]: string } = {
                        'Seguro Auto': 'auto',
                        'Seguro Residencial': 'residencial'
                    };

                    // Verificar tipo de apólice
                    if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policy.type]) {
                        return false;
                    }

                    // Verificar tipo de contrato
                    if (criterion.contract_type && criterion.contract_type !== policy.contract_type) {
                        return false;
                    }

                    // Verificar valor mínimo por apólice
                    if (criterion.min_value_per_policy && policy.premium_value < criterion.min_value_per_policy) {
                        return false;
                    }

                    return true;
                });
                let criterionCurrent = 0;
                let criterionTarget = 0;
                let criterionCompleted = false;
                let criterionProgressPercentage = 0;

                if (criterion.target_type === 'quantity') {
                    // Critério por quantidade
                    criterionCurrent = matchingPolicies.length;
                    criterionTarget = criterion.target_value || 0;
                    criterionProgressPercentage = criterionTarget > 0 ? (criterionCurrent / criterionTarget) * 100 : 0;
                    criterionCompleted = criterionProgressPercentage >= 100;
                } else if (criterion.target_type === 'value') {
                    // Critério por valor
                    criterionCurrent = matchingPolicies.reduce((sum, policy) => sum + policy.premium_value, 0);
                    criterionTarget = criterion.target_value || 0;
                    criterionProgressPercentage = criterionTarget > 0 ? (criterionCurrent / criterionTarget) * 100 : 0;
                    criterionCompleted = criterionProgressPercentage >= 100;
                }

                criteriaProgress.push({
                    criterion: i + 1,
                    current: criterionCurrent,
                    target: criterionTarget,
                    progress: criterionProgressPercentage,
                    completed: criterionCompleted
                });
                
                if (!criterionCompleted) {
                    allCriteriaCompleted = false;
                } else {
                }
            }
        }

        // Calcular progresso geral (média dos critérios)
        const totalProgress = criteriaProgress.length > 0 
            ? criteriaProgress.reduce((sum, c) => sum + c.progress, 0) / criteriaProgress.length 
            : 0;
        
        // Uma campanha só é concluída quando TODOS os critérios estão 100%
        const isCompleted = allCriteriaCompleted && criteriaProgress.length > 0;
        return {
            current_value: criteriaProgress.reduce((sum, c) => sum + c.current, 0),
            progress_percentage: Math.min(totalProgress, 100),
            is_completed: isCompleted
        };
    }
}
