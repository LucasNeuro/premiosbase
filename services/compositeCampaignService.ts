import { supabase } from '../lib/supabase';

export interface CompositeCampaignCriteria {
    policy_type: 'auto' | 'residencial';
    target_type: 'quantity' | 'value';
    target_value: number;
    min_value_per_policy: number;
    order_index: number;
}

export interface CompositeCampaignProgress {
    goalId: string;
    totalTarget: number;
    totalCurrent: number;
    totalProgress: number;
    criteriaProgress: Array<{
        policy_type: string;
        target_value: number;
        current_value: number;
        progress: number;
    }>;
    isCompleted: boolean;
}

export class CompositeCampaignService {
   
    static async calculateCompositeCampaignProgress(
        goalId: string,
        userId: string,
        startDate: string,
        endDate: string,
        criteria: CompositeCampaignCriteria[]
    ): Promise<CompositeCampaignProgress> {
        try {
            // Se userId está vazio, não calcular progresso (campanha de grupo)
            if (!userId || userId.trim() === '') {
                return {
                    goalId,
                    totalTarget: 0,
                    totalCurrent: 0,
                    totalProgress: 0,
                    criteriaProgress: [],
                    isCompleted: false
                };
            }

            const criteriaProgress = [];

            // Processar cada critério individualmente
            for (const criterion of criteria) {
                const criterionProgress = await this.calculateCriterionProgress(
                    userId,
                    startDate,
                    endDate,
                    criterion
                );

                criteriaProgress.push(criterionProgress);

                }

            // NOVA LÓGICA: Campanha completa = TODOS os critérios atingidos
            const isCompleted = criteriaProgress.every(c => c.progress >= 100);
            
            // CORREÇÃO: Progresso geral = 100% APENAS se TODOS os critérios = 100%
            // Se qualquer critério < 100%, progresso geral < 100%
            let totalProgress = 0;
            if (criteriaProgress.length > 0) {
                if (isCompleted) {
                    // Se todos os critérios estão 100%, progresso geral = 100%
                    totalProgress = 100;
                } else {
                    // Se nem todos estão 100%, progresso geral = média dos critérios
                    totalProgress = criteriaProgress.reduce((sum, c) => sum + c.progress, 0) / criteriaProgress.length;
                }
            }

            // Para exibição: usar apenas critérios de VALOR para target total
            const valueCriteria = criteriaProgress.filter(c => {
                const criterion = criteria.find(cr => cr.policy_type === c.policy_type);
                return criterion?.target_type === 'value';
            });
            
            const totalTarget = valueCriteria.reduce((sum, c) => sum + c.target_value, 0);
            const totalCurrent = valueCriteria.reduce((sum, c) => sum + c.current_value, 0);

            const result = {
                goalId,
                totalTarget,
                totalCurrent,
                totalProgress: Math.min(totalProgress, 100),
                criteriaProgress,
                isCompleted
            };

            return result;

        } catch (error) {
            console.error('Erro ao calcular progresso da campanha composta:', error);
            return {
                goalId,
                totalTarget: 0,
                totalCurrent: 0,
                totalProgress: 0,
                criteriaProgress: [],
                isCompleted: false
            };
        }
    }

    /**
     * Calcula o progresso de um critério específico
     */
    private static async calculateCriterionProgress(
        userId: string,
        startDate: string,
        endDate: string,
        criterion: CompositeCampaignCriteria
    ): Promise<{
        policy_type: string;
        target_value: number;
        current_value: number;
        progress: number;
    }> {
        try {
            // Mapear tipos de apólice
            const policyTypeMap = {
                'auto': 'Seguro Auto',
                'residencial': 'Seguro Residencial'
            };

            const policyType = policyTypeMap[criterion.policy_type] || criterion.policy_type;

            let currentValue = 0;

            if (criterion.target_type === 'quantity') {
                // Critério de quantidade: contar apólices que atendem ao valor mínimo
                const { count } = await supabase
                    .from('policies')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('type', policyType)
                    .gte('registration_date', startDate)
                    .lte('registration_date', endDate)
                    .gte('premium_value', criterion.min_value_per_policy || 0);

                currentValue = count || 0;

            } else if (criterion.target_type === 'value') {
                // Critério de valor: somar valores das apólices que atendem ao valor mínimo
                const { data } = await supabase
                    .from('policies')
                    .select('premium_value')
                    .eq('user_id', userId)
                    .eq('type', policyType)
                    .gte('registration_date', startDate)
                    .lte('registration_date', endDate)
                    .gte('premium_value', criterion.min_value_per_policy || 0);

                currentValue = data?.reduce((sum, policy) => sum + (policy.premium_value || 0), 0) || 0;
            }

            const progress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;

            return {
                policy_type: criterion.policy_type,
                target_value: criterion.target_value,
                current_value: currentValue,
                progress: Math.min(progress, 100)
            };

        } catch (error) {
            console.error('Erro ao calcular progresso do critério:', error);
            return {
                policy_type: criterion.policy_type,
                target_value: criterion.target_value,
                current_value: 0,
                progress: 0
            };
        }
    }

    /**
     * Atualiza o progresso de uma campanha composta no banco
     */
    static async updateCompositeCampaignProgress(
        goalId: string,
        progress: CompositeCampaignProgress
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('goals')
                .update({
                    current_value: progress.totalCurrent,
                    progress_percentage: progress.totalProgress,
                    status: progress.isCompleted ? 'completed' : 'active',
                    achieved_at: progress.isCompleted ? new Date().toISOString() : null,
                    achieved_value: progress.isCompleted ? progress.totalCurrent : null,
                    last_updated: new Date().toISOString()
                })
                .eq('id', goalId);

            if (error) {
                console.error('Erro ao atualizar progresso da campanha:', error);
                throw error;
            }

        } catch (error) {
            console.error('Erro ao atualizar progresso da campanha:', error);
            throw error;
        }
    }

    /**
     * Recalcula e atualiza o progresso de todas as campanhas compostas de um usuário
     */
    static async recalculateUserCompositeCampaigns(userId: string): Promise<void> {
        try {
            // Buscar todas as campanhas compostas do usuário
            const { data: goals, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('campaign_type', 'composite')
                .eq('is_active', true);

            if (error) {
                console.error('Erro ao buscar campanhas do usuário:', error);
                return;
            }

            if (!goals || goals.length === 0) {
                return;
            }

            // Recalcular cada campanha
            for (const goal of goals) {
                if (goal.criteria) {
                    try {
                        const criteria = Array.isArray(goal.criteria) 
                            ? goal.criteria 
                            : JSON.parse(goal.criteria);

                        const progress = await this.calculateCompositeCampaignProgress(
                            goal.id,
                            userId,
                            goal.start_date,
                            goal.end_date,
                            criteria
                        );

                        await this.updateCompositeCampaignProgress(goal.id, progress);

                    } catch (error) {
                        console.error(`Erro ao recalcular campanha ${goal.id}:`, error);
                    }
                }
            }

            } catch (error) {
            console.error('Erro ao recalcular campanhas compostas:', error);
        }
    }
}
