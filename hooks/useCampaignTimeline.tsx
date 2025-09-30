import { useState, useEffect } from 'react';
import { CampaignTimelineService, CampaignTimelineEvent, PolicyLaunchAudit } from '../services/CampaignTimelineService';

export const useCampaignTimeline = (userId: string | null) => {
    const [timelineEvents, setTimelineEvents] = useState<CampaignTimelineEvent[]>([]);
    const [policyAnalyses, setPolicyAnalyses] = useState<PolicyLaunchAudit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadTimelineData = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            // Carregar timeline de campanhas
            const timelineResult = await CampaignTimelineService.getUserTimeline(userId, 50);
            if (timelineResult.success && timelineResult.data) {
                setTimelineEvents(timelineResult.data);
            } else if (timelineResult.error) {
                setError(timelineResult.error);
            }

            // Carregar análises de apólices
            const analysisResult = await CampaignTimelineService.getUserPolicyAnalyses(userId, 50);
            if (analysisResult.success && analysisResult.data) {
                setPolicyAnalyses(analysisResult.data);
            } else if (analysisResult.error) {
                setError(analysisResult.error);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados do timeline');
        } finally {
            setLoading(false);
        }
    };

    // Funções simplificadas - as tabelas existentes já fazem tudo automaticamente
    const refreshData = async () => {
        await loadTimelineData();
    };

    useEffect(() => {
        loadTimelineData();
    }, [userId]);

    return {
        timelineEvents,
        policyAnalyses,
        loading,
        error,
        loadTimelineData,
        refreshData
    };
};
