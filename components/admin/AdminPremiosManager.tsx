import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit, Trash2, Package, Eye, AlertTriangle, CheckCircle, X, Filter, Grid, List, Star, Award } from 'lucide-react';
import AdminPremiosSidepanel from './AdminPremiosSidepanel';

interface Premio {
    id: string;
    nome: string;
    descricao: string;
    tipo_id: string;
    categoria_id: string;
    valor_estimado: number;
    imagem_url?: string;
    imagem_miniatura_url?: string;
    is_ativo: boolean;
    created_at: string;
    updated_at: string;
    // Dados relacionados (joins)
    tipos_premios?: {
        nome: string;
    };
    categorias_premios?: {
        nome: string;
    };
}

const AdminPremiosManager: React.FC = () => {
    const [premios, setPremios] = useState<Premio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidepanel, setShowSidepanel] = useState(false);
    const [editingPremio, setEditingPremio] = useState<Premio | null>(null);
    
    // Estados para paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalItems, setTotalItems] = useState(0);
    
    // Estados para layout moderno
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Removido - agora é chamado pelo useEffect de paginação

    const fetchPremios = async () => {
        try {
            // Calcular offset para paginação
            const offset = (currentPage - 1) * itemsPerPage;
            
            const { data, error, count } = await supabase
                .from('premios')
                .select(`
                    *,
                    tipos_premios!premios_tipo_id_fkey(nome),
                    categorias_premios!premios_categoria_id_fkey(nome)
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + itemsPerPage - 1);

            if (error) {
                console.error('Error fetching premios:', error);
                console.error('Error details:', error.message, error.details, error.hint);
                return;
            }

            // Log detalhado para debug
            data?.forEach((premio, index) => {
                });
            
            setPremios(data || []);
            setTotalItems(count || 0);
        } catch (error) {
            console.error('Error in fetchPremios:', error);
        } finally {
            setLoading(false);
        }
    };

    // useEffect para recarregar quando a página ou itens por página mudarem
    useEffect(() => {
        fetchPremios();
    }, [currentPage, itemsPerPage]);

    const handleNewPremio = () => {
        setEditingPremio(null);
        setShowSidepanel(true);
    };

    const handleEditPremio = (premio: Premio) => {
        setEditingPremio(premio);
        setShowSidepanel(true);
    };

    const handleDeletePremio = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este prêmio?')) return;

        try {
            const { error } = await supabase
                .from('premios')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting premio:', error);
                return;
            }

            fetchPremios();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Funções de paginação
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };
    
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset para primeira página
    };
    
    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

    const togglePremioStatus = async (premio: Premio) => {
        try {
            const { error } = await supabase
                .from('premios')
                .update({ is_ativo: !premio.is_ativo })
                .eq('id', premio.id);

            if (error) {
                console.error('Error updating premio status:', error);
                return;
            }

            fetchPremios();
        } catch (error) {
            console.error('Error:', error);
        }
    };



    const filteredPremios = premios.filter(premio => {
        // Filtro de busca
        const matchesSearch = premio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        premio.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (premio.tipos_premios?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (premio.categorias_premios?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro de status
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && premio.is_ativo) ||
            (filterStatus === 'inactive' && !premio.is_ativo);
        
        // Filtro de categoria
        const matchesCategory = filterCategory === 'all' || 
            premio.categorias_premios?.nome === filterCategory;
        
        // Filtro de tipo
        const matchesType = filterType === 'all' || 
            premio.tipos_premios?.nome === filterType;
        
        return matchesSearch && matchesStatus && matchesCategory && matchesType;
    });

    // Componente de Skeleton para cards
    const SkeletonCard = () => (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
                </div>
                <div className="flex gap-2 w-full">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
            </div>
        </div>
    );

    // Componente de Skeleton para lista
    const SkeletonList = () => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>

                {/* Filters Skeleton */}
                <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>

                {/* Content Skeleton */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonList key={i} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header Moderno */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                        </div>
                        Gerenciar Prêmios
                    </h2>
                    <p className="text-gray-600 mt-2">Gerencie o catálogo de prêmios da plataforma</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Controles de Visualização */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${
                                viewMode === 'grid' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${
                                viewMode === 'list' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    
                <button
                    onClick={handleNewPremio}
                        className="bg-gradient-to-r from-[#49de80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Novo Prêmio
                </button>
                </div>
            </div>

            {/* Busca e Filtros Modernos */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
                    <div className="flex-1">
                <div className="relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, descrição, tipo ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                    
                    {/* Filtros */}
                    <div className="flex flex-wrap gap-3">
                        {/* Filtro de Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="active">Ativos</option>
                            <option value="inactive">Inativos</option>
                        </select>
                        
                        {/* Filtro de Categoria */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                        >
                            <option value="all">Todas as Categorias</option>
                            {Array.from(new Set(premios.map(p => p.categorias_premios?.nome).filter(Boolean))).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        
                        {/* Filtro de Tipo */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                        >
                            <option value="all">Todos os Tipos</option>
                            {Array.from(new Set(premios.map(p => p.tipos_premios?.nome).filter(Boolean))).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Estatísticas */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Mostrando <span className="font-semibold text-gray-900">{filteredPremios.length}</span> de <span className="font-semibold text-gray-900">{totalItems}</span> prêmios
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                {premios.filter(p => p.is_ativo).length} Ativos
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                {premios.filter(p => !p.is_ativo).length} Inativos
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            {filteredPremios.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterType !== 'all' 
                            ? 'Nenhum prêmio encontrado' 
                            : 'Nenhum prêmio cadastrado'
                        }
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterType !== 'all'
                            ? 'Tente ajustar os filtros ou termos de busca para encontrar o que procura'
                            : 'Comece criando seu primeiro prêmio para a plataforma'
                        }
                    </p>
                    {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && filterType === 'all' && (
                        <button
                            onClick={handleNewPremio}
                            className="bg-gradient-to-r from-[#49de80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Primeiro Prêmio
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Layout Grid */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPremios.map((premio) => (
                                <div key={premio.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        {/* Imagem do Prêmio */}
                                        <div className="relative">
                                                {premio.imagem_miniatura_url ? (
                                                    <img
                                                        src={premio.imagem_miniatura_url}
                                                        alt={premio.nome}
                                                    className="w-24 h-24 object-cover rounded-xl shadow-lg"
                                                    />
                                                ) : (
                                                <div className="w-24 h-24 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-xl flex items-center justify-center shadow-lg">
                                                    <Award className="w-12 h-12 text-white" />
                                                </div>
                                            )}
                                            
                                            {/* Status Badge */}
                                            <div className="absolute -top-2 -right-2">
                                                <button
                                                    onClick={() => togglePremioStatus(premio)}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                                                        premio.is_ativo
                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                            : 'bg-gray-400 text-white hover:bg-gray-500'
                                                    }`}
                                                >
                                                    {premio.is_ativo ? '✓' : '✕'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Informações do Prêmio */}
                                        <div className="space-y-2 w-full">
                                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                                {premio.nome}
                                            </h3>
                                            
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {premio.tipos_premios?.nome || 'N/A'}
                                                </span>
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                    {premio.categorias_premios?.nome || 'N/A'}
                                                </span>
                                            </div>
                                            
                                            <div className="text-2xl font-bold text-green-600">
                                                R$ {premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {premio.descricao}
                                            </p>
                                            </div>
                                        
                                        {/* Ações */}
                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={() => handleEditPremio(premio)}
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeletePremio(premio.id)}
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Layout Lista */}
                    {viewMode === 'list' && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {filteredPremios.map((premio) => (
                                    <div key={premio.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="flex items-center space-x-6">
                                            {/* Imagem */}
                                            <div className="flex-shrink-0">
                                                {premio.imagem_miniatura_url ? (
                                                    <img
                                                        src={premio.imagem_miniatura_url}
                                                        alt={premio.nome}
                                                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-lg flex items-center justify-center shadow-sm">
                                                        <Award className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Informações */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                        {premio.nome}
                                                    </h3>
                                            <button
                                                onClick={() => togglePremioStatus(premio)}
                                                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                                    premio.is_ativo
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                }`}
                                            >
                                                {premio.is_ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                                </div>
                                                
                                                <p className="text-gray-600 mb-3 line-clamp-2">
                                                    {premio.descricao}
                                                </p>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-2">
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                            {premio.tipos_premios?.nome || 'N/A'}
                                                        </span>
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                            {premio.categorias_premios?.nome || 'N/A'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="text-lg font-bold text-green-600">
                                                        R$ {premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Ações */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditPremio(premio)}
                                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePremio(premio.id)}
                                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                </div>
                    </div>
                )}
                </>
            )}

            {/* Paginação Moderna */}
            {totalPages > 1 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Informações de registros */}
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-gray-600">
                                Mostrando <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> a <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-semibold text-gray-900">{totalItems}</span> prêmios
                        </span>
                        <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Por página:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                                >
                                    <option value={6}>6</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={48}>48</option>
                            </select>
                        </div>
                    </div>

                    {/* Navegação de páginas */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            &lt;&lt;
                        </button>
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            &lt;
                        </button>
                            
                            {/* Páginas */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                currentPage === pageNum
                                                    ? 'bg-[#49de80] text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            &gt;
                        </button>
                        <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            &gt;&gt;
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* Sidepanel */}
            {showSidepanel && (
                <AdminPremiosSidepanel
                    premio={editingPremio}
                    onClose={() => {
                        setShowSidepanel(false);
                        setEditingPremio(null);
                    }}
                    onSave={() => {
                        setShowSidepanel(false);
                        setEditingPremio(null);
                        fetchPremios();
                    }}
                />
            )}
        </div>
    );
};

export default AdminPremiosManager;
