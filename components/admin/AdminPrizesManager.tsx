import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit, Trash2, Package, DollarSign, Calendar, Tag, Image, Award, CheckCircle, XCircle } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { currencyMaskFree } from '../../utils/masks';
import PrizeSidepanel from './PrizeSidepanel';

interface Prize {
    id: string;
    nome: string;
    descricao: string;
    valor_estimado: number;
    pontos_necessarios: number;
    categoria_id?: string;
    tipo_id?: string;
    imagem_url?: string;
    imagem_miniatura_url?: string;
    is_ativo: boolean;
    created_at: string;
    updated_at: string;
    categoria_nome?: string;
    tipo_nome?: string;
    conquistados_count: number;
    pedidos_count: number;
}

const AdminPrizesManager: React.FC = () => {
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedPrizes, setSelectedPrizes] = useState<string[]>([]);
    const [showSidepanel, setShowSidepanel] = useState(false);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    const fetchPrizes = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('premios')
                .select(`
                    id,
                    nome,
                    descricao,
                    valor_estimado,
                    pontos_necessarios,
                    categoria_id,
                    tipo_id,
                    imagem_url,
                    imagem_miniatura_url,
                    is_ativo,
                    created_at,
                    updated_at
                `)
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filterStatus !== 'all') {
                query = query.eq('is_ativo', filterStatus === 'active');
            }

            if (filterCategory !== 'all') {
                query = query.eq('categoria_id', filterCategory);
            }

            // Aplicar busca
            if (searchTerm) {
                query = query.or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Processar dados
            const processedPrizes = (data || []).map(prize => ({
                id: prize.id,
                nome: prize.nome,
                descricao: prize.descricao || '',
                valor_estimado: prize.valor_estimado,
                pontos_necessarios: prize.pontos_necessarios,
                categoria_id: prize.categoria_id,
                tipo_id: prize.tipo_id,
                imagem_url: prize.imagem_url || '',
                imagem_miniatura_url: prize.imagem_miniatura_url || prize.imagem_url || '',
                is_ativo: prize.is_ativo,
                created_at: prize.created_at,
                updated_at: prize.updated_at,
                categoria_nome: 'Sem categoria',
                tipo_nome: 'Sem tipo',
                conquistados_count: 0,
                pedidos_count: 0
            }));

            setPrizes(processedPrizes);
        } catch (err: any) {
            console.error('Erro ao buscar prêmios:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterStatus, filterCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            // Por enquanto, usar categorias mockadas
            setCategories([
                { id: '1', nome: 'Eletrônicos' },
                { id: '2', nome: 'Casa e Decoração' },
                { id: '3', nome: 'Experiências' },
                { id: '4', nome: 'Vale Presente' }
            ]);
        } catch (err: any) {
            console.error('Erro ao buscar categorias:', err);
        }
    }, []);

    useEffect(() => {
        fetchPrizes();
        fetchCategories();
    }, []);

    const handleDelete = async (prizeId: string) => {
        if (confirm('Tem certeza que deseja excluir este prêmio?')) {
            try {
                const { error } = await supabase
                    .from('premios')
                    .delete()
                    .eq('id', prizeId);

                if (error) throw error;

                await fetchPrizes();
            } catch (err: any) {
                alert('Erro ao excluir prêmio: ' + err.message);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPrizes.length === 0) {
            alert('Selecione pelo menos um prêmio para excluir');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir ${selectedPrizes.length} prêmio(s)?`)) {
            try {
                const { error } = await supabase
                    .from('premios')
                    .delete()
                    .in('id', selectedPrizes);

                if (error) throw error;

                setSelectedPrizes([]);
                await fetchPrizes();
            } catch (err: any) {
                alert('Erro ao excluir prêmios: ' + err.message);
            }
        }
    };

    const handleSelectAll = () => {
        if (selectedPrizes.length === prizes.length) {
            setSelectedPrizes([]);
        } else {
            setSelectedPrizes(prizes.map(prize => prize.id));
        }
    };

    const handleSelectPrize = (prizeId: string) => {
        if (selectedPrizes.includes(prizeId)) {
            setSelectedPrizes(selectedPrizes.filter(id => id !== prizeId));
        } else {
            setSelectedPrizes([...selectedPrizes, prizeId]);
        }
    };

    const handleCreatePrize = () => {
        setEditingPrize(null);
        setShowSidepanel(true);
    };

    const handleEditPrize = (prize: Prize) => {
        setEditingPrize(prize);
        setShowSidepanel(true);
    };

    const handleSidepanelClose = () => {
        setShowSidepanel(false);
        setEditingPrize(null);
    };

    const handleSidepanelSuccess = () => {
        fetchPrizes();
    };

    const getStatusBadge = (isAtivo: boolean) => {
        return isAtivo ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ativo
            </span>
        ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Inativo
            </span>
        );
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Paginação
    const totalPages = Math.ceil(prizes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPrizes = prizes.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1e293b]">Gerenciar Prêmios</h2>
                    <p className="text-gray-600 mt-1">Gerencie prêmios disponíveis para resgate</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCreatePrize}
                        className="bg-[#1e293b] hover:bg-[#49de80] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Prêmio
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Total de Prêmios</p>
                        <p className="text-2xl font-bold text-white">{prizes.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Prêmios Ativos</p>
                        <p className="text-2xl font-bold text-white">{prizes.filter(p => p.is_ativo).length}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Prêmios Inativos</p>
                        <p className="text-2xl font-bold text-white">{prizes.filter(p => !p.is_ativo).length}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="p-4 flex items-center justify-between rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#263245' }}>
                    <div>
                        <p className="text-sm text-white">Valor Total</p>
                        <p className="text-2xl font-bold text-white">
                            {currencyMaskFree(prizes.reduce((sum, prize) => sum + prize.valor_estimado, 0).toString())}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, descrição ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">Todas as Categorias</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.nome}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Ações em Lote */}
            {selectedPrizes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-800 font-medium">
                            {selectedPrizes.length} prêmio(s) selecionado(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4 inline mr-1" />
                                Excluir Selecionados
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
                                        checked={selectedPrizes.length === prizes.length && prizes.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prêmio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoria
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor/Pontos
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estatísticas
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cadastro
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentPrizes.map((prize) => (
                                <tr key={prize.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedPrizes.includes(prize.id)}
                                            onChange={() => handleSelectPrize(prize.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <SafeImage
                                                    src={prize.imagem_url}
                                                    alt={prize.nome}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    fallback={
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <span className="text-blue-600 font-medium text-sm">
                                                                {getInitials(prize.nome)}
                                                            </span>
                                                        </div>
                                                    }
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {prize.nome}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {prize.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900">
                                            {prize.categoria_nome ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {prize.categoria_nome}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Sem categoria</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900">
                                            <div className="font-medium">{currencyMaskFree(prize.valor_estimado.toString())}</div>
                                            <div className="text-gray-500">{prize.pontos_necessarios} pontos</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900">
                                            <div className="font-medium">{prize.conquistados_count} conquistados</div>
                                            <div className="text-gray-500">{prize.pedidos_count} pedidos</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(prize.is_ativo)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(prize.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditPrize(prize)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prize.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">
                            Mostrando {startIndex + 1} a {Math.min(endIndex, prizes.length)} de {prizes.length} registros
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Por página:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            &lt;&lt;
                        </button>
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            &lt;
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            &gt;
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            &gt;&gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidepanel */}
            <PrizeSidepanel
                isOpen={showSidepanel}
                onClose={handleSidepanelClose}
                onSuccess={handleSidepanelSuccess}
                prize={editingPrize}
            />
        </div>
    );
};

export default AdminPrizesManager;
