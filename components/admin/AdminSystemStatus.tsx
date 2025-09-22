import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Database, Users, FileText, Target, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SystemStatus {
    database: 'online' | 'offline' | 'slow';
    users: number;
    policies: number;
    campaigns: number;
    lastUpdate: string;
    responseTime: number;
}

const AdminSystemStatus: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus>({
        database: 'offline',
        users: 0,
        policies: 0,
        campaigns: 0,
        lastUpdate: '',
        responseTime: 0
    });
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 30000); // A cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    const checkSystemStatus = async () => {
        const startTime = Date.now();
        
        try {
            // Testar conexão com o banco
            const { data, error } = await supabase
                .from('users')
                .select('id', { count: 'exact' })
                .limit(1);

            const responseTime = Date.now() - startTime;
            
            if (error) throw error;

            // Buscar estatísticas básicas
            const [usersResult, policiesResult, campaignsResult] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact' }),
                supabase.from('policies').select('id', { count: 'exact' }),
                supabase.from('goals').select('id', { count: 'exact' }).eq('record_type', 'campaign')
            ]);

            setStatus({
                database: responseTime > 1000 ? 'slow' : 'online',
                users: usersResult.count || 0,
                policies: policiesResult.count || 0,
                campaigns: campaignsResult.count || 0,
                lastUpdate: new Date().toLocaleString('pt-BR'),
                responseTime
            });
        } catch (error) {
            setStatus(prev => ({
                ...prev,
                database: 'offline',
                lastUpdate: new Date().toLocaleString('pt-BR'),
                responseTime: Date.now() - startTime
            }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'text-green-500';
            case 'slow':
                return 'text-yellow-500';
            case 'offline':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'slow':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'offline':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="relative">
            {/* Botão de Status */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-10"
            >
                {getStatusIcon(status.database)}
                <span className="text-sm font-medium">
                    {status.database === 'online' ? 'Online' : 
                     status.database === 'slow' ? 'Lento' : 'Offline'}
                </span>
            </button>

            {/* Dropdown de Status */}
            {isExpanded && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Status do Sistema</h3>
                            <button
                                onClick={checkSystemStatus}
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <Activity className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Status do Banco */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Banco de Dados</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(status.database)}
                                    <span className={`text-sm font-medium ${getStatusColor(status.database)}`}>
                                        {status.database === 'online' ? 'Online' : 
                                         status.database === 'slow' ? 'Lento' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                Tempo de resposta: {status.responseTime}ms
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">Usuários</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-800">{status.users}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium text-gray-700">Apólices</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-800">{status.policies}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-700">Campanhas</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-800">{status.campaigns}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium text-gray-700">Última Atualização</span>
                                </div>
                                <div className="text-xs text-gray-600">{status.lastUpdate}</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-xs text-gray-500 text-center">
                            Sistema monitorado automaticamente
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay para fechar */}
            {isExpanded && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default AdminSystemStatus;
