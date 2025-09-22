import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, FileText, TrendingUp, Award, Target, DollarSign, Calendar } from 'lucide-react';
import BrokerSalesDonutChart from './charts/BrokerSalesDonutChart';
import PolicyDistributionChart from './charts/PolicyDistributionChart';
import BrokerRankingList from './BrokerRankingList';
import SalesByCategoryList from './SalesByCategoryList';

interface AdminStats {
    totalUsers: number;
    totalPolicies: number;
    totalRevenue: number;
    monthlyGrowth: number;
    activeGoals: number;
    completedGoals: number;
    topPerformers: Array<{
        user_id: string;
        name: string;
        policies_count: number;
        total_revenue: number;
    }>;
    recentPolicies: Array<{
        id: string;
        policy_number: string;
        type: string;
        premium_value: number;
        created_at: string;
        user_name: string;
    }>;
}

const AdminStatsOverview: React.FC = () => {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalPolicies: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
        activeGoals: 0,
        completedGoals: 0,
        topPerformers: [],
        recentPolicies: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        try {
            setLoading(true);
            
            // Buscar dados em tempo real usando queries diretas
            const [usersResult, policiesResult, goalsResult] = await Promise.all([
                supabase
                    .from('users')
                    .select('id')
                    .eq('is_admin', false),
                supabase
                    .from('policies')
                    .select('premium_value, created_at'),
                supabase
                    .from('goals')
                    .select('status')
                    .eq('record_type', 'campaign')
            ]);

            if (usersResult.error) throw usersResult.error;
            if (policiesResult.error) throw policiesResult.error;
            if (goalsResult.error) throw goalsResult.error;

            const totalRevenue = policiesResult.data?.reduce((sum, policy) => sum + Number(policy.premium_value), 0) || 0;
            const activeGoals = goalsResult.data?.filter(goal => goal.status === 'active').length || 0;
            const completedGoals = goalsResult.data?.filter(goal => goal.status === 'completed').length || 0;

            // Calcular crescimento mensal
            const currentMonth = new Date();
            const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

            const [currentMonthResult, previousMonthResult] = await Promise.all([
                supabase
                    .from('policies')
                    .select('premium_value')
                    .gte('created_at', currentMonthStart.toISOString())
                    .lt('created_at', new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString()),
                supabase
                    .from('policies')
                    .select('premium_value')
                    .gte('created_at', previousMonth.toISOString())
                    .lt('created_at', currentMonthStart.toISOString())
            ]);

            const currentMonthRevenue = currentMonthResult.data?.reduce((sum, policy) => sum + Number(policy.premium_value), 0) || 0;
            const previousMonthRevenue = previousMonthResult.data?.reduce((sum, policy) => sum + Number(policy.premium_value), 0) || 0;
            const monthlyGrowth = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

            setStats({
                totalUsers: usersResult.data?.length || 0,
                totalPolicies: policiesResult.data?.length || 0,
                totalRevenue: totalRevenue,
                monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
                activeGoals: activeGoals,
                completedGoals: completedGoals,
                topPerformers: [],
                recentPolicies: []
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Componente de Skeleton para os minicards
    const SkeletonCard = () => (
        <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg animate-pulse">
            <div className="p-5">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-slate-600"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-600 rounded w-3/4"></div>
                        <div className="h-6 bg-slate-600 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                {/* Header com título e ações */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Resumo Geral</h2>
                        <p className="text-gray-600 mt-2">Visão geral completa do sistema</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">
                            Carregando...
                        </div>
                    </div>
                </div>

                {/* Minicards com Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

                {/* Gráficos com Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Listas com Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header com título e ações */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 mt-2">Visão geral completa do sistema</p>
                </div>
                    <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                        Última atualização: {new Date().toLocaleString('pt-BR')}
                    </div>
                    <button 
                        onClick={fetchAdminStats}
                        className="px-4 py-2 bg-[#1e293b] text-white rounded-lg hover:bg-[#334155] transition-colors"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Minicards - Design igual ao corretor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Total de Corretores */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
                    <div className="p-5">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                                <Users className="h-6 w-6" />
                        </div>
                        <div>
                                <p className="text-sm font-medium text-slate-300 truncate">Total de Corretores</p>
                                <p className="mt-2 text-xl font-semibold text-white">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total de Apólices */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
                    <div className="p-5">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                                <FileText className="h-6 w-6" />
                        </div>
                        <div>
                                <p className="text-sm font-medium text-slate-300 truncate">Total de Apólices</p>
                                <p className="mt-2 text-xl font-semibold text-white">{stats.totalPolicies}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receita Total */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
                    <div className="p-5">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                                <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                                <p className="text-sm font-medium text-slate-300 truncate">Receita Total</p>
                                <p className="mt-2 text-xl font-semibold text-[#49de80]">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Crescimento Mensal */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
                    <div className="p-5">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                                <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                                <p className="text-sm font-medium text-slate-300 truncate">Crescimento Mensal</p>
                                <p className={`mt-2 text-xl font-semibold ${
                                    stats.monthlyGrowth >= 0 ? 'text-[#49de80]' : 'text-red-400'
                                }`}>
                                    {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
                                </p>
                        </div>
                    </div>
                </div>
            </div>

                {/* Metas Ativas */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
                    <div className="p-4">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                                <Target className="h-5 w-5" />
                                    </div>
                                    <div>
                                <p className="text-xs font-medium text-slate-300 truncate">Metas Ativas</p>
                                <p className="mt-1 text-lg font-semibold text-white">{stats.activeGoals}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metas Concluídas */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
                    <div className="p-4">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                                <Award className="h-5 w-5" />
                    </div>
                                <div>
                                <p className="text-xs font-medium text-slate-300 truncate">Metas Concluídas</p>
                                <p className="mt-1 text-lg font-semibold text-white">{stats.completedGoals}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos - Primeira Linha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Vendas por Corretor */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Vendas por Corretor</h3>
                </div>
                    <div className="h-80">
                        <BrokerSalesDonutChart />
                    </div>
                </div>

                {/* Gráfico de Distribuição de Apólices */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Distribuição de Apólices</h3>
                    </div>
                    <div className="h-80">
                        <PolicyDistributionChart />
                    </div>
                </div>
            </div>

            {/* Cards - Segunda Linha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking de Corretores */}
                <BrokerRankingList />

                {/* Vendas por Categoria de Corretores */}
                <SalesByCategoryList />
            </div>


        </div>
    );
};

export default AdminStatsOverview;

