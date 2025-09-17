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
            console.log(`⏸️ Evento ${eventName} ignorado (debounce)`);
            return;
        }
        
        window[lastEventKey] = now;
        console.log(`📡 Disparando evento: ${eventName}`);
        
        window.dispatchEvent(new CustomEvent(eventName, {
            detail: { userId, timestamp: new Date(), data }
        }));
    }, [userId]);

    // Configurar subscriptions do Supabase para tempo real
    useEffect(() => {
        if (!userId || userId === '') return;

        console.log('🔄 Configurando subscriptions em tempo real para user:', userId);

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
                    console.log('📊 Mudança em campanhas detectada:', payload);
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
                    console.log('📄 Mudança em apólices detectada:', payload);
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
                    console.log('🔗 Mudança em vinculações detectada:', payload);
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
                    console.log('🎁 Mudança em prêmios detectada:', payload);
                    triggerUpdate('campaigns', payload);
                }
            )
            .subscribe();

        // Cleanup das subscriptions
        return () => {
            console.log('🔄 Removendo subscriptions em tempo real');
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
            console.log(`📢 Recebido evento ${eventName}:`, event.detail);
            callback(event.detail?.data);
        };

        window.addEventListener(eventName, handleUpdate);

        return () => {
            window.removeEventListener(eventName, handleUpdate);
        };
    }, [eventType, callback, ...dependencies]);
};
