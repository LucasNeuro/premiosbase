import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminGoal {
    id: string;
    title: string;
    description?: string;
    target: number;
    type: 'apolices' | 'valor' | 'crescimento';
    target_period: 'semana' | 'mes' | 'trimestre' | 'ano';
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface UserAdminGoalProgress {
    id: string;
    user_id: string;
    admin_goal_id: string;
    current_value: number;
    target_value: number;
    period_start: string;
    period_end: string;
    is_completed: boolean;
    completed_at?: string;
    last_updated: string;
    admin_goal: AdminGoal;
}

export interface AdminGoalStats {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalProgress: number;
}

interface AdminGoalsContextType {
    adminGoals: AdminGoal[];
    userProgress: UserAdminGoalProgress[];
    stats: AdminGoalStats;
    loading: boolean;
    addAdminGoal: (goal: Omit<AdminGoal, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; message: string }>;
    updateAdminGoal: (id: string, updates: Partial<AdminGoal>) => Promise<{ success: boolean; message: string }>;
    deleteAdminGoal: (id: string) => Promise<{ success: boolean; message: string }>;
    refreshAdminGoals: () => Promise<void>;
}

const AdminGoalsContext = createContext<AdminGoalsContextType | undefined>(undefined);

export const AdminGoalsProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children, userId }) => {
    const [adminGoals, setAdminGoals] = useState<AdminGoal[]>([]);
    const [userProgress, setUserProgress] = useState<UserAdminGoalProgress[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Buscar metas do admin
    const fetchAdminGoals = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('admin_goals')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                return;
            }

            setAdminGoals(data || []);
        } catch (error) {
        }
    }, []);

    // Buscar progresso do usuário nas metas do admin
    const fetchUserProgress = useCallback(async () => {
        if (!userId) return;

        try {
            // Primeiro, atualizar progresso
            const { error: updateError } = await supabase.rpc('update_admin_goals_progress', {
                p_user_id: userId
            });

            if (updateError) {
            }

            // Depois, buscar progresso atualizado
            const { data, error } = await supabase
                .from('user_admin_goal_progress')
                .select(`
                    *,
                    admin_goals (*)
                `)
                .eq('user_id', userId)
                .gte('period_end', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                return;
            }

            const progressData = data?.map(item => ({
                ...item,
                admin_goal: item.admin_goals
            })) || [];

            setUserProgress(progressData);
        } catch (error) {
        }
    }, [userId]);

    // Calcular estatísticas
    const calculateStats = useCallback((): AdminGoalStats => {
        const totalGoals = userProgress.length;
        const completedGoals = userProgress.filter(p => p.is_completed).length;
        const activeGoals = totalGoals - completedGoals;
        const totalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

        return {
            totalGoals,
            activeGoals,
            completedGoals,
            totalProgress
        };
    }, [userProgress]);

    const stats = useMemo(() => calculateStats(), [calculateStats]);

    // Carregar dados
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchAdminGoals(),
                fetchUserProgress()
            ]);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [fetchAdminGoals, fetchUserProgress]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Adicionar meta do admin
    const addAdminGoal = useCallback(async (goalData: Omit<AdminGoal, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, message: 'Usuário não autenticado.' };
            }

            const { data, error } = await supabase.rpc('create_admin_goal', {
                p_title: goalData.title,
                p_description: goalData.description || '',
                p_target: goalData.target,
                p_type: goalData.type,
                p_target_period: goalData.target_period,
                p_admin_user_id: user.id
            });

            if (error) {
                return { success: false, message: 'Erro ao criar meta.' };
            }

            await loadData();
            return { success: true, message: 'Meta criada com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, [loadData]);

    // Atualizar meta do admin
    const updateAdminGoal = useCallback(async (id: string, updates: Partial<AdminGoal>): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('admin_goals')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                return { success: false, message: 'Erro ao atualizar meta.' };
            }

            setAdminGoals(prev => prev.map(goal => 
                goal.id === id ? { ...goal, ...updates } : goal
            ));
            return { success: true, message: 'Meta atualizada com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, []);

    // Deletar meta do admin
    const deleteAdminGoal = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('admin_goals')
                .update({ is_active: false })
                .eq('id', id);

            if (error) {
                return { success: false, message: 'Erro ao excluir meta.' };
            }

            setAdminGoals(prev => prev.filter(goal => goal.id !== id));
            return { success: true, message: 'Meta excluída com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, []);

    // Atualizar dados
    const refreshAdminGoals = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const adminGoalsContextValue = useMemo(() => ({
        adminGoals,
        userProgress,
        stats,
        loading,
        addAdminGoal,
        updateAdminGoal,
        deleteAdminGoal,
        refreshAdminGoals
    }), [adminGoals, userProgress, stats, loading, addAdminGoal, updateAdminGoal, deleteAdminGoal, refreshAdminGoals]);

    return (
        <AdminGoalsContext.Provider value={adminGoalsContextValue}>
            {children}
        </AdminGoalsContext.Provider>
    );
};

export const useAdminGoals = (): AdminGoalsContextType => {
    const context = useContext(AdminGoalsContext);
    if (context === undefined) {
        throw new Error('useAdminGoals must be used within an AdminGoalsProvider');
    }
    return context;
};
