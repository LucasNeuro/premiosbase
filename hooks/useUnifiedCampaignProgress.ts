import { useState, useEffect, useCallback } from 'react';
import { UnifiedCampaignProgressService, UnifiedCampaignProgress } from '../services/unifiedCampaignProgressService';

export const useUnifiedCampaignProgress = (userId?: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Calcula o progresso de uma campanha específica em tempo real
     * Usado tanto pelo admin quanto pelo corretor
     */
    const calculateCampaignProgress = useCallback(async (
        campaignId: string
    ): Promise<UnifiedCampaignProgress | null> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await UnifiedCampaignProgressService.calculateCampaignProgress(campaignId);
            return result;
        } catch (err: any) {
            console.error('Erro ao calcular progresso da campanha:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Recalcula progresso de todas as campanhas de um usuário (para corretor)
     */
    const recalculateUserCampaigns = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);
            
            await UnifiedCampaignProgressService.recalculateUserCampaigns(userId);
        } catch (err: any) {
            console.error('Erro ao recalcular campanhas do usuário:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    /**
     * Recalcula progresso de todas as campanhas ativas (para admin)
     */
    const recalculateAllCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            await UnifiedCampaignProgressService.recalculateAllCampaigns();
        } catch (err: any) {
            console.error('Erro ao recalcular todas as campanhas:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        calculateCampaignProgress,
        recalculateUserCampaigns,
        recalculateAllCampaigns
    };
};
