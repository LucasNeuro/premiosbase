import { supabase } from '../lib/supabase';

export class TimelineDebugService {
    /**
     * Debug completo do sistema de timeline
     */
    static async debugTimelineSystem(userId: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        try {
            console.log('🔍 TimelineDebugService: Iniciando debug para usuário:', userId);

            // 1. Verificar dados em policy_campaign_links
            const { data: linksData, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies!policy_id (
                        id,
                        policy_number,
                        type,
                        premium_value,
                        registration_date
                    ),
                    campaign:goals!campaign_id (
                        id,
                        title,
                        description,
                        campaign_type
                    )
                `)
                .eq('user_id', userId)
                .order('linked_at', { ascending: false });

            if (linksError) {
                console.error('❌ TimelineDebugService: Erro ao buscar policy_campaign_links:', linksError);
                return { success: false, error: linksError.message };
            }

            // 2. Verificar dados em policy_launch_audit
            const { data: auditData, error: auditError } = await supabase
                .from('policy_launch_audit')
                .select(`
                    *,
                    policy:policies!policy_id (
                        id,
                        policy_number,
                        type,
                        premium_value,
                        registration_date
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (auditError) {
                console.error('❌ TimelineDebugService: Erro ao buscar policy_launch_audit:', auditError);
                return { success: false, error: auditError.message };
            }

            // 3. Verificar campanhas do usuário
            const { data: campaignsData, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .order('created_at', { ascending: false });

            if (campaignsError) {
                console.error('❌ TimelineDebugService: Erro ao buscar campanhas:', campaignsError);
                return { success: false, error: campaignsError.message };
            }

            // 4. Verificar apólices do usuário
            const { data: policiesData, error: policiesError } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (policiesError) {
                console.error('❌ TimelineDebugService: Erro ao buscar apólices:', policiesError);
                return { success: false, error: policiesError.message };
            }

            const debugData = {
                userId,
                policyCampaignLinks: {
                    total: linksData?.length || 0,
                    active: linksData?.filter(link => link.is_active).length || 0,
                    automatic: linksData?.filter(link => link.linked_automatically).length || 0,
                    manual: linksData?.filter(link => !link.linked_automatically).length || 0,
                    data: linksData || []
                },
                policyLaunchAudit: {
                    total: auditData?.length || 0,
                    withCampaigns: auditData?.filter(audit => audit.linked_campaigns_count > 0).length || 0,
                    withoutCampaigns: auditData?.filter(audit => audit.linked_campaigns_count === 0).length || 0,
                    data: auditData || []
                },
                campaigns: {
                    total: campaignsData?.length || 0,
                    accepted: campaignsData?.filter(c => c.acceptance_status === 'accepted').length || 0,
                    pending: campaignsData?.filter(c => c.acceptance_status === 'pending').length || 0,
                    rejected: campaignsData?.filter(c => c.acceptance_status === 'rejected').length || 0,
                    data: campaignsData || []
                },
                policies: {
                    total: policiesData?.length || 0,
                    auto: policiesData?.filter(p => p.type === 'Seguro Auto').length || 0,
                    residential: policiesData?.filter(p => p.type === 'Seguro Residencial').length || 0,
                    data: policiesData || []
                }
            };

            console.log('📊 TimelineDebugService: Debug completo:', debugData);

            return { success: true, data: debugData };
        } catch (error: any) {
            console.error('❌ TimelineDebugService: Erro geral:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Criar dados de teste para o timeline
     */
    static async createTestData(userId: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }> {
        try {
            console.log('🧪 TimelineDebugService: Criando dados de teste para usuário:', userId);

            // 1. Verificar se existem apólices
            const { data: existingPolicies, error: policiesError } = await supabase
                .from('policies')
                .select('id, policy_number, type, premium_value')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(3);

            if (policiesError) {
                return { success: false, error: policiesError.message };
            }

            if (!existingPolicies || existingPolicies.length === 0) {
                return { success: false, error: 'Nenhuma apólice encontrada. Crie uma apólice primeiro.' };
            }

            // 2. Verificar se existem campanhas aceitas, se não, criar uma
            let { data: existingCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('id, title, description')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted')
                .limit(1);

            if (campaignsError) {
                return { success: false, error: campaignsError.message };
            }

            // Se não existir campanha aceita, criar uma
            if (!existingCampaigns || existingCampaigns.length === 0) {
                console.log('📝 TimelineDebugService: Criando campanha de teste...');
                
                const { data: newCampaign, error: createCampaignError } = await supabase
                    .from('goals')
                    .insert({
                        user_id: userId,
                        title: 'Campanha de Teste - Auto',
                        description: 'Campanha criada para testar o timeline',
                        target: 10000,
                        unit: 'reais',
                        type: 'valor',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        record_type: 'campaign',
                        campaign_type: 'simple',
                        target_type: 'individual',
                        acceptance_status: 'accepted',
                        accepted_at: new Date().toISOString(),
                        accepted_by: userId,
                        is_active: true
                    })
                    .select('id, title, description')
                    .single();

                if (createCampaignError) {
                    return { success: false, error: createCampaignError.message };
                }

                existingCampaigns = [newCampaign];
            }

            const campaign = existingCampaigns[0];
            let createdLinks = 0;
            let createdAudits = 0;

            // 3. Criar vinculações para as apólices
            for (const policy of existingPolicies) {
                // Verificar se já existe vinculação
                const { data: existingLink } = await supabase
                    .from('policy_campaign_links')
                    .select('id')
                    .eq('policy_id', policy.id)
                    .eq('campaign_id', campaign.id)
                    .single();

                if (!existingLink) {
                    const { error: linkError } = await supabase
                        .from('policy_campaign_links')
                        .insert({
                            policy_id: policy.id,
                            campaign_id: campaign.id,
                            user_id: userId,
                            linked_automatically: true,
                            is_active: true,
                            ai_confidence: 95,
                            ai_reasoning: `Vinculação automática criada para teste do timeline - Apólice ${policy.policy_number}`
                        });

                    if (!linkError) {
                        createdLinks++;
                    }
                }

                // 4. Criar auditoria se não existir
                const { data: existingAudit } = await supabase
                    .from('policy_launch_audit')
                    .select('id')
                    .eq('policy_id', policy.id)
                    .single();

                if (!existingAudit) {
                    const { error: auditError } = await supabase
                        .from('policy_launch_audit')
                        .insert({
                            policy_id: policy.id,
                            user_id: userId,
                            policy_number: policy.policy_number,
                            policy_type: policy.type,
                            contract_type: 'Novo',
                            premium_value: policy.premium_value,
                            cpd_number: `TESTE${Date.now()}`,
                            cpd_name: 'CPD de Teste',
                            linked_campaigns_count: 1,
                            linked_campaigns_details: {
                                campaign_id: campaign.id,
                                campaign_title: campaign.title,
                                linked_at: new Date().toISOString(),
                                confidence: 95
                            },
                            ai_analysis: {
                                confidence: 95,
                                reasoning: 'Análise automática para teste do timeline',
                                suggestions: ['Continue lançando apólices similares', 'Esta apólice atende aos critérios da campanha'],
                                analysis_date: new Date().toISOString()
                            }
                        });

                    if (!auditError) {
                        createdAudits++;
                    }
                }
            }

            return { 
                success: true, 
                message: `Dados de teste criados! ${createdLinks} vinculações e ${createdAudits} auditorias criadas.` 
            };
        } catch (error: any) {
            console.error('❌ TimelineDebugService: Erro ao criar dados de teste:', error);
            return { success: false, error: error.message };
        }
    }
}
