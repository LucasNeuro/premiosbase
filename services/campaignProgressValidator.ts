import { supabase } from '../lib/supabase';

/**
 * Serviço para validar e corrigir automaticamente inconsistências no progresso das campanhas
 */
export class CampaignProgressValidator {
    
    /**
     * Valida o progresso de todas as campanhas de um usuário
     */
    static async validateUserCampaignProgress(userId: string): Promise<{
        validated: number;
        corrected: number;
        errors: string[];
    }> {
        try {
            // Buscar todas as campanhas ativas do usuário
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .in('status', ['active', 'completed']);

            if (campaignsError) {
                return { validated: 0, corrected: 0, errors: [campaignsError.message] };
            }

            if (!campaigns || campaigns.length === 0) {
                return { validated: 0, corrected: 0, errors: [] };
            }

            let validated = 0;
            let corrected = 0;
            const errors: string[] = [];

            // Validar cada campanha
            for (const campaign of campaigns) {
                try {
                    const isValid = await this.validateCampaignProgress(campaign);
                    validated++;
                    
                    if (!isValid) {
                        const correctedSuccessfully = await this.correctCampaignProgress(campaign);
                        if (correctedSuccessfully) {
                            corrected++;
                        } else {
                            errors.push(`Falha ao corrigir campanha ${campaign.title}`);
                        }
                    }
                } catch (error: any) {
                    errors.push(`Erro ao validar campanha ${campaign.title}: ${error.message}`);
                }
            }
            return { validated, corrected, errors };

        } catch (error: any) {
            return { validated: 0, corrected: 0, errors: [error.message] };
        }
    }

    /**
     * Valida se o progresso de uma campanha está correto
     */
    private static async validateCampaignProgress(campaign: any): Promise<boolean> {
        try {
            // Buscar políticas vinculadas
            const { data: policyLinks, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    policies (
                        id,
                        type,
                        premium_value,
                        policy_number,
                        created_at
                    )
                `)
                .eq('campaign_id', campaign.id)
                .eq('is_active', true);

            if (linksError) throw linksError;

            const policies = policyLinks?.map(link => link.policies).filter(Boolean) || [];
            
            // Calcular progresso correto
            let correctProgress = 0;
            let correctValue = 0;
            let isCompleted = false;

            if (campaign.criteria) {
                const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : Object.values(campaign.criteria);
                let totalProgress = 0;
                let completedCriteria = 0;

                for (const criterion of criteria) {
                    // Filtrar políticas que atendem este critério
                    const matchingPolicies = policies.filter(policy => {
                        const policyTypeMap = {
                            'Seguro Auto': 'auto',
                            'Seguro Residencial': 'residencial'
                        };

                        // Verificar tipo de apólice
                        if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policy.type]) {
                            return false;
                        }

                        // Verificar valor mínimo por apólice
                        if (criterion.min_value_per_policy && policy.premium_value < criterion.min_value_per_policy) {
                            return false;
                        }

                        return true;
                    });

                    let criterionProgress = 0;
                    let criterionCompleted = false;

                    if (criterion.target_type === 'quantity') {
                        const current = matchingPolicies.length;
                        const target = criterion.target_value || 0;
                        criterionProgress = target > 0 ? (current / target) * 100 : 0;
                        criterionCompleted = criterionProgress >= 100;
                    } else if (criterion.target_type === 'value') {
                        const current = matchingPolicies.reduce((sum, p) => sum + p.premium_value, 0);
                        const target = criterion.target_value || 0;
                        criterionProgress = target > 0 ? (current / target) * 100 : 0;
                        criterionCompleted = criterionProgress >= 100;
                    }

                    totalProgress += criterionProgress;
                    if (criterionCompleted) completedCriteria++;
                }

                // Progresso médio dos critérios
                correctProgress = criteria.length > 0 ? totalProgress / criteria.length : 0;
                isCompleted = completedCriteria === criteria.length;
            } else {
                // Campanha sem critérios específicos
                correctValue = policies.reduce((sum, p) => sum + p.premium_value, 0);
                correctProgress = campaign.target > 0 ? (correctValue / campaign.target) * 100 : 0;
                isCompleted = correctProgress >= 100;
            }

            // Valor atual = soma de todos os valores
            correctValue = policies.reduce((sum, p) => sum + p.premium_value, 0);

            // Verificar se há diferenças significativas
            const progressDiff = Math.abs(campaign.progress_percentage - correctProgress);
            const valueDiff = Math.abs(campaign.current_value - correctValue);
            const statusCorrect = (campaign.status === 'completed') === isCompleted;

            // Considerar inconsistente se houver diferença > 0.1% ou > R$ 1
            const isInconsistent = progressDiff > 0.1 || valueDiff > 1 || !statusCorrect;

            if (isInconsistent) {
            }

            return !isInconsistent;

        } catch (error: any) {
            return false;
        }
    }

    /**
     * Corrige o progresso de uma campanha
     */
    private static async correctCampaignProgress(campaign: any): Promise<boolean> {
        try {
            // Buscar políticas vinculadas
            const { data: policyLinks, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    policies (
                        id,
                        type,
                        premium_value,
                        policy_number,
                        created_at
                    )
                `)
                .eq('campaign_id', campaign.id)
                .eq('is_active', true);

            if (linksError) throw linksError;

            const policies = policyLinks?.map(link => link.policies).filter(Boolean) || [];
            
            // Calcular progresso correto
            let correctProgress = 0;
            let correctValue = 0;
            let isCompleted = false;

            if (campaign.criteria) {
                const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : Object.values(campaign.criteria);
                let totalProgress = 0;
                let completedCriteria = 0;

                for (const criterion of criteria) {
                    // Filtrar políticas que atendem este critério
                    const matchingPolicies = policies.filter(policy => {
                        const policyTypeMap = {
                            'Seguro Auto': 'auto',
                            'Seguro Residencial': 'residencial'
                        };

                        // Verificar tipo de apólice
                        if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policy.type]) {
                            return false;
                        }

                        // Verificar valor mínimo por apólice
                        if (criterion.min_value_per_policy && policy.premium_value < criterion.min_value_per_policy) {
                            return false;
                        }

                        return true;
                    });

                    let criterionProgress = 0;
                    let criterionCompleted = false;

                    if (criterion.target_type === 'quantity') {
                        const current = matchingPolicies.length;
                        const target = criterion.target_value || 0;
                        criterionProgress = target > 0 ? (current / target) * 100 : 0;
                        criterionCompleted = criterionProgress >= 100;
                    } else if (criterion.target_type === 'value') {
                        const current = matchingPolicies.reduce((sum, p) => sum + p.premium_value, 0);
                        const target = criterion.target_value || 0;
                        criterionProgress = target > 0 ? (current / target) * 100 : 0;
                        criterionCompleted = criterionProgress >= 100;
                    }

                    totalProgress += criterionProgress;
                    if (criterionCompleted) completedCriteria++;
                }

                // Progresso médio dos critérios
                correctProgress = criteria.length > 0 ? totalProgress / criteria.length : 0;
                isCompleted = completedCriteria === criteria.length;
            } else {
                // Campanha sem critérios específicos
                correctValue = policies.reduce((sum, p) => sum + p.premium_value, 0);
                correctProgress = campaign.target > 0 ? (correctValue / campaign.target) * 100 : 0;
                isCompleted = correctProgress >= 100;
            }

            // Valor atual = soma de todos os valores
            correctValue = policies.reduce((sum, p) => sum + p.premium_value, 0);

            // Atualizar no banco
            const { error: updateError } = await supabase
                .from('goals')
                .update({
                    current_value: correctValue,
                    progress_percentage: Math.min(correctProgress, 999), // Máximo 999%
                    status: isCompleted ? 'completed' : 'active',
                    last_updated: new Date().toISOString(),
                    achieved_at: isCompleted ? new Date().toISOString() : null
                })
                .eq('id', campaign.id);

            if (updateError) {
                return false;
            }

            return true;

        } catch (error: any) {
            return false;
        }
    }
}
