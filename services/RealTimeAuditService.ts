// Serviço de Auditoria em Tempo Real
import { supabase } from '../lib/supabase';
import { mistralAI } from './mistralAI';

export interface CampaignAnalysis {
    campaignId: string;
    campaignTitle: string;
    isCompatible: boolean;
    confidence: number;
    matchedCriteria: string[];
    unmatchedCriteria: string[];
    reasoning: string;
}

export interface PolicyAuditResult {
    policyId: string;
    policyNumber: string;
    totalCampaigns: number;
    compatibleCampaigns: number;
    incompatibleCampaigns: number;
    analyses: CampaignAnalysis[];
    aiSummary: string;
    auditTimestamp: string;
}

export class RealTimeAuditService {
    /**
     * Analisa uma apólice recém-lançada contra todas as campanhas ativas
     */
    static async auditNewPolicy(
        policyId: string,
        userId: string
    ): Promise<{ success: boolean; data?: PolicyAuditResult; error?: string }> {
        try {
            console.log('🔍 RealTimeAuditService: Iniciando auditoria para apólice:', policyId);

            // 1. Buscar dados da apólice
            const { data: policy, error: policyError } = await supabase
                .from('policies')
                .select('*')
                .eq('id', policyId)
                .eq('user_id', userId)
                .single();

            if (policyError) throw policyError;

            // 2. Buscar todas as campanhas ativas do usuário
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('acceptance_status', 'accepted')
                .eq('is_active', true);

            if (campaignsError) throw campaignsError;

            if (!campaigns || campaigns.length === 0) {
                return {
                    success: true,
                    data: {
                        policyId,
                        policyNumber: policy.policy_number,
                        totalCampaigns: 0,
                        compatibleCampaigns: 0,
                        incompatibleCampaigns: 0,
                        analyses: [],
                        aiSummary: 'Nenhuma campanha ativa encontrada para análise.',
                        auditTimestamp: new Date().toISOString()
                    }
                };
            }

            // 3. Analisar cada campanha
            const analyses: CampaignAnalysis[] = [];
            let compatibleCount = 0;
            let incompatibleCount = 0;

            for (const campaign of campaigns) {
                const analysis = await this.analyzePolicyVsCampaign(policy, campaign);
                analyses.push(analysis);

                if (analysis.isCompatible) {
                    compatibleCount++;
                    // Criar link para campanhas compatíveis
                    await this.createPolicyCampaignLink(policyId, campaign.id, userId, analysis);
                } else {
                    incompatibleCount++;
                    // Criar link para campanhas INCOMPATÍVEIS também (para mostrar no timeline)
                    await this.createPolicyCampaignLink(policyId, campaign.id, userId, analysis);
                }
            }

            // 4. Gerar resumo com IA
            const aiSummary = await this.generateAISummary(policy, analyses);

            // 5. Salvar auditoria completa
            const auditResult: PolicyAuditResult = {
                policyId,
                policyNumber: policy.policy_number,
                totalCampaigns: campaigns.length,
                compatibleCampaigns: compatibleCount,
                incompatibleCampaigns: incompatibleCount,
                analyses,
                aiSummary,
                auditTimestamp: new Date().toISOString()
            };

            // Salvar no localStorage para exibição imediata
            this.saveAuditToLocalStorage(auditResult, userId);

            console.log('✅ RealTimeAuditService: Auditoria concluída:', auditResult);
            return { success: true, data: auditResult };

        } catch (error: any) {
            console.error('❌ RealTimeAuditService: Erro na auditoria:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analisa uma apólice contra uma campanha específica
     */
    private static async analyzePolicyVsCampaign(policy: any, campaign: any): Promise<CampaignAnalysis> {
        try {
            // Critérios básicos de compatibilidade
            const matchedCriteria: string[] = [];
            const unmatchedCriteria: string[] = [];
            let confidence = 0;

            // Critério 1: Tipo de seguro
            if (this.isPolicyTypeCompatible(policy.type, campaign)) {
                matchedCriteria.push('Tipo de seguro compatível');
                confidence += 30;
            } else {
                unmatchedCriteria.push('Tipo de seguro incompatível');
            }

            // Critério 2: Valor do prêmio
            if (this.isPremiumValueCompatible(policy.premium_value, campaign)) {
                matchedCriteria.push('Valor do prêmio adequado');
                confidence += 25;
            } else {
                unmatchedCriteria.push('Valor do prêmio inadequado');
            }

            // 🎯 NOVO CRITÉRIO 3: Tipo de contrato (CRÍTICO!)
            if (this.isContractTypeCompatible(policy.contract_type, campaign)) {
                matchedCriteria.push('Tipo de contrato compatível');
                confidence += 25;
            } else {
                unmatchedCriteria.push('Tipo de contrato incompatível');
            }

            // Critério 4: Data de lançamento
            if (this.isDateCompatible(policy.registration_date, campaign)) {
                matchedCriteria.push('Data de lançamento dentro do período');
                confidence += 20;
            } else {
                unmatchedCriteria.push('Data de lançamento fora do período');
            }

            // Critério 5: Critérios específicos da campanha
            const specificCriteria = this.analyzeSpecificCriteria(policy, campaign);
            matchedCriteria.push(...specificCriteria.matched);
            unmatchedCriteria.push(...specificCriteria.unmatched);
            confidence += specificCriteria.confidenceBonus;

            // Critério 6: Análise com IA
            const aiAnalysis = await this.getAIAnalysis(policy, campaign);
            if (aiAnalysis.isCompatible) {
                matchedCriteria.push('Análise IA positiva');
                confidence += 15;
            } else {
                unmatchedCriteria.push('Análise IA negativa');
            }

            const isCompatible = confidence >= 70;
            const reasoning = this.generateReasoning(policy, campaign, matchedCriteria, unmatchedCriteria, confidence);

            return {
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                isCompatible,
                confidence: Math.min(confidence, 100),
                matchedCriteria,
                unmatchedCriteria,
                reasoning
            };

        } catch (error: any) {
            console.error('❌ RealTimeAuditService: Erro na análise:', error);
            return {
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                isCompatible: false,
                confidence: 0,
                matchedCriteria: [],
                unmatchedCriteria: ['Erro na análise'],
                reasoning: 'Erro ao analisar compatibilidade: ' + error.message
            };
        }
    }

    /**
     * Verifica compatibilidade do tipo de seguro
     */
    private static isPolicyTypeCompatible(policyType: string, campaign: any): boolean {
        // Se a campanha tem critérios específicos de tipo
        if (campaign.criteria && campaign.criteria.allowed_types) {
            return campaign.criteria.allowed_types.includes(policyType);
        }
        
        // Critérios padrão baseados no título da campanha
        const campaignTitle = campaign.title.toLowerCase();
        if (campaignTitle.includes('auto') && policyType === 'Seguro Auto') return true;
        if (campaignTitle.includes('residencial') && policyType === 'Seguro Residencial') return true;
        if (campaignTitle.includes('auto + res') && (policyType === 'Seguro Auto' || policyType === 'Seguro Residencial')) return true;
        
        return true; // Por padrão, aceita todos os tipos
    }

    /**
     * Verifica compatibilidade do valor do prêmio
     */
    private static isPremiumValueCompatible(premiumValue: number, campaign: any): boolean {
        if (campaign.criteria && campaign.criteria.min_premium_value) {
            return premiumValue >= campaign.criteria.min_premium_value;
        }
        
        // Critérios padrão baseados na meta da campanha
        const targetValue = campaign.target || 0;
        const minValue = targetValue * 0.1; // 10% da meta
        const maxValue = targetValue * 2; // 200% da meta
        
        return premiumValue >= minValue && premiumValue <= maxValue;
    }

    /**
     * Verifica compatibilidade da data
     */
    private static isDateCompatible(registrationDate: string, campaign: any): boolean {
        const policyDate = new Date(registrationDate);
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        
        return policyDate >= startDate && policyDate <= endDate;
    }

    /**
     * 🎯 NOVA FUNÇÃO: Verifica compatibilidade do tipo de contrato
     */
    private static isContractTypeCompatible(policyContractType: string, campaign: any): boolean {
        // Se a campanha não tem critérios específicos, aceita qualquer tipo
        if (!campaign.criteria || !Array.isArray(campaign.criteria)) {
            return true;
        }

        // Verificar se algum critério da campanha aceita o tipo de contrato da apólice
        for (const criterion of campaign.criteria) {
            const criterionContractType = criterion.contract_type?.toLowerCase();
            const policyContractTypeLower = policyContractType?.toLowerCase();

            // Se o critério aceita "ambos", aceita qualquer tipo
            if (criterionContractType === 'ambos') {
                return true;
            }

            // Verificar compatibilidade específica
            if (criterionContractType === policyContractTypeLower) {
                return true;
            }

            // Mapeamento de compatibilidades específicas
            if (criterionContractType === 'novo' && policyContractTypeLower === 'novo') {
                return true;
            }
            if (criterionContractType === 'renovacao_bradesco' && policyContractTypeLower?.includes('renovação')) {
                return true;
            }
            if (criterionContractType === 'renovacao_bradesco' && policyContractTypeLower?.includes('bradesco')) {
                return true;
            }
        }

        // Se nenhum critério aceita, retorna false
        return false;
    }

    /**
     * Analisa critérios específicos da campanha
     */
    private static analyzeSpecificCriteria(policy: any, campaign: any): {
        matched: string[];
        unmatched: string[];
        confidenceBonus: number;
    } {
        const matched: string[] = [];
        const unmatched: string[] = [];
        let confidenceBonus = 0;

        if (campaign.criteria) {
            // Critérios de valor mínimo
            if (campaign.criteria.min_premium_value && policy.premium_value >= campaign.criteria.min_premium_value) {
                matched.push(`Valor acima do mínimo (R$ ${campaign.criteria.min_premium_value})`);
                confidenceBonus += 10;
            }

            // Critérios de valor máximo
            if (campaign.criteria.max_premium_value && policy.premium_value <= campaign.criteria.max_premium_value) {
                matched.push(`Valor dentro do máximo (R$ ${campaign.criteria.max_premium_value})`);
                confidenceBonus += 10;
            }

            // Critérios de tipo específico
            if (campaign.criteria.allowed_types && campaign.criteria.allowed_types.includes(policy.type)) {
                matched.push(`Tipo permitido: ${policy.type}`);
                confidenceBonus += 15;
            }
        }

        return { matched, unmatched, confidenceBonus };
    }

    /**
     * Obtém análise da IA
     */
    private static async getAIAnalysis(policy: any, campaign: any): Promise<{ isCompatible: boolean; reasoning: string }> {
        try {
            const prompt = `
Analise se esta apólice é compatível com esta campanha:

APÓLICE:
- Número: ${policy.policy_number}
- Tipo: ${policy.type}
- Valor: R$ ${policy.premium_value}
- Data: ${policy.registration_date}

CAMPANHA:
- Título: ${campaign.title}
- Descrição: ${campaign.description || 'Sem descrição'}
- Meta: R$ ${campaign.target}
- Período: ${campaign.start_date} a ${campaign.end_date}

Responda apenas: COMPATÍVEL ou INCOMPATÍVEL
`;

            const aiResponse = await mistralAI.analyzePolicyCampaign(policy, campaign);
            
            // Tentar extrair compatibilidade da resposta
            const response = aiResponse.toLowerCase();
            const isCompatible = response.includes('compatível') || response.includes('aceitar');
            
            return {
                isCompatible,
                reasoning: aiResponse
            };
        } catch (error: any) {
            return {
                isCompatible: true, // Por padrão, assume compatível se IA falhar
                reasoning: 'Análise IA indisponível'
            };
        }
    }

    /**
     * Gera raciocínio da análise
     */
    private static generateReasoning(
        policy: any, 
        campaign: any, 
        matchedCriteria: string[], 
        unmatchedCriteria: string[], 
        confidence: number
    ): string {
        const status = confidence >= 70 ? 'COMPATÍVEL' : 'INCOMPATÍVEL';
        
        let reasoning = `Apólice ${policy.policy_number} vs Campanha ${campaign.title}: ${status} (${confidence}% confiança)\n\n`;
        
        if (matchedCriteria.length > 0) {
            reasoning += `✅ Critérios atendidos:\n`;
            matchedCriteria.forEach(criteria => {
                reasoning += `  • ${criteria}\n`;
            });
        }
        
        if (unmatchedCriteria.length > 0) {
            reasoning += `\n❌ Critérios não atendidos:\n`;
            unmatchedCriteria.forEach(criteria => {
                reasoning += `  • ${criteria}\n`;
            });
        }
        
        return reasoning;
    }

    /**
     * Cria link entre apólice e campanha (compatível ou incompatível)
     */
    private static async createPolicyCampaignLink(
        policyId: string, 
        campaignId: string, 
        userId: string, 
        analysis: CampaignAnalysis
    ): Promise<void> {
        try {
            // Verificar se o link já existe antes de criar
            const { data: existingLink, error: checkError } = await supabase
                .from('policy_campaign_links')
                .select('id')
                .eq('policy_id', policyId)
                .eq('campaign_id', campaignId)
                .single();

            if (existingLink) {
                console.log('ℹ️ RealTimeAuditService: Link já existe, pulando criação');
                return;
            }

            const { error } = await supabase
                .from('policy_campaign_links')
                .insert({
                    policy_id: policyId,
                    campaign_id: campaignId,
                    user_id: userId,
                    linked_automatically: true,
                    is_active: analysis.isCompatible, // TRUE para compatíveis, FALSE para incompatíveis
                    ai_confidence: analysis.confidence,
                    ai_reasoning: analysis.reasoning,
                    linked_at: new Date().toISOString()
                });

            if (error) {
                console.warn('⚠️ RealTimeAuditService: Erro ao criar link:', error);
            } else {
                const status = analysis.isCompatible ? 'COMPATÍVEL' : 'INCOMPATÍVEL';
                console.log(`✅ RealTimeAuditService: Link criado para campanha ${status}:`, analysis.campaignTitle);
            }
        } catch (error: any) {
            console.error('❌ RealTimeAuditService: Erro ao criar link:', error);
        }
    }

    /**
     * Gera resumo com IA
     */
    private static async generateAISummary(policy: any, analyses: CampaignAnalysis[]): Promise<string> {
        try {
            // Verificar se analyses é um array válido
            if (!analyses || !Array.isArray(analyses)) {
                return `Auditoria concluída para a apólice ${policy.policy_number}.`;
            }

            const compatibleCampaigns = analyses.filter(a => a.isCompatible);
            const incompatibleCampaigns = analyses.filter(a => !a.isCompatible);

            const prompt = `
Gere um resumo executivo da auditoria desta apólice:

APÓLICE: ${policy.policy_number} - ${policy.type} - R$ ${policy.premium_value}

RESULTADO:
- Total de campanhas analisadas: ${analyses.length}
- Campanhas compatíveis: ${compatibleCampaigns.length}
- Campanhas incompatíveis: ${incompatibleCampaigns.length}

CAMPANHAS COMPATÍVEIS:
${compatibleCampaigns.map(c => `• ${c.campaignTitle} (${c.confidence}% confiança)`).join('\n')}

CAMPANHAS INCOMPATÍVEIS:
${incompatibleCampaigns.map(c => `• ${c.campaignTitle} (${c.confidence}% confiança)`).join('\n')}

Gere um resumo em 2-3 frases destacando os pontos principais.
`;

            const aiResponse = await mistralAI.analyzePolicyCampaign(policy, { title: 'Resumo de Auditoria' });
            return aiResponse;
        } catch (error: any) {
            const safeAnalyses = analyses && Array.isArray(analyses) ? analyses : [];
            return `Auditoria concluída: ${safeAnalyses.filter(a => a.isCompatible).length} de ${safeAnalyses.length} campanhas são compatíveis com a apólice ${policy.policy_number}.`;
        }
    }

    /**
     * Salva resultado da auditoria no localStorage para exibição imediata
     */
    private static saveAuditToLocalStorage(auditResult: PolicyAuditResult, userId: string): void {
        try {
            const storageKey = `audit_${userId}`;
            const existingAudits = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Adicionar nova auditoria no início do array
            existingAudits.unshift(auditResult);
            
            // Manter apenas as últimas 50 auditorias
            const limitedAudits = existingAudits.slice(0, 50);
            
            localStorage.setItem(storageKey, JSON.stringify(limitedAudits));
            console.log('💾 RealTimeAuditService: Auditoria salva no localStorage');
        } catch (error: any) {
            console.error('❌ RealTimeAuditService: Erro ao salvar no localStorage:', error);
        }
    }

    /**
     * Busca auditorias do localStorage
     */
    static getAuditsFromLocalStorage(userId: string): PolicyAuditResult[] {
        try {
            const storageKey = `audit_${userId}`;
            const audits = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return audits;
        } catch (error: any) {
            console.error('❌ RealTimeAuditService: Erro ao buscar do localStorage:', error);
            return [];
        }
    }

    /**
     * Salva resultado da auditoria
     */
    private static async saveAuditResult(auditResult: PolicyAuditResult, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('policy_launch_audit')
                .upsert({
                    policy_id: auditResult.policyId,
                    user_id: userId,
                    policy_number: auditResult.policyNumber,
                    policy_type: 'Auditoria Automática',
                    contract_type: 'Novo',
                    premium_value: 0,
                    cpd_number: 'AUDIT_' + Date.now(),
                    cpd_name: 'Sistema de Auditoria',
                    linked_campaigns_count: auditResult.compatibleCampaigns,
                    linked_campaigns_details: {
                        total_campaigns: auditResult.totalCampaigns,
                        compatible_campaigns: auditResult.compatibleCampaigns,
                        incompatible_campaigns: auditResult.incompatibleCampaigns,
                        analyses: auditResult.analyses || [],
                        audit_timestamp: auditResult.auditTimestamp
                    },
                    ai_analysis: {
                        summary: auditResult.aiSummary,
                        confidence: auditResult.analyses && auditResult.analyses.length > 0 
                            ? auditResult.analyses.reduce((acc, a) => acc + a.confidence, 0) / auditResult.analyses.length
                            : 0,
                        audit_timestamp: auditResult.auditTimestamp
                    }
                });

            if (error) {
                console.warn('⚠️ RealTimeAuditService: Erro ao salvar auditoria:', error);
            } else {
                console.log('✅ RealTimeAuditService: Auditoria salva com sucesso');
            }
        } catch (error: any) {
            console.error('❌ RealTimeAuditService: Erro ao salvar auditoria:', error);
        }
    }
}
