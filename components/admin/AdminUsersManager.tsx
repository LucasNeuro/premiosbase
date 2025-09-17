import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, Building, Shield, Eye, UserPlus, Users, Tag, Star, Crown, Target, TrendingUp, MapPin, Award } from 'lucide-react';
import AdminUsersSidepanel from './AdminUsersSidepanel';
import AdminCategoriasCorretoresSidepanel from './AdminCategoriasCorretoresSidepanel';
import AssignCategorySidepanel from './AssignCategorySidepanel';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    cnpj: string;
    cpd: any;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
    policies_count?: number;
    total_revenue?: number;
    categorias?: CategoriaCorretor[];
}

interface CategoriaCorretor {
    id: string;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    is_ativo: boolean;
    created_at: string;
    updated_at: string;
}

const AdminUsersManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [categorias, setCategorias] = useState<CategoriaCorretor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidepanel, setShowSidepanel] = useState(false);
    const [showCategoriasSidepanel, setShowCategoriasSidepanel] = useState(false);
    const [showAssignSidepanel, setShowAssignSidepanel] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingCategoria, setEditingCategoria] = useState<CategoriaCorretor | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    
    // Estados para paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchUsers = async () => {
        try {
            // Calcular offset para paginação
            const offset = (currentPage - 1) * itemsPerPage;
            
            // Buscar usuários com paginação
            const { data: usersData, error: usersError, count } = await supabase
                .from('users')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + itemsPerPage - 1);

            if (usersError) {
                console.error('Error fetching users:', usersError);
                return;
            }

            // Buscar estatísticas e categorias de cada usuário
            const usersWithStats = await Promise.all(
                usersData.map(async (user) => {
                    // Buscar estatísticas
                    const { data: policiesData } = await supabase
                        .from('policies')
                        .select('premium_value')
                        .eq('user_id', user.id);

                    const policies_count = policiesData?.length || 0;
                    const total_revenue = policiesData?.reduce((sum, p) => sum + Number(p.premium_value), 0) || 0;

                    // Buscar categorias
                    const { data: categoriasData } = await supabase
                        .from('corretores_categorias')
                        .select(`
                            categorias_corretores!categoria_id (
                                id,
                                nome,
                                descricao,
                                cor,
                                icone,
                                is_ativo
                            )
                        `)
                        .eq('corretor_id', user.id);

                    const categorias = categoriasData?.map(item => item.categorias_corretores).filter(Boolean) || [];

                    return {
                        ...user,
                        policies_count,
                        total_revenue,
                        categorias
                    };
                })
            );

            setUsers(usersWithStats);
            setTotalItems(count || 0);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // useEffect para recarregar quando a página ou itens por página mudarem
    useEffect(() => {
        fetchUsers();
    }, [currentPage, itemsPerPage]);

    const fetchCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias_corretores')
                .select('*')
                .eq('is_ativo', true)
                .order('nome');

            if (error) {
                console.error('Error fetching categorias:', error);
                return;
            }

            setCategorias(data || []);
        } catch (error) {
            console.error('Error fetching categorias:', error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cnpj.includes(searchTerm)
    );

    const handleSave = () => {
        setShowSidepanel(false);
        setEditingUser(null);
        fetchUsers();
    };

    const handleCategoriasSave = () => {
        setShowCategoriasSidepanel(false);
        setEditingCategoria(null);
        fetchCategorias();
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(user => user.id));
        }
        setSelectAll(!selectAll);
    };

    const handleNewCategoria = () => {
        setEditingCategoria(null);
        setShowCategoriasSidepanel(true);
    };

    const handleEditCategoria = (categoria: CategoriaCorretor) => {
        setEditingCategoria(categoria);
        setShowCategoriasSidepanel(true);
    };

    const handleAssignCategory = () => {
        if (selectedUsers.length === 0) {
            alert('Selecione pelo menos um corretor');
            return;
        }
        setShowAssignSidepanel(true);
    };

    const handleAssignSave = () => {
        setShowAssignSidepanel(false);
        setSelectedUsers([]);
        setSelectAll(false);
        fetchUsers(); // Recarregar dados se necessário
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowSidepanel(true);
    };

    const handleDelete = async (userId: string) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', userId);

                if (error) throw error;

                await fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Erro ao excluir usuário');
            }
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleNewUser = () => {
        setEditingUser(null);
        setShowSidepanel(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getIconComponent = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            'Users': User,
            'Star': Star,
            'Crown': Crown,
            'Target': Target,
            'TrendingUp': TrendingUp,
            'MapPin': MapPin,
            'Shield': Shield,
            'Award': Award
        };
        return iconMap[iconName] || User;
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

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gerenciar Corretores</h2>
                    <p className="text-gray-600 mt-1">Gerencie todos os corretores da plataforma</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleNewCategoria}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                    >
                        <Tag className="w-4 h-4" />
                        Categorias
                    </button>
                    <button
                        onClick={handleNewUser}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                    >
                        <UserPlus className="w-4 h-4" />
                        Novo Corretor
                    </button>
                </div>
            </div>

            {/* Busca */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>


            {/* Tabela de Usuários */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Corretor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contato
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CNPJ/CPD
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estatísticas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categorias
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cadastro
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleSelectUser(user.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm text-gray-900 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {user.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm text-gray-900">{user.cnpj}</div>
                                            <div className="text-sm text-gray-500">
                                                CPD: {typeof user.cpd === 'string' ? user.cpd : 'Múltiplos'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm text-gray-900">
                                                {user.policies_count || 0} apólices
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {formatCurrency(user.total_revenue || 0)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {user.categorias && user.categorias.length > 0 ? (
                                                user.categorias.map((categoria) => {
                                                    const IconComponent = getIconComponent(categoria.icone);
                                                    return (
                                                        <span
                                                            key={categoria.id}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-white"
                                                            style={{ backgroundColor: categoria.cor }}
                                                            title={categoria.descricao}
                                                        >
                                                            <IconComponent className="w-3 h-3" />
                                                            {categoria.nome}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">
                                                    Sem categoria
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.is_admin 
                                                ? 'bg-red-100 text-red-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {user.is_admin ? 'Admin' : 'Corretor'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                title="Editar usuário"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                title="Excluir usuário"
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

                {/* Barra de ações para usuários selecionados */}
                {selectedUsers.length > 0 && (
                    <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">
                                    {selectedUsers.length} corretor(es) selecionado(s)
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAssignCategory}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                    <Tag className="w-3 h-3" />
                                    Atribuir Categoria
                                </button>
                                <button
                                    onClick={() => setSelectedUsers([])}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                >
                                    Limpar Seleção
                                </button>
                            </div>
                        </div>
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

            {/* Sidepanel de Usuários */}
            {showSidepanel && (
                <AdminUsersSidepanel
                    user={editingUser}
                    onClose={() => {
                        setShowSidepanel(false);
                        setEditingUser(null);
                    }}
                    onSave={handleSave}
                />
            )}

            {/* Sidepanel de Categorias */}
            {showCategoriasSidepanel && (
                <AdminCategoriasCorretoresSidepanel
                    categoria={editingCategoria}
                    onClose={() => {
                        setShowCategoriasSidepanel(false);
                        setEditingCategoria(null);
                    }}
                    onSave={handleCategoriasSave}
                />
            )}

            {/* Sidepanel de Atribuir Categoria */}
            {showAssignSidepanel && (
                <AssignCategorySidepanel
                    selectedUsers={users.filter(user => selectedUsers.includes(user.id))}
                    onClose={() => setShowAssignSidepanel(false)}
                    onSave={handleAssignSave}
                />
            )}
        </div>
    );
};

export default AdminUsersManager;
