import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { PolicyCampaignLinksService, PolicyCampaignLinkWithAI } from '../services/policyCampaignLinksService';

export const usePolicyCampaignLinks = () => {
    const { user } = useAuth();
    const [links, setLinks] = useState<PolicyCampaignLinkWithAI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<any>(null);

    const fetchLinks = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const [linksData, statsData] = await Promise.all([
                PolicyCampaignLinksService.getUserPolicyLinks(user.id),
                PolicyCampaignLinksService.getAIStatistics(user.id)
            ]);

            setLinks(linksData);
            setStatistics(statsData);

        } catch (err: any) {
            setError(err.message || 'Erro ao carregar vinculações');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const getPolicyLinks = useCallback(async (policyId: string): Promise<PolicyCampaignLinkWithAI[]> => {
        try {
            return await PolicyCampaignLinksService.getPolicyLinks(policyId);
        } catch (err: any) {
            throw err;
        }
    }, []);

    const getLowConfidenceLinks = useCallback(async (threshold: number = 70): Promise<PolicyCampaignLinkWithAI[]> => {
        if (!user?.id) return [];

        try {
            return await PolicyCampaignLinksService.getLowConfidenceLinks(user.id, threshold);
        } catch (err: any) {
            throw err;
        }
    }, [user?.id]);

    const removeLink = useCallback(async (linkId: string): Promise<void> => {
        try {
            await PolicyCampaignLinksService.removeLink(linkId);
            await fetchLinks(); // Recarregar dados
        } catch (err: any) {
            throw err;
        }
    }, [fetchLinks]);

    const updateAIData = useCallback(async (
        linkId: string, 
        confidence: number, 
        reasoning: string
    ): Promise<void> => {
        try {
            await PolicyCampaignLinksService.updateAIData(linkId, confidence, reasoning);
            await fetchLinks(); // Recarregar dados
        } catch (err: any) {
            throw err;
        }
    }, [fetchLinks]);

    // Carregar dados iniciais
    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    return {
        links,
        loading,
        error,
        statistics,
        fetchLinks,
        getPolicyLinks,
        getLowConfidenceLinks,
        removeLink,
        updateAIData
    };
};
