import { supabase } from '../lib/supabase';

export interface PolicyCampaignLinkWithAI {
    id: string;
    policy_id: string;
    campaign_id: string;
    user_id: string;
    linked_automatically: boolean;
    is_active: boolean;
    ai_confidence: number | null;
    ai_reasoning: string | null;
    created_at: string;
    updated_at: string;
    
    // Dados relacionados
    policy?: {
        id: string;
        policy_number: string;
        type: string;
        premium_value: number;
    };
    campaign?: {
        id: string;
        title: string;
        description: string;
    };
}

export class PolicyCampaignLinksService {
    /**
     * Busca todas as vinculações de um usuário com dados da IA
     */
    static async getUserPolicyLinks(userId: string): Promise<PolicyCampaignLinkWithAI[]> {
        try {
            const { data, error } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policy_id (
                        id,
                        policy_number,
                        type,
                        premium_value
                    ),
                    campaign:campaign_id (
                        id,
                        title,
                        description
                    )
                `)
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar vinculações:', error);
            throw error;
        }
    }

    /**
     * Busca vinculações de uma apólice específica
     */
    static async getPolicyLinks(policyId: string): Promise<PolicyCampaignLinkWithAI[]> {
        try {
            const { data, error } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    campaign:campaign_id (
                        id,
                        title,
                        description
                    )
                `)
                .eq('policy_id', policyId)
                .eq('is_active', true)
                .order('ai_confidence', { ascending: false }); // Ordenar por confiança

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar vinculações da apólice:', error);
            throw error;
        }
    }

    /**
     * Busca vinculações com baixa confiança da IA
     */
    static async getLowConfidenceLinks(userId: string, threshold: number = 70): Promise<PolicyCampaignLinkWithAI[]> {
        try {
            const { data, error } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policy_id (
                        id,
                        policy_number,
                        type,
                        premium_value
                    ),
                    campaign:campaign_id (
                        id,
                        title,
                        description
                    )
                `)
                .eq('user_id', userId)
                .eq('is_active', true)
                .not('ai_confidence', 'is', null)
                .lt('ai_confidence', threshold)
                .order('ai_confidence', { ascending: true });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar vinculações de baixa confiança:', error);
            throw error;
        }
    }

    /**
     * Estatísticas das vinculações com IA
     */
    static async getAIStatistics(userId: string): Promise<{
        total_links: number;
        high_confidence_links: number;
        medium_confidence_links: number;
        low_confidence_links: number;
        average_confidence: number;
        automatic_links: number;
        manual_links: number;
    }> {
        try {
            const { data, error } = await supabase
                .from('policy_campaign_links')
                .select('ai_confidence, linked_automatically')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;

            const links = data || [];
            const totalLinks = links.length;
            
            const highConfidence = links.filter(l => l.ai_confidence && l.ai_confidence >= 90).length;
            const mediumConfidence = links.filter(l => l.ai_confidence && l.ai_confidence >= 70 && l.ai_confidence < 90).length;
            const lowConfidence = links.filter(l => l.ai_confidence && l.ai_confidence < 70).length;
            
            const confidenceValues = links.filter(l => l.ai_confidence).map(l => l.ai_confidence!);
            const averageConfidence = confidenceValues.length > 0 
                ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
                : 0;
            
            const automaticLinks = links.filter(l => l.linked_automatically).length;
            const manualLinks = totalLinks - automaticLinks;

            return {
                total_links: totalLinks,
                high_confidence_links: highConfidence,
                medium_confidence_links: mediumConfidence,
                low_confidence_links: lowConfidence,
                average_confidence: Math.round(averageConfidence * 100) / 100,
                automatic_links: automaticLinks,
                manual_links: manualLinks
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas da IA:', error);
            throw error;
        }
    }

    /**
     * Remove uma vinculação
     */
    static async removeLink(linkId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('policy_campaign_links')
                .update({ is_active: false })
                .eq('id', linkId);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao remover vinculação:', error);
            throw error;
        }
    }

    /**
     * Atualiza confiança e raciocínio da IA
     */
    static async updateAIData(
        linkId: string, 
        confidence: number, 
        reasoning: string
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('policy_campaign_links')
                .update({
                    ai_confidence: confidence,
                    ai_reasoning: reasoning,
                    updated_at: new Date().toISOString()
                })
                .eq('id', linkId);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao atualizar dados da IA:', error);
            throw error;
        }
    }
}
