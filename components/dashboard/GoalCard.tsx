import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Award, DollarSign, FileText, Calendar, Eye, Clock } from 'lucide-react';
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
}

interface GoalCardProps {
    goal: Goal;
    progress: number;
    onClick: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, progress, onClick }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    const formatCurrency = (value: number) => {
        return currencyMask(value.toString());
    };

    // Contagem regressiva para o prazo
    useEffect(() => {
        if (!goal.end_date) return;

        const updateCountdown = () => {
            const now = new Date();
            const endDate = new Date(goal.end_date!);
            const diff = endDate.getTime() - now.getTime();

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Expirada');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes}m`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Atualiza a cada minuto

        return () => clearInterval(interval);
    }, [goal.end_date]);

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
        if (goal.start_date && goal.end_date) {
            try {
                const start = new Date(goal.start_date);
                const end = new Date(goal.end_date);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return `${diffDays} dias`;
            } catch (error) {
                return null;
            }
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

    // Status baseado no progresso e prazo
    const isCompleted = progress >= 100;
    const today = new Date();
    const endDate = goal.end_date ? new Date(goal.end_date) : null;
    const isExpiredByDate = endDate && today > endDate && !isCompleted;
    
    const getStatusColor = () => {
        if (isCompleted) {
            return 'bg-green-100 text-green-800 border-green-200';
        } else if (isExpired || isExpiredByDate) {
            return 'bg-red-100 text-red-800 border-red-200';
        }
        return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getStatusLabel = () => {
        if (isCompleted) {
            return 'Atingida';
        } else if (isExpired || isExpiredByDate) {
            return 'Não Atingida';
        }
        return 'Ativa';
    };

    return (
        <div 
            className={`relative bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer group transition-all duration-200 ${
                isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : (isExpired || isExpiredByDate)
                        ? 'border-red-200 bg-red-50' 
                        : 'hover:border-[#49de80]'
            }`}
            onClick={onClick}
        >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                    {isCompleted && <Award className="w-3 h-3 mr-1" />}
                    {getStatusLabel()}
                </span>
            </div>

            {/* Header com Valor em Destaque */}
            <div className="mb-2">
                <h3 className="font-semibold text-gray-900 mb-2">{goal.title}</h3>
                
                {/* Valor em Destaque */}
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${
                        isCompleted 
                            ? 'bg-green-100' 
                            : (isExpired || isExpiredByDate)
                                ? 'bg-red-100' 
                                : 'bg-blue-100'
                    }`}>
                        {getTypeIcon(goal.type)}
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900">
                            {goal.type === 'valor' 
                                ? formatCurrency(goal.target || 0) 
                                : `${goal.target || 0} apólices`
                            }
                        </div>
                        <div className="text-xs text-gray-500">
                            {getTypeLabel(goal.type)}
                        </div>
                    </div>
                </div>

                {/* Contagem Regressiva e Data de Criação */}
                <div className="space-y-1">
                    {goal.end_date && !isCompleted && (
                        <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={`font-medium ${
                                isExpired || isExpiredByDate 
                                    ? 'text-red-600' 
                                    : 'text-gray-600'
                            }`}>
                                {timeLeft}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                                até {formatDate(goal.end_date)}
                            </span>
                        </div>
                    )}
                    
                    {/* Data de Criação */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Criada: {formatDate(goal.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#49de80] hover:text-[#1E293B] hover:bg-[#49de80] hover:bg-opacity-10 rounded-lg transition-all duration-200 group">
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </button>
            </div>

            {/* Completion Badge */}
            {isCompleted && (
                <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalCard;
