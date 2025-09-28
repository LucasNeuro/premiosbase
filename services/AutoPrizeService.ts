import { supabase } from '../lib/supabase';

/**
 * Serviço para inserir prêmios automaticamente quando campanhas são completadas
 */
export class AutoPrizeService {
    
    /**
     * Verifica se uma campanha está realmente completa
     */
    static async isCampaignTrulyCompleted(campaignId: string): Promise<boolean> {
        try {
            // Buscar dados da campanha
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', campaignId)
                .eq('record_type', 'campaign')
                .single();

            if (campaignError || !campaign) {
                return false;
            }

            // Verificar se status é completed E progresso >= 100%
            const isCompleted = campaign.status === 'completed' && (campaign.progress_percentage || 0) >= 100;
            
            console.log(`🔍 AutoPrizeService - Campanha ${campaignId}: status=${campaign.status}, progresso=${campaign.progress_percentage}%, completa=${isCompleted}`);
            
            return isCompleted;

        } catch (error) {
            console.error('❌ AutoPrizeService - Erro ao verificar campanha:', error);
            return false;
        }
    }

    /**
     * Insere prêmios automaticamente para campanhas completadas
     */
    static async insertPrizesForCompletedCampaign(campaignId: string): Promise<boolean> {
        try {
            console.log(`🎁 AutoPrizeService - Verificando se deve inserir prêmios para campanha ${campaignId}`);

            // Verificar se campanha está realmente completa
            const isTrulyCompleted = await this.isCampaignTrulyCompleted(campaignId);
            
            if (!isTrulyCompleted) {
                console.log('⚠️ AutoPrizeService - Campanha não está realmente completa, prêmios NÃO inseridos');
                return false;
            }

            // Verificar se já existem prêmios inseridos para esta campanha
            const { data: existingPrizes, error: checkError } = await supabase
                .from('premios_conquistados')
                .select('id')
                .eq('campaign_id', campaignId);

            if (checkError) {
                console.error('❌ AutoPrizeService - Erro ao verificar prêmios existentes:', checkError);
                return false;
            }

            if (existingPrizes && existingPrizes.length > 0) {
                console.log('ℹ️ AutoPrizeService - Prêmios já inseridos para esta campanha');
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
                console.error('❌ AutoPrizeService - Erro ao buscar prêmios:', prizesError);
                return false;
            }

            if (!campaignPrizes || campaignPrizes.length === 0) {
                console.log('ℹ️ AutoPrizeService - Nenhum prêmio configurado para esta campanha');
                return true;
            }

            // Buscar dados da campanha para obter user_id
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('user_id, title')
                .eq('id', campaignId)
                .single();

            if (campaignError || !campaign) {
                console.error('❌ AutoPrizeService - Erro ao buscar dados da campanha:', campaignError);
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
                console.error('❌ AutoPrizeService - Erro ao inserir prêmios conquistados:', insertError);
                return false;
            }

            console.log(`✅ AutoPrizeService - ${prizesToInsert.length} prêmios inseridos automaticamente`);
            return true;

        } catch (error) {
            console.error('❌ AutoPrizeService - Erro ao inserir prêmios:', error);
            return false;
        }
    }

    /**
     * Processa todas as campanhas completadas e insere prêmios
     */
    static async processAllCompletedCampaigns(): Promise<{
        success: boolean;
        processedCampaigns: number;
        errors: string[];
    }> {
        try {
            console.log('🔍 AutoPrizeService - Processando todas as campanhas completadas');

            // Buscar todas as campanhas com status completed
            const { data: completedCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('id, title, user_id, progress_percentage')
                .eq('record_type', 'campaign')
                .eq('status', 'completed')
                .eq('is_active', true);

            if (campaignsError) {
                throw campaignsError;
            }

            if (!completedCampaigns || completedCampaigns.length === 0) {
                console.log('ℹ️ AutoPrizeService - Nenhuma campanha completada encontrada');
                return {
                    success: true,
                    processedCampaigns: 0,
                    errors: []
                };
            }

            console.log(`📊 AutoPrizeService - Encontradas ${completedCampaigns.length} campanhas completadas`);

            let processedCampaigns = 0;
            const errors: string[] = [];

            for (const campaign of completedCampaigns) {
                try {
                    console.log(`🔍 AutoPrizeService - Processando campanha: ${campaign.title} (${campaign.progress_percentage}%)`);
                    
                    const success = await this.insertPrizesForCompletedCampaign(campaign.id);
                    if (success) {
                        processedCampaigns++;
                        console.log(`✅ AutoPrizeService - Campanha ${campaign.title} processada com sucesso`);
                    }
                } catch (error) {
                    const errorMsg = `Erro ao processar campanha ${campaign.title}: ${error}`;
                    errors.push(errorMsg);
                    console.error(`❌ AutoPrizeService - ${errorMsg}`);
                }
            }

            console.log(`✅ AutoPrizeService - Processamento concluído: ${processedCampaigns} campanhas processadas`);

            return {
                success: true,
                processedCampaigns,
                errors
            };

        } catch (error) {
            console.error('❌ AutoPrizeService - Erro ao processar campanhas:', error);
            return {
                success: false,
                processedCampaigns: 0,
                errors: [error.message]
            };
        }
    }
}
