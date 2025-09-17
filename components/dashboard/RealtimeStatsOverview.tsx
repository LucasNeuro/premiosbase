import React from 'react';
import { useAchievementsRealtime } from '../../hooks/useAchievementsRealtime';
import { TrendingUp, Target, Award, Calendar, DollarSign, FileText } from 'lucide-react';

interface RealtimeStatsOverviewProps {
    userId: string;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
}> = ({ title, value, subtitle, icon, color, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                {loading ? (
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                        {subtitle && <div className="h-4 bg-gray-200 rounded w-16"></div>}
                    </div>
                ) : (
                    <>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    </>
                )}
            </div>
            <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg ${color}`}>
                {icon}
            </div>
        </div>
    </div>
);

const RealtimeStatsOverview: React.FC<RealtimeStatsOverviewProps> = ({ userId }) => {
    const { stats, loading, lastUpdate } = useAchievementsRealtime(userId);

    // Se não há userId, mostrar estado de carregamento
    if (!userId) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span>Carregando dados do usuário...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header com indicador de tempo real */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Estatísticas em Tempo Real</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
                </div>
            </div>

            {/* Grid de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Apólices Totais */}
                <StatCard
                    title="Apólices Totais"
                    value={stats.totalPolicies}
                    subtitle={formatCurrency(stats.totalValue)}
                    icon={<FileText className="h-6 w-6 text-white" />}
                    color="bg-blue-500"
                    loading={loading}
                />

                {/* Apólices do Mês */}
                <StatCard
                    title="Apólices do Mês"
                    value={stats.monthlyPolicies}
                    subtitle={formatCurrency(stats.monthlyValue)}
                    icon={<Calendar className="h-6 w-6 text-white" />}
                    color="bg-green-500"
                    loading={loading}
                />

                {/* Campanhas Ativas */}
                <StatCard
                    title="Campanhas Ativas"
                    value={stats.activeCampaigns}
                    subtitle={`${stats.progressAverage.toFixed(1)}% progresso médio`}
                    icon={<Target className="h-6 w-6 text-white" />}
                    color="bg-purple-500"
                    loading={loading}
                />

                {/* Campanhas Concluídas */}
                <StatCard
                    title="Campanhas Concluídas"
                    value={stats.completedCampaigns}
                    subtitle="Metas atingidas"
                    icon={<Award className="h-6 w-6 text-white" />}
                    color="bg-orange-500"
                    loading={loading}
                />

                {/* Valor Médio por Apólice */}
                <StatCard
                    title="Valor Médio"
                    value={stats.totalPolicies > 0 ? formatCurrency(stats.totalValue / stats.totalPolicies) : 'R$ 0,00'}
                    subtitle="Por apólice"
                    icon={<DollarSign className="h-6 w-6 text-white" />}
                    color="bg-cyan-500"
                    loading={loading}
                />

                {/* Performance Geral */}
                <StatCard
                    title="Performance"
                    value={`${stats.progressAverage.toFixed(1)}%`}
                    subtitle="Progresso médio das campanhas"
                    icon={<TrendingUp className="h-6 w-6 text-white" />}
                    color="bg-rose-500"
                    loading={loading}
                />
            </div>

            {/* Indicador de carregamento global */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span>Atualizando estatísticas...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealtimeStatsOverview;
