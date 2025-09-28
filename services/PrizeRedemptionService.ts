import { supabase } from '../lib/supabase';

/**
 * Serviço para gerenciar resgate de prêmios
 */
export class PrizeRedemptionService {
    
    /**
     * Remove prêmios da tabela premios_conquistados após resgate
     */
    static async removeRedeemedPrizes(campaignIds: string[]): Promise<{
        success: boolean;
        removedPrizes: number;
        error?: string;
    }> {
        try {
            console.log(`🎁 PrizeRedemptionService - Removendo prêmios das campanhas: ${campaignIds.join(', ')}`);

            // Buscar prêmios das campanhas para remover
            const { data: prizesToRemove, error: fetchError } = await supabase
                .from('premios_conquistados')
                .select('id, campaign_id, premio_nome')
                .in('campaign_id', campaignIds);

            if (fetchError) {
                throw fetchError;
            }

            if (!prizesToRemove || prizesToRemove.length === 0) {
                console.log('ℹ️ PrizeRedemptionService - Nenhum prêmio encontrado para remover');
                return {
                    success: true,
                    removedPrizes: 0
                };
            }

            console.log(`🔍 PrizeRedemptionService - Encontrados ${prizesToRemove.length} prêmios para remover`);

            // Remover prêmios da tabela premios_conquistados
            const { error: deleteError } = await supabase
                .from('premios_conquistados')
                .delete()
                .in('campaign_id', campaignIds);

            if (deleteError) {
                throw deleteError;
            }

            console.log(`✅ PrizeRedemptionService - ${prizesToRemove.length} prêmios removidos com sucesso`);

            return {
                success: true,
                removedPrizes: prizesToRemove.length
            };

        } catch (error) {
            console.error('❌ PrizeRedemptionService - Erro ao remover prêmios:', error);
            return {
                success: false,
                removedPrizes: 0,
                error: error.message
            };
        }
    }

    /**
     * Cria pedido de resgate e remove prêmios
     */
    static async createRedemptionOrder(cartItems: any[]): Promise<{
        success: boolean;
        orderId?: string;
        removedPrizes: number;
        error?: string;
    }> {
        try {
            console.log('🛒 PrizeRedemptionService - Criando pedido de resgate');

            // Extrair IDs das campanhas únicas
            const campaignIds = [...new Set(cartItems.map(item => item.campaign_id))];
            
            // Criar pedido na tabela pedidos_premios
            const orderData = {
                user_id: cartItems[0]?.user_id, // Assumindo que todos os itens são do mesmo usuário
                status: 'pending',
                total_items: cartItems.length,
                total_value: cartItems.reduce((sum, item) => sum + (item.valor_total || 0), 0),
                items: cartItems.map(item => ({
                    premio_id: item.premio_id,
                    premio_nome: item.premio_nome,
                    premio_categoria: item.premio_categoria,
                    premio_tipo: item.premio_tipo,
                    quantidade: item.quantidade,
                    valor_unitario: item.premio_valor_estimado,
                    valor_total: item.valor_total,
                    campaign_id: item.campaign_id,
                    campaign_title: item.campaign_title
                })),
                created_at: new Date().toISOString()
            };

            const { data: order, error: orderError } = await supabase
                .from('pedidos_premios')
                .insert([orderData])
                .select()
                .single();

            if (orderError) {
                throw orderError;
            }

            console.log(`✅ PrizeRedemptionService - Pedido criado: ${order.id}`);

            // Remover prêmios da tabela premios_conquistados
            const removeResult = await this.removeRedeemedPrizes(campaignIds);

            if (!removeResult.success) {
                console.error('⚠️ PrizeRedemptionService - Erro ao remover prêmios, mas pedido foi criado');
            }

            return {
                success: true,
                orderId: order.id,
                removedPrizes: removeResult.removedPrizes
            };

        } catch (error) {
            console.error('❌ PrizeRedemptionService - Erro ao criar pedido:', error);
            return {
                success: false,
                removedPrizes: 0,
                error: error.message
            };
        }
    }
}
