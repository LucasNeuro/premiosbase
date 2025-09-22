import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Download, Eye, Trash2, Calendar, User, FileText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import DynamicTable from '../ui/DynamicTable';
import ConfirmationModal from '../ui/ConfirmationModal';
import TicketTag from '../ui/TicketTag';
import DateRangePicker from '../ui/DateRangePicker';
import SalesReportGenerator from './SalesReportGenerator';

interface AdminPolicy {
    id: string;
    user_id: string;
    policy_number: string;
    type: string;
    premium_value: number;
    registration_date: string;
    ticket_code: string;
    contract_type: string;
    city?: string;
    original_policy_id?: string;
    cpd_number?: string;
    created_at: string;
    updated_at: string;
    user_name: string;
    user_email: string;
    user_cnpj?: string;
    user_phone?: string;
}

const AdminPoliciesTable: React.FC = () => {
    const [policies, setPolicies] = useState<AdminPolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        policy: AdminPolicy | null;
    }>({
        isOpen: false,
        policy: null
    });

    const [showReportGenerator, setShowReportGenerator] = useState(false);

    // Estados para filtros
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        contractType: '',
        startDate: '',
        endDate: ''
    });
    const [filteredPolicies, setFilteredPolicies] = useState<AdminPolicy[]>([]);

    useEffect(() => {
        fetchAllPolicies();
        
        // Configurar atualização em tempo real
        const policiesSubscription = supabase
            .channel('policies_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'policies' 
                }, 
                (payload) => {
                    fetchAllPolicies(); // Recarregar dados quando houver mudanças
                }
            )
            .subscribe();

        return () => {
            policiesSubscription.unsubscribe();
        };
    }, []);

    // Efeito para aplicar filtros
    useEffect(() => {
        let filtered = [...policies];

        // Filtro de busca
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(policy => 
                policy.policy_number.toLowerCase().includes(searchLower) ||
                policy.user_name.toLowerCase().includes(searchLower) ||
                policy.user_email.toLowerCase().includes(searchLower) ||
                policy.cpd_number?.toLowerCase().includes(searchLower) ||
                policy.ticket_code?.toLowerCase().includes(searchLower)
            );
        }

        // Filtro por tipo
        if (filters.type) {
            filtered = filtered.filter(policy => policy.type === filters.type);
        }

        // Filtro por tipo de contrato
        if (filters.contractType) {
            filtered = filtered.filter(policy => policy.contract_type === filters.contractType);
        }

        // Filtro por data
        if (filters.startDate) {
            filtered = filtered.filter(policy => 
                new Date(policy.registration_date) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            filtered = filtered.filter(policy => 
                new Date(policy.registration_date) <= new Date(filters.endDate)
            );
        }

        setFilteredPolicies(filtered);
    }, [policies, filters]);

    const fetchAllPolicies = async () => {
        try {
            // Buscar policies sem join primeiro
            const { data: policiesData, error: policiesError } = await supabase
                .from('policies')
                .select('*')
                .order('created_at', { ascending: false });

            if (policiesError) {
                alert('Erro ao carregar apólices: ' + policiesError.message);
                return;
            }

            if (!policiesData || policiesData.length === 0) {
                setPolicies([]);
                return;
            }

            // Buscar usuários separadamente
            const userIds = [...new Set(policiesData.map(p => p.user_id))];
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, name, email, cnpj, phone')
                .in('id', userIds);

            if (usersError) {
                alert('Erro ao carregar usuários: ' + usersError.message);
                return;
            }

            // Criar mapa de usuários
            const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

            // Combinar dados
            const formattedPolicies = policiesData.map(policy => {
                const user = usersMap.get(policy.user_id);
                return {
                    ...policy,
                    user_name: user?.name || 'Usuário não encontrado',
                    user_email: user?.email || 'N/A',
                    user_cnpj: user?.cnpj || 'N/A',
                    user_phone: user?.phone || 'N/A'
                };
            });

            setPolicies(formattedPolicies);
        } catch (error) {
            alert('Erro ao carregar apólices');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (policy: AdminPolicy) => {
        setDeleteModal({
            isOpen: true,
            policy: policy
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.policy) return;
        
        try {
            const { error } = await supabase
                .from('policies')
                .delete()
                .eq('id', deleteModal.policy.id);

            if (error) throw error;

            await fetchAllPolicies();
            setDeleteModal({ isOpen: false, policy: null });
        } catch (error) {
            alert('Erro ao excluir apólice');
        }
    };

    const handleCloseModal = () => {
        setDeleteModal({ isOpen: false, policy: null });
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Funções para atualizar filtros
    const updateSearch = (search: string) => {
        setFilters(prev => ({ ...prev, search }));
    };

    const updateTypeFilter = (type: string) => {
        setFilters(prev => ({ ...prev, type }));
    };

    const updateContractTypeFilter = (contractType: string) => {
        setFilters(prev => ({ ...prev, contractType }));
    };

    const updateDateRange = (startDate: string, endDate: string) => {
        setFilters(prev => ({ ...prev, startDate, endDate }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            contractType: '',
            startDate: '',
            endDate: ''
        });
    };

    // Definir colunas da tabela
    const columns: ColumnDef<AdminPolicy>[] = [
        {
            accessorKey: 'policy_number',
            header: () => <div className="text-left">Número da Apólice</div>,
            cell: ({ row }) => (
                <div className="font-medium text-gray-900 text-left min-w-[120px]">
                    {row.getValue('policy_number')}
                </div>
            ),
        },
        {
            accessorKey: 'user_name',
            header: () => <div className="text-left">Corretor</div>,
            cell: ({ row }) => (
                <div className="text-left min-w-[250px]">
                    <div className="font-medium text-gray-900">{row.getValue('user_name')}</div>
                    <div className="text-sm text-gray-500">{row.original.user_email}</div>
                    <div className="text-xs text-gray-400">CNPJ: {row.original.user_cnpj}</div>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: () => <div className="text-left">Tipo</div>,
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                return (
                    <div className="text-left min-w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            type === 'Seguro Auto' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                        }`}>
                            {type === 'Seguro Auto' ? 'Auto' : 'Residencial'}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'premium_value',
            header: () => <div className="text-left">Valor do Prêmio</div>,
            cell: ({ row }) => (
                <div className="font-semibold text-gradient text-left min-w-[140px]">
                    {formatCurrency(row.getValue('premium_value'))}
                </div>
            ),
        },
        {
            accessorKey: 'contract_type',
            header: () => <div className="text-left">Contrato</div>,
            cell: ({ row }) => {
                const contract = row.getValue('contract_type') as string;
                return (
                    <div className="text-left min-w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contract === 'Novo' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-orange-100 text-orange-800'
                        }`}>
                            {contract}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'registration_date',
            header: () => <div className="text-left">Data de Registro</div>,
            cell: ({ row }) => (
                <div className="text-gray-600 text-left min-w-[120px]">
                    {formatDate(row.getValue('registration_date'))}
                </div>
            ),
        },
        {
            accessorKey: 'ticket_code',
            header: () => <div className="text-left">Ticket</div>,
            cell: ({ row }) => (
                <div className="text-left min-w-[80px]">
                    <TicketTag ticketCode={row.getValue('ticket_code')} />
                </div>
            ),
        },
        {
            accessorKey: 'user_phone',
            header: () => <div className="text-left">Telefone</div>,
            cell: ({ row }) => (
                <div className="text-gray-600 text-left text-sm min-w-[130px]">
                    {row.original.user_phone || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'cpd_number',
            header: () => <div className="text-left">CPD</div>,
            cell: ({ row }) => (
                <div className="text-gray-600 text-left text-sm min-w-[80px]">
                    {row.original.cpd_number || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'city',
            header: () => <div className="text-left">Cidade</div>,
            cell: ({ row }) => (
                <div className="text-gray-600 text-left text-sm min-w-[100px]">
                    {row.original.city || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: () => <div className="text-left">Status</div>,
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <div className="text-left min-w-[80px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {status === 'active' ? 'Ativo' : 'Cancelado'}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: () => <div className="text-left">Criado em</div>,
            cell: ({ row }) => (
                <div className="text-gray-600 text-left text-sm min-w-[120px]">
                    {formatDate(row.getValue('created_at'))}
                </div>
            ),
        },
        {
            accessorKey: 'updated_at',
            header: () => <div className="text-left">Atualizado em</div>,
            cell: ({ row }) => (
                <div className="text-gray-600 text-left text-sm min-w-[120px]">
                    {formatDate(row.getValue('updated_at'))}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-left">Ações</div>,
            cell: ({ row }) => (
                <div className="text-left min-w-[80px]">
                    <button
                        onClick={() => handleDelete(row.original)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Excluir apólice"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // Componente de Skeleton para cards
    const SkeletonCard = () => (
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-600 rounded-lg"></div>
                <div className="flex-1">
                    <div className="h-4 bg-slate-600 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-slate-600 rounded w-16"></div>
                </div>
            </div>
        </div>
    );

    // Componente de Skeleton para a tabela
    const SkeletonTable = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header com Skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>

                {/* Estatísticas com Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

                {/* Filtros com Skeleton */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Tabela com Skeleton */}
                <SkeletonTable />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Todas as Vendas</h2>
                    <p className="text-gray-600 mt-1">Visualize todas as apólices de todos os corretores</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowReportGenerator(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                    >
                        <Download className="w-4 h-4" />
                        Relatório Completo
                    </button>
                </div>
            </div>

            {/* Estatísticas - Cards Escuros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Total de Apólices</p>
                            <p className="text-2xl font-bold text-white">{policies.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Corretores Ativos</p>
                            <p className="text-2xl font-bold text-white">
                                {new Set(policies.map(p => p.user_name)).size}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Receita Total</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(policies.reduce((sum, p) => sum + p.premium_value, 0))}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <Filter className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Ticket Médio</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(
                                    policies.length > 0 
                                        ? policies.reduce((sum, p) => sum + p.premium_value, 0) / policies.length
                                        : 0
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Limpar filtros
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Busca */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Número, corretor, CPD..."
                                value={filters.search}
                                onChange={(e) => updateSearch(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtro por Tipo */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={filters.type}
                            onChange={(e) => updateTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos os tipos</option>
                            <option value="Seguro Auto">Seguro Auto</option>
                            <option value="Seguro Residencial">Seguro Residencial</option>
                        </select>
                    </div>

                    {/* Filtro por Tipo de Contrato */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contrato
                        </label>
                        <select
                            value={filters.contractType}
                            onChange={(e) => updateContractTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos os contratos</option>
                            <option value="Novo">Novo</option>
                            <option value="Renovação Bradesco">Renovação Bradesco</option>
                        </select>
                    </div>

                    {/* Filtro de Período */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Período
                        </label>
                        <DateRangePicker
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            onChange={updateDateRange}
                            placeholder="Selecionar período"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela usando DynamicTable com scroll horizontal */}
            <div className="w-full overflow-x-auto">
                <DynamicTable
                    data={filteredPolicies}
                    columns={columns}
                    title="Histórico de Apólices"
                    searchPlaceholder="Buscar por número da apólice, corretor..."
                    pageSize={10}
                    loading={loading}
                    hideSearch={true}
                />
            </div>

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                title="Excluir Apólice"
                message={`Tem certeza que deseja excluir a apólice ${deleteModal.policy?.policy_number}?\n\nValor: ${formatCurrency(deleteModal.policy?.premium_value || 0)}\nTipo: ${deleteModal.policy?.type}\nCorretor: ${deleteModal.policy?.user_name}`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                isLoading={false}
            />

            {/* Gerador de Relatório de Vendas */}
            {showReportGenerator && (
                <SalesReportGenerator
                    onClose={() => setShowReportGenerator(false)}
                />
            )}
        </div>
    );
};

export default AdminPoliciesTable;
