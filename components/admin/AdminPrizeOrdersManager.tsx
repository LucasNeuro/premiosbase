import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, CheckCircle, XCircle, Clock, Truck, Package, User, Calendar, DollarSign, Eye, MoreVertical } from 'lucide-react';
import DateRangePicker from '../ui/DateRangePicker';

interface PrizeOrder {
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
    // Dados do usuário
    user_name?: string;
    user_email?: string;
    user_phone?: string;
    // Dados do aprovador
    aprovador_name?: string;
}

const AdminPrizeOrdersManager: React.FC = () => {
    const [orders, setOrders] = useState<PrizeOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [filteredOrders, setFilteredOrders] = useState<PrizeOrder[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, filters]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('pedidos_premios')
                .select(`
                    *,
                    user:users!pedidos_premios_user_id_fkey(name, email, phone),
                    aprovador:users!pedidos_premios_aprovado_por_fkey(name)
                `)
                .order('data_solicitacao', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
                return;
            }

            const processedOrders = data?.map(order => ({
                ...order,
                user_name: order.user?.name,
                user_email: order.user?.email,
                user_phone: order.user?.phone,
                aprovador_name: order.aprovador?.name
            })) || [];

            setOrders(processedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...orders];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(order =>
                order.premio_nome.toLowerCase().includes(searchLower) ||
                order.campaign_title.toLowerCase().includes(searchLower) ||
                order.user_name?.toLowerCase().includes(searchLower) ||
                order.user_email?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.status) {
            filtered = filtered.filter(order => order.status === filters.status);
        }

        if (filters.startDate) {
            filtered = filtered.filter(order => 
                new Date(order.data_solicitacao) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            filtered = filtered.filter(order => 
                new Date(order.data_solicitacao) <= new Date(filters.endDate)
            );
        }

        setFilteredOrders(filtered);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string, observacoes?: string) => {
        try {
            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (newStatus === 'approved' || newStatus === 'delivered') {
                updateData.data_aprovacao = new Date().toISOString();
            }

            if (newStatus === 'delivered') {
                updateData.data_entrega = new Date().toISOString();
            }

            if (observacoes) {
                updateData.observacoes = observacoes;
            }

            const { error } = await supabase
                .from('pedidos_premios')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            await fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Erro ao atualizar status do pedido');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-orange-600" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'delivered':
                return <Truck className="w-4 h-4 text-blue-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-gray-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'delivered':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendente';
            case 'approved':
                return 'Aprovado';
            case 'rejected':
                return 'Rejeitado';
            case 'delivered':
                return 'Entregue';
            case 'cancelled':
                return 'Cancelado';
            default:
                return status;
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const updateSearch = (value: string) => {
        setFilters(prev => ({ ...prev, search: value }));
    };

    const updateStatusFilter = (value: string) => {
        setFilters(prev => ({ ...prev, status: value }));
    };

    const updateDateRange = (startDate: string, endDate: string) => {
        setFilters(prev => ({
            ...prev,
            startDate,
            endDate
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            startDate: '',
            endDate: ''
        });
    };

    // Estatísticas
    const stats = {
        total: filteredOrders.length,
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        approved: filteredOrders.filter(o => o.status === 'approved').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        totalValue: filteredOrders.reduce((sum, o) => sum + o.valor_total, 0)
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        Gestão de Retirada de Prêmios
                    </h2>
                    <p className="text-gray-600 mt-2">Gerencie os pedidos de resgate de prêmios dos corretores</p>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Pedidos</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pendentes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Aprovados</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Entregues</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Busca */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por prêmio, campanha ou corretor..."
                                value={filters.search}
                                onChange={(e) => updateSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                    
                    {/* Filtros */}
                    <div className="flex flex-wrap gap-3">
                        {/* Filtro de Status */}
                        <select
                            value={filters.status}
                            onChange={(e) => updateStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                        >
                            <option value="">Todos os Status</option>
                            <option value="pending">Pendente</option>
                            <option value="approved">Aprovado</option>
                            <option value="rejected">Rejeitado</option>
                            <option value="delivered">Entregue</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                        
                        {/* Filtro de Período */}
                        <div className="w-72">
                            <DateRangePicker
                                startDate={filters.startDate}
                                endDate={filters.endDate}
                                onChange={updateDateRange}
                                placeholder="Selecionar período"
                                className="w-full"
                            />
                        </div>

                        {/* Limpar Filtros */}
                        <button
                            onClick={clearFilters}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Limpar
                        </button>
                    </div>
                </div>
                
                {/* Estatísticas dos Filtros */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Mostrando <span className="font-semibold text-gray-900">{filteredOrders.length}</span> de <span className="font-semibold text-gray-900">{orders.length}</span> pedidos
                        </span>
                    </div>
                </div>
            </div>

            {/* Lista de Pedidos em Cards */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pedidos de Resgate</h3>
                
                {filteredOrders.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                        <p className="text-gray-600">Não há pedidos que correspondam aos filtros selecionados.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    {/* Informações do Pedido */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Truck className="w-5 h-5 text-blue-600" />
                                            <h4 className="text-lg font-semibold text-gray-900">{order.premio_nome}</h4>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <p><span className="font-medium">Campanha:</span> {order.campaign_title}</p>
                                            <p><span className="font-medium">Corretor:</span> {order.user_name} ({order.user_email})</p>
                                            <div className="flex items-center gap-4">
                                                <span><span className="font-medium">Quantidade:</span> {order.quantidade}</span>
                                                <span><span className="font-medium">Valor:</span> {formatCurrency(order.valor_total)}</span>
                                                <span><span className="font-medium">Data:</span> {formatDate(order.data_solicitacao)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-2 ml-4">
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'approved')}
                                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Aprovar"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'rejected')}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Rejeitar"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'approved' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Marcar como Entregue"
                                            >
                                                <Truck className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {/* TODO: Implementar visualização de detalhes */}}
                                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                                            title="Ver Detalhes"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPrizeOrdersManager;