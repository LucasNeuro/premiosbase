import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Target, TrendingUp, Award, Plus, Calendar, Trophy, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGoalProgress } from '../../hooks/useGoalProgress';
import GoalCard from './GoalCard';
import GoalDetailsSidepanel from './GoalDetailsSidepanel';

interface Goal {
    id: string;
    title: string;
    target: number;
    current_value: number;
    type: string;
    status: string;
    target_period: string;
    created_at: string;
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

const GoalsOverview: React.FC = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    
    // Hook para calcular progresso em tempo real
    const { 
        progressData, 
        policyData, 
        loading: progressLoading, 
        getGoalProgress, 
        getOverallProgress, 
        getCompletedGoals 
    } = useGoalProgress(user?.id || '', goals);

    useEffect(() => {
        if (user?.id) {
            fetchGoals();
        }
    }, [user?.id]);

    const fetchGoals = async () => {
        try {
            // Buscar campanhas atribuídas ao usuário atual
            const { data, error } = await supabase
                .from('goals')
                .select(`
                    *,
                    users!goals_user_id_fkey (
                        id,
                        name,
                        email
                    ),
                    campanhas_premios(
                        id,
                        quantidade,
                        entregue,
                        premio:premios(
                            id,
                            nome,
                            valor_estimado,
                            imagem_miniatura_url,
                            categoria:categorias_premios!premios_categoria_id_fkey(nome),
                            tipo:tipos_premios!premios_tipo_id_fkey(nome)
                        )
                    )
                `)
                .eq('user_id', user?.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                return;
            }

            setGoals(data || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
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

    const handleGoalClick = (goal: Goal) => {
        setSelectedGoal(goal);
        setShowDetailsPanel(true);
    };

    const handleCloseDetailsPanel = () => {
        setShowDetailsPanel(false);
        setSelectedGoal(null);
    };

    // Lógica para categorizar campanhas
    const categorizeGoals = () => {
        const active = [];
        const completed = [];
        const expired = [];
        
        goals.forEach(goal => {
            const goalProgress = getGoalProgress(goal.id);
            const progress = goalProgress ? goalProgress.progress : 0;
            const today = new Date();
            const endDate = goal.end_date ? new Date(goal.end_date) : null;
            
            if (progress >= 100) {
                completed.push(goal);
            } else if (endDate && today > endDate) {
                expired.push(goal);
            } else {
                active.push(goal);
            }
        });
        
        return { active, completed, expired };
    };
    
    const { active, completed, expired } = categorizeGoals();

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estatísticas Detalhadas - MOVIDO PARA O TOPO */}
            {goals.length > 0 && (
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#49de80]" />
                        Estatísticas Detalhadas
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400">
                                {active.length}
                            </div>
                            <div className="text-sm text-slate-300">Ativas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-400">
                                {completed.length}
                            </div>
                            <div className="text-sm text-slate-300">Atingidas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-400">
                                {expired.length}
                            </div>
                            <div className="text-sm text-slate-300">Não Atingidas</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban de Campanhas */}
            {goals.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="text-center py-12">
                        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-500 mb-2">Nenhuma campanha definida</h4>
                        <p className="text-sm text-gray-400">Aguarde o administrador definir as campanhas da empresa.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna: Ativas */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-900">Ativas</h3>
                            <span className="text-sm text-gray-500">({active.length})</span>
                        </div>
                        <div className="space-y-3">
                            {active.map((goal) => {
                                const goalProgress = getGoalProgress(goal.id);
                                const progress = goalProgress ? goalProgress.progress : 0;
                                
                                return (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        progress={progress}
                                        onClick={() => handleGoalClick(goal)}
                                    />
                                );
                            })}
                            {active.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    Nenhuma campanha ativa
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna: Atingidas */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-900">Atingidas</h3>
                            <span className="text-sm text-gray-500">({completed.length})</span>
                        </div>
                        <div className="space-y-3">
                            {completed.map((goal) => {
                                const goalProgress = getGoalProgress(goal.id);
                                const progress = goalProgress ? goalProgress.progress : 0;
                                
                                return (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        progress={progress}
                                        onClick={() => handleGoalClick(goal)}
                                    />
                                );
                            })}
                            {completed.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    Nenhuma campanha atingida
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna: Não Atingidas */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-900">Não Atingidas</h3>
                            <span className="text-sm text-gray-500">({expired.length})</span>
                        </div>
                        <div className="space-y-3">
                            {expired.map((goal) => {
                                const goalProgress = getGoalProgress(goal.id);
                                const progress = goalProgress ? goalProgress.progress : 0;
                                
                                return (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        progress={progress}
                                        onClick={() => handleGoalClick(goal)}
                                    />
                                );
                            })}
                            {expired.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    Nenhuma campanha expirada
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sidepanel de Detalhes */}
            <GoalDetailsSidepanel
                isOpen={showDetailsPanel}
                onClose={handleCloseDetailsPanel}
                goal={selectedGoal}
                progress={selectedGoal ? (getGoalProgress(selectedGoal.id)?.progress || 0) : 0}
                policyData={policyData}
                periodData={selectedGoal ? (getGoalProgress(selectedGoal.id)?.periodData) : undefined}
            />
        </div>
    );
};

export default GoalsOverview;
