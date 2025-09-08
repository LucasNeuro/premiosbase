import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { PolicyType } from '../types';

export interface Goal {
    id: string;
    userId: string;
    title: string;
    target: number;
    current: number;
    period: string;
    type: 'apolices' | 'valor';
    status: 'active' | 'completed' | 'pending';
    createdAt: string;
    updatedAt: string;
}

export interface GoalStats {
    totalApolices: number;
    totalValor: number;
    monthlyGrowth: number;
    goalsCompleted: number;
    goalsActive: number;
    performancePercentage: number;
}

interface GoalsContextType {
    goals: Goal[];
    stats: GoalStats;
    loading: boolean;
    addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'current' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string }>;
    updateGoal: (id: string, updates: Partial<Goal>) => Promise<{ success: boolean; message: string }>;
    deleteGoal: (id: string) => Promise<{ success: boolean; message: string }>;
    refreshGoals: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children, userId }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [policies, setPolicies] = useState<any[]>([]);

    // Buscar políticas do usuário para calcular estatísticas
    const fetchPolicies = useCallback(async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching policies:', error);
                return;
            }

            setPolicies(data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
        }
    }, [userId]);

    // Buscar metas do usuário
    const fetchGoals = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            // Primeiro, atualizar progresso completo (metas + insígnias)
            const { error: updateError } = await supabase.rpc('update_user_progress_complete', {
                p_user_id: userId
            });

            if (updateError) {
                console.error('Error updating complete progress:', updateError);
            }

            // Depois, buscar as metas atualizadas
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching goals:', error);
                return;
            }

            console.log('Metas encontradas:', data);
            setGoals(data || []);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Calcular estatísticas baseadas nas políticas
    const calculateStats = useCallback((policies: any[]): GoalStats => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Políticas do mês atual
        const currentMonthPolicies = policies.filter(p => {
            const policyDate = new Date(p.created_at);
            return policyDate.getMonth() === currentMonth && policyDate.getFullYear() === currentYear;
        });

        // Políticas do mês anterior
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const previousMonthPolicies = policies.filter(p => {
            const policyDate = new Date(p.created_at);
            return policyDate.getMonth() === previousMonth && policyDate.getFullYear() === previousYear;
        });

        const totalApolices = currentMonthPolicies.length;
        const totalValor = currentMonthPolicies.reduce((sum, p) => sum + Number(p.premium_value), 0);
        
        const previousApolices = previousMonthPolicies.length;
        const monthlyGrowth = previousApolices > 0 
            ? ((totalApolices - previousApolices) / previousApolices) * 100 
            : 0;

        // Calcular metas completadas
        const goalsCompleted = goals.filter(g => g.status === 'completed').length;
        const goalsActive = goals.filter(g => g.status === 'active').length;
        const performancePercentage = goals.length > 0 ? (goalsCompleted / goals.length) * 100 : 0;

        return {
            totalApolices,
            totalValor,
            monthlyGrowth,
            goalsCompleted,
            goalsActive,
            performancePercentage
        };
    }, [goals]);

    const stats = useMemo(() => calculateStats(policies), [policies, calculateStats]);

    // Atualizar metas com dados reais
    const updateGoalsWithRealData = useCallback(async () => {
        if (!userId || goals.length === 0) return;

        const updatedGoals = goals.map(goal => {
            let current = 0;
            
            switch (goal.type) {
                case 'apolices':
                    current = stats.totalApolices;
                    break;
                case 'valor':
                    current = stats.totalValor;
                    break;
                case 'crescimento':
                    current = Math.max(0, stats.monthlyGrowth);
                    break;
            }

            const isCompleted = current >= goal.target;
            const status = isCompleted ? 'completed' : 'active';

            return {
                ...goal,
                current,
                status
            };
        });

        setGoals(updatedGoals);

        // Atualizar no banco se necessário
        for (const goal of updatedGoals) {
            if (goal.current !== goals.find(g => g.id === goal.id)?.current) {
                await supabase
                    .from('goals')
                    .update({ 
                        current: goal.current, 
                        status: goal.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', goal.id);
            }
        }
    }, [userId, goals, stats]);

    useEffect(() => {
        fetchPolicies();
        fetchGoals();
    }, [fetchPolicies, fetchGoals]);

    useEffect(() => {
        updateGoalsWithRealData();
    }, [updateGoalsWithRealData]);

    const addGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'userId' | 'current' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string }> => {
        try {
            // Usar a função integrada do banco para criar meta e atualizar progresso
            const { data, error } = await supabase.rpc('create_goal_and_update_progress', {
                p_user_id: userId,
                p_title: goalData.title,
                p_type: goalData.type,
                p_target: goalData.target,
                p_period: goalData.period
            });

            if (error) {
                console.error('Error adding goal:', error);
                return { success: false, message: 'Erro ao criar meta.' };
            }

            // Recarregar metas
            await fetchGoals();
            return { success: true, message: 'Meta criada com sucesso!' };
        } catch (error) {
            console.error('Error adding goal:', error);
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, [userId, fetchGoals]);

    const updateGoal = useCallback(async (id: string, updates: Partial<Goal>): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('goals')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('Error updating goal:', error);
                return { success: false, message: 'Erro ao atualizar meta.' };
            }

            setGoals(prev => prev.map(goal => 
                goal.id === id ? { ...goal, ...updates } : goal
            ));
            return { success: true, message: 'Meta atualizada com sucesso!' };
        } catch (error) {
            console.error('Error updating goal:', error);
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, []);

    const deleteGoal = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting goal:', error);
                return { success: false, message: 'Erro ao excluir meta.' };
            }

            setGoals(prev => prev.filter(goal => goal.id !== id));
            return { success: true, message: 'Meta excluída com sucesso!' };
        } catch (error) {
            console.error('Error deleting goal:', error);
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, []);

    const refreshGoals = useCallback(async () => {
        await fetchPolicies();
        await fetchGoals();
    }, [fetchPolicies, fetchGoals]);

    const goalsContextValue = useMemo(() => ({
        goals,
        stats,
        loading,
        addGoal,
        updateGoal,
        deleteGoal,
        refreshGoals
    }), [goals, stats, loading, addGoal, updateGoal, deleteGoal, refreshGoals]);

    return (
        <GoalsContext.Provider value={goalsContextValue}>
            {children}
        </GoalsContext.Provider>
    );
};

export const useGoals = (): GoalsContextType => {
    const context = useContext(GoalsContext);
    if (context === undefined) {
        throw new Error('useGoals must be used within a GoalsProvider');
    }
    return context;
};
