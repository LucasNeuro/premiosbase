import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, Target, Users, FileText } from 'lucide-react';
import { NotificationService, Notification } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

const AdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            setupRealtimeListener();
        }

        return () => {
            if (user?.id) {
                NotificationService.removeRealtimeListener(realtimeChannel);
            }
        };
    }, [user?.id]);

    const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

    const fetchNotifications = async () => {
        if (!user?.id) {
            console.log('❌ Usuário não encontrado para buscar notificações');
            return;
        }
        
        console.log('👤 Usuário logado:', user.id, user.name, user.is_admin);
        
        try {
            // Buscar todas as notificações (não apenas as não lidas) para o admin
            const data = await NotificationService.getAllNotifications(user.id);
            console.log('🔔 Notificações do admin recebidas:', data);
            console.log('📊 Total de notificações:', data.length);
            console.log('📋 Notificações não lidas:', data.filter(n => !n.is_read).length);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        }
    };

    const setupRealtimeListener = () => {
        if (!user?.id) return;
        
        const channel = NotificationService.setupRealtimeListener(user.id, (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });
        
        setRealtimeChannel(channel);
    };

    const markAsRead = async (notificationId: string) => {
        try {
            console.log('🔔 Marcando notificação como lida:', notificationId);
            await NotificationService.markAsRead(notificationId);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            console.log('✅ Notificação marcada como lida com sucesso');
        } catch (error) {
            console.error('❌ Erro ao marcar notificação como lida:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        
        try {
            console.log('🔔 Marcando todas as notificações como lidas');
            await NotificationService.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            console.log('✅ Todas as notificações marcadas como lidas');
            // Fechar o dropdown após marcar todas como lidas
            setIsOpen(false);
        } catch (error) {
            console.error('❌ Erro ao marcar todas como lidas:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'policy_added':
                return <FileText className="w-5 h-5 text-green-500" />;
            case 'campaign_completed':
                return <Target className="w-5 h-5 text-blue-500" />;
            case 'goal_achieved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
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
                return 'bg-green-50 border-green-200';
            case 'system_alert':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="relative">
            {/* Botão de Notificações */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-10"
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
                        {notifications.filter(n => !n.is_read).length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Nenhuma notificação não lida</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {notifications
                                    .filter(notification => !notification.is_read)
                                    .map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 rounded-lg border mb-2 cursor-pointer transition-all hover:shadow-md ${getBgColor(notification.type)}`}
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
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                    <p className="text-sm mt-1 text-gray-600">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs mt-2 text-gray-500">
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
                    <div className="p-4 border-t border-gray-200 space-y-2">
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="w-full text-center text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                            Ver todas as notificações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
