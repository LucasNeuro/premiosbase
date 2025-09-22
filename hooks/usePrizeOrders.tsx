import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface PrizeOrder {
    id: string;
    user_id: string;
    campaign_id: string;
    campaign_title: string;
    premio_id: string;
    premio_nome: string;
    premio_valor_estimado: number;
    quantidade: number;
    valor_total: number;
    status: 'pending' | 'approved' | 'rejected' | 'delivered' | 'cancelled';
    data_solicitacao: string;
    data_aprovacao?: string;
    data_entrega?: string;
    observacoes?: string;
    aprovado_por?: string;
    created_at: string;
    updated_at: string;
}

export interface PrizeBalance {
    total_conquistado: number;
    total_pedidos_pendentes: number;
    saldo_disponivel: number;
}

export const usePrizeOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<PrizeOrder[]>([]);
    const [balance, setBalance] = useState<PrizeBalance>({
        total_conquistado: 0,
        total_pedidos_pendentes: 0,
        saldo_disponivel: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Buscar pedidos do usuário logado
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {

                setOrders([]);
                return;
            }

            const { data: ordersData, error: ordersError } = await supabase
                .from('pedidos_premios')
                .select('*')
                .eq('user_id', user.id)
                .order('data_solicitacao', { ascending: false });

            if (ordersError) {
                throw ordersError;
            }

            setOrders(ordersData || []);

        } catch (err: any) {
            setError(err.message || 'Erro ao carregar pedidos');
        } finally {
            setLoading(false);
        }
    }, []);

    // Calcular saldo de premiação
    const calculateBalance = useCallback(async () => {
        try {
            if (!user) {

                setBalance({
                    total_conquistado: 0,
                    total_pedidos_pendentes: 0,
                    saldo_disponivel: 0
                });
                return;
            }

            // Usar a função do banco para calcular o saldo
            const { data: saldoData, error: saldoError } = await supabase
                .rpc('calcular_saldo_premiacao', { user_id_param: user.id });

            if (saldoError) {
                throw saldoError;
            }

            const saldoDisponivel = saldoData || 0;

            // Calcular total conquistado (campanhas completadas)
            const { data: conquistadoData, error: conquistadoError } = await supabase
                .from('goals')
                .select(`
                    campanhas_premios!inner(
                        quantidade,
                        premio:premios(valor_estimado)
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .eq('acceptance_status', 'accepted');

            if (conquistadoError) {
            }

            const totalConquistado = conquistadoData?.reduce((sum, goal) => {
                return sum + (goal.campanhas_premios?.reduce((premioSum: number, cp: any) => {
                    return premioSum + (cp.quantidade * cp.premio.valor_estimado);
                }, 0) || 0);
            }, 0) || 0;

            // Calcular total de pedidos pendentes
            const { data: pendentesData, error: pendentesError } = await supabase
                .from('pedidos_premios')
                .select('valor_total')
                .eq('user_id', user.id)
                .in('status', ['pending', 'approved']);

            if (pendentesError) {
            }

            const totalPedidosPendentes = pendentesData?.reduce((sum, order) => {
                return sum + order.valor_total;
            }, 0) || 0;

            const newBalance: PrizeBalance = {
                total_conquistado: totalConquistado,
                total_pedidos_pendentes: totalPedidosPendentes,
                saldo_disponivel: saldoDisponivel
            };

            setBalance(newBalance);

        } catch (err: any) {
            setError(err.message || 'Erro ao calcular saldo');
        }
    }, []);

    // Criar novo pedido
    const createOrder = useCallback(async (orderData: {
        campaign_id: string;
        campaign_title: string;
        premio_id: string;
        premio_nome: string;
        premio_valor_estimado: number;
        quantidade: number;
    }) => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const valorTotal = orderData.quantidade * orderData.premio_valor_estimado;

            // Verificar se tem saldo suficiente
            const { data: saldoSuficiente, error: saldoError } = await supabase
                .rpc('verificar_saldo_suficiente', {
                    user_id_param: user.id,
                    valor_solicitado: valorTotal
                });

            if (saldoError) {
                throw saldoError;
            }

            if (!saldoSuficiente) {
                throw new Error('Saldo insuficiente para este pedido');
            }

            const { data: newOrder, error: createError } = await supabase
                .from('pedidos_premios')
                .insert({
                    user_id: user.id,
                    campaign_id: orderData.campaign_id,
                    campaign_title: orderData.campaign_title,
                    premio_id: orderData.premio_id,
                    premio_nome: orderData.premio_nome,
                    premio_valor_estimado: orderData.premio_valor_estimado,
                    quantidade: orderData.quantidade,
                    valor_total: valorTotal,
                    status: 'pending'
                })
                .select()
                .single();

            if (createError) {
                throw createError;
            }

            // Atualizar listas
            await fetchOrders();
            await calculateBalance();

            return newOrder;

        } catch (err: any) {
            setError(err.message || 'Erro ao criar pedido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchOrders, calculateBalance]);

    // Cancelar pedido
    const cancelOrder = useCallback(async (orderId: string) => {
        try {
            setLoading(true);
            setError(null);

            const { error: updateError } = await supabase
                .from('pedidos_premios')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

            if (updateError) {
                throw updateError;
            }

            // Atualizar listas
            await fetchOrders();
            await calculateBalance();

        } catch (err: any) {
            setError(err.message || 'Erro ao cancelar pedido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchOrders, calculateBalance]);

    // Carregar dados iniciais
    useEffect(() => {
        if (user) {
            fetchOrders();
            calculateBalance();
        } else {
            setOrders([]);
            setBalance({
                total_conquistado: 0,
                total_pedidos_pendentes: 0,
                saldo_disponivel: 0
            });
        }
    }, [user, fetchOrders, calculateBalance]);

    return {
        orders,
        balance,
        loading,
        error,
        createOrder,
        cancelOrder,
        refreshOrders: fetchOrders,
        refreshBalance: calculateBalance
    };
};
