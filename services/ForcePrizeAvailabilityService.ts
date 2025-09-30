import { supabase } from '../lib/supabase';

/**
 * Serviço para forçar disponibilização de prêmios para campanhas completadas
 * Usado para corrigir campanhas que já atingiram 100% mas não tiveram prêmios disponibilizados
 */
export class ForcePrizeAvailabilityService {
    
    /**
     * Força disponibilização de prêmios para uma campanha específica
     */
    static async forcePrizeAvailabilityForCampaign(campaignId: string): Promise<{
        success: boolean;
        message: string;
        prizesInserted: number;
    }> {
        try {
            console.log(`🎁 ForcePrizeAvailabilityService - Forçando disponibilização de prêmios para campanha ${campaignId}`);

            // 1. Verificar se campanha existe e está completada
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', campaignId)
                .eq('record_type', 'campaign')
                .single();

            if (campaignError || !campaign) {
                return {
                    success: false,
                    message: 'Campanha não encontrada',
                    prizesInserted: 0
                };
            }

            if (campaign.status !== 'completed') {
                return {
                    success: false,
                    message: `Campanha não está completada (status: ${campaign.status})`,
                    prizesInserted: 0
                };
            }

            // 2. Verificar se já existem prêmios disponibilizados
            const { data: existingPrizes, error: checkError } = await supabase
                .from('premios_conquistados')
                .select('id')
                .eq('campaign_id', campaignId);

            if (checkError) {
                return {
                    success: false,
                    message: `Erro ao verificar prêmios existentes: ${checkError.message}`,
                    prizesInserted: 0
                };
            }

            if (existingPrizes && existingPrizes.length > 0) {
                return {
                    success: true,
                    message: `Prêmios já disponibilizados (${existingPrizes.length} prêmios)`,
                    prizesInserted: existingPrizes.length
                };
            }

            // 3. Buscar prêmios da campanha
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
                        imagem_miniatura_url
                    )
                `)
                .eq('goal_id', campaignId);

            if (prizesError) {
                return {
                    success: false,
                    message: `Erro ao buscar prêmios: ${prizesError.message}`,
                    prizesInserted: 0
                };
            }

            if (!campaignPrizes || campaignPrizes.length === 0) {
                return {
                    success: true,
                    message: 'Nenhum prêmio configurado para esta campanha',
                    prizesInserted: 0
                };
            }

            // 4. Preparar dados para inserção
            const prizesToInsert = campaignPrizes.map(cp => ({
                user_id: campaign.user_id,
                campaign_id: campaignId,
                campaign_title: campaign.title,
                premio_id: cp.premio_id,
                premio_nome: cp.premio?.nome || 'Prêmio',
                premio_valor_estimado: cp.premio?.valor_estimado || 0,
                premio_imagem_url: cp.premio?.imagem_url,
                premio_categoria: 'Prêmio', // Categoria padrão
                premio_tipo: 'Prêmio', // Tipo padrão
                quantidade_conquistada: cp.quantidade || 1,
                valor_total_conquistado: (cp.premio?.valor_estimado || 0) * (cp.quantidade || 1),
                data_conquista: new Date().toISOString(),
                status: 'disponivel'
            }));

            // 5. Inserir prêmios na tabela premios_conquistados
            const { error: insertError } = await supabase
                .from('premios_conquistados')
                .insert(prizesToInsert);

            if (insertError) {
                return {
                    success: false,
                    message: `Erro ao inserir prêmios: ${insertError.message}`,
                    prizesInserted: 0
                };
            }

            console.log(`✅ ForcePrizeAvailabilityService - ${prizesToInsert.length} prêmios disponibilizados com sucesso`);

            return {
                success: true,
                message: `${prizesToInsert.length} prêmios disponibilizados com sucesso`,
                prizesInserted: prizesToInsert.length
            };

        } catch (error: any) {
            console.error('❌ ForcePrizeAvailabilityService - Erro:', error);
            return {
                success: false,
                message: `Erro interno: ${error.message}`,
                prizesInserted: 0
            };
        }
    }

    /**
     * Força disponibilização de prêmios para todas as campanhas completadas
     */
    static async forcePrizeAvailabilityForAllCompletedCampaigns(): Promise<{
        success: boolean;
        message: string;
        totalProcessed: number;
        totalPrizesInserted: number;
        errors: string[];
    }> {
        try {
            console.log('🎁 ForcePrizeAvailabilityService - Forçando disponibilização para todas as campanhas completadas');

            // Buscar todas as campanhas completadas
            const { data: completedCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('id, title, user_id')
                .eq('record_type', 'campaign')
                .eq('status', 'completed')
                .eq('is_active', true);

            if (campaignsError) {
                return {
                    success: false,
                    message: `Erro ao buscar campanhas: ${campaignsError.message}`,
                    totalProcessed: 0,
                    totalPrizesInserted: 0,
                    errors: [campaignsError.message]
                };
            }

            if (!completedCampaigns || completedCampaigns.length === 0) {
                return {
                    success: true,
                    message: 'Nenhuma campanha completada encontrada',
                    totalProcessed: 0,
                    totalPrizesInserted: 0,
                    errors: []
                };
            }

            console.log(`📊 ForcePrizeAvailabilityService - Processando ${completedCampaigns.length} campanhas completadas`);

            let totalProcessed = 0;
            let totalPrizesInserted = 0;
            const errors: string[] = [];

            for (const campaign of completedCampaigns) {
                try {
                    const result = await this.forcePrizeAvailabilityForCampaign(campaign.id);
                    
                    if (result.success) {
                        totalProcessed++;
                        totalPrizesInserted += result.prizesInserted;
                        console.log(`✅ Campanha ${campaign.title}: ${result.message}`);
                    } else {
                        errors.push(`Campanha ${campaign.title}: ${result.message}`);
                    }
                } catch (error: any) {
                    const errorMsg = `Campanha ${campaign.title}: ${error.message}`;
                    errors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }
            }

            const success = errors.length === 0;
            const message = success 
                ? `${totalProcessed} campanhas processadas, ${totalPrizesInserted} prêmios disponibilizados`
                : `${totalProcessed} campanhas processadas, ${totalPrizesInserted} prêmios disponibilizados, ${errors.length} erros`;

            return {
                success,
                message,
                totalProcessed,
                totalPrizesInserted,
                errors
            };

        } catch (error: any) {
            console.error('❌ ForcePrizeAvailabilityService - Erro geral:', error);
            return {
                success: false,
                message: `Erro interno: ${error.message}`,
                totalProcessed: 0,
                totalPrizesInserted: 0,
                errors: [error.message]
            };
        }
    }
}

