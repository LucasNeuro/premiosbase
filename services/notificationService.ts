import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    type: 'policy_added' | 'campaign_completed' | 'goal_achieved' | 'system_alert';
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    read_at?: string;
    created_at: string;
    updated_at: string;
}

export class NotificationService {
    // Buscar notificações não lidas
    static async getUnreadNotifications(userId: string): Promise<Notification[]> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            return [];
        }
    }

    // Buscar todas as notificações
    static async getAllNotifications(userId: string): Promise<Notification[]> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar todas as notificações:', error);
            return [];
        }
    }

    // Marcar notificação como lida
    static async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .rpc('mark_notification_as_read', { notification_id: notificationId });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            return false;
        }
    }

    // Marcar todas as notificações como lidas
    static async markAllAsRead(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ 
                    is_read: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
            return false;
        }
    }

    // Contar notificações não lidas
    static async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Erro ao contar notificações não lidas:', error);
            return 0;
        }
    }

    // Criar notificação manual
    static async createNotification(
        userId: string,
        type: Notification['type'],
        title: string,
        message: string,
        data?: any
    ): Promise<string | null> {
        try {
            const { data: result, error } = await supabase
                .rpc('create_notification', {
                    p_user_id: userId,
                    p_type: type,
                    p_title: title,
                    p_message: message,
                    p_data: data
                });

            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            return null;
        }
    }

    // Configurar listener realtime para notificações
    static setupRealtimeListener(userId: string, callback: (notification: Notification) => void) {
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('🔔 Nova notificação recebida:', payload.new);
                    callback(payload.new as Notification);
                }
            )
            .subscribe();

        return channel;
    }

    // Remover listener realtime
    static removeRealtimeListener(channel: any) {
        if (channel) {
            supabase.removeChannel(channel);
        }
    }
}
