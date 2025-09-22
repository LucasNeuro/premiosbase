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
                console.log('⚠️ [PRÊMIOS] Usuário não autenticado - pulando busca de prêmios');
                setConqueredPrizes([]);
                setAvailablePrizes([]);
                return;
            }

            console.log(`🎁 [PRÊMIOS] Buscando prêmios conquistados para: ${user.id}`);

            const { data: prizesData, error: prizesError } = await supabase
                .from('premios_conquistados')
                .select('*')
                .eq('user_id', user.id)
                .order('data_conquista', { ascending: false });

            if (prizesError) {
                console.error('❌ [PRÊMIOS] Erro ao buscar prêmios conquistados:', prizesError);
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
            
            const uniquePrizesArray = Array.from(uniquePrizes);
            const available = uniquePrizesArray.filter(prize => prize.status === 'disponivel');

            setConqueredPrizes(uniquePrizesArray);
            setAvailablePrizes(available);
            
            console.log(`✅ [PRÊMIOS] Prêmios originais: ${allPrizes.length}, Únicos: ${uniquePrizesArray.length}, Disponíveis: ${available.length}`);
            
            console.log(`✅ [PRÊMIOS] Prêmios carregados: ${allPrizes.length} total, ${available.length} disponíveis`);
            console.log(`✅ [PRÊMIOS] Dados dos prêmios:`, allPrizes.map(p => ({
                nome: p.premio_nome,
                valor_estimado: p.premio_valor_estimado,
                valor_total_conquistado: p.valor_total_conquistado,
                status: p.status
            })));
            console.log(`✅ [PRÊMIOS] Total conquistados: ${allPrizes.length}, Disponíveis: ${available.length}`);

            // Calcular total conquistado usando os prêmios únicos
            const totalConquistado = uniquePrizesArray.reduce((sum, prize) => {
                // Usar valor_total_conquistado se disponível, senão calcular
                const valor = prize.valor_total_conquistado || (prize.premio_valor_estimado * prize.quantidade_conquistada);
                return sum + (valor || 0);
            }, 0);
            
            console.log(`💰 [SALDO] Total conquistado calculado: R$ ${totalConquistado.toFixed(2)}`);
            console.log(`💰 [SALDO] Prêmios disponíveis: ${available.length}`);
            console.log(`💰 [SALDO] Detalhes do cálculo:`, uniquePrizesArray.map(p => ({
                nome: p.premio_nome,
                valor_estimado: p.premio_valor_estimado,
                quantidade: p.quantidade_conquistada,
                valor_total_conquistado: p.valor_total_conquistado,
                calculado: p.valor_total_conquistado || (p.premio_valor_estimado * p.quantidade_conquistada)
            })));

            // Atualizar o saldo imediatamente
            setBalance({
                total_conquistado: totalConquistado,
                total_pedidos_pendentes: 0,
                saldo_disponivel: totalConquistado
            });

        } catch (err: any) {
            console.error('❌ [PRÊMIOS] Erro ao buscar prêmios conquistados:', err);
            setError(err.message || 'Erro ao carregar prêmios');
        } finally {
            setLoading(false);
        }
    }, []);

    // Calcular saldo de premiação
    const calculateBalance = useCallback(async () => {
        try {
            if (!user) {
                console.log('⚠️ [SALDO] Usuário não autenticado - pulando cálculo de saldo');
                setBalance({
                    total_conquistado: 0,
                    total_pedidos_pendentes: 0,
                    saldo_disponivel: 0
                });
                return;
            }

            // Saldo já foi calculado acima quando carregamos os prêmios

        } catch (err: any) {
            console.error('❌ [SALDO] Erro ao calcular saldo:', err);
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

            // Verificar se tem saldo suficiente
            const { data: saldoSuficiente, error: saldoError } = await supabase
                .rpc('verificar_saldo_suficiente', {
                    user_id_param: user.id,
                    valor_solicitado: valorTotal
                });

            if (saldoError) {
                console.error('❌ [PEDIDO] Erro ao verificar saldo:', saldoError);
                throw saldoError;
            }

            if (!saldoSuficiente) {
                throw new Error('Saldo insuficiente para este pedido');
            }

            console.log(`🛒 [PEDIDO] Criando pedido de resgate:`, orderData);

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
                console.error('❌ [PEDIDO] Erro ao criar pedido:', createError);
                throw createError;
            }

            // Marcar prêmio como resgatado
            const { error: markError } = await supabase
                .rpc('marcar_premio_resgatado', {
                    premio_conquistado_id: orderData.premio_conquistado_id,
                    pedido_id_param: newOrder.id
                });

            if (markError) {
                console.error('❌ [PEDIDO] Erro ao marcar prêmio como resgatado:', markError);
                // Não lançar erro aqui, pois o pedido já foi criado
            }

            console.log(`✅ [PEDIDO] Pedido de resgate criado com sucesso:`, newOrder);

            // Atualizar listas
            await fetchConqueredPrizes();
            await calculateBalance();

            return newOrder;

        } catch (err: any) {
            console.error('❌ [PEDIDO] Erro ao criar pedido de resgate:', err);
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
