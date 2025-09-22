import { useState, useEffect, useCallback } from 'react';
import { UnifiedCampaignProgressService, UnifiedCampaignProgress } from '../services/unifiedCampaignProgressService';

export const useCompositeCampaignProgress = (userId: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Recalcula o progresso de todas as campanhas compostas do usuário
     */
    const recalculateProgress = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            await UnifiedCampaignProgressService.recalculateUserCampaigns(userId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    /**
     * Calcula o progresso de uma campanha específica
     */
    const calculateCampaignProgress = useCallback(async (
        goalId: string
    ): Promise<UnifiedCampaignProgress | null> => {
        if (!userId) return null;

        try {
            return await UnifiedCampaignProgressService.calculateCampaignProgress(goalId);
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [userId]);

    /**
     * Atualiza o progresso de uma campanha no banco
     */
    const updateCampaignProgress = useCallback(async (
        goalId: string,
        progress: CompositeCampaignProgress
    ): Promise<void> => {
        try {
            await CompositeCampaignService.updateCompositeCampaignProgress(goalId, progress);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    return {
        loading,
        error,
        recalculateProgress,
        calculateCampaignProgress,
        updateCampaignProgress
    };
};

