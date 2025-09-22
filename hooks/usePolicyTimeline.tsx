import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { PolicyAuditService, PolicyLaunchAudit } from '../services/policyAuditService';

export interface TimelineItem {
    id: string;
    policyNumber: string;
    policyType: string;
    contractType: string;
    premiumValue: number;
    cpdNumber: string;
    cpdName: string;
    linkedCampaignsCount: number;
    linkedCampaignsDetails: any[];
    createdAt: string;
    timeAgo: string;
}

export const usePolicyTimeline = () => {
    const { user } = useAuth();
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeline = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const auditRecords = await PolicyAuditService.getPolicyLaunchHistory(user.id, 20);
            const formattedItems = auditRecords.map(record => 
                PolicyAuditService.formatForTimeline(record)
            );

            setTimelineItems(formattedItems);

        } catch (err: any) {
            console.error('Erro ao buscar timeline:', err);
            setError(err.message || 'Erro ao carregar timeline');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const addTimelineItem = useCallback((auditRecord: PolicyLaunchAudit) => {
        const formattedItem = PolicyAuditService.formatForTimeline(auditRecord);
        setTimelineItems(prev => [formattedItem, ...prev.slice(0, 19)]); // Manter apenas 20 itens
    }, []);

    const getStatistics = useCallback(async () => {
        if (!user?.id) return null;

        try {
            return await PolicyAuditService.getLaunchStatistics(user.id);
        } catch (err: any) {
            console.error('Erro ao buscar estatísticas:', err);
            return null;
        }
    }, [user?.id]);

    // Configurar listener em tempo real (DESABILITADO - pode causar problemas)
    useEffect(() => {
        if (!user?.id) return;

        fetchTimeline();

        // Escutar evento personalizado para atualizar timeline
        const handlePolicyAdded = () => {
            console.log('🔄 Atualizando timeline após nova apólice');
            fetchTimeline();
        };

        window.addEventListener('policyAdded', handlePolicyAdded);

        return () => {
            window.removeEventListener('policyAdded', handlePolicyAdded);
        };
    }, [user?.id, fetchTimeline]);

    return {
        timelineItems,
        loading,
        error,
        fetchTimeline,
        getStatistics,
        addTimelineItem
    };
};
