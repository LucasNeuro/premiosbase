import React, { useState } from 'react';
import { Target, TrendingUp, Award, Calendar, Plus, Star, Zap, Gem, Crown } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { useAchievements } from '../../hooks/useAchievements';
import CreateGoalModal from './CreateGoalModal';

const GoalsOverview: React.FC = () => {
    const { goals, stats, loading } = useGoals();
    const { getUnlockedAchievements } = useAchievements();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Obter insígnias conquistadas
    const unlockedAchievements = getUnlockedAchievements();

    // Mapear ícones das insígnias
    const getAchievementIcon = (iconName: string) => {
        const iconMap: { [key: string]: React.ReactNode } = {
            'star': <Star className="w-6 h-6" />,
            'award': <Award className="w-6 h-6" />,
            'trending-up': <TrendingUp className="w-6 h-6" />,
            'target': <Target className="w-6 h-6" />,
            'gift': <Award className="w-6 h-6" />,
            'zap': <Zap className="w-6 h-6" />,
            'gem': <Gem className="w-6 h-6" />,
            'crown': <Crown className="w-6 h-6" />,
            'calendar': <Calendar className="w-6 h-6" />
        };
        return iconMap[iconName] || <Star className="w-6 h-6" />;
    };

    const getProgressPercentage = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'active': return 'bg-blue-500';
            case 'pending': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'apolices': return <Target className="w-5 h-5" />;
            case 'valor': return <TrendingUp className="w-5 h-5" />;
            case 'crescimento': return <Award className="w-5 h-5" />;
            default: return <Calendar className="w-5 h-5" />;
        }
    };

    const formatValue = (value: number, unit: string) => {
        if (unit === 'R$') {
            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        return `${value.toLocaleString('pt-BR')} ${unit}`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Seção de Insígnias Conquistadas */}
            {unlockedAchievements.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Insígnias Conquistadas</h3>
                            <p className="text-yellow-100 text-sm">Parabéns pelas suas conquistas!</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{unlockedAchievements.length}</div>
                            <div className="text-yellow-100 text-sm">insígnias desbloqueadas</div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        {unlockedAchievements.slice(0, 6).map((achievement) => (
                            <div key={achievement.id} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 min-w-0">
                                <div className="text-white">
                                    {getAchievementIcon(achievement.icon_name)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-white font-semibold text-sm truncate">{achievement.name}</h4>
                                    <p className="text-yellow-100 text-xs truncate">{achievement.description}</p>
                                </div>
                            </div>
                        ))}
                        {unlockedAchievements.length > 6 && (
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    +{unlockedAchievements.length - 6} mais
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Suas Metas</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Atualizado em tempo real</span>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Meta
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = getProgressPercentage(goal.current, goal.target);
                    const isCompleted = goal.status === 'completed';
                    
                    return (
                        <div key={goal.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${getStatusColor(goal.status)}`}>
                                        {getTypeIcon(goal.type)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                                        <p className="text-sm text-slate-400">{goal.period}</p>
                                    </div>
                                </div>
                                {isCompleted && (
                                    <div className="text-green-400">
                                        <Award className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-white">
                                        {formatValue(goal.current, goal.type === 'valor' ? 'R$' : 'apólices')}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                        de {formatValue(goal.target, goal.type === 'valor' ? 'R$' : 'apólices')}
                                    </span>
                                </div>

                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">
                                        {progress.toFixed(1)}% concluído
                                    </span>
                                    <span className={`font-medium ${
                                        isCompleted ? 'text-green-400' : 'text-blue-400'
                                    }`}>
                                        {isCompleted ? 'Meta Atingida!' : `${formatValue(goal.target - goal.current, goal.type === 'valor' ? 'R$' : 'apólices')} restantes`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resumo de Performance */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Performance Geral</h3>
                        <p className="text-blue-100">
                            {stats.monthlyGrowth > 0 
                                ? `Crescimento de ${stats.monthlyGrowth.toFixed(1)}% este mês!`
                                : 'Continue trabalhando para alcançar suas metas!'
                            }
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{stats.performancePercentage.toFixed(0)}%</div>
                        <div className="text-blue-100 text-sm">das metas atingidas</div>
                    </div>
                </div>
            </div>

            {/* Modal para criar nova meta */}
            {showCreateModal && (
                <CreateGoalModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
};

export default GoalsOverview;
