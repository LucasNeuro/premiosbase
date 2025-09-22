import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, Building, Shield, Eye, UserPlus, Users, Tag, Star, Crown, Target, TrendingUp, MapPin, Award, Grid, List, Filter, X } from 'lucide-react';
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
    cpds?: CpdInfo[];
}

interface CpdInfo {
    id: string;
    number: string;
    name: string;
    isActive: boolean;
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
    
    // Estados para gerenciamento de categorias
    const [activeTab, setActiveTab] = useState<'corretores' | 'categorias'>('corretores');
    const [categoriasViewMode, setCategoriasViewMode] = useState<'grid' | 'list'>('grid');
    const [categoriasSearchTerm, setCategoriasSearchTerm] = useState('');
    const [categoriasFilterStatus, setCategoriasFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

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

                    // Processar CPDs
                    let cpds: CpdInfo[] = [];
                    console.log('🔍 Processando CPDs para usuário:', user.name, 'CPD data:', user.cpd, 'Tipo:', typeof user.cpd);
                    
                    if (user.cpd) {
                        try {
                            // Se cpd é uma string JSON, fazer parse
                            let cpdData = user.cpd;
                            console.log('📊 CPD Data inicial:', cpdData);
                            
                            if (typeof cpdData === 'string') {
                                try {
                                    cpdData = JSON.parse(cpdData);
                                    console.log('✅ Parse JSON bem-sucedido:', cpdData);
                                } catch (e) {
                                    console.log('⚠️ Não é JSON válido, tratando como string simples');
                                    // Se não conseguir fazer parse, tratar como string simples (CPD único)
                                    cpds = [{
                                        id: '1',
                                        number: cpdData,
                                        name: `CPD ${cpdData}`,
                                        isActive: true
                                    }];
                                    console.log('📝 CPD simples criado:', cpds);
                                }
                            }

                            if (cpdData && typeof cpdData === 'object' && cpdData.cpds && Array.isArray(cpdData.cpds)) {
                                console.log('📋 CPDs encontrados no objeto:', cpdData.cpds);
                                // Filtrar apenas CPDs ativos
                                cpds = cpdData.cpds.filter((cpd: CpdInfo) => cpd.isActive);
                                console.log('✅ CPDs ativos filtrados:', cpds);
                            } else if (cpdData && typeof cpdData === 'object' && Array.isArray(cpdData)) {
                                console.log('📋 CPDs em array direto:', cpdData);
                                cpds = cpdData.filter((cpd: CpdInfo) => cpd.isActive);
                                console.log('✅ CPDs ativos do array direto:', cpds);
                            } else if (cpds.length === 0) {
                                console.log('⚠️ Fallback para CPD único');
                                // Fallback para CPD único
                                cpds = [{
                                    id: '1',
                                    number: typeof user.cpd === 'string' ? user.cpd : 'N/A',
                                    name: `CPD ${typeof user.cpd === 'string' ? user.cpd : 'N/A'}`,
                                    isActive: true
                                }];
                                console.log('📝 CPD fallback criado:', cpds);
                            }
                        } catch (error) {
                            console.error('❌ Erro ao processar CPDs:', error);
                            cpds = [{
                                id: '1',
                                number: 'Erro',
                                name: 'Erro ao carregar CPD',
                                isActive: false
                            }];
                        }
                    } else {
                        console.log('❌ Usuário sem CPD');
                    }
                    
                    console.log('🎯 CPDs finais para', user.name, ':', cpds);

                    return {
                        ...user,
                        policies_count,
                        total_revenue,
                        categorias,
                        cpds
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

    const filteredCategorias = categorias.filter(categoria => {
        const matchesSearch = categoria.nome.toLowerCase().includes(categoriasSearchTerm.toLowerCase()) ||
            categoria.descricao.toLowerCase().includes(categoriasSearchTerm.toLowerCase());
        
        const matchesStatus = categoriasFilterStatus === 'all' || 
            (categoriasFilterStatus === 'active' && categoria.is_ativo) ||
            (categoriasFilterStatus === 'inactive' && !categoria.is_ativo);
        
        return matchesSearch && matchesStatus;
    });

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

    const handleDeleteCategoria = async (categoriaId: string) => {
        if (confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
            try {
                // Primeiro, remover todas as associações de corretores com esta categoria
                await supabase
                    .from('corretores_categorias')
                    .delete()
                    .eq('categoria_id', categoriaId);

                // Depois, excluir a categoria
                const { error } = await supabase
                    .from('categorias_corretores')
                    .delete()
                    .eq('id', categoriaId);

                if (error) throw error;

                await fetchCategorias();
                await fetchUsers(); // Recarregar usuários para atualizar categorias
            } catch (error) {
                console.error('Error deleting categoria:', error);
                alert('Erro ao excluir categoria');
            }
        }
    };

    const handleToggleCategoriaStatus = async (categoria: CategoriaCorretor) => {
        try {
            const { error } = await supabase
                .from('categorias_corretores')
                .update({ is_ativo: !categoria.is_ativo })
                .eq('id', categoria.id);

            if (error) throw error;

            await fetchCategorias();
        } catch (error) {
            console.error('Error updating categoria status:', error);
            alert('Erro ao atualizar status da categoria');
        }
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
            {/* Header Moderno */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        Gerenciar Corretores
                    </h2>
                    <p className="text-gray-600 mt-2">Gerencie corretores e categorias da plataforma</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'corretores' && (
                    <button
                        onClick={handleNewUser}
                            className="bg-gradient-to-r from-[#49de80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <UserPlus className="w-4 h-4" />
                        Novo Corretor
                    </button>
                    )}
                    {activeTab === 'categorias' && (
                        <button
                            onClick={handleNewCategoria}
                            className="bg-gradient-to-r from-[#49de80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Categoria
                        </button>
                    )}
                </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('corretores')}
                    className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${
                        activeTab === 'corretores' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Corretores
                </button>
                <button
                    onClick={() => setActiveTab('categorias')}
                    className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${
                        activeTab === 'categorias' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Tag className="w-4 h-4" />
                    Categorias
                </button>
            </div>

            {/* Busca e Filtros */}
            {activeTab === 'corretores' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                        />
                    </div>
                </div>
            )}

            {activeTab === 'categorias' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Busca */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou descrição..."
                                    value={categoriasSearchTerm}
                                    onChange={(e) => setCategoriasSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                    />
                </div>
            </div>

                        {/* Filtros */}
                        <div className="flex flex-wrap gap-3">
                            {/* Filtro de Status */}
                            <select
                                value={categoriasFilterStatus}
                                onChange={(e) => setCategoriasFilterStatus(e.target.value as any)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-transparent transition-all duration-200"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="active">Ativas</option>
                                <option value="inactive">Inativas</option>
                            </select>
                            
                            {/* Controles de Visualização */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setCategoriasViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${
                                        categoriasViewMode === 'grid' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCategoriasViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${
                                        categoriasViewMode === 'list' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Estatísticas */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                                Mostrando <span className="font-semibold text-gray-900">{filteredCategorias.length}</span> de <span className="font-semibold text-gray-900">{categorias.length}</span> categorias
                            </span>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    {categorias.filter(c => c.is_ativo).length} Ativas
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    {categorias.filter(c => !c.is_ativo).length} Inativas
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Conteúdo Principal */}
            {activeTab === 'corretores' && (
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
                                                {user.cpds && user.cpds.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.cpds.map((cpd, index) => (
                                                            <span
                                                                key={cpd.id}
                                                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                                                    cpd.isActive 
                                                                        ? 'bg-blue-100 text-blue-800' 
                                                                        : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                                title={cpd.name}
                                                            >
                                                                <Shield className="w-3 h-3 mr-1" />
                                                                {cpd.number}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">
                                                        Sem CPD cadastrado
                                                    </span>
                                                )}
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
                                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                                                title="Editar usuário"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
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
            )}

            {/* Conteúdo de Categorias */}
            {activeTab === 'categorias' && (
                <>
                    {filteredCategorias.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Tag className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {categoriasSearchTerm || categoriasFilterStatus !== 'all' 
                                    ? 'Nenhuma categoria encontrada' 
                                    : 'Nenhuma categoria cadastrada'
                                }
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {categoriasSearchTerm || categoriasFilterStatus !== 'all'
                                    ? 'Tente ajustar os filtros ou termos de busca para encontrar o que procura'
                                    : 'Comece criando sua primeira categoria para organizar os corretores'
                                }
                            </p>
                            {!categoriasSearchTerm && categoriasFilterStatus === 'all' && (
                                <button
                                    onClick={handleNewCategoria}
                                    className="bg-gradient-to-r from-[#49de80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Criar Primeira Categoria
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Layout Grid */}
                            {categoriasViewMode === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredCategorias.map((categoria) => {
                                        const IconComponent = getIconComponent(categoria.icone);
                                        return (
                                            <div key={categoria.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    {/* Ícone da Categoria */}
                                                    <div className="relative">
                                                        <div 
                                                            className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg"
                                                            style={{ backgroundColor: categoria.cor }}
                                                        >
                                                            <IconComponent className="w-10 h-10 text-white" />
                                                        </div>
                                                        
                                                        {/* Status Badge */}
                                                        <div className="absolute -top-2 -right-2">
                                                            <button
                                                                onClick={() => handleToggleCategoriaStatus(categoria)}
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                                                                    categoria.is_ativo
                                                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                                                        : 'bg-gray-400 text-white hover:bg-gray-500'
                                                                }`}
                                                            >
                                                                {categoria.is_ativo ? '✓' : '✕'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Informações da Categoria */}
                                                    <div className="space-y-2 w-full">
                                                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                                            {categoria.nome}
                                                        </h3>
                                                        
                                                        <p className="text-sm text-gray-600 line-clamp-3">
                                                            {categoria.descricao || 'Sem descrição'}
                                                        </p>
                                                        
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div 
                                                                className="w-4 h-4 rounded-full border-2 border-gray-300"
                                                                style={{ backgroundColor: categoria.cor }}
                                                            ></div>
                                                            <span className="text-xs text-gray-500">{categoria.cor}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Ações */}
                                                    <div className="flex gap-2 w-full">
                                                        <button
                                                            onClick={() => handleEditCategoria(categoria)}
                                                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategoria(categoria.id)}
                                                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Layout Lista */}
                            {categoriasViewMode === 'list' && (
                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="divide-y divide-gray-200">
                                        {filteredCategorias.map((categoria) => {
                                            const IconComponent = getIconComponent(categoria.icone);
                                            return (
                                                <div key={categoria.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                                    <div className="flex items-center space-x-6">
                                                        {/* Ícone */}
                                                        <div className="flex-shrink-0">
                                                            <div 
                                                                className="w-16 h-16 rounded-lg flex items-center justify-center shadow-sm"
                                                                style={{ backgroundColor: categoria.cor }}
                                                            >
                                                                <IconComponent className="w-8 h-8 text-white" />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Informações */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                                    {categoria.nome}
                                                                </h3>
                                                                <button
                                                                    onClick={() => handleToggleCategoriaStatus(categoria)}
                                                                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                                                        categoria.is_ativo
                                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                                    }`}
                                                                >
                                                                    {categoria.is_ativo ? 'Ativa' : 'Inativa'}
                                                                </button>
                                                            </div>
                                                            
                                                            <p className="text-gray-600 mb-3 line-clamp-2">
                                                                {categoria.descricao || 'Sem descrição'}
                                                            </p>
                                                            
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div 
                                                                        className="w-4 h-4 rounded-full border-2 border-gray-300"
                                                                        style={{ backgroundColor: categoria.cor }}
                                                                    ></div>
                                                                    <span className="text-sm text-gray-500">{categoria.cor}</span>
                                                                </div>
                                                                
                                                                <div className="text-sm text-gray-500">
                                                                    Criada em: {formatDate(categoria.created_at)}
                                                                </div>
                                                            </div>
            </div>

                                                        {/* Ações */}
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleEditCategoria(categoria)}
                                                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                                title="Editar categoria"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategoria(categoria.id)}
                                                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                                title="Excluir categoria"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Controles de Paginação - Apenas para Corretores */}
            {activeTab === 'corretores' && (
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
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#49de80]"
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
            )}

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
