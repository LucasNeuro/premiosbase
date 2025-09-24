import { supabase } from '../lib/supabase';
import { mistralAI } from './mistralAI';

export interface CampaignCriteria {
    id: string;
    policy_type: string;
    contract_type: string;
    min_value_per_policy?: number;
    target_count?: number;
    target_value?: number;
    description?: string;
}

export interface PolicyData {
    id: string;
    type: string;
    contract_type: string;
    premium_value: number;
    policy_number: string;
    cpd_number: string;
    user_id: string;
    created_at: string;
}

export interface CampaignMatch {
    campaign_id: string;
    campaign_title: string;
    criteria_matches: CampaignCriteria[];
    match_score: number;
    reasoning: string;
}

export class CampaignCriteriaService {
    /**
     * Analisa uma apólice e encontra TODAS as campanhas compatíveis usando IA
     */
    static async analyzePolicyCompatibility(
        policyData: PolicyData,
        userId: string
    ): Promise<CampaignMatch[]> {
        try {
            // 1. Buscar todas as campanhas aceitas pelo usuário
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .eq('user_id', userId)
                .eq('acceptance_status', 'accepted');

            if (campaignsError) throw campaignsError;

            if (!campaigns || campaigns.length === 0) {
                return [];
            }

            // 2. Preparar dados para análise da IA
            const analysisData = {
                policy: {
                    type: policyData.type,
                    contract_type: policyData.contract_type,
                    premium_value: policyData.premium_value,
                    policy_number: policyData.policy_number
                },
                campaigns: campaigns.map(campaign => ({
                    id: campaign.id,
                    title: campaign.title,
                    criteria: campaign.criteria
                }))
            };

            // 3. Usar IA para análise inteligente
            const aiAnalysis = await this.performAICriteriaAnalysis(analysisData);

            // 4. Processar resultados e criar matches
            const matches: CampaignMatch[] = [];

            for (const campaign of campaigns) {
                const aiResult = aiAnalysis.find(result => result.campaign_id === campaign.id);
                
                if (aiResult && aiResult.is_compatible) {
                    const criteriaMatches = this.extractMatchingCriteria(
                        campaign.criteria,
                        policyData
                    );

                    matches.push({
                        campaign_id: campaign.id,
                        campaign_title: campaign.title,
                        criteria_matches: criteriaMatches,
                        match_score: aiResult.confidence_score,
                        reasoning: aiResult.reasoning
                    });
                }
            }

            return matches;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Usa IA para análise inteligente de critérios
     */
    private static async performAICriteriaAnalysis(data: any): Promise<any[]> {
        const prompt = `
        Analise a compatibilidade entre uma apólice e campanhas de seguro.

        APÓLICE:
        - Tipo: ${data.policy.type}
        - Tipo de Contrato: ${data.policy.contract_type}
        - Valor do Prêmio: R$ ${data.policy.premium_value}
        - Número: ${data.policy.policy_number}

        CAMPANHAS DISPONÍVEIS:
        ${data.campaigns.map((campaign: any) => `
        - ID: ${campaign.id}
        - Título: ${campaign.title}
        - Critérios: ${JSON.stringify(campaign.criteria)}
        `).join('\n')}

        Para cada campanha, determine:
        1. Se a apólice é compatível com os critérios
        2. Nível de confiança (0-100)
        3. Explicação do motivo

        REGRAS RIGOROSAS:
        - Se a campanha tem "min_value_per_policy", a apólice DEVE ter valor >= esse mínimo
        - Se a apólice tem valor menor que o mínimo, NÃO é compatível (confidence_score = 0)
        - Se não há valor mínimo definido, considere compatível
        - Verifique tipo de apólice (auto/residencial) e tipo de contrato

        IMPORTANTE: Responda APENAS com JSON válido, sem markdown, sem \`\`\`json, sem texto adicional.
        Formato obrigatório:
        [
            {
                "campaign_id": "id_da_campanha",
                "is_compatible": true,
                "confidence_score": 85,
                "reasoning": "Explicação detalhada"
            }
        ]
        `;

        try {

            const response = await mistralAI.chat({
                messages: [{ role: 'user', content: prompt }]
            });
            
            let content = response.choices[0].message.content;

            // Limpar markdown se presente
            if (content.includes('```json')) {
                content = content.replace(/```json\s*/, '').replace(/\s*```$/, '');

            }
            if (content.includes('```')) {
                content = content.replace(/```\s*/, '').replace(/\s*```$/, '');

            }
            
            // Tentar parsear o JSON
            const result = JSON.parse(content);

            return result;
        } catch (error) {

            // Fallback para análise manual
            return this.performManualCriteriaAnalysis(data);
        }
    }

    /**
     * Análise manual como fallback
     */
    private static performManualCriteriaAnalysis(data: any): any[] {
        const results = [];

        for (const campaign of data.campaigns) {
            let isCompatible = false;
            let confidenceScore = 0;
            let reasoning = '';

            if (campaign.criteria && Array.isArray(campaign.criteria)) {
                for (const criterion of campaign.criteria) {
                    // Verificar tipo de apólice
                    const policyTypeMap: { [key: string]: string } = {
                        'Seguro Auto': 'auto',
                        'Seguro Residencial': 'residencial'
                    };

                    if (criterion.policy_type && criterion.policy_type === policyTypeMap[data.policy.type]) {
                        // Verificar tipo de contrato
                        if (!criterion.contract_type || criterion.contract_type === data.policy.contract_type) {
                            // Verificar valor mínimo (DEVE SER MAIS RIGOROSO)
                            if (criterion.min_value_per_policy && data.policy.premium_value < criterion.min_value_per_policy) {
                                // Apólice NÃO atende ao valor mínimo - NÃO é compatível
                                isCompatible = false;
                                confidenceScore = 0;
                                reasoning = `Apólice NÃO compatível: valor R$ ${data.policy.premium_value} < mínimo R$ ${criterion.min_value_per_policy}`;
                                break;
                            } else {
                                // Apólice atende aos critérios
                                isCompatible = true;
                                confidenceScore = 90;
                                reasoning = `Apólice compatível: ${criterion.policy_type} - valor R$ ${data.policy.premium_value} >= mínimo R$ ${criterion.min_value_per_policy || 'sem mínimo'}`;
                                break;
                            }
                        }
                    }
                }
            }

            results.push({
                campaign_id: campaign.id,
                is_compatible: isCompatible,
                confidence_score: confidenceScore,
                reasoning: reasoning
            });
        }

        return results;
    }

    /**
     * Extrai critérios que fazem match com a apólice
     */
    private static extractMatchingCriteria(criteria: any, policyData: PolicyData): CampaignCriteria[] {
        if (!criteria || !Array.isArray(criteria)) {
            return [];
        }

        const matches: CampaignCriteria[] = [];

        for (const criterion of criteria) {
            const policyTypeMap: { [key: string]: string } = {
                'Seguro Auto': 'auto',
                'Seguro Residencial': 'residencial'
            };

            // Verificar compatibilidade
            if (criterion.policy_type && criterion.policy_type === policyTypeMap[policyData.type]) {
                if (!criterion.contract_type || criterion.contract_type === policyData.contract_type) {
                    if (!criterion.min_value_per_policy || policyData.premium_value >= criterion.min_value_per_policy) {
                        matches.push({
                            id: criterion.id || Math.random().toString(),
                            policy_type: criterion.policy_type,
                            contract_type: criterion.contract_type,
                            min_value_per_policy: criterion.min_value_per_policy,
                            target_count: criterion.target_count,
                            target_value: criterion.target_value,
                            description: criterion.description
                        });
                    }
                }
            }
        }

        return matches;
    }

    /**
     * Atualiza o progresso de TODAS as campanhas ativas do corretor
     */
    static async updateAllActiveCampaigns(
        policyData: PolicyData,
        userId: string
    ): Promise<{ updated: number; campaigns: string[] }> {
        try {

            // 1. Buscar TODAS as campanhas ativas e aceitas do usuário
            const { data: activeCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .eq('acceptance_status', 'accepted')
                .eq('record_type', 'campaign');

            if (campaignsError) {
                throw campaignsError;
            }

            if (!activeCampaigns || activeCampaigns.length === 0) {

                return { updated: 0, campaigns: [] };
            }

            // 2. Atualizar progresso de CADA campanha ativa
            const updatedCampaigns: string[] = [];

            for (const campaign of activeCampaigns) {
                try {

                    await this.updateCampaignProgress(campaign.id, policyData);
                    updatedCampaigns.push(campaign.title);

                } catch (error) {
                }
            }

            return {
                updated: updatedCampaigns.length,
                campaigns: updatedCampaigns
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Atualiza o progresso de TODAS as campanhas compatíveis (mantido para compatibilidade)
     */
    static async updateAllCompatibleCampaigns(
        policyData: PolicyData,
        userId: string
    ): Promise<{ updated: number; campaigns: string[] }> {
        try {
            // 1. Analisar compatibilidade
            const matches = await this.analyzePolicyCompatibility(policyData, userId);

            if (matches.length === 0) {
                return { updated: 0, campaigns: [] };
            }

            // 2. Atualizar progresso de cada campanha compatível
            const updatedCampaigns: string[] = [];

            for (const match of matches) {
                try {
                    await this.updateCampaignProgress(match.campaign_id, policyData);
                    updatedCampaigns.push(match.campaign_title);
                } catch (error) {
                }
            }

            return {
                updated: updatedCampaigns.length,
                campaigns: updatedCampaigns
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Atualiza o progresso de uma campanha específica
     */
    private static async updateCampaignProgress(campaignId: string, policyData: PolicyData): Promise<void> {
        // Buscar campanha atual
        const { data: campaign, error: campaignError } = await supabase
            .from('goals')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (campaignError) throw campaignError;

        // Calcular novo progresso baseado nos critérios
        const newProgress = await this.calculateCampaignProgress(campaign, policyData);

        // Atualizar no banco
        const { error: updateError } = await supabase
            .from('goals')
            .update({
                current_value: newProgress.current_value,
                progress_percentage: newProgress.progress_percentage,
                status: newProgress.is_completed ? 'completed' : 'active',
                achieved_at: newProgress.is_completed ? new Date().toISOString() : null,
                last_updated: new Date().toISOString()
            })
            .eq('id', campaignId);

        if (updateError) {
            throw updateError;
        }

    }

    /**
     * Calcula o progresso da campanha baseado nos critérios
     */
    private static async calculateCampaignProgress(campaign: any, newPolicy: PolicyData): Promise<any> {

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

        // Incluir a nova apólice
        const allPolicies = [
            ...(linkedPolicies?.map(link => link.policies) || []),
            newPolicy
        ];

        // Calcular progresso baseado nos critérios
        let allCriteriaCompleted = true;
        let criteriaProgress = [];

        // Processar critérios (pode ser array ou objeto JSONB)
        const criteria = campaign.criteria;
        if (criteria) {
            let criteriaArray = [];
            
            if (Array.isArray(criteria)) {
                criteriaArray = criteria;
            } else if (typeof criteria === 'object') {
                // Se é um objeto JSONB, converter para array
                criteriaArray = Object.values(criteria);
            }

            for (let i = 0; i < criteriaArray.length; i++) {
                const criterion = criteriaArray[i];

                const matchingPolicies = allPolicies.filter((policy: any) => {
                    const policyTypeMap: { [key: string]: string } = {
                        'Seguro Auto': 'auto',
                        'Seguro Residencial': 'residencial'
                    };

                    // Verificar tipo de apólice
                    if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policy.type]) {
                        return false;
                    }

                    // Verificar tipo de contrato
                    if (criterion.contract_type && criterion.contract_type !== 'ambos') {
                        const policyContractType = policy.contract_type;
                        if (criterion.contract_type === 'novo' && policyContractType !== 'Novo') return false;
                        if (criterion.contract_type === 'renovacao_bradesco' && policyContractType !== 'Renovação Bradesco') return false;
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
                    criterionTarget = criterion.target_value || 0; // Para quantidade, o valor está em target_value
                    criterionProgressPercentage = criterionTarget > 0 ? (criterionCurrent / criterionTarget) * 100 : 0;
                    criterionCompleted = criterionProgressPercentage >= 100;

                } else if (criterion.target_type === 'value') {
                    // Critério por valor
                    criterionCurrent = matchingPolicies.reduce((sum, policy: any) => sum + policy.premium_value, 0);
                    criterionTarget = criterion.target_value || 0;
                    criterionProgressPercentage = criterionTarget > 0 ? (criterionCurrent / criterionTarget) * 100 : 0;
                    criterionCompleted = criterionProgressPercentage >= 100;

                } else {
                    // Fallback para compatibilidade com estruturas antigas
                    if (criterion.target_count || criterion.target_quantity) {
                        // Critério por quantidade (estrutura antiga)
                        criterionCurrent = matchingPolicies.length;
                        criterionTarget = criterion.target_count || criterion.target_quantity || 0;
                        criterionProgressPercentage = criterionTarget > 0 ? (criterionCurrent / criterionTarget) * 100 : 0;
                        criterionCompleted = criterionProgressPercentage >= 100;

                    } else if (criterion.target_value) {
                        // Critério por valor (estrutura antiga)
                        criterionCurrent = matchingPolicies.reduce((sum, policy: any) => sum + policy.premium_value, 0);
                        criterionTarget = criterion.target_value;
                        criterionProgressPercentage = criterionTarget > 0 ? (criterionCurrent / criterionTarget) * 100 : 0;
                        criterionCompleted = criterionProgressPercentage >= 100;

                    }
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
