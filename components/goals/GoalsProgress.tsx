import React, { useMemo } from 'react';
import { TrendingUp, Calendar, BarChart3, Target, Award } from 'lucide-react';
import { useGoals } from '../../hooks/useGoalsNew';

const GoalsProgress: React.FC = () => {
    const { stats, goals } = useGoals();
    
    // Calcular progresso das metas baseado em dados reais
    const goalsProgress = useMemo(() => {
        return goals.map(goal => {
            let current = 0;
            let target = goal.target;
            
            switch (goal.type) {
                case 'apolices':
                    current = stats.totalApolices;
                    break;
                case 'valor':
                    current = stats.totalValor;
                    break;
                case 'crescimento':
                    current = stats.monthlyGrowth;
                    break;
            }
            
            const progress = Math.min((current / target) * 100, 100);
            const isCompleted = progress >= 100;
            
            return {
                ...goal,
                current,
                progress,
                isCompleted
            };
        });
    }, [goals, stats]);

    const completedGoals = goalsProgress.filter(g => g.isCompleted).length;
    const totalGoals = goalsProgress.length;
    const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Progresso das Metas
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Award className="w-4 h-4" />
                    <span>{completedGoals}/{totalGoals} concluídas</span>
                </div>
            </div>

            {/* Progresso Geral */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Progresso Geral</span>
                    <span className="text-lg font-bold text-white">{overallProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${overallProgress}%` }}
                    ></div>
                </div>
            </div>

            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total de Apólices</p>
                            <p className="text-xl font-bold text-white">{stats.totalApolices}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Valor Total</p>
                            <p className="text-xl font-bold text-white">R$ {stats.totalValor.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Crescimento</p>
                            <p className="text-xl font-bold text-white">+{stats.monthlyGrowth}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Metas */}
            {goalsProgress.length > 0 ? (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Suas Metas</h4>
                    <div className="space-y-3">
                        {goalsProgress.map((goal) => (
                            <div key={goal.id} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-white">{goal.title}</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        goal.isCompleted 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                        {goal.isCompleted ? 'Concluída' : 'Em andamento'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                                    <span>{goal.period}</span>
                                    <span>{goal.current.toLocaleString('pt-BR')} / {goal.target.toLocaleString('pt-BR')}</span>
                                </div>
                                
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            goal.isCompleted 
                                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                        }`}
                                        style={{ width: `${goal.progress}%` }}
                                    ></div>
                                </div>
                                
                                <div className="text-right text-xs text-slate-500 mt-1">
                                    {goal.progress.toFixed(1)}% concluído
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">Nenhuma meta definida ainda</p>
                    <p className="text-sm text-slate-500">Crie sua primeira meta para começar a acompanhar seu progresso!</p>
                </div>
            )}

            {/* Insights */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
                <h5 className="text-blue-400 font-semibold mb-2">💡 Insight</h5>
                <p className="text-blue-100 text-sm">
                    {completedGoals > 0 
                        ? `Parabéns! Você já concluiu ${completedGoals} meta${completedGoals > 1 ? 's' : ''}. Continue assim!`
                        : totalGoals > 0
                            ? `Você tem ${totalGoals} meta${totalGoals > 1 ? 's' : ''} em andamento. Foque em uma por vez!`
                            : 'Defina suas primeiras metas para começar a acompanhar seu progresso!'
                    }
                </p>
            </div>
        </div>
    );
};

export default GoalsProgress;
