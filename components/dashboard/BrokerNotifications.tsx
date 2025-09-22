import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, X, AlertTriangle, CheckCircle, Info, Target, Users, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Notification {
    id: string;
    user_id: string;
    type: 'policy_added' | 'campaign_completed' | 'goal_achieved' | 'system_alert';
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

const BrokerNotifications: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
        
        // Configurar realtime para notificações
        const subscription = supabase
            .channel('notifications')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'notifications' 
                }, 
                () => {
                    if (user?.id) {
                        fetchNotifications();
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        if (!user?.id) {
            console.log('⚠️ [NOTIFICAÇÕES] Usuário não autenticado');
            return;
        }

        try {
            console.log('🔍 [NOTIFICAÇÕES] Buscando notificações para usuário:', user.id);
            
            // Buscar apenas notificações não lidas (is_read = false) do usuário atual
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('❌ [NOTIFICAÇÕES] Erro ao buscar:', error);
                throw error;
            }

            console.log('✅ [NOTIFICAÇÕES] Notificações encontradas:', data?.length || 0);
            console.log('📋 [NOTIFICAÇÕES] Dados:', data);

            setNotifications(data || []);
            setUnreadCount(data?.length || 0);
        } catch (error) {
            console.error('❌ [NOTIFICAÇÕES] Erro ao buscar notificações:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        if (!user?.id) {
            console.log('⚠️ [NOTIFICAÇÕES] Usuário não autenticado para marcar como lida');
            return;
        }

        try {
            console.log('📝 [NOTIFICAÇÕES] Marcando notificação como lida:', notificationId);
            
            const { error } = await supabase
                .from('notifications')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId)
                .eq('user_id', user.id);

            if (error) {
                console.error('❌ [NOTIFICAÇÕES] Erro ao marcar como lida:', error);
                throw error;
            }

            console.log('✅ [NOTIFICAÇÕES] Notificação marcada como lida com sucesso');

            // Remover a notificação da lista local (já que só mostramos não lidas)
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('❌ [NOTIFICAÇÕES] Erro ao marcar notificação como lida:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) {
            console.log('⚠️ [NOTIFICAÇÕES] Usuário não autenticado para marcar todas como lidas');
            return;
        }

        try {
            console.log('📝 [NOTIFICAÇÕES] Marcando todas as notificações como lidas para usuário:', user.id);
            
            const { error } = await supabase
                .from('notifications')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                console.error('❌ [NOTIFICAÇÕES] Erro ao marcar todas como lidas:', error);
                throw error;
            }

            console.log('✅ [NOTIFICAÇÕES] Todas as notificações marcadas como lidas com sucesso');

            // Limpar todas as notificações da lista local
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('❌ [NOTIFICAÇÕES] Erro ao marcar todas como lidas:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'policy_added':
                return <FileText className="w-5 h-5 text-green-500" />;
            case 'campaign_completed':
                return <CheckCircle className="w-5 h-5 text-blue-500" />;
            case 'goal_achieved':
                return <Target className="w-5 h-5 text-purple-500" />;
            case 'system_alert':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'policy_added':
                return 'bg-green-50 border-green-200';
            case 'campaign_completed':
                return 'bg-blue-50 border-blue-200';
            case 'goal_achieved':
                return 'bg-purple-50 border-purple-200';
            case 'system_alert':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="relative">
            {/* Botão de Notificações */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown de Notificações */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Marcar todas como lidas
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Lista de Notificações */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg border mb-2 cursor-pointer transition-all hover:shadow-md ${
                                            notification.is_read ? 'bg-gray-50' : getBgColor(notification.type)
                                        }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-gray-800">
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {new Date(notification.created_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                            Ver todas as notificações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrokerNotifications;
