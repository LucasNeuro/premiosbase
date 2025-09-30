import { supabase } from '../lib/supabase';

/**
 * Serviço para gerenciar resgate de prêmios
 */
export class PrizeRedemptionService {
    

    /**
     * Cria pedido de resgate e remove prêmios
     */
    static async createRedemptionOrder(cartItems: any[], userId: string): Promise<{
        success: boolean;
        orderId?: string;
        removedPrizes: number;
        error?: string;
    }> {
        try {
            console.log('🛒 PrizeRedemptionService - Criando pedido de resgate');

            // Extrair IDs das campanhas únicas
            const campaignIds = [...new Set(cartItems.map(item => item.campaign_id))];
            
            // Criar pedido na tabela pedidos_premios (usando apenas o primeiro item do carrinho)
            const firstItem = cartItems[0];
            const orderData = {
                user_id: userId, // Usar o userId passado como parâmetro
                campaign_id: firstItem?.campaign_id,
                campaign_title: firstItem?.campaign_title,
                premio_id: firstItem?.premio_id,
                premio_nome: firstItem?.premio_nome,
                premio_valor_estimado: firstItem?.premio_valor_estimado,
                quantidade: firstItem?.quantidade,
                valor_total: firstItem?.valor_total,
                status: 'pending',
                data_solicitacao: new Date().toISOString()
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

    /**
     * Remove prêmios resgatados da tabela premios_conquistados
     */
    private static async removeRedeemedPrizes(campaignIds: string[]): Promise<{
        success: boolean;
        removedPrizes: number;
        error?: string;
    }> {
        try {
            console.log('🗑️ PrizeRedemptionService - Removendo prêmios resgatados');

            // Buscar prêmios conquistados das campanhas
            const { data: conqueredPrizes, error: fetchError } = await supabase
                .from('premios_conquistados')
                .select('*')
                .in('campaign_id', campaignIds)
                .eq('status', 'disponivel');

            if (fetchError) {
                throw fetchError;
            }

            if (!conqueredPrizes || conqueredPrizes.length === 0) {
                console.log('ℹ️ PrizeRedemptionService - Nenhum prêmio conquistado encontrado para remover');
                return {
                    success: true,
                    removedPrizes: 0
                };
            }

            // Atualizar status para 'resgatado' em vez de deletar
            const { error: updateError } = await supabase
                .from('premios_conquistados')
                .update({ 
                    status: 'resgatado',
                    data_resgate: new Date().toISOString()
                })
                .in('campaign_id', campaignIds)
                .eq('status', 'disponivel');

            if (updateError) {
                throw updateError;
            }

            console.log(`✅ PrizeRedemptionService - ${conqueredPrizes.length} prêmios marcados como resgatados`);

            return {
                success: true,
                removedPrizes: conqueredPrizes.length
            };

        } catch (error: any) {
            console.error('❌ PrizeRedemptionService - Erro ao remover prêmios:', error);
            return {
                success: false,
                removedPrizes: 0,
                error: error.message
            };
        }
    }
}
