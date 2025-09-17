import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Download, Eye, Trash2, Calendar, User, FileText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import DynamicTable from '../ui/DynamicTable';
import ConfirmationModal from '../ui/ConfirmationModal';
import TicketTag from '../ui/TicketTag';

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

    const fetchAllPolicies = async () => {
        try {
            // Buscar policies sem join primeiro
            const { data: policiesData, error: policiesError } = await supabase
                .from('policies')
                .select('*')
                .order('created_at', { ascending: false });

            if (policiesError) {
                console.error('Error fetching policies:', policiesError);
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
                console.error('Error fetching users:', usersError);
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
            console.error('Error fetching policies:', error);
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
            console.error('Error deleting policy:', error);
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
                    <h2 className="text-2xl font-bold text-gray-800">Todas as Vendas</h2>
                    <p className="text-gray-600 mt-1">Visualize todas as apólices de todos os corretores</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Estatísticas - Cards Brancos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Apólices</p>
                            <p className="text-2xl font-bold text-gray-800">{policies.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Corretores Ativos</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {new Set(policies.map(p => p.user_name)).size}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Receita Total</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatCurrency(policies.reduce((sum, p) => sum + p.premium_value, 0))}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Filter className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ticket Médio</p>
                            <p className="text-2xl font-bold text-gray-800">
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

            {/* Tabela usando DynamicTable */}
            <div className="w-full">
                <DynamicTable
                    data={policies}
                    columns={columns}
                    title="Histórico de Apólices"
                    searchPlaceholder="Buscar por número da apólice, corretor..."
                    pageSize={10}
                    loading={loading}
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
        </div>
    );
};

export default AdminPoliciesTable;
