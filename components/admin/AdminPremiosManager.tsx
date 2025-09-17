import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit, Trash2, Package, Eye, AlertTriangle, CheckCircle, X } from 'lucide-react';
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
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Removido - agora é chamado pelo useEffect de paginação

    const fetchPremios = async () => {
        try {
            console.log('Fetching premios...');
            
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

            console.log('Premios loaded successfully:', data);
            console.log('Premios count:', data?.length || 0);
            
            // Log detalhado para debug
            data?.forEach((premio, index) => {
                console.log(`Premio ${index + 1}:`, {
                    nome: premio.nome,
                    tipo_id: premio.tipo_id,
                    categoria_id: premio.categoria_id,
                    tipo_nome: premio.tipos_premios?.nome,
                    categoria_nome: premio.categorias_premios?.nome
                });
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



    const filteredPremios = premios.filter(premio =>
        premio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        premio.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (premio.tipos_premios?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (premio.categorias_premios?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gerenciar Prêmios</h2>
                    <p className="text-gray-600 mt-1">Gerencie o catálogo de prêmios da plataforma</p>
                </div>
                <button
                    onClick={handleNewPremio}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                    <Plus className="w-4 h-4" />
                    Novo Prêmio
                </button>
            </div>

            {/* Busca */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, descrição, tipo ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prêmio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo/Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Descrição
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPremios.map((premio) => {
                                return (
                                    <tr key={premio.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {premio.imagem_miniatura_url ? (
                                                    <img
                                                        src={premio.imagem_miniatura_url}
                                                        alt={premio.nome}
                                                        className="w-10 h-10 rounded-lg object-cover mr-3"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {premio.nome}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {premio.descricao}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {premio.tipos_premios?.nome || 'N/A'}
                                                </span>
                                                <div className="text-sm text-gray-500">
                                                    {premio.categorias_premios?.nome || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                R$ {premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 truncate max-w-xs">
                                                {premio.descricao}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => togglePremioStatus(premio)}
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                                    premio.is_ativo
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                            >
                                                {premio.is_ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditPremio(premio)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePremio(premio.id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredPremios.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">
                            {searchTerm ? 'Nenhum prêmio encontrado' : 'Nenhum prêmio cadastrado'}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            {searchTerm 
                                ? 'Tente ajustar os termos de busca' 
                                : 'Comece criando seu primeiro prêmio'
                            }
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={handleNewPremio}
                                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Prêmio
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Controles de Paginação */}
            <div className="bg-white border border-gray-200 rounded-lg mt-4 p-4">
                <div className="flex items-center justify-between">
                    {/* Informações de registros */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">
                            Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Por página:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    {/* Navegação de páginas */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &lt;&lt;
                        </button>
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &lt;
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &gt;
                        </button>
                        <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &gt;&gt;
                        </button>
                    </div>
                </div>
            </div>

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
