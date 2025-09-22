import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeListener } from './useRealtimeEvents';

interface AchievementStats {
    totalPolicies: number;
    totalValue: number;
    monthlyPolicies: number;
    monthlyValue: number;
    activeCampaigns: number;
    completedCampaigns: number;
    progressAverage: number;
}

/**
 * Hook para estatísticas e conquistas em tempo real
 */
export const useAchievementsRealtime = (userId: string) => {
    const [stats, setStats] = useState<AchievementStats>({
        totalPolicies: 0,
        totalValue: 0,
        monthlyPolicies: 0,
        monthlyValue: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        progressAverage: 0
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Função para calcular estatísticas
    const calculateStats = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            // Buscar apólices
            const { data: policies, error: policiesError } = await supabase
                .from('policies')
                .select('premium_value, registration_date')
                .eq('user_id', userId)
                .eq('status', 'active');

            if (policiesError) throw policiesError;

            // Buscar campanhas
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('status, progress_percentage')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted');

            if (campaignsError) throw campaignsError;

            // Calcular estatísticas das apólices
            const totalPolicies = policies?.length || 0;
            const totalValue = policies?.reduce((sum, p) => sum + (p.premium_value || 0), 0) || 0;

            // Apólices do mês atual
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyPolicies = policies?.filter(p => {
                const policyDate = new Date(p.registration_date);
                return policyDate.getMonth() === currentMonth && policyDate.getFullYear() === currentYear;
            }) || [];

            const monthlyValue = monthlyPolicies.reduce((sum, p) => sum + (p.premium_value || 0), 0);

            // Estatísticas das campanhas
            const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
            const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;
            
            const progressSum = campaigns?.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) || 0;
            const progressAverage = campaigns?.length ? progressSum / campaigns.length : 0;

            const newStats: AchievementStats = {
                totalPolicies,
                totalValue,
                monthlyPolicies: monthlyPolicies.length,
                monthlyValue,
                activeCampaigns,
                completedCampaigns,
                progressAverage
            };

            setStats(newStats);
            setLastUpdate(new Date());
            } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Carregar estatísticas inicial
    useEffect(() => {
        if (userId && userId !== '') {
            calculateStats();
        }
    }, [userId, calculateStats]);

    // Listener para eventos em tempo real
    useRealtimeListener('campaigns', useCallback(() => {
        calculateStats();
    }, [calculateStats]), [calculateStats]);

    useRealtimeListener('policies', useCallback(() => {
        calculateStats();
    }, [calculateStats]), [calculateStats]);

    return {
        stats,
        loading,
        lastUpdate,
        refreshStats: calculateStats
    };
};
