import { supabase } from '../lib/supabase';

export interface PrizeRequest {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    prize_id: string;
    prize_name: string;
    prize_description: string;
    prize_value: number;
    campaign_id: string;
    campaign_name: string;
    quantity: number;
    status: 'pending' | 'approved' | 'rejected' | 'delivered';
    created_at: string;
    updated_at: string;
    admin_notes?: string;
}

export interface CreatePrizeRequestData {
    user_id: string;
    prize_id: string;
    campaign_id: string;
    quantity: number;
}

export class PrizeRequestService {
    /**
     * Criar um novo pedido de prêmio
     */
    static async createRequest(data: CreatePrizeRequestData): Promise<{ success: boolean; message: string; requestId?: string }> {
        try {
            // Buscar dados do prêmio e campanha
            const { data: prizeData, error: prizeError } = await supabase
                .from('premios')
                .select('nome, valor_estimado')
                .eq('id', data.prize_id)
                .single();

            const { data: campaignData, error: campaignError } = await supabase
                .from('goals')
                .select('title')
                .eq('id', data.campaign_id)
                .single();

            if (prizeError || campaignError) {
                return {
                    success: false,
                    message: 'Erro ao buscar dados do prêmio ou campanha'
                };
            }

            // Verificar se o usuário já tem um pedido pendente para este prêmio
            const { data: existingRequest, error: checkError } = await supabase
                .from('pedidos_premios')
                .select('id')
                .eq('user_id', data.user_id)
                .eq('premio_id', data.prize_id)
                .eq('status', 'pending')
                .single();

            if (existingRequest && !checkError) {
                return {
                    success: false,
                    message: 'Você já possui um pedido pendente para este prêmio'
                };
            }

            const valorTotal = (prizeData.valor_estimado || 0) * data.quantity;

            // Criar o pedido
            const { data: request, error } = await supabase
                .from('pedidos_premios')
                .insert([{
                    user_id: data.user_id,
                    premio_id: data.prize_id,
                    campaign_id: data.campaign_id,
                    campaign_title: campaignData.title,
                    premio_nome: prizeData.nome,
                    premio_valor_estimado: prizeData.valor_estimado,
                    quantidade: data.quantity,
                    valor_total: valorTotal
                }])
                .select('id')
                .single();

            if (error) {
                console.error('Erro ao criar pedido:', error);
                return {
                    success: false,
                    message: 'Erro ao criar pedido de prêmio'
                };
            }

            return {
                success: true,
                message: 'Pedido de prêmio criado com sucesso!',
                requestId: request.id
            };

        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }

    /**
     * Buscar pedidos de prêmios de um usuário
     */
    static async getUserRequests(userId: string): Promise<PrizeRequest[]> {
        try {
            // Buscar pedidos do usuário
            const { data: requests, error: requestsError } = await supabase
                .from('pedidos_premios')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (requestsError) {
                console.error('Erro ao buscar pedidos do usuário:', requestsError);
                return [];
            }

            if (!requests || requests.length === 0) {
                return [];
            }

            // Buscar dados dos prêmios
            const prizeIds = [...new Set(requests.map(r => r.premio_id))];
            const { data: prizes, error: prizesError } = await supabase
                .from('premios')
                .select('id, nome, descricao, valor_estimado')
                .in('id', prizeIds);

            if (prizesError) {
                console.error('Erro ao buscar prêmios:', prizesError);
            }

            // Buscar dados do usuário
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error('Erro ao buscar usuário:', userError);
            }

            // Mapear dados
            const prizesMap = new Map(prizes?.map(p => [p.id, p]) || []);

            return requests.map((req: any) => {
                const prize = prizesMap.get(req.premio_id);

                return {
                    id: req.id,
                    user_id: req.user_id,
                    user_name: user?.name || 'N/A',
                    user_email: user?.email || 'N/A',
                    prize_id: req.premio_id,
                    prize_name: prize?.nome || req.premio_nome || 'N/A',
                    prize_description: prize?.descricao || '',
                    prize_value: prize?.valor_estimado || req.premio_valor_estimado || 0,
                    campaign_id: req.campaign_id,
                    campaign_name: req.campaign_title || 'N/A',
                    quantity: req.quantidade || 1,
                    status: req.status || 'pending',
                    created_at: req.created_at,
                    updated_at: req.updated_at,
                    admin_notes: req.observacoes
                };
            });

        } catch (error) {
            console.error('Erro ao buscar pedidos do usuário:', error);
            return [];
        }
    }

    /**
     * Buscar todos os pedidos (para admin)
     */
    static async getAllRequests(): Promise<PrizeRequest[]> {
        try {
            // Buscar pedidos sem relacionamentos primeiro
            const { data: requests, error: requestsError } = await supabase
                .from('pedidos_premios')
                .select('*')
                .order('created_at', { ascending: false });

            if (requestsError) {
                console.error('Erro ao buscar pedidos:', requestsError);
                return [];
            }

            if (!requests || requests.length === 0) {
                return [];
            }

            // Buscar dados dos usuários
            const userIds = [...new Set(requests.map(r => r.user_id))];
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', userIds);

            if (usersError) {
                console.error('Erro ao buscar usuários:', usersError);
            }

            // Buscar dados dos prêmios
            const prizeIds = [...new Set(requests.map(r => r.premio_id))];
            const { data: prizes, error: prizesError } = await supabase
                .from('premios')
                .select('id, nome, descricao, valor_estimado')
                .in('id', prizeIds);

            if (prizesError) {
                console.error('Erro ao buscar prêmios:', prizesError);
            }

            // Mapear dados
            const usersMap = new Map(users?.map(u => [u.id, u]) || []);
            const prizesMap = new Map(prizes?.map(p => [p.id, p]) || []);

            return requests.map((req: any) => {
                const user = usersMap.get(req.user_id);
                const prize = prizesMap.get(req.premio_id);

                return {
                    id: req.id,
                    user_id: req.user_id,
                    user_name: user?.name || req.user_name || 'N/A',
                    user_email: user?.email || req.user_email || 'N/A',
                    prize_id: req.premio_id,
                    prize_name: prize?.nome || req.premio_nome || 'N/A',
                    prize_description: prize?.descricao || '',
                    prize_value: prize?.valor_estimado || req.premio_valor_estimado || 0,
                    campaign_id: req.campaign_id,
                    campaign_name: req.campaign_title || 'N/A',
                    quantity: req.quantidade || 1,
                    status: req.status || 'pending',
                    created_at: req.created_at,
                    updated_at: req.updated_at,
                    admin_notes: req.observacoes
                };
            });

        } catch (error) {
            console.error('Erro ao buscar todos os pedidos:', error);
            return [];
        }
    }

    /**
     * Aprovar pedido de prêmio
     */
    static async approveRequest(requestId: string, adminNotes?: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('pedidos_premios')
                .update({
                    status: 'approved',
                    observacoes: adminNotes || 'Pedido aprovado pelo administrador',
                    data_aprovacao: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) {
                console.error('Erro ao aprovar pedido:', error);
                return {
                    success: false,
                    message: 'Erro ao aprovar pedido'
                };
            }

            return {
                success: true,
                message: 'Pedido aprovado com sucesso!'
            };

        } catch (error) {
            console.error('Erro ao aprovar pedido:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }

    /**
     * Rejeitar pedido de prêmio
     */
    static async rejectRequest(requestId: string, adminNotes?: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('pedidos_premios')
                .update({
                    status: 'rejected',
                    observacoes: adminNotes || 'Pedido rejeitado pelo administrador',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) {
                console.error('Erro ao rejeitar pedido:', error);
                return {
                    success: false,
                    message: 'Erro ao rejeitar pedido'
                };
            }

            return {
                success: true,
                message: 'Pedido rejeitado'
            };

        } catch (error) {
            console.error('Erro ao rejeitar pedido:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }

    /**
     * Marcar pedido como entregue
     */
    static async markAsDelivered(requestId: string, adminNotes?: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('pedidos_premios')
                .update({
                    status: 'delivered',
                    observacoes: adminNotes || 'Prêmio entregue',
                    data_entrega: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) {
                console.error('Erro ao marcar como entregue:', error);
                return {
                    success: false,
                    message: 'Erro ao marcar como entregue'
                };
            }

            return {
                success: true,
                message: 'Pedido marcado como entregue!'
            };

        } catch (error) {
            console.error('Erro ao marcar como entregue:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }

    /**
     * Cancelar pedido (apenas para o usuário)
     */
    static async cancelRequest(requestId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Verificar se o pedido pertence ao usuário e está pendente
            const { data: request, error: checkError } = await supabase
                .from('pedidos_premios')
                .select('id, status')
                .eq('id', requestId)
                .eq('user_id', userId)
                .single();

            if (checkError || !request) {
                return {
                    success: false,
                    message: 'Pedido não encontrado'
                };
            }

            if (request.status !== 'pending') {
                return {
                    success: false,
                    message: 'Apenas pedidos pendentes podem ser cancelados'
                };
            }

            const { error } = await supabase
                .from('pedidos_premios')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) {
                console.error('Erro ao cancelar pedido:', error);
                return {
                    success: false,
                    message: 'Erro ao cancelar pedido'
                };
            }

            return {
                success: true,
                message: 'Pedido cancelado com sucesso!'
            };

        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }

    /**
     * Buscar estatísticas de pedidos
     */
    static async getRequestStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        delivered: number;
        cancelled: number;
    }> {
        try {
            const { data, error } = await supabase
                .from('pedidos_premios')
                .select('status');

            if (error) {
                console.error('Erro ao buscar estatísticas:', error);
                return {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    delivered: 0,
                    cancelled: 0
                };
            }

            const stats = {
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                approved: data.filter(r => r.status === 'approved').length,
                rejected: data.filter(r => r.status === 'rejected').length,
                delivered: data.filter(r => r.status === 'delivered').length,
                cancelled: data.filter(r => r.status === 'cancelled').length
            };

            return stats;

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                delivered: 0,
                cancelled: 0
            };
        }
    }
}
