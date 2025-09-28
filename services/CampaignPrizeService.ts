import { supabase } from '../lib/supabase';

/**
 * Serviço para gerenciar prêmios de campanhas
 * Salva prêmios na tabela premios_conquistados apenas quando campanha está realmente completa
 */
export class CampaignPrizeService {
    
    /**
     * Verifica se uma campanha está realmente completa
     * Para campanhas compostas: TODOS os critérios devem estar 100%
     */
    static async isCampaignTrulyCompleted(campaignId: string): Promise<boolean> {
        try {
            console.log(`🔍 CampaignPrizeService - Verificando se campanha ${campaignId} está realmente completa`);

            // Buscar dados da campanha
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', campaignId)
                .eq('record_type', 'campaign')
                .single();

            if (campaignError || !campaign) {
                console.log('❌ CampaignPrizeService - Campanha não encontrada');
                return false;
            }

            // Verificar se status é completed
            if (campaign.status !== 'completed') {
                console.log(`⚠️ CampaignPrizeService - Campanha não está completed (status: ${campaign.status})`);
                return false;
            }

            // Para campanhas compostas, verificar se TODOS os critérios estão 100%
            if (campaign.campaign_type === 'composite' && campaign.criteria) {
                try {
                    const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : JSON.parse(campaign.criteria);
                    
                    console.log(`🔍 CampaignPrizeService - Verificando ${criteria.length} critérios`);
                    
                    // Buscar apólices vinculadas
                    const { data: linkedPolicies, error: policiesError } = await supabase
                        .from('policy_campaign_links')
                        .select(`
                            policy_id,
                            policies!inner(
                                id,
                                premium_value,
                                type,
                                contract_type,
                                created_at
                            )
                        `)
                        .eq('campaign_id', campaignId)
                        .eq('is_active', true);

                    if (policiesError) {
                        console.log('❌ CampaignPrizeService - Erro ao buscar apólices');
                        return false;
                    }

                    const policies = (linkedPolicies || [])
                        .map(link => link.policies)
                        .filter(policy => policy !== null);

                    // Aplicar filtro de data (apólices criadas APÓS aceitar a campanha)
                    const acceptedAt = campaign.accepted_at ? new Date(campaign.accepted_at) : new Date();
                    const filteredPolicies = policies.filter(policy => {
                        const policyCreatedAt = new Date(policy.created_at);
                        return policyCreatedAt >= acceptedAt;
                    });

                    console.log(`📊 CampaignPrizeService - ${filteredPolicies.length} apólices válidas após filtro de data`);

                    // Verificar cada critério
                    for (const criterion of criteria) {
                        const matchingPolicies = filteredPolicies.filter(policy => {
                            // Verificar tipo de apólice
                            if (criterion.policy_type) {
                                const policyTypeMap = {
                                    'auto': 'Seguro Auto',
                                    'residencial': 'Seguro Residencial'
                                };
                                
                                if (policyTypeMap[criterion.policy_type] !== policy.type) {
                                    return false;
                                }
                            }

                            // Verificar tipo de contrato
                            if (criterion.contract_type && criterion.contract_type !== 'ambos') {
                                if (criterion.contract_type === 'novo' && policy.contract_type !== 'Novo') return false;
                                if (criterion.contract_type === 'renovacao_bradesco' && policy.contract_type !== 'Renovação Bradesco') return false;
                            }

                            // Verificar valor mínimo
                            if (criterion.min_value_per_policy && (policy.premium_value || 0) < criterion.min_value_per_policy) {
                                return false;
                            }

                            return true;
                        });

                        // Calcular progresso deste critério
                        let criterionProgress = 0;
                        if (criterion.target_type === 'valor') {
                            const currentValue = matchingPolicies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
                            criterionProgress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;
                        } else {
                            criterionProgress = criterion.target_value > 0 ? (matchingPolicies.length / criterion.target_value) * 100 : 0;
                        }

                        console.log(`📊 CampaignPrizeService - Critério ${criterion.policy_type}: ${criterionProgress.toFixed(1)}%`);

                        // Se qualquer critério não estiver 100%, campanha não está completa
                        if (criterionProgress < 100) {
                            console.log(`❌ CampaignPrizeService - Critério ${criterion.policy_type} não atingido (${criterionProgress.toFixed(1)}%)`);
                            return false;
                        }
                    }

                    console.log('✅ CampaignPrizeService - TODOS os critérios foram atingidos');
                    return true;

                } catch (error) {
                    console.error('❌ CampaignPrizeService - Erro ao processar critérios:', error);
                    return false;
                }
            }

            // Para campanhas simples, se status é completed, está completa
            console.log('✅ CampaignPrizeService - Campanha simples está completa');
            return true;

        } catch (error) {
            console.error('❌ CampaignPrizeService - Erro ao verificar campanha:', error);
            return false;
        }
    }

    /**
     * Salva prêmios na tabela premios_conquistados apenas se campanha estiver realmente completa
     */
    static async savePrizesIfCampaignCompleted(campaignId: string): Promise<boolean> {
        try {
            console.log(`🎁 CampaignPrizeService - Verificando se deve salvar prêmios para campanha ${campaignId}`);

            // Verificar se campanha está realmente completa
            const isTrulyCompleted = await this.isCampaignTrulyCompleted(campaignId);
            
            if (!isTrulyCompleted) {
                console.log('⚠️ CampaignPrizeService - Campanha não está realmente completa, prêmios NÃO salvos');
                return false;
            }

            // Verificar se já existem prêmios salvos para esta campanha
            const { data: existingPrizes, error: checkError } = await supabase
                .from('premios_conquistados')
                .select('id')
                .eq('campaign_id', campaignId);

            if (checkError) {
                console.error('❌ CampaignPrizeService - Erro ao verificar prêmios existentes:', checkError);
                return false;
            }

            if (existingPrizes && existingPrizes.length > 0) {
                console.log('ℹ️ CampaignPrizeService - Prêmios já salvos para esta campanha');
                return true;
            }

            // Buscar prêmios da campanha
            const { data: campaignPrizes, error: prizesError } = await supabase
                .from('campanhas_premios')
                .select(`
                    *,
                    premio:premios(
                        id,
                        nome,
                        descricao,
                        valor_estimado,
                        imagem_url,
                        imagem_miniatura_url,
                        categoria:categorias_premios(nome),
                        tipo:tipos_premios(nome)
                    )
                `)
                .eq('goal_id', campaignId);

            if (prizesError) {
                console.error('❌ CampaignPrizeService - Erro ao buscar prêmios:', prizesError);
                return false;
            }

            if (!campaignPrizes || campaignPrizes.length === 0) {
                console.log('ℹ️ CampaignPrizeService - Nenhum prêmio configurado para esta campanha');
                return true;
            }

            // Buscar dados da campanha para obter user_id
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('user_id, title')
                .eq('id', campaignId)
                .single();

            if (campaignError || !campaign) {
                console.error('❌ CampaignPrizeService - Erro ao buscar dados da campanha:', campaignError);
                return false;
            }

            // Preparar dados para inserção
            const prizesToInsert = campaignPrizes.map(cp => ({
                user_id: campaign.user_id,
                campaign_id: campaignId,
                campaign_title: campaign.title,
                premio_id: cp.premio_id,
                premio_nome: cp.premio?.nome || 'Prêmio',
                premio_valor_estimado: cp.premio?.valor_estimado || 0,
                premio_imagem_url: cp.premio?.imagem_url,
                premio_categoria: cp.premio?.categoria?.nome,
                premio_tipo: cp.premio?.tipo?.nome,
                quantidade_conquistada: cp.quantidade || 1,
                valor_total_conquistado: (cp.premio?.valor_estimado || 0) * (cp.quantidade || 1),
                data_conquista: new Date().toISOString(),
                status: 'disponivel'
            }));

            // Inserir prêmios na tabela premios_conquistados
            const { error: insertError } = await supabase
                .from('premios_conquistados')
                .insert(prizesToInsert);

            if (insertError) {
                console.error('❌ CampaignPrizeService - Erro ao inserir prêmios conquistados:', insertError);
                return false;
            }

            console.log(`✅ CampaignPrizeService - ${prizesToInsert.length} prêmios salvos na tabela premios_conquistados`);
            return true;

        } catch (error) {
            console.error('❌ CampaignPrizeService - Erro ao salvar prêmios:', error);
            return false;
        }
    }

    /**
     * Remove prêmios da tabela premios_conquistados se campanha não estiver realmente completa
     */
    static async removePrizesIfCampaignNotCompleted(campaignId: string): Promise<boolean> {
        try {
            console.log(`🗑️ CampaignPrizeService - Verificando se deve remover prêmios da campanha ${campaignId}`);

            // Verificar se campanha está realmente completa
            const isTrulyCompleted = await this.isCampaignTrulyCompleted(campaignId);
            
            if (isTrulyCompleted) {
                console.log('✅ CampaignPrizeService - Campanha está completa, prêmios mantidos');
                return true;
            }

            // Remover prêmios disponíveis desta campanha
            const { error: deleteError } = await supabase
                .from('premios_conquistados')
                .delete()
                .eq('campaign_id', campaignId)
                .eq('status', 'disponivel');

            if (deleteError) {
                console.error('❌ CampaignPrizeService - Erro ao remover prêmios:', deleteError);
                return false;
            }

            console.log('✅ CampaignPrizeService - Prêmios removidos (campanha não está realmente completa)');
            return true;

        } catch (error) {
            console.error('❌ CampaignPrizeService - Erro ao remover prêmios:', error);
            return false;
        }
    }
}
