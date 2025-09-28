import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Target, User, Calendar, TrendingUp, Award, Edit, Trash2, DollarSign, FileText, Wifi, WifiOff } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import { currencyMask } from '../../utils/masks';
import { useRealtimeCampaignProgress } from '../../hooks/useRealtimeCampaignProgress';

interface Goal {
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
    description?: string;
    user_name: string;
    user_email: string;
    user_cpd?: string;
    // Campos para campanhas compostas
    campaign_type?: 'simple' | 'composite';
    criteria?: any[];
    start_date?: string;
    end_date?: string;
    // Prêmios associados
    campanhas_premios?: Array<{
        id: string;
        quantidade: number;
        entregue: boolean;
        premio: {
            id: string;
            nome: string;
            valor_estimado: number;
            imagem_url?: string;
            imagem_miniatura_url?: string;
            categoria: { nome: string };
            tipo: { nome: string };
        };
    }>;
}

interface GoalDetailsSidepanelProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    onGoalUpdated: () => void;
}

const GoalDetailsSidepanel: React.FC<GoalDetailsSidepanelProps> = ({ 
    isOpen, 
    onClose, 
    goal, 
    onGoalUpdated 
}) => {
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);
    
    // Estados para progresso em tempo real - MOVENDO PARA O TOPO
    const [realtimeProgress, setRealtimeProgress] = useState(0);
    const [realtimeCompleted, setRealtimeCompleted] = useState(false);
    const [progressLoading, setProgressLoading] = useState(false);

    // Hook de tempo real para atualizações automáticas
    const { 
        progressData, 
        isConnected, 
        error: realtimeError 
    } = useRealtimeCampaignProgress(goal?.id);

    useEffect(() => {
        if (isOpen && goal) {
            fetchGoalPolicies();
        }
    }, [isOpen, goal]);

    // Sincronizar dados de tempo real com estados locais
    useEffect(() => {
        if (progressData) {
            setRealtimeProgress(progressData.progress);
            setRealtimeCompleted(progressData.isCompleted);

        }
    }, [progressData]);

    const fetchGoalPolicies = async () => {
        if (!goal) return;

        try {
            // CORREÇÃO: Buscar apólices vinculadas à campanha através de policy_campaign_links
            // e que foram lançadas DEPOIS da data de aceite da campanha
            const { data: linkedPolicies, error } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies(
                        id,
                        policy_number,
                        type,
                        premium_value,
                        registration_date,
                        contract_type,
                        cpd_number,
                        user_id,
                        created_by,
                        user:users!policies_user_id_fkey(
                            id,
                            name,
                            email,
                            cpd
                        )
                    )
                `)
                .eq('campaign_id', goal.id)
                .eq('is_active', true)
                .order('linked_at', { ascending: false });

            if (error) {
                return;
            }

            // Filtrar apólices que foram lançadas DEPOIS da data de aceite da campanha
            const acceptedAt = (goal as any).accepted_at ? new Date((goal as any).accepted_at) : null;
            const filteredPolicies = (linkedPolicies || [])
                .filter(link => {
                    if (!link.policy) return false;
                    
                    // Se não há data de aceite, considerar todas as apólices vinculadas
                    if (!acceptedAt) return true;
                    
                    // Verificar se a apólice foi lançada DEPOIS da data de aceite
                    const policyDate = new Date(link.policy.registration_date);
                    return policyDate >= acceptedAt;
                })
                .map(link => ({
                    ...link.policy,
                    linked_at: link.linked_at,
                    linked_by: link.linked_by,
                    broker_name: String(link.policy.user?.name || 'N/A'),
                    broker_email: String(link.policy.user?.email || 'N/A'),
                    broker_cpd: String(link.policy.cpd_number || 'N/A'), // VOLTAR AO CPD ORIGINAL DA APÓLICE
                    campaign_received: String(goal.title || 'N/A')
                }));


            setPolicies(filteredPolicies);
        } catch (error) {
        }
    };

    const handleDelete = async () => {
        if (!goal) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('goals')
                .update({ is_active: false })
                .eq('id', goal.id);

            if (error) {
                alert('Erro ao excluir meta: ' + error.message);
                return;
            }

            onGoalUpdated();
            onClose();
        } catch (error) {
            alert('Erro ao excluir meta');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    const formatCurrency = (value: number) => {
        // Função específica para números (não strings)
        if (isNaN(value) || value === null || value === undefined) {
            return 'R$ 0,00';
        }
        
        // Formatar como moeda brasileira
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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

    const formatProgress = (current: number, target: number) => {
        const percentage = target > 0 ? (current / target) * 100 : 0;
        return Math.min(percentage, 100);
    };

    const getPeriodLabel = (period: string) => {
        const labels = {
            'semana': 'Semana',
            'mes': 'Mês',
            'trimestre': 'Trimestre',
            'ano': 'Ano'
        };
        return labels[period as keyof typeof labels] || period;
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            'apolices': 'Apólices',
            'valor': 'Valor',
            'crescimento': 'Crescimento'
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getStatusConfig = (status: string) => {
        const configs = {
            'active': { label: 'Ativa', class: 'bg-green-100 text-green-800' },
            'completed': { label: 'Concluída', class: 'bg-blue-100 text-blue-800' },
            'pending': { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' }
        };
        return configs[status as keyof typeof configs] || { label: status, class: 'bg-gray-100 text-gray-800' };
    };

    // Carregar progresso em tempo real quando o sidepanel abre
    useEffect(() => {
        const loadRealtimeProgress = async () => {
            if (!goal || !isOpen) return;
            
            setProgressLoading(true);
            try {
                // ✅ USAR A MESMA LÓGICA DO CORRETOR
                const { calculateCampaignProgressAuxiliar } = await import('../../services/campaignProgressAuxiliar');
                const progressData = await calculateCampaignProgressAuxiliar(goal.id);
                
                console.log('🔍 Admin - Calculando progresso com mesma lógica do corretor:', {
                    campaignId: goal.id,
                    progressData
                });
                
                if (progressData) {
                    setRealtimeProgress(progressData.progressPercentage);
                    setRealtimeCompleted(progressData.isCompleted);
                } else {
                    // Fallback para progresso simples
                    const fallbackProgress = formatProgress(goal.current_value, goal.target);
                    setRealtimeProgress(fallbackProgress);
                    setRealtimeCompleted(fallbackProgress >= 100);
                }
            } catch (error) {
                // Fallback para progresso simples
                const fallbackProgress = formatProgress(goal.current_value, goal.target);
                setRealtimeProgress(fallbackProgress);
                setRealtimeCompleted(fallbackProgress >= 100);
            } finally {
                setProgressLoading(false);
            }
        };

        loadRealtimeProgress();
    }, [goal?.id, isOpen]);

    if (!isOpen || !goal) return null;

    // Usar progresso em tempo real se disponível, senão usar progresso do banco
    const progress = realtimeProgress || formatProgress(goal.current_value, goal.target);
    const isCompleted = realtimeCompleted || progress >= 100;
    
    const statusConfig = getStatusConfig(goal.status);

    return (
        <>
            {/* Sidepanel */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
                <div className="bg-white w-full max-w-7xl h-full overflow-y-auto shadow-xl transform transition-transform duration-300 ease-in-out">
                    {/* Header - Igual ao de criação */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Campanha</h2>
                                {/* Indicador de conexão em tempo real */}
                                <div className="flex items-center space-x-2">
                                    {isConnected ? (
                                        <div className="flex items-center space-x-1 text-green-600">
                                            <Wifi className="w-4 h-4" />
                                            <span className="text-xs font-medium">Tempo Real</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-1 text-gray-400">
                                            <WifiOff className="w-4 h-4" />
                                            <span className="text-xs font-medium">Offline</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content - Igual ao de criação */}
                    <div className="px-6 pb-6 space-y-6">
                        {/* Prêmio da Campanha - Imagens Maiores */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-[#1e293b] rounded-lg flex items-center justify-center">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-lg font-bold text-[#1e293b]">Prêmio da Campanha</h4>
                                </div>
                                
                            {goal.campanhas_premios && goal.campanhas_premios.length > 0 ? (
                                <div className="space-y-6">
                                    {goal.campanhas_premios.map((campanhaPremio) => (
                                        <div key={campanhaPremio.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                            <div className="flex flex-col items-center text-center">
                                                {/* Imagem Grande e Ajustada */}
                                            {(campanhaPremio.premio.imagem_url || campanhaPremio.premio.imagem_miniatura_url) ? (
                                                <img
                                                    src={campanhaPremio.premio.imagem_url || campanhaPremio.premio.imagem_miniatura_url}
                                                    alt={campanhaPremio.premio.nome}
                                                        className="w-48 h-48 object-contain bg-gray-100 rounded-lg shadow-lg mb-4"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                    <div className="w-48 h-48 bg-[#49de80] rounded-lg flex items-center justify-center shadow-lg mb-4">
                                                        <Award className="w-24 h-24 text-white" />
                                                </div>
                                            )}
                                            
                                                {/* Informações do Prêmio */}
                                                <div className="space-y-3">
                                                    <h5 className="font-bold text-2xl text-[#1e293b]">
                                                    {campanhaPremio.premio.nome}
                                                </h5>
                                                    <div className="text-sm text-gray-600">
                                                    {campanhaPremio.premio.categoria?.nome} • {campanhaPremio.premio.tipo?.nome}
                                                    </div>
                                                    
                                                    {/* Quantidade */}
                                                    <div className="flex items-center justify-center">
                                                    <div className="text-sm text-gray-500">
                                                            Quantidade: {campanhaPremio.quantidade}
                                                    </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-10 h-10 text-gray-500" />
                                    </div>
                                    <p className="text-gray-600 text-sm">Nenhum prêmio definido para esta campanha</p>
                                    <p className="text-gray-500 text-xs mt-1">Entre em contato com o administrador</p>
                            </div>
                        )}
                        </div>

                        {/* Informações da Campanha */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-[#1e293b] rounded-lg flex items-center justify-center">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-[#1e293b]">{goal.title}</h4>
                            </div>
                            
                            {/* Todas as informações em uma única linha compacta */}
                            <div className="flex items-center justify-between text-sm mb-6 flex-wrap gap-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Tipo:</span>
                                    <span className="font-medium text-[#1e293b]">{getTypeLabel(goal.type)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        goal.status === 'active' 
                                            ? 'bg-[#49de80] bg-opacity-20 text-[#49de80] border border-[#49de80] border-opacity-30'
                                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Período:</span>
                                    <span className="font-medium text-[#1e293b]">{getPeriodLabel(goal.target_period)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Criada em:</span>
                                    <span className="font-medium text-[#1e293b]">{formatDate(goal.created_at)}</span>
                                </div>
                            </div>

                            {goal.description && (
                                <div className="pt-4 border-t border-gray-200">
                                    <span className="text-gray-600 text-sm font-medium">Descrição:</span>
                                    <p className="text-sm text-[#1e293b] mt-1">{goal.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Progresso Geral - Donut Chart + Métricas */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                            <h4 className="font-semibold text-[#1e293b] mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#1e293b] rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                Progresso da Campanha
                            </h4>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* Donut Chart */}
                                <div className="flex justify-center">
                                    <div className="relative w-48 h-48">
                                        {/* Donut Chart SVG */}
                                        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                                            {/* Background Circle */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="none"
                                                stroke="#e5e7eb"
                                                strokeWidth="8"
                                            />
                                            {/* Progress Circle */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="none"
                                                stroke={progress >= 100 ? "#10b981" : "#1e293b"}
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        
                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="text-3xl font-bold text-[#1e293b]">
                                                {progress.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600 text-center">
                                                {isCompleted ? 'Concluída' : 'Em andamento'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Métricas Detalhadas */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-bold text-[#1e293b]">
                                                {goal.type === 'valor' ? formatCurrency(goal.current_value) : goal.current_value.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Valor Atual</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-bold text-[#49de80]">
                                                {goal.type === 'valor' ? formatCurrency(goal.target) : goal.target.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600">Meta</div>
                                        </div>
                                    </div>
                                    
                                    {/* Barra de Progresso Linear (Backup) */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Progresso</span>
                                            <span>{progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    progress >= 100 ? 'bg-green-500' : 'bg-[#1e293b]'
                                                }`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Status da Campanha */}
                                    <div className="text-center">
                                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                            isCompleted 
                                                ? 'bg-[#49de80] bg-opacity-20 text-[#49de80] border border-[#49de80] border-opacity-30' 
                                                : 'bg-[#1e293b] bg-opacity-10 text-[#1e293b] border border-[#1e293b] border-opacity-20'
                                        }`}>
                                            {isCompleted ? '🎉 Campanha Concluída!' : 'Campanha em andamento'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Critérios Individuais - Para campanhas compostas */}
                        {goal.campaign_type === 'composite' && goal.criteria && (
                            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                                <h4 className="font-semibold text-[#1e293b] mb-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#1e293b] rounded-lg flex items-center justify-center">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    Critérios da Campanha
                                </h4>
                                
                                <div className="space-y-4">
                                    {(() => {
                                        try {
                                            const criteria = Array.isArray(goal.criteria) ? goal.criteria : JSON.parse(goal.criteria);
                                            
                                            return criteria.map((criterion: any, index: number) => {
                                                // Calcular progresso do critério
                                                let criterionProgress = 0;
                                                let currentValue = 0;
                                                let targetValue = criterion.target_value || 0;
                                                
                                                if (goal.current_value === 0) {
                                                    criterionProgress = 0;
                                                    currentValue = 0;
                                                } else {
                                                    if (criterion.target_type === 'value') {
                                                        currentValue = Math.min(goal.current_value || 0, targetValue);
                                                        criterionProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
                                                    } else {
                                                        const avgPolicyValue = 15000;
                                                        currentValue = Math.floor((goal.current_value || 0) / avgPolicyValue);
                                                        criterionProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
                                                    }
                                                }
                                        
                                        return (
                                                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                                        <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                                <div className="text-sm font-medium text-gray-700">
                                                                    Critério {index + 1}: {criterion.policy_type || 'Geral'}
                                                        </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {criterion.target_type === 'value' 
                                                                        ? `Meta: ${formatCurrency(targetValue)}`
                                                                        : `Meta: ${targetValue} apólices`
                                                                    }
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                                <div className="text-sm font-medium text-gray-700">
                                                                    {criterion.target_type === 'value' 
                                                                        ? formatCurrency(currentValue)
                                                                        : `${currentValue} apólices`
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-500">Atual</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                            <div 
                                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                                    criterionProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                                                }`}
                                                                style={{ width: `${Math.min(criterionProgress, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-gray-600">
                                                                {criterionProgress.toFixed(1)}%
                                                            </div>
                                                            {criterionProgress >= 100 && (
                                                                <span className="text-green-600 text-xs">✓ Atingido</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        } catch (error) {
                                            return (
                                                <div className="text-center py-4">
                                                    <p className="text-red-500 text-sm">Erro ao processar critérios</p>
                                            </div>
                                        );
                                        }
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Apólices da Campanha */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                            <h4 className="font-semibold text-[#1e293b] mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#1e293b] rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                Apólices da Campanha
                            </h4>
                            
                            {policies.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <FileText className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <p className="text-gray-600 text-sm">Nenhuma apólice encontrada para esta campanha</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {goal.start_date && goal.end_date ? (
                                            <>Período: {formatDate(goal.start_date)} - {formatDate(goal.end_date)}</>
                                        ) : (
                                            <>Campanha ativa</>
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Resumo das apólices */}
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-[#1e293b]">{policies.length}</div>
                                            <div className="text-xs text-gray-600">Total de Apólices</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-[#49de80]">
                                                {formatCurrency(policies.reduce((sum, p) => {
                                                    const value = parseFloat(p.premium_value) || 0;
                                                    return sum + value;
                                                }, 0))}
                                            </div>
                                            <div className="text-xs text-gray-600">Valor Total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-[#49de80]">
                                                {(() => {
                                                    if (policies.length === 0) return formatCurrency(0);
                                                    
                                                    const totalValue = policies.reduce((sum, p) => {
                                                        const value = parseFloat(p.premium_value) || 0;
                                                        return sum + value;
                                                    }, 0);
                                                    
                                                    const averageValue = totalValue / policies.length;
                                                    return formatCurrency(averageValue);
                                                })()}
                                            </div>
                                            <div className="text-xs text-gray-600">Valor Médio</div>
                                        </div>
                                    </div>
                                    
                                    {/* Tabela completa de apólices */}
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="max-h-80">
                                            <table className="w-full text-sm table-fixed">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="w-40 px-3 py-3 text-left text-gray-700 font-medium">Apólice</th>
                                                        <th className="w-32 px-3 py-3 text-left text-gray-700 font-medium">Tipo</th>
                                                        <th className="w-32 px-3 py-3 text-left text-gray-700 font-medium">Status</th>
                                                        <th className="w-28 px-3 py-3 text-left text-gray-700 font-medium">CPD</th>
                                                        <th className="w-60 px-3 py-3 text-left text-gray-700 font-medium">Corretor</th>
                                                        <th className="w-32 px-3 py-3 text-right text-gray-700 font-medium">Valor</th>
                                                        <th className="w-36 px-3 py-3 text-right text-gray-700 font-medium">Data</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                        {policies.map((policy) => (
                                                        <tr key={policy.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                                                            <td className="px-3 py-3 text-[#1e293b] font-medium truncate">
                                                                {policy.policy_number}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                                            policy.type === 'Seguro Auto' 
                                                                        ? 'bg-[#1e293b] bg-opacity-10 text-[#1e293b] border border-[#1e293b] border-opacity-20' 
                                                                        : 'bg-[#49de80] bg-opacity-10 text-[#49de80] border border-[#49de80] border-opacity-30'
                                                        }`}>
                                                            {policy.type}
                                                        </span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                                            policy.contract_type === 'Novo' 
                                                                        ? 'bg-[#49de80] bg-opacity-10 text-[#49de80] border border-[#49de80] border-opacity-30' 
                                                                        : 'bg-[#1e293b] bg-opacity-10 text-[#1e293b] border border-[#1e293b] border-opacity-20'
                                                        }`}>
                                                            {policy.contract_type}
                                                        </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-700 text-xs">
                                                                {policy.cpd_number || 'N/A'}
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-700">
                                                                <div className="text-xs">
                                                                    <div className="font-medium truncate">
                                                                        {typeof policy.broker_name === 'string' ? policy.broker_name : 'N/A'}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        {typeof policy.campaign_received === 'string' ? policy.campaign_received : 'N/A'}
                                                    </div>
                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-right text-[#49de80] font-bold text-xs">
                                                        {formatCurrency(policy.premium_value || 0)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right text-gray-600 text-xs">
                                                        {formatDate(policy.registration_date)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                            <h4 className="font-semibold text-[#1e293b] mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#1e293b] rounded-lg flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-white" />
                                </div>
                                Ações
                            </h4>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Campanha
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Excluir Meta"
                message={`Tem certeza que deseja excluir a meta "${goal.title}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                isLoading={loading}
            />
        </>
    );
};

export default GoalDetailsSidepanel;
