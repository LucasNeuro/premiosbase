import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gerenciar eventos em tempo real no dashboard do corretor
 */
export const useRealtimeEvents = (userId: string) => {
    // Função para disparar evento de atualização com debounce
    const triggerUpdate = useCallback((type: 'campaigns' | 'policies' | 'achievements' | 'all', data?: any) => {
        const eventName = `realtime_update_${type}`;
        
        // Debounce para evitar loops - só dispara se não houve evento nos últimos 2 segundos
        const now = Date.now();
        const lastEventKey = `lastEvent_${type}`;
        const lastEventTime = window[lastEventKey] || 0;
        
        if (now - lastEventTime < 2000) {
            return;
        }
        
        window[lastEventKey] = now;
        
        window.dispatchEvent(new CustomEvent(eventName, {
            detail: { userId, timestamp: new Date(), data }
        }));
    }, [userId]);

    // Configurar subscriptions do Supabase para tempo real
    useEffect(() => {
        if (!userId || userId === '') return;


        // Subscription para campanhas (goals)
        const campaignsSubscription = supabase
            .channel('campaigns_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'goals',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    triggerUpdate('campaigns', payload);
                }
            )
            .subscribe();

        // Subscription para apólices (policies)
        const policiesSubscription = supabase
            .channel('policies_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'policies',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    triggerUpdate('policies', payload);
                    // Atualizar campanhas também pois pode afetar progresso
                    triggerUpdate('campaigns', payload);
                }
            )
            .subscribe();

        // Subscription para vinculações (policy_campaign_links)
        const linksSubscription = supabase
            .channel('policy_links_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'policy_campaign_links',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    triggerUpdate('campaigns', payload);
                    triggerUpdate('policies', payload);
                }
            )
            .subscribe();

        // Subscription para prêmios das campanhas
        const prizesSubscription = supabase
            .channel('prizes_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'campanhas_premios'
                },
                (payload) => {
                    triggerUpdate('campaigns', payload);
                }
            )
            .subscribe();

        // Cleanup das subscriptions
        return () => {
            supabase.removeChannel(campaignsSubscription);
            supabase.removeChannel(policiesSubscription);
            supabase.removeChannel(linksSubscription);
            supabase.removeChannel(prizesSubscription);
        };
    }, [userId, triggerUpdate]);

    return {
        triggerUpdate
    };
};

/**
 * Hook para escutar eventos específicos de atualização
 */
export const useRealtimeListener = (
    eventType: 'campaigns' | 'policies' | 'achievements' | 'all',
    callback: (data?: any) => void,
    dependencies: any[] = []
) => {
    useEffect(() => {
        const eventName = `realtime_update_${eventType}`;
        
        const handleUpdate = (event: CustomEvent) => {
            callback(event.detail?.data);
        };

        window.addEventListener(eventName, handleUpdate);

        return () => {
            window.removeEventListener(eventName, handleUpdate);
        };
    }, [eventType, callback, ...dependencies]);
};
