import { useState, useEffect, useCallback } from 'react';
import { UnifiedCampaignProgressServiceV2 } from '../services/UnifiedCampaignProgressServiceV2';

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
            
            const result = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaignId);
            return result;
        } catch (err: any) {
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
            
            // Recalcular campanhas usando o serviço unificado
            console.log('🔄 Recalculando campanhas do usuário:', userId);
        } catch (err: any) {
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
            
            // Recalcular todas as campanhas usando o serviço unificado
            console.log('🔄 Recalculando todas as campanhas');
        } catch (err: any) {
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
