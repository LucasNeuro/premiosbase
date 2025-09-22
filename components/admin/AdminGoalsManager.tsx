import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Target, TrendingUp, Users, Calendar, Eye, Download } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import DynamicTable from '../ui/DynamicTable';
import CompositeCampaignSidepanel from './CompositeCampaignSidepanel';
import GoalDetailsSidepanel from './GoalDetailsSidepanel';
import DateRangePicker from '../ui/DateRangePicker';
import CampaignReportGenerator from './CampaignReportGenerator';
import { currencyMask } from '../../utils/masks';
import { UnifiedCampaignProgressService } from '../../services/unifiedCampaignProgressService';

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
    // Campos adicionais para compatibilidade com ExpandableCampaignsTable
    progress_percentage?: number;
    description?: string;
    policies?: any[];
    brokers?: any[];
    audits?: any[];
}

const AdminGoalsManager: React.FC = () => {
    const [goals, setGoals] = useState<AdminGoal[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateSidepanel, setShowCreateSidepanel] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<AdminGoal | null>(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    
    // Estados para filtros simples
    const [filters, setFilters] = useState({
        search: '',
        acceptanceStatus: '',
        startDate: '',
        endDate: ''
    });
    const [filteredGoals, setFilteredGoals] = useState<AdminGoal[]>([]);

    useEffect(() => {
        fetchGoals();
        fetchUsers();
    }, []);

    // Efeito para aplicar filtros
    useEffect(() => {

        let filtered = goals;

        // Filtro de busca (nome, corretor, email)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const beforeSearch = filtered.length;
            filtered = filtered.filter(goal => 
                goal.title.toLowerCase().includes(searchLower) ||
                goal.user_name.toLowerCase().includes(searchLower) ||
                goal.user_email.toLowerCase().includes(searchLower)
            );

        }

        // Filtro por status de aceitação
        if (filters.acceptanceStatus) {
            const beforeStatus = filtered.length;
            filtered = filtered.filter(goal => goal.acceptance_status === filters.acceptanceStatus);

        }

        // Filtro por período (data de início e fim)
        if (filters.startDate || filters.endDate) {
            const beforeDate = filtered.length;
            filtered = filtered.filter(goal => {
                // Converter data de criação para string no formato YYYY-MM-DD
                const createdDateStr = goal.created_at.split('T')[0];
                const startDateStr = filters.startDate;
                const endDateStr = filters.endDate;

                // Se só tem data de início
                if (startDateStr && !endDateStr) {
                    const result = createdDateStr >= startDateStr;

                    return result;
                }
                
                // Se só tem data de fim
                if (!startDateStr && endDateStr) {
                    const result = createdDateStr <= endDateStr;

                    return result;
                }
                
                // Se tem ambas as datas
                if (startDateStr && endDateStr) {
                    const result = createdDateStr >= startDateStr && createdDateStr <= endDateStr;

                    return result;
                }
                
                return true;
            });

        }

        setFilteredGoals(filtered);
    }, [goals, filters]);

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

            const formattedGoals = await Promise.all(data?.map(async (goal) => {
                // CORREÇÃO: Recalcular progresso usando o mesmo serviço do corretor
                let updatedProgress = goal.progress_percentage || 0;
                let updatedCurrentValue = goal.current_value || 0;
                let updatedStatus = goal.status;

                try {
                    // Usar o serviço unificado em tempo real
                    const progressData = await UnifiedCampaignProgressService.calculateCampaignProgress(goal.id);
                    if (progressData) {
                        updatedProgress = progressData.progressPercentage;
                        updatedCurrentValue = progressData.currentValue;
                        updatedStatus = progressData.isCompleted ? 'completed' : 'active';
                    }
                } catch (error) {
                }

                // Para campanhas compostas, calcular o target real baseado nos critérios
                let realTarget = goal.target;
                if (goal.campaign_type === 'composite' && goal.criteria) {
                    try {
                        const criteria = Array.isArray(goal.criteria) ? goal.criteria : JSON.parse(goal.criteria);
                        realTarget = criteria.reduce((sum: number, c: any) => {
                            // Só somar critérios de VALOR, não de QUANTIDADE
                            if (c.target_type === 'value') {
                                return sum + (c.target_value || 0);
                            }
                            return sum; // Critérios de quantidade não são somados ao target total
                        }, 0);
                    } catch (e) {
                    }
                }

                // Buscar informações do usuário
                const user = users.find(u => u.id === goal.user_id);

                return {
                    ...goal,
                    target: realTarget, // Usar o target calculado
                    progress_percentage: updatedProgress, // Usar progresso recalculado
                    current_value: updatedCurrentValue, // Usar valor atual recalculado
                    status: updatedStatus, // Usar status recalculado
                    user_name: user?.name || 'N/A',
                    user_email: user?.email || 'N/A',
                    user_cpd: user?.cpd || 'N/A'
                };
            }) || []);

            setGoals(formattedGoals);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // Função para limpar filtros
    const clearFilters = () => {
        setFilters({
            search: '',
            acceptanceStatus: '',
            startDate: '',
            endDate: ''
        });
    };

    // Função para atualizar filtros
    const updateFilter = (key: string, value: string) => {

        setFilters(prev => {
            const newFilters = {
                ...prev,
                [key]: value
            };

            return newFilters;
        });
    };

    // Função para atualizar filtro de período
    const updateDateRange = (startDate: string | null, endDate: string | null) => {

        setFilters(prev => {
            const newFilters = {
                ...prev,
                startDate: startDate || '',
                endDate: endDate || ''
            };

            return newFilters;
        });
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('is_admin', false);

            if (error) {
                return;
            }

            setUsers(data || []);
        } catch (error) {
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
                <div className="text-left min-w-[250px]">
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
                const criteria = row.original.criteria;
                
                // DEBUG: Log para investigar
                if (row.original.title?.includes('TESTE INDIVIDUAL SIMPLES')) {
                }
                
                const typeLabels = {
                    'apolices': 'Apólices',
                    'valor': 'Valor',
                    'crescimento': 'Crescimento',
                    'composite': 'Composta'
                };
                
                const getBadgeColor = () => {
                    if (campaignType === 'composite') return 'bg-[#49de80] bg-opacity-20 text-[#49de80] border border-[#49de80] border-opacity-30';
                    if (type === 'valor') return 'bg-[#1e293b] bg-opacity-10 text-[#1e293b] border border-[#1e293b] border-opacity-20';
                    if (type === 'apolices') return 'bg-blue-100 text-blue-800 border border-blue-200';
                    return 'bg-gray-100 text-gray-800 border border-gray-200';
                };

                // LÓGICA CORRIGIDA: Verificar se realmente tem critérios válidos
                const hasValidCriteria = criteria && 
                    criteria !== null && 
                    (typeof criteria === 'string' ? criteria !== 'null' && criteria !== '[]' : true) &&
                    (Array.isArray(criteria) ? criteria.length > 0 : true);

                return (
                    <div className="text-left min-w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()}`}>
                            {typeLabels[type as keyof typeof typeLabels] || type}
                        </span>
                        {campaignType === 'composite' && hasValidCriteria && (
                            <div className="text-xs text-gray-500 mt-1">
                                Múltiplos critérios
                            </div>
                        )}
                    </div>
                );
            },
        },
        // COLUNAS SEPARADAS PARA CADA CRITÉRIO
        ...(() => {
            // Função para gerar colunas dinâmicas baseadas nos critérios
            const generateCriteriaColumns = () => {
                const columns: ColumnDef<AdminGoal>[] = [];
                
                // Buscar todas as campanhas compostas para determinar quantas colunas criar
                const compositeGoals = goals.filter(g => g.campaign_type === 'composite' && g.criteria);
                let maxCriteria = 0;
                
                compositeGoals.forEach(goal => {
                    try {
                        const criteria = Array.isArray(goal.criteria) ? goal.criteria : JSON.parse(goal.criteria);
                        maxCriteria = Math.max(maxCriteria, criteria.length);
                    } catch (e) {
                        // Ignorar erros de parsing
                    }
                });
                
                // Criar colunas para cada critério (máximo 4 critérios)
                for (let i = 0; i < Math.min(maxCriteria, 4); i++) {
                    columns.push({
                        accessorKey: `criteria_${i}`,
                        header: () => <div className="text-left">Critério {i + 1}</div>,
            cell: ({ row }) => {
                            const goal = row.original;
                            
                            // Se não é campanha composta, mostrar vazio
                            if (goal.campaign_type !== 'composite' || !goal.criteria) {
                                return <div className="text-left min-w-[150px] text-gray-400">-</div>;
                            }
                            
                            try {
                                const criteria = Array.isArray(goal.criteria) ? goal.criteria : JSON.parse(goal.criteria);
                                const criterion = criteria[i];
                                
                                if (!criterion) {
                                    return <div className="text-left min-w-[150px] text-gray-400">-</div>;
                                }
                                
                                // LÓGICA CORRETA: Calcular progresso real baseado nas apólices
                                let criterionProgress = 0;
                                let currentValue = 0;
                                let targetValue = criterion.target_value || 0;
                                
                                // CORREÇÃO: Não mostrar 100% se não há apólices reais
                                if (goal.current_value === 0 || !goal.current_value) {
                                    criterionProgress = 0;
                                    currentValue = 0;
                                } else {
                                    // Lógica baseada no tipo de critério
                                    if (criterion.target_type === 'value') {
                                        // Critério de valor - usar parte proporcional do valor total
                                        currentValue = Math.min(goal.current_value || 0, targetValue);
                                        criterionProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
                                    } else {
                                        // Critério de quantidade - estimar baseado no valor
                                        // Assumir que cada apólice tem valor médio de R$ 15.000
                                        const avgPolicyValue = 15000;
                                        currentValue = Math.floor((goal.current_value || 0) / avgPolicyValue);
                                        criterionProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
                                    }
                                }
                                
                return (
                                    <div className="text-left min-w-[150px]">
                                        <div className="text-xs font-medium text-gray-700 mb-1">
                                            {criterion.policy_type || 'Geral'}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {criterion.target_type === 'value' 
                                                ? `Meta: ${formatCurrency(targetValue)}`
                                                : `Meta: ${targetValue} apólices`
                                            }
                                        </div>
                                        <div className="text-xs text-gray-600 mb-1">
                                            {criterion.target_type === 'value' 
                                                ? `Atual: ${formatCurrency(currentValue)}`
                                                : `Atual: ${currentValue} apólices`
                                            }
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    criterionProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${Math.min(criterionProgress, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {criterionProgress.toFixed(1)}%
                                            {criterionProgress >= 100 && (
                                                <span className="text-green-600 ml-1">✓</span>
                                            )}
                    </div>
                    </div>
                );
                            } catch (error) {
                                return <div className="text-left min-w-[150px] text-red-500 text-xs">Erro</div>;
                            }
                        },
                    });
                }
                
                return columns;
            };
            
            return generateCriteriaColumns();
        })(),
        {
            accessorKey: 'progress',
            header: () => <div className="text-left">Progresso Geral</div>,
            cell: ({ row }) => {
                const goal = row.original;
                const current = goal.current_value || 0;
                
                // LÓGICA CORRETA: Para campanhas compostas, calcular baseado nos critérios
                if (goal.campaign_type === 'composite' && goal.criteria) {
                    try {
                        const criteria = Array.isArray(goal.criteria) ? goal.criteria : JSON.parse(goal.criteria);
                        
                        // Se não há apólices, progresso = 0%
                        if (current === 0) {
                            return (
                                <div className="text-left min-w-[120px]">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">0.0%</div>
                                </div>
                            );
                        }
                        
                        // Calcular progresso de cada critério
                        let totalProgress = 0;
                        let completedCriteria = 0;
                        
                        criteria.forEach((criterion: any) => {
                            let criterionProgress = 0;
                            const targetValue = criterion.target_value || 0;
                            
                            if (criterion.target_type === 'value') {
                                const currentValue = Math.min(current, targetValue);
                                criterionProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
                            } else {
                                // Critério de quantidade
                                const avgPolicyValue = 15000;
                                const currentCount = Math.floor(current / avgPolicyValue);
                                criterionProgress = targetValue > 0 ? (currentCount / targetValue) * 100 : 0;
                            }
                            
                            totalProgress += criterionProgress;
                            if (criterionProgress >= 100) {
                                completedCriteria++;
                            }
                        });
                        
                        // Progresso geral = média dos critérios, mas só 100% se TODOS completos
                        const avgProgress = criteria.length > 0 ? totalProgress / criteria.length : 0;
                        const finalProgress = completedCriteria === criteria.length ? 100 : avgProgress;
                        
                        return (
                            <div className="text-left min-w-[120px]">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            finalProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${Math.min(finalProgress, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {finalProgress.toFixed(1)}%
                                    {finalProgress >= 100 && (
                                        <span className="text-green-600 ml-1">✓</span>
                                    )}
                                </div>
                            </div>
                        );
                    } catch (error) {
                        // Fallback para progresso simples
                        const progress = formatProgress(current, goal.target);
                        return (
                            <div className="text-left min-w-[120px]">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{progress.toFixed(1)}%</div>
                            </div>
                        );
                    }
                }
                
                // Para campanhas simples
                const progress = formatProgress(current, goal.target);
                return (
                    <div className="text-left min-w-[120px]">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-[#49de80] h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'start_date',
            header: () => <div className="text-left">Data Início</div>,
            cell: ({ row }) => {
                const startDate = row.getValue('start_date') as string;
                return (
                    <div className="text-left min-w-[100px]">
                        {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'end_date',
            header: () => <div className="text-left">Data Fim</div>,
            cell: ({ row }) => {
                const endDate = row.getValue('end_date') as string;
                return (
                    <div className="text-left min-w-[100px]">
                        {endDate ? new Date(endDate).toLocaleDateString('pt-BR') : '-'}
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
            accessorKey: 'target_type',
            header: () => <div className="text-left">Tipo Alvo</div>,
            cell: ({ row }) => {
                const targetType = row.getValue('target_type') as string;
                const typeLabels = {
                    'individual': 'Individual',
                    'group': 'Grupo'
                };
                const getBadgeColor = () => {
                    if (targetType === 'individual') return 'bg-[#1e293b] bg-opacity-10 text-[#1e293b] border border-[#1e293b] border-opacity-20';
                    if (targetType === 'group') return 'bg-[#49de80] bg-opacity-20 text-[#49de80] border border-[#49de80] border-opacity-30';
                    return 'bg-gray-100 text-gray-800 border border-gray-200';
                };
                return (
                    <div className="text-left min-w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()}`}>
                            {typeLabels[targetType as keyof typeof typeLabels] || targetType}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: () => <div className="text-left">Criada em</div>,
            cell: ({ row }) => {
                const createdAt = row.getValue('created_at') as string;
                return (
                    <div className="text-left min-w-[100px]">
                        {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'description',
            header: () => <div className="text-left">Descrição</div>,
            cell: ({ row }) => {
                const description = row.getValue('description') as string;
                return (
                    <div className="text-left min-w-[200px] max-w-[300px]">
                        <div className="truncate" title={description || 'Sem descrição'}>
                            {description || '-'}
                        </div>
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
                                color: 'bg-[#49de80] bg-opacity-20 text-[#49de80] border border-[#49de80] border-opacity-30',
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
                                color: 'bg-red-100 text-red-800 border border-red-200',
                                date: acceptedAt ? new Date(acceptedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                }) : null
                            };
                        default:
                            return {
                                label: 'Pendente',
                                color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
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
                        className="text-[#1e293b] hover:text-[#49de80] transition-colors p-2 rounded-lg hover:bg-[#1e293b] hover:bg-opacity-10"
                        title="Ver detalhes"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // Componente de Skeleton para os cards de estatísticas
    const SkeletonCard = () => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
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
                    <h2 className="text-2xl font-bold text-[#1e293b]">Gerenciar Campanhas</h2>
                    <p className="text-gray-600 mt-1">Crie e gerencie campanhas para os corretores</p>
                </div>
                <div className="flex items-center gap-4">
                <button 
                    onClick={handleCreateGoal}
                        className="bg-[#1e293b] hover:bg-[#49de80] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                        <Plus className="w-5 h-5" />
                    Nova Campanha
                </button>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Total de Metas</p>
                            <p className="text-2xl font-bold text-white">{goals.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Metas Ativas</p>
                            <p className="text-2xl font-bold text-white">
                                {goals.filter(g => g.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#49de80] rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-300">Corretores com Metas</p>
                            <p className="text-2xl font-bold text-white">
                                {new Set(goals.map(g => g.user_id)).size}
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
                            <p className="text-sm text-slate-300">Concluídas</p>
                            <p className="text-2xl font-bold text-white">
                                {goals.filter(g => g.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela com Filtros */}
            <div className="w-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Header com Filtros */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Metas dos Corretores</h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Limpar Filtros
                            </button>
                            
                            <button
                                onClick={() => setShowReportGenerator(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Relatório Completo
                            </button>
                        </div>
                        
                        {/* Filtros Simples */}
                        <div className="flex items-center gap-4">
                            {/* Campo de Busca */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    placeholder="Buscar por meta, corretor..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            {/* Filtro de Status de Aceitação */}
                            <div className="w-48">
                                <select
                                    value={filters.acceptanceStatus}
                                    onChange={(e) => updateFilter('acceptanceStatus', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todos os Status</option>
                                    <option value="pending">Pendente</option>
                                    <option value="accepted">Aceita</option>
                                    <option value="rejected">Rejeitada</option>
                                </select>
                            </div>
                            
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
                        </div>
                    </div>

                    {/* Conteúdo da Tabela */}
                    <div className="p-0">
                <DynamicTable
                            data={filteredGoals}
                            columns={columns as any}
                            title=""
                    pageSize={10}
                    loading={loading}
                            hideSearch={true}
                />
                    </div>
                </div>
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

            {/* Gerador de Relatório Completo */}
            {showReportGenerator && (
                <CampaignReportGenerator
                    onClose={() => setShowReportGenerator(false)}
                />
            )}
        </div>
    );
};

export default AdminGoalsManager;