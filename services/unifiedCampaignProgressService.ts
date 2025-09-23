import { supabase } from '../lib/supabase';

export interface UnifiedCampaignProgress {
    campaignId: string;
    currentValue: number;
    progressPercentage: number;
    isCompleted: boolean;
    criteriaProgress?: CriterionProgress[];
    totalPolicies: number;
    lastCalculated: Date;
}

export interface CriterionProgress {
    policy_type: string;
    target_type: 'value' | 'quantity';
    target_value: number;
    current_value: number;
    progress: number;
    isCompleted: boolean;
}

export class UnifiedCampaignProgressService {
    /**
     * Calcula o progresso de uma campanha específica em tempo real
     * Usado tanto pelo admin quanto pelo corretor
     */
    static async calculateCampaignProgress(campaignId: string): Promise<UnifiedCampaignProgress | null> {
        try {
            console.log(`🔄 Calculando progresso em tempo real para campanha: ${campaignId}`);

            // 1. Buscar dados da campanha
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', campaignId)
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .single();

            if (campaignError || !campaign) {
                console.error('❌ Erro ao buscar campanha:', campaignError);
                return null;
            }

            // 2. Buscar apólices vinculadas em tempo real
            const { data: linkedPolicies, error: policiesError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies(
                        id,
                        premium_value,
                        type,
                        contract_type,
                        registration_date
                    )
                `)
                .eq('campaign_id', campaignId)
                .eq('is_active', true);

            if (policiesError) {
                console.error('❌ Erro ao buscar apólices vinculadas:', policiesError);
                return null;
            }

            const policies = linkedPolicies || [];
            console.log(`📊 Encontradas ${policies.length} apólices vinculadas`);

            // 3. Calcular progresso baseado no tipo da campanha
            if (campaign.campaign_type === 'composite' && campaign.criteria) {
                return await this.calculateCompositeCampaignProgress(campaign, policies);
            } else {
                return await this.calculateSimpleCampaignProgress(campaign, policies);
            }

        } catch (error) {
            console.error('❌ Erro ao calcular progresso da campanha:', error);
            return null;
        }
    }

    /**
     * Calcula progresso para campanhas compostas
     */
    private static async calculateCompositeCampaignProgress(
        campaign: any,
        linkedPolicies: any[]
    ): Promise<UnifiedCampaignProgress> {
        try {
            const criteria = Array.isArray(campaign.criteria) 
                ? campaign.criteria 
                : JSON.parse(campaign.criteria);

            const criteriaProgress: CriterionProgress[] = [];
            let totalProgress = 0;
            let completedCriteria = 0;

            // Calcular progresso de cada critério
            for (const criterion of criteria) {
                const criterionProgress = await this.calculateCriterionProgress(
                    campaign.id,
                    criterion,
                    linkedPolicies
                );

                criteriaProgress.push(criterionProgress);
                totalProgress += criterionProgress.progress;

                if (criterionProgress.isCompleted) {
                    completedCriteria++;
                }
            }

            // LÓGICA CORRETA: Progresso geral = 100% APENAS se TODOS os critérios = 100%
            // Se nem todos estão 100%, progresso geral = menor progresso entre os critérios
            let finalProgress = 0;
            if (criteria.length > 0) {
                if (completedCriteria === criteria.length) {
                    finalProgress = 100; // Todos os critérios completos
                } else {
                    // Progresso geral = menor progresso entre os critérios
                    // Isso garante que a campanha só é considerada completa quando TODOS os critérios são atingidos
                    finalProgress = Math.min(...criteriaProgress.map(c => c.progress));
                }
            }

            // Calcular valor atual total (apenas critérios de valor)
            const valueCriteria = criteriaProgress.filter(c => c.target_type === 'value');
            const currentValue = valueCriteria.reduce((sum, c) => sum + c.current_value, 0);

            return {
                campaignId: campaign.id,
                currentValue,
                progressPercentage: Math.min(finalProgress, 100),
                isCompleted: completedCriteria === criteria.length,
                criteriaProgress,
                totalPolicies: linkedPolicies.length,
                lastCalculated: new Date()
            };

        } catch (error) {
            console.error('❌ Erro ao calcular progresso composto:', error);
            return {
                campaignId: campaign.id,
                currentValue: 0,
                progressPercentage: 0,
                isCompleted: false,
                criteriaProgress: [],
                totalPolicies: linkedPolicies.length,
                lastCalculated: new Date()
            };
        }
    }

    /**
     * Calcula progresso para campanhas simples
     */
    private static async calculateSimpleCampaignProgress(
        campaign: any,
        linkedPolicies: any[]
    ): Promise<UnifiedCampaignProgress> {
        try {
            let currentValue = 0;
            let progressPercentage = 0;

            if (campaign.type === 'valor') {
                // Somar valores das apólices
                currentValue = linkedPolicies.reduce((sum, link) => {
                    const value = link.policy?.premium_value || 0;
                    return sum + value;
                }, 0);
                
                progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
            } else if (campaign.type === 'apolices') {
                // Contar número de apólices
                currentValue = linkedPolicies.length;
                progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
            }

            return {
                campaignId: campaign.id,
                currentValue,
                progressPercentage: Math.min(progressPercentage, 100),
                isCompleted: progressPercentage >= 100,
                totalPolicies: linkedPolicies.length,
                lastCalculated: new Date()
            };

        } catch (error) {
            console.error('❌ Erro ao calcular progresso simples:', error);
            return {
                campaignId: campaign.id,
                currentValue: 0,
                progressPercentage: 0,
                isCompleted: false,
                totalPolicies: linkedPolicies.length,
                lastCalculated: new Date()
            };
        }
    }

    /**
     * Calcula progresso de um critério específico
     */
    private static async calculateCriterionProgress(
        campaignId: string,
        criterion: any,
        linkedPolicies: any[]
    ): Promise<CriterionProgress> {
        try {
            // Filtrar apólices que atendem ao critério
            const matchingPolicies = linkedPolicies.filter(link => {
                const policy = link.policy;
                if (!policy) return false;

                // Verificar tipo de apólice
                if (criterion.policy_type && criterion.policy_type !== 'geral') {
                    if (criterion.policy_type === 'auto' && policy.type !== 'Seguro Auto') return false;
                    if (criterion.policy_type === 'residencial' && policy.type !== 'Seguro Residencial') return false;
                }

                // Verificar valor mínimo por apólice
                if (criterion.min_value_per_policy && policy.premium_value < criterion.min_value_per_policy) {
                    return false;
                }

                return true;
            });

            let currentValue = 0;
            let progress = 0;

            if (criterion.target_type === 'value') {
                // Critério de valor
                currentValue = matchingPolicies.reduce((sum, link) => {
                    return sum + (link.policy?.premium_value || 0);
                }, 0);
                
                progress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;
            } else {
                // Critério de quantidade
                currentValue = matchingPolicies.length;
                progress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;
            }

            return {
                policy_type: criterion.policy_type || 'geral',
                target_type: criterion.target_type,
                target_value: criterion.target_value,
                current_value: currentValue,
                progress: Math.min(progress, 100),
                isCompleted: progress >= 100
            };

        } catch (error) {
            console.error('❌ Erro ao calcular progresso do critério:', error);
            return {
                policy_type: criterion.policy_type || 'geral',
                target_type: criterion.target_type,
                target_value: criterion.target_value,
                current_value: 0,
                progress: 0,
                isCompleted: false
            };
        }
    }

    /**
     * Recalcula progresso de todas as campanhas de um usuário
     */
    static async recalculateUserCampaigns(userId: string): Promise<void> {
        try {
            console.log(`🔄 Recalculando campanhas do usuário: ${userId}`);

            const { data: campaigns, error } = await supabase
                .from('goals')
                .select('id')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('is_active', true);

            if (error) {
                console.error('❌ Erro ao buscar campanhas do usuário:', error);
                return;
            }

            for (const campaign of campaigns || []) {
                await this.calculateCampaignProgress(campaign.id);
            }

            console.log(`✅ Recalculadas ${campaigns?.length || 0} campanhas`);

        } catch (error) {
            console.error('❌ Erro ao recalcular campanhas do usuário:', error);
        }
    }

    /**
     * Recalcula progresso de todas as campanhas ativas
     */
    static async recalculateAllCampaigns(): Promise<void> {
        try {
            console.log('🔄 Recalculando todas as campanhas ativas...');

            const { data: campaigns, error } = await supabase
                .from('goals')
                .select('id')
                .eq('record_type', 'campaign')
                .eq('is_active', true);

            if (error) {
                console.error('❌ Erro ao buscar campanhas:', error);
                return;
            }

            for (const campaign of campaigns || []) {
                await this.calculateCampaignProgress(campaign.id);
            }

            console.log(`✅ Recalculadas ${campaigns?.length || 0} campanhas`);

        } catch (error) {
            console.error('❌ Erro ao recalcular todas as campanhas:', error);
        }
    }
}