import { useState, useEffect, useCallback } from 'react';
import { CompositeCampaignService, CompositeCampaignProgress } from '../services/compositeCampaignService';

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
            await CompositeCampaignService.recalculateUserCompositeCampaigns(userId);
        } catch (err: any) {
            console.error('Erro ao recalcular progresso:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    /**
     * Calcula o progresso de uma campanha específica
     */
    const calculateCampaignProgress = useCallback(async (
        goalId: string,
        startDate: string,
        endDate: string,
        criteria: any[]
    ): Promise<CompositeCampaignProgress | null> => {
        if (!userId) return null;

        try {
            return await CompositeCampaignService.calculateCompositeCampaignProgress(
                goalId,
                userId,
                startDate,
                endDate,
                criteria
            );
        } catch (err: any) {
            console.error('Erro ao calcular progresso da campanha:', err);
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
            console.error('Erro ao atualizar progresso da campanha:', err);
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


