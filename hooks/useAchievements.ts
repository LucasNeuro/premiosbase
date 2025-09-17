import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    category: 'vendas' | 'crescimento' | 'consistencia' | 'especial';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    criteria_type: 'apolices' | 'valor' | 'consecutive_months' | 'single_day';
    criteria_value: number;
    criteria_description: string;
    display_order: number;
    is_active: boolean;
    campaign_id?: string;
    campaign_name?: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    achieved_at: string;
    achieved_value: number;
    achievement: Achievement;
}

export interface UserAchievementProgress {
    id: string;
    user_id: string;
    achievement_id: string;
    current_value: number;
    last_updated: string;
    achievement: Achievement;
}

export interface AchievementStats {
    totalAchievements: number;
    unlockedAchievements: number;
    lockedAchievements: number;
    progressPercentage: number;
}

export const useAchievements = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [userProgress, setUserProgress] = useState<UserAchievementProgress[]>([]);
    const [stats, setStats] = useState<AchievementStats>({
        totalAchievements: 0,
        unlockedAchievements: 0,
        lockedAchievements: 0,
        progressPercentage: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar todas as insígnias configuradas
    const fetchAchievements = async () => {
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select(`
                    *,
                    campaigns (
                        id,
                        name
                    )
                `)
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;

            const achievementsData = data?.map(achievement => ({
                ...achievement,
                campaign_name: achievement.campaigns?.name
            })) || [];

            setAchievements(achievementsData);
        } catch (err) {
            console.error('Erro ao buscar insígnias:', err);
            setError('Erro ao carregar insígnias');
        }
    };

    // Buscar insígnias conquistadas pelo usuário
    const fetchUserAchievements = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return;
            }

            const { data, error } = await supabase
                .from('user_achievements')
                .select(`
                    *,
                    achievements (
                        *
                    )
                `)
                .eq('user_id', user.id)
                .order('achieved_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar conquistas:', error);
                throw error;
            }

            const userAchievementsData = data?.map(item => ({
                ...item,
                achievement: item.achievements
            })) || [];

            setUserAchievements(userAchievementsData);
        } catch (err) {
            console.error('Erro ao buscar conquistas do usuário:', err);
            setError('Erro ao carregar conquistas');
        }
    };

    // Buscar progresso do usuário para cada insígnia
    const fetchUserProgress = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return;
            }

            const { data, error } = await supabase
                .from('user_achievement_progress')
                .select(`
                    *,
                    achievements (
                        *
                    )
                `)
                .eq('user_id', user.id);

            if (error) {
                console.error('Erro ao buscar progresso:', error);
                throw error;
            }

            const userProgressData = data?.map(item => ({
                ...item,
                achievement: item.achievements
            })) || [];

            setUserProgress(userProgressData);
        } catch (err) {
            console.error('Erro ao buscar progresso do usuário:', err);
            setError('Erro ao carregar progresso');
        }
    };

    // Calcular estatísticas
    const calculateStats = () => {
        const totalAchievements = achievements.length;
        const unlockedAchievements = userAchievements.length;
        const lockedAchievements = totalAchievements - unlockedAchievements;
        const progressPercentage = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;

        setStats({
            totalAchievements,
            unlockedAchievements,
            lockedAchievements,
            progressPercentage
        });
    };

    // Verificar se uma insígnia foi conquistada
    const isAchievementUnlocked = (achievementId: string): boolean => {
        return userAchievements.some(ua => ua.achievement_id === achievementId);
    };

    // Obter progresso de uma insígnia específica
    const getAchievementProgress = (achievementId: string): UserAchievementProgress | null => {
        return userProgress.find(up => up.achievement_id === achievementId) || null;
    };

    // Obter insígnias não conquistadas
    const getLockedAchievements = (): Achievement[] => {
        return achievements.filter(achievement => !isAchievementUnlocked(achievement.id));
    };

    // Obter insígnias conquistadas
    const getUnlockedAchievements = (): Achievement[] => {
        return achievements.filter(achievement => isAchievementUnlocked(achievement.id));
    };

    // Obter próximas insígnias (não conquistadas, ordenadas por critério)
    const getNextAchievements = (limit: number = 3): Achievement[] => {
        return getLockedAchievements()
            .sort((a, b) => a.criteria_value - b.criteria_value)
            .slice(0, limit);
    };

    // Atualizar progresso do usuário baseado em dados reais da tabela policies
    const updateUserProgress = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Chamar a função do banco para atualizar progresso baseado na tabela policies
            const { error } = await supabase.rpc('update_user_achievement_progress_from_policies', {
                p_user_id: user.id
            });

            if (error) throw error;

            // Recarregar dados
            await Promise.all([
                fetchUserAchievements(),
                fetchUserProgress()
            ]);
        } catch (err) {
            console.error('Erro ao atualizar progresso:', err);
            setError('Erro ao atualizar progresso');
        }
    };

    // Carregar todos os dados
    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Primeiro, atualizar progresso baseado na tabela policies
            await updateUserProgress();
            
            // Depois, carregar todos os dados
            await Promise.all([
                fetchAchievements(),
                fetchUserAchievements(),
                fetchUserProgress()
            ]);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // Efeito para carregar dados e calcular estatísticas
    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [achievements, userAchievements]);

    return {
        // Dados
        achievements,
        userAchievements,
        userProgress,
        stats,
        
        // Estados
        loading,
        error,
        
        // Funções
        isAchievementUnlocked,
        getAchievementProgress,
        getLockedAchievements,
        getUnlockedAchievements,
        getNextAchievements,
        updateUserProgress,
        loadData,
        
        // Funções de busca
        fetchAchievements,
        fetchUserAchievements,
        fetchUserProgress
    };
};
