import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ConqueredPrize {
    id: string;
    user_id: string;
    campaign_id: string;
    campaign_title: string;
    premio_id: string;
    premio_nome: string;
    premio_valor_estimado: number;
    premio_imagem_url?: string;
    premio_categoria?: string;
    premio_tipo?: string;
    quantidade_conquistada: number;
    valor_total_conquistado: number;
    data_conquista: string;
    status: 'disponivel' | 'resgatado' | 'expirado';
    data_resgate?: string;
    pedido_id?: string;
    created_at: string;
    updated_at: string;
}

export interface PrizeBalance {
    total_conquistado: number;
    total_pedidos_pendentes: number;
    saldo_disponivel: number;
}

export const useConqueredPrizes = () => {
    const { user } = useAuth();
    const [conqueredPrizes, setConqueredPrizes] = useState<ConqueredPrize[]>([]);
    const [availablePrizes, setAvailablePrizes] = useState<ConqueredPrize[]>([]);
    const [balance, setBalance] = useState<PrizeBalance>({
        total_conquistado: 0,
        total_pedidos_pendentes: 0,
        saldo_disponivel: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Buscar prêmios conquistados do usuário
    const fetchConqueredPrizes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {

                setConqueredPrizes([]);
                setAvailablePrizes([]);
                return;
            }

            console.log('🔍 Debug: Buscando prêmios para user_id:', user.id);
            
            const { data: prizesData, error: prizesError } = await supabase
                .from('premios_conquistados')
                .select('*')
                .eq('user_id', user.id)
                .order('data_conquista', { ascending: false });

            console.log('🔍 Debug: Resultado da busca:', { prizesData, prizesError });

            if (prizesError) {
                console.error('❌ Erro ao buscar prêmios:', prizesError);
                throw prizesError;
            }

            const allPrizes = prizesData || [];
            
            // Remover duplicatas baseado em premio_id + campaign_id
            const uniquePrizes = allPrizes.reduce((acc, prize) => {
                const key = `${prize.premio_id}-${prize.campaign_id}`;
                if (!acc.has(key)) {
                    acc.set(key, prize);
                }
                return acc;
            }, new Map()).values();
            
            const uniquePrizesArray = Array.from(uniquePrizes) as ConqueredPrize[];
            const available = uniquePrizesArray.filter(prize => prize.status === 'disponivel');

            setConqueredPrizes(uniquePrizesArray);
            setAvailablePrizes(available);

            // Simplificado: Apenas definir valores básicos sem cálculo de saldo
            setBalance({
                total_conquistado: 0, // Não usado mais
                total_pedidos_pendentes: 0, // Não usado mais
                saldo_disponivel: 0 // Não usado mais
            });

        } catch (err: any) {
            setError(err.message || 'Erro ao carregar prêmios');
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

            // Saldo já foi calculado acima quando carregamos os prêmios

        } catch (err: any) {
            setError(err.message || 'Erro ao calcular saldo');
        }
    }, []);

    // Criar pedido de resgate
    const createRedemptionOrder = useCallback(async (orderData: {
        premio_conquistado_id: string;
        quantidade: number;
    }) => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            // Buscar dados do prêmio conquistado
            const { data: conqueredPrize, error: prizeError } = await supabase
                .from('premios_conquistados')
                .select('*')
                .eq('id', orderData.premio_conquistado_id)
                .eq('user_id', user.id)
                .eq('status', 'disponivel')
                .single();

            if (prizeError || !conqueredPrize) {
                throw new Error('Prêmio não encontrado ou não disponível');
            }

            const valorTotal = orderData.quantidade * conqueredPrize.premio_valor_estimado;

            // Simplificado: Apenas verificar se o prêmio está disponível
            console.log('🔍 Debug: Criando pedido:', {
                premio_nome: conqueredPrize.premio_nome,
                quantidade: orderData.quantidade,
                valorTotal
            });

            // Criar pedido na tabela pedidos_premios
            const { data: newOrder, error: createError } = await supabase
                .from('pedidos_premios')
                .insert({
                    user_id: user.id,
                    campaign_id: conqueredPrize.campaign_id,
                    campaign_title: conqueredPrize.campaign_title,
                    premio_id: conqueredPrize.premio_id,
                    premio_nome: conqueredPrize.premio_nome,
                    premio_valor_estimado: conqueredPrize.premio_valor_estimado,
                    quantidade: orderData.quantidade,
                    valor_total: valorTotal,
                    status: 'pending'
                })
                .select()
                .single();

            if (createError) {
                throw createError;
            }

            // Marcar prêmio como resgatado
            const { error: markError } = await supabase
                .rpc('marcar_premio_resgatado', {
                    premio_conquistado_id: orderData.premio_conquistado_id,
                    pedido_id_param: newOrder.id
                });

            if (markError) {
                // Não lançar erro aqui, pois o pedido já foi criado
            }

            // Atualizar listas
            await fetchConqueredPrizes();
            await calculateBalance();

            return newOrder;

        } catch (err: any) {
            setError(err.message || 'Erro ao criar pedido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchConqueredPrizes, calculateBalance]);


    // Carregar dados iniciais
    useEffect(() => {
        if (user) {
            fetchConqueredPrizes();
            calculateBalance();
        } else {
            setConqueredPrizes([]);
            setAvailablePrizes([]);
            setBalance({
                total_conquistado: 0,
                total_pedidos_pendentes: 0,
                saldo_disponivel: 0
            });
        }
    }, [user, fetchConqueredPrizes, calculateBalance]);

    return {
        conqueredPrizes,
        availablePrizes,
        balance,
        loading,
        error,
        createRedemptionOrder,
        refreshPrizes: fetchConqueredPrizes,
        refreshBalance: calculateBalance
    };
};
