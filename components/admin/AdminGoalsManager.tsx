import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Target, TrendingUp, Users, Calendar, Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import DynamicTable from '../ui/DynamicTable';
import CompositeCampaignSidepanel from './CompositeCampaignSidepanel';
import GoalDetailsSidepanel from './GoalDetailsSidepanel';
import { currencyMask } from '../../utils/masks';

interface AdminGoal {
    id: string;
    user_id: string;
    title: string;
    target: number;
    current_value: number;
    unit: string;
    period: string;
    type: string;
    status: string;
    target_period: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    start_date?: string;
    end_date?: string;
    user_name: string;
    user_email: string;
    // Novos campos para campanhas compostas
    campaign_type?: 'simple' | 'composite';
    criteria?: any[];
    // Campos de aceitação
    acceptance_status?: 'pending' | 'accepted' | 'rejected';
    accepted_at?: string;
    accepted_by?: string;
    // Prêmios associados
    campanhas_premios?: Array<{
        id: string;
        quantidade: number;
        entregue: boolean;
        premio: {
            id: string;
            nome: string;
            valor_estimado: number;
            imagem_miniatura_url?: string;
            categoria: { nome: string };
            tipo: { nome: string };
        };
    }>;
}

const AdminGoalsManager: React.FC = () => {
    const [goals, setGoals] = useState<AdminGoal[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateSidepanel, setShowCreateSidepanel] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<AdminGoal | null>(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    useEffect(() => {
        fetchGoals();
        fetchUsers();
    }, []);

    const fetchGoals = async () => {
        try {
            // Primeiro buscar as campanhas (incluindo dados de aceitação)
            const { data: goalsData, error: goalsError } = await supabase
                .from('goals')
                .select('*, acceptance_status, accepted_at, accepted_by')
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (goalsError) {
                console.error('Error fetching goals:', goalsError);
                return;
            }

            // Depois buscar os prêmios associados
            let goalsWithPrizes = goalsData || [];
            
            if (goalsData && goalsData.length > 0) {
                const campaignIds = goalsData.map(g => g.id);
                
                const { data: prizesData, error: prizesError } = await supabase
                    .from('campanhas_premios')
                    .select(`
                        *,
                        premio:premios(
                            id,
                            nome,
                            valor_estimado,
                            imagem_url,
                            imagem_miniatura_url
                        )
                    `)
                    .in('goal_id', campaignIds);

                if (!prizesError && prizesData) {
                    // Associar prêmios às campanhas
                    goalsWithPrizes = goalsData.map(goal => ({
                        ...goal,
                        campanhas_premios: prizesData.filter(p => p.goal_id === goal.id)
                    }));
                }
            }

            const data = goalsWithPrizes;

            const formattedGoals = data?.map(goal => {
                // Para campanhas compostas, calcular o target real baseado nos critérios
                let realTarget = goal.target;
                if (goal.campaign_type === 'composite' && goal.criteria) {
                    try {
                        const criteria = Array.isArray(goal.criteria) ? goal.criteria : JSON.parse(goal.criteria);
                        console.log('📊 Processando critérios da campanha:', goal.title, 'criteria:', criteria);
                        realTarget = criteria.reduce((sum: number, c: any) => {
                            console.log('📊 Critério:', c, 'target_type:', c.target_type, 'target_value:', c.target_value);
                            // Só somar critérios de VALOR, não de QUANTIDADE
                            if (c.target_type === 'value') {
                                return sum + (c.target_value || 0);
                            }
                            return sum; // Critérios de quantidade não são somados ao target total
                        }, 0);
                        console.log('📊 Target real calculado:', realTarget);
                    } catch (e) {
                        console.warn('Erro ao processar critérios:', e);
                    }
                }

                return {
                    ...goal,
                    target: realTarget, // Usar o target calculado
                    user_name: 'Corretor', // Simplificado por enquanto
                    user_email: 'N/A'
                };
            }) || [];

            setGoals(formattedGoals);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('is_admin', false);

            if (error) {
                console.error('Error fetching users:', error);
                return;
            }

            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCreateGoal = () => {
        setShowCreateSidepanel(true);
    };

    const handleGoalCreated = () => {
        fetchGoals();
    };

    const handleViewGoal = (goal: AdminGoal) => {
        setSelectedGoal(goal);
        setShowDetailsPanel(true);
    };

    const handleGoalUpdated = () => {
        fetchGoals();
    };


    const handleCloseDetailsPanel = () => {
        setShowDetailsPanel(false);
        setSelectedGoal(null);
    };

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return 'R$ 0,00';
        return currencyMask(value.toString());
    };

    const formatProgress = (current: number | undefined, target: number | undefined) => {
        if (current === undefined || current === null) current = 0;
        if (target === undefined || target === null) target = 0;
        const percentage = target > 0 ? (current / target) * 100 : 0;
        return Math.min(percentage, 100);
    };

    const columns: ColumnDef<AdminGoal>[] = [
        {
            accessorKey: 'title',
            header: () => <div className="text-left">Meta</div>,
            cell: ({ row }) => (
                <div className="text-left min-w-[200px]">
                    <div className="font-medium text-gray-900">{row.getValue('title')}</div>
                    <div className="text-sm text-gray-500">{row.original.user_name}</div>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: () => <div className="text-left">Tipo</div>,
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                const campaignType = row.original.campaign_type || 'simple';
                const typeLabels = {
                    'apolices': 'Apólices',
                    'valor': 'Valor',
                    'crescimento': 'Crescimento',
                    'composite': 'Composta'
                };
                
                const getBadgeColor = () => {
                    if (campaignType === 'composite') return 'bg-green-100 text-green-800';
                    if (type === 'valor') return 'bg-blue-100 text-blue-800';
                    if (type === 'apolices') return 'bg-purple-100 text-purple-800';
                    return 'bg-gray-100 text-gray-800';
                };

                return (
                    <div className="text-left min-w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()}`}>
                            {typeLabels[type as keyof typeof typeLabels] || type}
                        </span>
                        {campaignType === 'composite' && (
                            <div className="text-xs text-gray-500 mt-1">
                                Múltiplos critérios
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'target',
            header: () => <div className="text-left">Meta</div>,
            cell: ({ row }) => {
                const target = row.getValue('target') as number;
                const type = row.original.type;
                return (
                    <div className="text-left min-w-[100px]">
                        {type === 'valor' ? formatCurrency(target) : target.toLocaleString()}
                    </div>
                );
            },
        },
        {
            accessorKey: 'current_value',
            header: () => <div className="text-left">Atual</div>,
            cell: ({ row }) => {
                const current = row.getValue('current_value') as number | undefined;
                const type = row.original.type;
                return (
                    <div className="text-left min-w-[100px]">
                        {type === 'valor' ? formatCurrency(current) : (current || 0).toLocaleString()}
                    </div>
                );
            },
        },
        {
            accessorKey: 'progress',
            header: () => <div className="text-left">Progresso</div>,
            cell: ({ row }) => {
                const current = row.original.current_value || 0;
                const target = row.original.target || 0;
                const progress = formatProgress(current, target);
                return (
                    <div className="text-left min-w-[120px]">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'target_period',
            header: () => <div className="text-left">Período</div>,
            cell: ({ row }) => {
                const period = row.getValue('target_period') as string;
                const periodLabels = {
                    'semana': 'Semana',
                    'mes': 'Mês',
                    'trimestre': 'Trimestre',
                    'ano': 'Ano'
                };
                return (
                    <div className="text-left min-w-[100px]">
                        {periodLabels[period as keyof typeof periodLabels] || period}
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: () => <div className="text-left">Status</div>,
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                const statusConfig = {
                    'active': { label: 'Ativa', class: 'bg-green-100 text-green-800' },
                    'completed': { label: 'Concluída', class: 'bg-blue-100 text-blue-800' },
                    'pending': { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' }
                };
                const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: 'bg-gray-100 text-gray-800' };
                return (
                    <div className="text-left min-w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
                            {config.label}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'acceptance_status',
            header: () => <div className="text-center">Status</div>,
            cell: ({ row }) => {
                const status = row.original.acceptance_status || 'pending';
                const acceptedAt = row.original.accepted_at;
                
                const getStatusInfo = () => {
                    switch (status) {
                        case 'accepted':
                            return {
                                label: 'Aceita',
                                color: 'bg-green-100 text-green-800',
                                date: acceptedAt ? new Date(acceptedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : null
                            };
                        case 'rejected':
                            return {
                                label: 'Rejeitada',
                                color: 'bg-red-100 text-red-800',
                                date: acceptedAt ? new Date(acceptedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                }) : null
                            };
                        default:
                            return {
                                label: 'Pendente',
                                color: 'bg-yellow-100 text-yellow-800',
                                date: null
                            };
                    }
                };
                
                const statusInfo = getStatusInfo();
                
                return (
                    <div className="text-center min-w-[120px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        {statusInfo.date && (
                            <div className="text-xs text-gray-500 mt-1">
                                {statusInfo.date}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: () => <div className="text-left">Ações</div>,
            cell: ({ row }) => (
                <div className="text-left min-w-[80px] flex gap-2">
                    <button
                        onClick={() => handleViewGoal(row.original)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Ver detalhes"
                    >
                        <Eye className="w-4 h-4" />
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
                    <h2 className="text-2xl font-bold text-gray-800">Gerenciar Campanhas</h2>
                    <p className="text-gray-600 mt-1">Crie e gerencie campanhas para os corretores</p>
                </div>
                <button 
                    onClick={handleCreateGoal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                    <Plus className="w-4 h-4" />
                    Nova Campanha
                </button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Metas</p>
                            <p className="text-2xl font-bold text-gray-800">{goals.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Metas Ativas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {goals.filter(g => g.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Corretores com Metas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {new Set(goals.map(g => g.user_id)).size}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Concluídas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {goals.filter(g => g.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="w-full">
                <DynamicTable
                    data={goals}
                    columns={columns}
                    title="Metas dos Corretores"
                    searchPlaceholder="Buscar por meta, corretor..."
                    pageSize={10}
                    loading={loading}
                />
            </div>

            {/* Sidepanels */}
            <CompositeCampaignSidepanel
                isOpen={showCreateSidepanel}
                onClose={() => setShowCreateSidepanel(false)}
                onSuccess={handleGoalCreated}
            />

            <GoalDetailsSidepanel
                isOpen={showDetailsPanel}
                onClose={handleCloseDetailsPanel}
                goal={selectedGoal as any}
                onGoalUpdated={handleGoalUpdated}
            />
        </div>
    );
};

export default AdminGoalsManager;