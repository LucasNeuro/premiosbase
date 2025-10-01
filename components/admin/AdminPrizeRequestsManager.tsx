import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PrizeRequestService, PrizeRequest } from '../../services/prizeRequestService';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    Eye, 
    User, 
    Trophy, 
    Calendar,
    Search,
    Filter,
    RefreshCw,
    AlertCircle
} from 'lucide-react';


const AdminPrizeRequestsManager: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PrizeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<PrizeRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Estados para seleção múltipla e paginação
    const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Buscar pedidos de prêmios
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const requests = await PrizeRequestService.getAllRequests();
            setRequests(requests);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Filtrar pedidos
    const filteredRequests = requests.filter(request => {
        const matchesSearch = 
            request.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.prize_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Paginação
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredRequests.slice(startIndex, endIndex);

    // Funções para seleção múltipla
    const handleSelectAll = () => {
        if (selectedRequests.length === currentRequests.length) {
            setSelectedRequests([]);
        } else {
            setSelectedRequests(currentRequests.map(request => request.id));
        }
    };

    const handleSelectRequest = (requestId: string) => {
        setSelectedRequests(prev => 
            prev.includes(requestId) 
                ? prev.filter(id => id !== requestId)
                : [...prev, requestId]
        );
    };

    // Aprovar pedido
    const approveRequest = async (requestId: string) => {
        try {
            setActionLoading(requestId);
            const result = await PrizeRequestService.approveRequest(requestId, adminNotes);
            
            if (result.success) {
                await fetchRequests();
                setShowModal(false);
                setAdminNotes('');
            }
        } catch (error) {
            console.error('Erro ao aprovar pedido:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Rejeitar pedido
    const rejectRequest = async (requestId: string) => {
        try {
            setActionLoading(requestId);
            const result = await PrizeRequestService.rejectRequest(requestId, adminNotes);
            
            if (result.success) {
                await fetchRequests();
                setShowModal(false);
                setAdminNotes('');
            }
        } catch (error) {
            console.error('Erro ao rejeitar pedido:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Marcar como entregue
    const markAsDelivered = async (requestId: string) => {
        try {
            setActionLoading(requestId);
            const result = await PrizeRequestService.markAsDelivered(requestId, adminNotes);
            
            if (result.success) {
                await fetchRequests();
                setShowModal(false);
                setAdminNotes('');
            }
        } catch (error) {
            console.error('Erro ao marcar como entregue:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return { 
                    label: 'Pendente', 
                    class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    icon: <Clock className="w-4 h-4" />
                };
            case 'approved':
                return { 
                    label: 'Aprovado', 
                    class: 'bg-blue-100 text-blue-800 border-blue-200',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'rejected':
                return { 
                    label: 'Rejeitado', 
                    class: 'bg-red-100 text-red-800 border-red-200',
                    icon: <XCircle className="w-4 h-4" />
                };
            case 'delivered':
                return { 
                    label: 'Entregue', 
                    class: 'bg-green-100 text-green-800 border-green-200',
                    icon: <Trophy className="w-4 h-4" />
                };
            default:
                return { 
                    label: 'Desconhecido', 
                    class: 'bg-gray-100 text-gray-800 border-gray-200',
                    icon: <AlertCircle className="w-4 h-4" />
                };
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#49de80]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1e293b]">Pedidos de Prêmios</h2>
                    <p className="text-gray-600 mt-1">Gerencie e aprove pedidos de resgate de prêmios</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchRequests}
                        className="bg-[#1e293b] hover:bg-[#49de80] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Pendentes</p>
                        <p className="text-2xl font-bold text-white">
                            {requests.filter(r => r.status === 'pending').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                </div>
                
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Aprovados</p>
                        <p className="text-2xl font-bold text-white">
                            {requests.filter(r => r.status === 'approved').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                </div>
                
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Entregues</p>
                        <p className="text-2xl font-bold text-white">
                            {requests.filter(r => r.status === 'delivered').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                </div>
                
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Rejeitados</p>
                        <p className="text-2xl font-bold text-white">
                            {requests.filter(r => r.status === 'rejected').length}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-white" />
                    </div>
                </div>
                
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Valor Total Premiado</p>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(
                                requests
                                    .filter(r => r.status === 'delivered')
                                    .reduce((sum, r) => sum + (r.prize_value * r.quantity), 0)
                            )}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por corretor, prêmio ou campanha..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#49de80] focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#49de80] focus:border-transparent"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="pending">Pendente</option>
                            <option value="approved">Aprovado</option>
                            <option value="rejected">Rejeitado</option>
                            <option value="delivered">Entregue</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Barra de Seleção Múltipla */}
            {selectedRequests.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                            {selectedRequests.length} pedido(s) selecionado(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    // Aprovar selecionados
                                    selectedRequests.forEach(id => {
                                        const request = requests.find(r => r.id === id);
                                        if (request && request.status === 'pending') {
                                            approveRequest(id);
                                        }
                                    });
                                    setSelectedRequests([]);
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Aprovar Selecionados
                            </button>
                            <button
                                onClick={() => {
                                    // Rejeitar selecionados
                                    selectedRequests.forEach(id => {
                                        const request = requests.find(r => r.id === id);
                                        if (request && request.status === 'pending') {
                                            rejectRequest(id);
                                        }
                                    });
                                    setSelectedRequests([]);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <XCircle className="w-4 h-4 inline mr-1" />
                                Rejeitar Selecionados
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabela */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedRequests.length === currentRequests.length && currentRequests.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Corretor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prêmio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Campanha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRequests.map((request) => {
                                const statusConfig = getStatusConfig(request.status);
                                
                                return (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRequests.includes(request.id)}
                                                onChange={() => handleSelectRequest(request.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-[#49de80] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {request.user_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.user_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {request.prize_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Qtd: {request.quantity}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-900">
                                                {request.campaign_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-green-600 font-semibold">
                                                {formatCurrency(request.prize_value * request.quantity)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.class}`}>
                                                {statusConfig.icon}
                                                <span className="ml-1">{statusConfig.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-500">
                                                {formatDate(request.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded"
                                                    title="Visualizar"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setShowModal(true);
                                                            }}
                                                            className="text-green-600 hover:text-green-700 transition-colors p-1 rounded"
                                                            title="Aprovar"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setShowModal(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 transition-colors p-1 rounded"
                                                            title="Rejeitar"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {request.status === 'approved' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded"
                                                        title="Marcar como Entregue"
                                                    >
                                                        <Trophy className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Informações de registros */}
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-gray-600">
                                Mostrando <span className="font-semibold text-gray-900">{Math.min(startIndex + 1, filteredRequests.length)}</span> a <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredRequests.length)}</span> de <span className="font-semibold text-gray-900">{filteredRequests.length}</span> pedidos
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Por página:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E293B] focus:border-transparent transition-all duration-200"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {/* Navegação de páginas */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &laquo;&laquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &laquo;
                            </button>
                            <span className="px-4 py-2 text-sm font-medium text-gray-700">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &raquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &raquo;&raquo;
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ações */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {selectedRequest.status === 'pending' ? 'Aprovar/Rejeitar Pedido' : 
                             selectedRequest.status === 'approved' ? 'Marcar como Entregue' : 
                             'Detalhes do Pedido'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Observações do Administrador
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Adicione observações sobre a decisão..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#49de80] focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setAdminNotes('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => rejectRequest(selectedRequest.id)}
                                        disabled={actionLoading === selectedRequest.id}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        {actionLoading === selectedRequest.id ? 'Rejeitando...' : 'Rejeitar'}
                                    </button>
                                    <button
                                        onClick={() => approveRequest(selectedRequest.id)}
                                        disabled={actionLoading === selectedRequest.id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        {actionLoading === selectedRequest.id ? 'Aprovando...' : 'Aprovar'}
                                    </button>
                                </>
                            )}
                            
                            {selectedRequest.status === 'approved' && (
                                <button
                                    onClick={() => markAsDelivered(selectedRequest.id)}
                                    disabled={actionLoading === selectedRequest.id}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading === selectedRequest.id ? 'Marcando...' : 'Marcar como Entregue'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPrizeRequestsManager;
