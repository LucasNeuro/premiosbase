import React from 'react';
import { X, Target, TrendingUp, Calendar, Award, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { currencyMask } from '../../utils/masks';

interface Goal {
    id: string;
    title: string;
    target: number;
    current_value: number;
    type: string;
    status: string;
    target_period: string;
    description?: string;
    created_at: string;
    unit?: string;
    start_date?: string;
    end_date?: string;
    // Campos para campanhas compostas
    campaign_type?: 'simple' | 'composite';
    criteria?: any[];
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

interface GoalDetailsSidepanelProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    progress: number;
    policyData?: any;
    periodData?: {
        current: number;
        previous: number;
        growth: number;
    };
}

const GoalDetailsSidepanel: React.FC<GoalDetailsSidepanelProps> = ({ 
    isOpen, 
    onClose, 
    goal,
    progress,
    policyData,
    periodData 
}) => {
    if (!isOpen || !goal) return null;
    
    // Verificar se todos os critérios estão 100% (se houver critérios)
    const allCriteriaCompleted = !goal.criteria || goal.criteria.length === 0 || 
        goal.criteria.every((criterio: any) => {
            const criterionProgress = ((criterio.current_value || 0) / (criterio.target_value || 1) * 100);
            return criterionProgress >= 100;
        });
    
    // Só mostrar "Meta Conquistada" se todos os critérios estiverem 100%
    const shouldShowMetaConquistada = progress >= 100 && allCriteriaCompleted;

    const formatCurrency = (value: number) => {
        return currencyMask(value.toString());
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const getCampaignDuration = () => {
        if (goal?.start_date && goal?.end_date) {
            const start = new Date(goal.start_date);
            const end = new Date(goal.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return `${diffDays} dias`;
        }
        return null;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'valor':
                return <DollarSign className="w-5 h-5" />;
            case 'apolices':
                return <FileText className="w-5 h-5" />;
            case 'crescimento':
                return <TrendingUp className="w-5 h-5" />;
            default:
                return <Target className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            'apolices': 'Apólices',
            'valor': 'Valor',
            'crescimento': 'Crescimento'
        };
        return labels[type as keyof typeof labels] || type;
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'active':
                return 'bg-[#1E293B] text-white';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            'completed': 'Concluída',
            'active': 'Ativa',
            'paused': 'Pausada',
            'cancelled': 'Cancelada'
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-green-500';
        if (progress >= 75) return 'bg-[#49de80]';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getMotivationalMessage = (progress: number) => {
        if (shouldShowMetaConquistada) return "🎉 Parabéns! Meta conquistada!";
        if (progress >= 75) return "🔥 Você está quase lá! Continue assim!";
        if (progress >= 50) return "💪 Metade do caminho percorrido!";
        if (progress >= 25) return "🚀 Bom começo! Mantenha o foco!";
        return "🎯 Vamos começar! Você consegue!";
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            
            <div className="absolute right-0 top-[-1px] h-screen w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                {/* Header Simples */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Detalhes da Campanha</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100vh-80px)]">
                    {/* FOTO DO PRÊMIO EM DESTAQUE - SEMPRE VISÍVEL PARA ESTIMULAR */}
                    {goal.campanhas_premios && goal.campanhas_premios.length > 0 ? (
                        <div className="relative">
                            {/* Imagem Principal do Prêmio */}
                            <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
                                {goal.campanhas_premios[0].premio.imagem_miniatura_url ? (
                                    <img
                                        src={goal.campanhas_premios[0].premio.imagem_miniatura_url}
                                        alt={goal.campanhas_premios[0].premio.nome}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                                        <Award className="w-16 h-16 text-yellow-600" />
                                    </div>
                                )}
                                
                                {/* Badge de Status - Baseado no progresso da campanha */}
                                <div className="absolute top-3 right-3">
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        shouldShowMetaConquistada 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-blue-500 text-white'
                                    }`}>
                                        {shouldShowMetaConquistada ? 'Conquistado' : 'Em Andamento'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Informações do Prêmio */}
                            <div className="p-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                    {goal.campanhas_premios[0].premio.nome}
                                </h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg font-bold text-green-600">
                                        R$ {goal.campanhas_premios[0].premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        • {goal.campanhas_premios[0].premio.categoria?.nome}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {goal.campanhas_premios[0].premio.tipo?.nome} • Quantidade: {goal.campanhas_premios[0].quantidade}
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Seção quando não há prêmio - Mostrar que será definido */
                        <div className="relative">
                            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden flex items-center justify-center">
                                <div className="text-center">
                                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                    <h3 className="text-lg font-bold text-gray-600 mb-1">Prêmio em Definição</h3>
                                    <p className="text-sm text-gray-500">Prêmio será definido em breve</p>
                                </div>
                            </div>
                            
                            <div className="p-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                    Recompensa da Campanha
                                </h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg font-bold text-gray-600">
                                        A ser definido
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        • Em breve
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    O prêmio desta campanha será definido em breve. Continue acompanhando!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RESUMO DA CAMPANHA - Simples como Google Maps */}
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
                        
                        {/* Status da Campanha - CORRIGIDO */}
                        <div className="flex items-center gap-2 mb-3">
                            {shouldShowMetaConquistada ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Meta Atingida
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    Em Progresso
                                </span>
                            )}
                            <span className="text-sm text-gray-500">
                                {progress.toFixed(1)}% concluído
                            </span>
                        </div>
                        
                        {/* DADOS DE ATINGIMENTO - Sempre visível */}
                        <div className={`mb-3 p-3 rounded-lg border ${
                            shouldShowMetaConquistada 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-blue-50 border-blue-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className={`w-4 h-4 ${
                                    shouldShowMetaConquistada ? 'text-green-600' : 'text-blue-600'
                                }`} />
                                <span className={`text-sm font-medium ${
                                    shouldShowMetaConquistada ? 'text-green-800' : 'text-blue-800'
                                }`}>
                                    {shouldShowMetaConquistada ? 'Meta Conquistada!' : 'Meta em Andamento'}
                                </span>
                            </div>
                            <div className={`text-xs ${
                                shouldShowMetaConquistada ? 'text-green-700' : 'text-blue-700'
                            }`}>
                                {shouldShowMetaConquistada ? (
                                    <>
                                        Parabéns! Você atingiu <strong>{progress.toFixed(1)}%</strong> da meta
                                        {progress > 100 && (
                                            <span className="ml-1">
                                                - <strong>{(progress - 100).toFixed(1)}%</strong> acima do esperado!
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        Você atingiu <strong>{progress.toFixed(1)}%</strong> da meta
                                        <span className="ml-1">
                                            - <strong>{(100 - progress).toFixed(1)}%</strong> restantes para completar!
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Progresso Visual Simples */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    shouldShowMetaConquistada ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                        
                        {/* Valores - Melhorados para mostrar atingimento */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    {goal.type === 'valor' 
                                        ? formatCurrency(goal.current_value || 0) 
                                        : `${goal.current_value || 0} apólices`
                                    }
                                </span>
                                <span className="text-gray-600">
                                    de {goal.type === 'valor' 
                                        ? formatCurrency(goal.target || 0) 
                                        : `${goal.target || 0} apólices`
                                    }
                                </span>
                            </div>
                            
                            {/* DIFERENÇA - Quando meta foi superada */}
                            {shouldShowMetaConquistada && goal.type === 'valor' && (
                                <div className="text-xs text-green-600 font-medium">
                                    +{formatCurrency((goal.current_value || 0) - (goal.target || 0))} acima da meta
                                </div>
                            )}
                        </div>
                        
                        {/* Período */}
                        {goal.start_date && goal.end_date && (
                            <div className="mt-3 text-sm text-gray-500">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                            </div>
                        )}
                    </div>

                    {/* CRITÉRIOS SIMPLIFICADOS - Só se for campanha composta */}
                    {goal.campaign_type === 'composite' && goal.criteria && Array.isArray(goal.criteria) && goal.criteria.length > 0 && (
                        <div className="p-4 border-b border-gray-100">
                            <h4 className="font-medium text-gray-900 mb-3">Critérios da Campanha</h4>
                            
                            {/* Resumo dos Critérios */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Resumo dos Critérios</span>
                                </div>
                                <div className="text-xs text-blue-700">
                                    {goal.criteria.length === 1 
                                        ? '1 critério para atingir'
                                        : `${goal.criteria.length} critérios para atingir`
                                    } • Todos devem ser 100% completos para conquistar o prêmio
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {goal.criteria.map((criterio: any, index: number) => {
                                    const progress = ((criterio.current_value || 0) / (criterio.target_value || 1) * 100);
                                    const isCompleted = progress >= 100;
                                    
                                    return (
                                        <div key={index} className={`p-3 rounded-lg border ${
                                            isCompleted 
                                                ? 'bg-green-50 border-green-200' 
                                                : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-900 capitalize">
                                                        {criterio.policy_type === 'auto' ? 'Auto' : 'Residencial'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {criterio.target_type === 'value' 
                                                            ? formatCurrency(criterio.target_value || 0)
                                                            : `${criterio.target_value || 0} apólices`
                                                        }
                                                        {criterio.min_value_per_policy && criterio.min_value_per_policy > 0 && (
                                                            <span className="ml-2 text-blue-600">
                                                                (mín. {formatCurrency(criterio.min_value_per_policy)})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${
                                                        isCompleted ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                        {progress.toFixed(0)}%
                                                    </div>
                                                    {isCompleted && (
                                                        <div className="text-xs text-green-600 font-medium">Concluído</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* DESCRIÇÃO SIMPLES - Só se existir */}
                    {goal.description && (
                        <div className="p-4 border-b border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed">{goal.description}</p>
                        </div>
                    )}

                    {/* BADGE DE CONQUISTA - Só se meta atingida */}
                    {shouldShowMetaConquistada && (
                        <div className="p-4 bg-green-50 border-b border-green-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <Award className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-green-800">🎉 Meta Conquistada!</h5>
                                    <p className="text-sm text-green-600">Parabéns por alcançar sua meta!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoalDetailsSidepanel;
