import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GoalCalculationService, GoalCalculationResult } from '../services/goalCalculationService';

interface GoalProgress {
    goalId: string;
    current: number;
    progress: number;
    isCompleted: boolean;
    lastUpdated: string;
    periodData: {
        current: number;
        previous: number;
        growth: number;
    };
}

interface PolicyData {
    totalValue: number;
    totalCount: number;
    monthlyValue: number;
    monthlyCount: number;
    quarterlyValue: number;
    quarterlyCount: number;
    yearlyValue: number;
    yearlyCount: number;
}

export const useGoalProgress = (userId: string, goals: any[]) => {
    const [progressData, setProgressData] = useState<GoalProgress[]>([]);
    const [policyData, setPolicyData] = useState<PolicyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId && goals.length > 0) {
            fetchProgressData();
        }
    }, [userId, goals]);

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            
            // Buscar dados do cache de progresso das metas (com fallback)
            let progressCache = null;
            try {
                const { data, error } = await supabase
                    .from('goal_progress_cache')
                    .select('*')
                    .eq('user_id', userId);
                
                if (error) {
                    } else {
                    progressCache = data;
                }
            } catch (cacheError) {
                }

            // Buscar dados das apólices para estatísticas gerais
            const { data: policies, error: policiesError } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', userId);

            if (policiesError) {
                return;
            }

            // Calcular dados das apólices por período
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const currentQuarter = Math.floor(currentMonth / 3) + 1;

            const policyStats: PolicyData = {
                totalValue: 0,
                totalCount: 0,
                monthlyValue: 0,
                monthlyCount: 0,
                quarterlyValue: 0,
                quarterlyCount: 0,
                yearlyValue: 0,
                yearlyCount: 0
            };

            policies?.forEach(policy => {
                const policyDate = new Date(policy.created_at);
                const policyMonth = policyDate.getMonth();
                const policyYear = policyDate.getFullYear();
                const policyQuarter = Math.floor(policyMonth / 3) + 1;
                const policyValue = policy.premium_value || 0;

                // Total
                policyStats.totalValue += policyValue;
                policyStats.totalCount += 1;

                // Mês atual
                if (policyMonth === currentMonth && policyYear === currentYear) {
                    policyStats.monthlyValue += policyValue;
                    policyStats.monthlyCount += 1;
                }

                // Trimestre atual
                if (policyQuarter === currentQuarter && policyYear === currentYear) {
                    policyStats.quarterlyValue += policyValue;
                    policyStats.quarterlyCount += 1;
                }

                // Ano atual
                if (policyYear === currentYear) {
                    policyStats.yearlyValue += policyValue;
                    policyStats.yearlyCount += 1;
                }
            });

            setPolicyData(policyStats);

            // Usar dados do cache para progresso das metas (com fallback)
            const progressCalculations: GoalProgress[] = goals.map(goal => {
                const cacheData = progressCache?.find(cache => cache.id === goal.id);
                
                // Se não há cache, usar dados diretos da meta
                const currentValue = cacheData?.current_value || goal.current_value || 0;
                const progressPercentage = cacheData?.progress_percentage || 
                    (goal.target > 0 ? (currentValue / goal.target) * 100 : 0);
                
                return {
                    goalId: goal.id,
                    current: currentValue,
                    progress: progressPercentage,
                    isCompleted: progressPercentage >= 100,
                    lastUpdated: cacheData?.last_updated || goal.last_updated || new Date().toISOString(),
                    periodData: {
                        current: currentValue,
                        previous: 0, // TODO: Implementar histórico
                        growth: 0
                    }
                };
            });

            setProgressData(progressCalculations);

        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // Função removida - agora o trigger automático cuida da atualização

    const getGoalProgress = (goalId: string): GoalProgress | undefined => {
        return progressData.find(p => p.goalId === goalId);
    };

    const getOverallProgress = (): number => {
        if (progressData.length === 0) return 0;
        const totalProgress = progressData.reduce((sum, p) => sum + p.progress, 0);
        return totalProgress / progressData.length;
    };

    const getCompletedGoals = (): number => {
        return progressData.filter(p => p.isCompleted).length;
    };

    return {
        progressData,
        policyData,
        loading,
        getGoalProgress,
        getOverallProgress,
        getCompletedGoals,
        refreshProgress: fetchProgressData
    };
};
