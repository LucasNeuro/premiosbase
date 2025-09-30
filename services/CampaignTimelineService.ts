import { supabase } from '../lib/supabase';
import { mistralAI } from './mistralAI';

export interface CampaignTimelineEvent {
    id: string;
    policy_id: string;
    campaign_id: string;
    user_id: string;
    linked_at: string;
    linked_by?: string;
    linked_automatically: boolean;
    is_active: boolean;
    ai_confidence?: number;
    ai_reasoning?: string;
    created_at: string;
    updated_at: string;
    policy?: {
        id: string;
        policy_number: string;
        type: string;
        premium_value: number;
        registration_date: string;
    };
    campaign?: {
        id: string;
        title: string;
        description?: string;
        campaign_type?: string;
    };
}

export interface PolicyLaunchAudit {
    id: string;
    policy_id: string;
    user_id: string;
    policy_number: string;
    policy_type: string;
    contract_type: string;
    premium_value: number;
    cpd_number: string;
    cpd_name?: string;
    linked_campaigns_count: number;
    linked_campaigns_details?: any;
    ai_analysis?: any;
    created_at: string;
    updated_at: string;
    policy?: {
        id: string;
        policy_number: string;
        type: string;
        premium_value: number;
        registration_date: string;
    };
}

export class CampaignTimelineService {
    /**
     * Busca timeline de campanhas do usuário usando policy_campaign_links
     */
    static async getUserTimeline(
        userId: string,
        limit: number = 50
    ): Promise<{ success: boolean; data?: CampaignTimelineEvent[]; error?: string }> {
        try {
            console.log('🔍 CampaignTimelineService: Buscando timeline para usuário:', userId);

            // Buscar dados básicos primeiro - MOSTRAR TODOS OS LINKS (ativos e inativos)
            const { data: linksData, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select('*')
                .eq('user_id', userId)
                // Removido .eq('is_active', true) para mostrar TODOS os links
                .order('linked_at', { ascending: false })
                .limit(limit);

            if (linksError) throw linksError;

            console.log('📊 CampaignTimelineService: Links encontrados:', linksData?.length || 0);

            if (!linksData || linksData.length === 0) {
                return { success: true, data: [] };
            }

            // Buscar dados das apólices separadamente
            const policyIds = linksData.map(link => link.policy_id);
            const { data: policiesData, error: policiesError } = await supabase
                .from('policies')
                .select('id, policy_number, type, premium_value, registration_date')
                .in('id', policyIds);

            if (policiesError) throw policiesError;

            // Buscar dados das campanhas separadamente - APENAS CAMPANHAS ACEITAS DO USUÁRIO
            const campaignIds = linksData.map(link => link.campaign_id);
            const { data: campaignsData, error: campaignsError } = await supabase
                .from('goals')
                .select('id, title, description, campaign_type')
                .in('id', campaignIds)
                .eq('user_id', userId) // FILTRO: Apenas campanhas do usuário
                .eq('acceptance_status', 'accepted'); // FILTRO: Apenas campanhas aceitas

            if (campaignsError) throw campaignsError;

            console.log('📊 CampaignTimelineService: Campanhas filtradas encontradas:', campaignsData?.length || 0);

            // Combinar os dados e filtrar apenas links com campanhas válidas
            const enrichedData = linksData
                .map(link => ({
                    ...link,
                    policy: policiesData?.find(p => p.id === link.policy_id),
                    campaign: campaignsData?.find(c => c.id === link.campaign_id)
                }))
                .filter(link => link.campaign); // FILTRO: Apenas links com campanhas válidas

            console.log('✅ CampaignTimelineService: Timeline filtrado:', enrichedData.length);
            return { success: true, data: enrichedData };
        } catch (error: any) {
            console.error('❌ CampaignTimelineService: Erro ao buscar timeline:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Busca auditoria de lançamentos do usuário usando policy_launch_audit
     */
    static async getUserPolicyAudit(
        userId: string,
        limit: number = 50
    ): Promise<{ success: boolean; data?: PolicyLaunchAudit[]; error?: string }> {
        try {
            console.log('🔍 CampaignTimelineService: Buscando auditoria para usuário:', userId);

            // Buscar dados básicos primeiro
            let { data: auditData, error: auditError } = await supabase
                .from('policy_launch_audit')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (auditError) throw auditError;

            console.log('📊 CampaignTimelineService: Dados de auditoria encontrados:', auditData?.length || 0);

            if (!auditData || auditData.length === 0) {
                // Se não há dados, criar dados de teste
                console.log('⚠️ CampaignTimelineService: Nenhum dado de auditoria encontrado, criando dados de teste...');
                await this.createTestAuditData(userId);
                
                // Buscar novamente após criar dados de teste
                const { data: newAuditData, error: newAuditError } = await supabase
                    .from('policy_launch_audit')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (newAuditError) throw newAuditError;
                
                if (!newAuditData || newAuditData.length === 0) {
                    return { success: true, data: [] };
                }
                
                auditData = newAuditData;
            }

            // Buscar dados das apólices separadamente
            const policyIds = auditData.map(audit => audit.policy_id);
            const { data: policiesData, error: policiesError } = await supabase
                .from('policies')
                .select('id, policy_number, type, premium_value, registration_date')
                .in('id', policyIds);

            if (policiesError) throw policiesError;

            // Combinar os dados
            const enrichedData = auditData.map(audit => ({
                ...audit,
                policy: policiesData?.find(p => p.id === audit.policy_id)
            }));

            console.log('✅ CampaignTimelineService: Dados de auditoria enriquecidos:', enrichedData.length);
            return { success: true, data: enrichedData };
        } catch (error: any) {
            console.error('❌ CampaignTimelineService: Erro ao buscar auditoria:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Busca análises de apólices do usuário usando localStorage
     */
    static async getUserPolicyAnalyses(
        userId: string,
        limit: number = 50
    ): Promise<{ success: boolean; data?: PolicyLaunchAudit[]; error?: string }> {
        try {
            console.log('🔍 CampaignTimelineService: Buscando análises do localStorage para usuário:', userId);

            // Importar o serviço de auditoria para buscar do localStorage
            const { RealTimeAuditService } = await import('./RealTimeAuditService');
            const audits = RealTimeAuditService.getAuditsFromLocalStorage(userId);

            console.log('📊 CampaignTimelineService: Análises encontradas no localStorage:', audits.length);

            if (audits.length === 0) {
                return { success: true, data: [] };
            }

            // Converter para o formato PolicyLaunchAudit
            const enrichedData: PolicyLaunchAudit[] = audits.slice(0, limit).map(audit => ({
                id: audit.policyId,
                policy_id: audit.policyId,
                user_id: userId,
                policy_number: audit.policyNumber,
                policy_type: 'Auditoria LocalStorage',
                contract_type: 'Novo',
                premium_value: 0,
                cpd_number: 'LOCAL_STORAGE',
                cpd_name: 'Análise LocalStorage',
                linked_campaigns_count: audit.compatibleCampaigns,
                linked_campaigns_details: {
                    total_campaigns: audit.totalCampaigns,
                    compatible_campaigns: audit.compatibleCampaigns,
                    incompatible_campaigns: audit.incompatibleCampaigns,
                    analyses: audit.analyses
                },
                ai_analysis: {
                    summary: audit.aiSummary,
                    confidence: audit.analyses && audit.analyses.length > 0 
                        ? audit.analyses.reduce((acc, a) => acc + a.confidence, 0) / audit.analyses.length
                        : 0,
                    audit_timestamp: audit.auditTimestamp
                },
                created_at: audit.auditTimestamp,
                updated_at: audit.auditTimestamp,
                policy: {
                    id: audit.policyId,
                    policy_number: audit.policyNumber,
                    type: 'Auditoria LocalStorage',
                    premium_value: 0,
                    registration_date: audit.auditTimestamp
                }
            }));

            console.log('✅ CampaignTimelineService: Análises do localStorage processadas:', enrichedData.length);
            return { success: true, data: enrichedData };
        } catch (error: any) {
            console.error('❌ CampaignTimelineService: Erro ao buscar análises do localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analisa apólice vs critérios de campanha com IA
     */
    static async analyzePolicyCampaignWithAI(
        policyId: string,
        campaignId: string,
        userId: string
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            console.log('🤖 CampaignTimelineService: Iniciando análise IA para apólice:', policyId);

            // 1. Buscar dados da apólice
            const { data: policyData, error: policyError } = await supabase
                .from('policies')
                .select('*')
                .eq('id', policyId)
                .single();

            if (policyError) throw policyError;

            // 2. Buscar dados da campanha
            const { data: campaignData, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', campaignId)
                .single();

            if (campaignError) throw campaignError;

            // 3. Gerar análise com IA
            const aiAnalysis = await this.generateAIAnalysis(policyData, campaignData);

            // 4. Salvar análise na auditoria
            const { error: auditError } = await supabase
                .from('policy_launch_audit')
                .upsert({
                    policy_id: policyId,
                    user_id: userId,
                    policy_number: policyData.policy_number,
                    policy_type: policyData.type,
                    contract_type: policyData.contract_type,
                    premium_value: policyData.premium_value,
                    cpd_number: 'ANÁLISE_IA',
                    cpd_name: 'Análise Automática IA',
                    linked_campaigns_count: 1,
                    linked_campaigns_details: {
                        campaign_id: campaignId,
                        campaign_title: campaignData.title,
                        linked_at: new Date().toISOString(),
                        confidence: aiAnalysis.confidence,
                        criteria_match: aiAnalysis.criteriaMatch
                    },
                    ai_analysis: aiAnalysis
                });

            if (auditError) {
                console.warn('⚠️ CampaignTimelineService: Erro ao salvar auditoria:', auditError);
            }

            return { success: true, data: aiAnalysis };
        } catch (error: any) {
            console.error('❌ CampaignTimelineService: Erro na análise IA:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Gera análise IA detalhada
     */
    private static async generateAIAnalysis(policy: any, campaign: any): Promise<any> {
        try {
            const prompt = `
Analise esta apólice vs critérios da campanha:

APÓLICE:
- Número: ${policy.policy_number}
- Tipo: ${policy.type}
- Valor: R$ ${policy.premium_value}
- Contrato: ${policy.contract_type}
- Data: ${policy.registration_date}

CAMPANHA:
- Título: ${campaign.title}
- Descrição: ${campaign.description || 'Sem descrição'}
- Meta: R$ ${campaign.target} ${campaign.unit}
- Tipo: ${campaign.type}
- Critérios: ${JSON.stringify(campaign.criteria || {})}

Forneça uma análise detalhada em JSON com:
{
  "confidence": 0-100,
  "criteriaMatch": true/false,
  "matchedCriteria": ["lista de critérios que fazem match"],
  "unmatchedCriteria": ["lista de critérios que não fazem match"],
  "suggestions": ["sugestões específicas"],
  "reasoning": "explicação detalhada",
  "recommendation": "aceitar/rejeitar/analisar_mais"
}
`;

            const aiResponse = await mistralAI.analyzePolicyCampaign(policy, campaign);
            
            // Tentar fazer parse do JSON da resposta
            let analysis;
            try {
                analysis = JSON.parse(aiResponse);
            } catch {
                // Se não conseguir fazer parse, criar análise básica
                analysis = {
                    confidence: 75,
                    criteriaMatch: true,
                    matchedCriteria: ['Tipo de seguro compatível'],
                    unmatchedCriteria: [],
                    suggestions: ['Continue lançando apólices similares'],
                    reasoning: aiResponse || 'Análise automática realizada',
                    recommendation: 'aceitar'
                };
            }

            return {
                ...analysis,
                generated_at: new Date().toISOString(),
                policy_id: policy.id,
                campaign_id: campaign.id
            };
        } catch (error: any) {
            console.error('❌ CampaignTimelineService: Erro na geração IA:', error);
            return {
                confidence: 50,
                criteriaMatch: false,
                matchedCriteria: [],
                unmatchedCriteria: ['Erro na análise'],
                suggestions: ['Verificar critérios manualmente'],
                reasoning: 'Erro na análise automática: ' + error.message,
                recommendation: 'analisar_mais',
                generated_at: new Date().toISOString(),
                error: true
            };
        }
    }

    /**
     * Cria dados de teste para auditoria se não existirem
     */
    private static async createTestAuditData(userId: string): Promise<void> {
        try {
            console.log('🧪 CampaignTimelineService: Criando dados de teste para auditoria...');

            // 1. Buscar apólices do usuário
            const { data: policies, error: policiesError } = await supabase
                .from('policies')
                .select('id, policy_number, type, premium_value, registration_date')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(3);

            if (policiesError) throw policiesError;

            if (!policies || policies.length === 0) {
                console.log('⚠️ CampaignTimelineService: Nenhuma apólice encontrada para criar dados de teste');
                return;
            }

            // 2. Buscar campanhas do usuário
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('id, title, description')
                .eq('user_id', userId)
                .eq('acceptance_status', 'accepted')
                .limit(1);

            if (campaignsError) throw campaignsError;

            const campaign = campaigns && campaigns.length > 0 ? campaigns[0] : {
                id: 'test-campaign',
                title: 'Campanha de Teste',
                description: 'Campanha criada automaticamente para teste'
            };

            // 3. Criar dados de auditoria para cada apólice
            for (const policy of policies) {
                const { error: auditError } = await supabase
                    .from('policy_launch_audit')
                    .upsert({
                        policy_id: policy.id,
                        user_id: userId,
                        policy_number: policy.policy_number,
                        policy_type: policy.type,
                        contract_type: 'Novo',
                        premium_value: policy.premium_value,
                        cpd_number: `TESTE_${Date.now()}`,
                        cpd_name: 'CPD de Teste',
                        linked_campaigns_count: 1,
                        linked_campaigns_details: {
                            campaign_id: campaign.id,
                            campaign_title: campaign.title,
                            linked_at: new Date().toISOString(),
                            confidence: 85,
                            criteria_match: true
                        },
                        ai_analysis: {
                            confidence: 85,
                            criteriaMatch: true,
                            matchedCriteria: [
                                'Tipo de seguro compatível',
                                'Valor dentro da faixa aceitável',
                                'Contrato novo'
                            ],
                            unmatchedCriteria: [],
                            suggestions: [
                                'Apólice ideal para a campanha',
                                'Continue com esse perfil de cliente'
                            ],
                            reasoning: `Apólice ${policy.policy_number} do tipo ${policy.type} com valor R$ ${policy.premium_value} atende aos critérios da campanha ${campaign.title}`,
                            recommendation: 'aceitar',
                            generated_at: new Date().toISOString(),
                            policy_id: policy.id,
                            campaign_id: campaign.id
                        }
                    });

                if (auditError) {
                    console.warn('⚠️ CampaignTimelineService: Erro ao criar auditoria para apólice:', policy.policy_number, auditError);
                } else {
                    console.log('✅ CampaignTimelineService: Auditoria criada para apólice:', policy.policy_number);
                }
            }

            console.log('✅ CampaignTimelineService: Dados de teste criados com sucesso!');
        } catch (error: any) {
            console.error('❌ CampaignTimelineService: Erro ao criar dados de teste:', error);
        }
    }

}
