import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CampaignCriteria {
    policy_type: 'auto' | 'residencial';
    target: number;
    type: 'quantity' | 'value';
    min_value?: number; // Para qualificações como "≥ R$ 2.000"
}

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    target: number;
    current_value: number;
    unit: string;
    period: string;
    type: 'apolices' | 'valor' | 'crescimento' | 'composite';
    status: 'active' | 'completed' | 'pending';
    admin_created_by?: string;
    target_period: 'semana' | 'mes' | 'trimestre' | 'ano';
    is_active: boolean;
    progress_percentage: number;
    last_updated: string;
    created_at: string;
    updated_at: string;
    // Novos campos para campanhas compostas
    campaign_type?: 'simple' | 'composite';
    criteria?: CampaignCriteria[];
    policy_types?: ('auto' | 'residencial')[];
}

interface GoalsContextType {
    goals: Goal[];
    loading: boolean;
    lastUpdate: Date;
    addGoal: (goal: Omit<Goal, 'id' | 'current_value' | 'status' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean, message: string }>;
    updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<{ success: boolean, message: string }>;
    deleteGoal: (goalId: string) => Promise<{ success: boolean, message: string }>;
    refreshGoals: () => void;
    getGoalsSummary: () => {
        totalGoals: number;
        activeGoals: number;
        completedGoals: number;
        totalTarget: number;
        totalCurrent: number;
    };
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: React.ReactNode, userId: string }> = ({ children, userId }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchGoals = useCallback(async (forceRefresh = false) => {
        if (!userId) {
            return;
        }

        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                return;
            }

            const formattedGoals: Goal[] = data?.map(goal => ({
                id: goal.id,
                user_id: goal.user_id,
                title: goal.title,
                target: Number(goal.target),
                current_value: Number(goal.current_value || 0),
                unit: goal.unit,
                period: goal.period,
                type: goal.type,
                status: goal.status,
                admin_created_by: goal.admin_created_by,
                target_period: goal.target_period,
                is_active: goal.is_active,
                progress_percentage: Number(goal.progress_percentage || 0),
                last_updated: goal.last_updated,
                created_at: goal.created_at,
                updated_at: goal.updated_at,
            })) || [];

            setGoals(formattedGoals);
            setLastUpdate(new Date());
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const refreshGoals = useCallback(() => {
        setLoading(true);
        fetchGoals(true);
    }, [fetchGoals]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchGoals();

        // Configurar real-time updates
        const channel = supabase
            .channel(`goals-changes-${userId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'goals',
                    filter: `user_id=eq.${userId}`
                }, 
                (payload) => {
                    fetchGoals(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchGoals]);

    const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'current' | 'status' | 'created_at' | 'updated_at'>): Promise<{ success: boolean, message: string }> => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .insert({
                    user_id: userId,
                    title: goal.title,
                    target: goal.target,
                    current_value: 0,
                    unit: goal.unit,
                    period: goal.period,
                    type: goal.type,
                    status: 'active',
                    admin_created_by: goal.admin_created_by,
                    target_period: goal.target_period,
                    is_active: true,
                })
                .select()
                .single();

            if (error) {
                return { success: false, message: 'Erro ao criar meta.' };
            }

            const newGoal: Goal = {
                id: data.id,
                user_id: data.user_id,
                title: data.title,
                target: data.target,
                current_value: data.current_value,
                unit: data.unit,
                period: data.period,
                type: data.type,
                status: data.status,
                admin_created_by: data.admin_created_by,
                target_period: data.target_period,
                is_active: data.is_active,
                progress_percentage: data.progress_percentage || 0,
                last_updated: data.last_updated || data.updated_at,
                created_at: data.created_at,
                updated_at: data.updated_at,
                campaign_type: data.campaign_type,
                criteria: data.criteria,
                policy_types: data.policy_types,
            };

            setGoals(prevGoals => [newGoal, ...prevGoals]);
            setLastUpdate(new Date());
            
            return { success: true, message: 'Meta criada com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, [userId]);

    const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>): Promise<{ success: boolean, message: string }> => {
        try {
            const { error } = await supabase
                .from('goals')
                .update(updates)
                .eq('id', goalId);

            if (error) {
                return { success: false, message: 'Erro ao atualizar meta.' };
            }

            setGoals(prevGoals => 
                prevGoals.map(goal => 
                    goal.id === goalId 
                        ? { ...goal, ...updates, updated_at: new Date().toISOString() }
                        : goal
                )
            );
            setLastUpdate(new Date());
            
            return { success: true, message: 'Meta atualizada com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, []);

    const deleteGoal = useCallback(async (goalId: string): Promise<{ success: boolean, message: string }> => {
        try {
            const { error } = await supabase
                .from('goals')
                .update({ is_active: false })
                .eq('id', goalId);

            if (error) {
                return { success: false, message: 'Erro ao excluir meta.' };
            }

            setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
            setLastUpdate(new Date());
            
            return { success: true, message: 'Meta excluída com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, []);

    const getGoalsSummary = useCallback(() => {
        return goals.reduce((summary, goal) => {
            summary.totalGoals++;
            if (goal.status === 'active') summary.activeGoals++;
            if (goal.status === 'completed') summary.completedGoals++;
            summary.totalTarget += goal.target;
            summary.totalCurrent += goal.current_value;
            return summary;
        }, { 
            totalGoals: 0, 
            activeGoals: 0, 
            completedGoals: 0, 
            totalTarget: 0, 
            totalCurrent: 0 
        });
    }, [goals]);
    
    const goalsContextValue = useMemo(() => ({
        goals,
        loading,
        lastUpdate,
        addGoal,
        updateGoal,
        deleteGoal,
        refreshGoals,
        getGoalsSummary,
    }), [goals, loading, lastUpdate, addGoal, updateGoal, deleteGoal, refreshGoals, getGoalsSummary]);

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