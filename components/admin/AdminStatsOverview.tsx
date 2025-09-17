import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, FileText, TrendingUp, Award, Target, DollarSign, Calendar } from 'lucide-react';

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
            // Buscar estatísticas gerais
            const [usersResult, policiesResult, goalsResult, topPerformersResult, recentPoliciesResult] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact' }),
                supabase.from('policies').select('premium_value, created_at', { count: 'exact' }),
                supabase.from('admin_goals').select('id', { count: 'exact' }).eq('is_active', true),
                supabase.rpc('get_top_performers'),
                supabase
                    .from('policies')
                    .select(`
                        id,
                        policy_number,
                        type,
                        premium_value,
                        created_at,
                        users!inner(name)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            // Calcular receita total
            const totalRevenue = policiesResult.data?.reduce((sum, policy) => sum + Number(policy.premium_value), 0) || 0;

            // Calcular crescimento mensal
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            const currentMonthPolicies = policiesResult.data?.filter(p => {
                const date = new Date(p.created_at);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }) || [];

            const lastMonthPolicies = policiesResult.data?.filter(p => {
                const date = new Date(p.created_at);
                return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
            }) || [];

            const monthlyGrowth = lastMonthPolicies.length > 0 
                ? ((currentMonthPolicies.length - lastMonthPolicies.length) / lastMonthPolicies.length) * 100 
                : 0;

            setStats({
                totalUsers: usersResult.count || 0,
                totalPolicies: policiesResult.count || 0,
                totalRevenue,
                monthlyGrowth,
                activeGoals: goalsResult.count || 0,
                completedGoals: 0, // Será calculado separadamente
                topPerformers: topPerformersResult.data || [],
                recentPolicies: recentPoliciesResult.data?.map(p => ({
                    ...p,
                    user_name: p.users?.name || 'N/A'
                })) || []
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

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Corretores</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Apólices</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalPolicies}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Receita Total</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Crescimento Mensal</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.monthlyGrowth.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Performers e Apólices Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.topPerformers.slice(0, 5).map((performer, index) => (
                            <div key={performer.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#1E293B] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{performer.name}</p>
                                        <p className="text-sm text-gray-500">{performer.policies_count} apólices</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">{formatCurrency(performer.total_revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Apólices Recentes */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-800">Apólices Recentes</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.recentPolicies.slice(0, 5).map((policy) => (
                            <div key={policy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-800">{policy.policy_number}</p>
                                    <p className="text-sm text-gray-500">{policy.user_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">{formatCurrency(policy.premium_value)}</p>
                                    <p className="text-sm text-gray-500">{policy.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resumo de Metas */}
            <div className="bg-gradient-to-r from-[#1E293B] to-slate-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">Resumo das Metas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold">{stats.activeGoals}</p>
                        <p className="text-slate-300">Metas Ativas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{stats.completedGoals}</p>
                        <p className="text-slate-300">Metas Concluídas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">
                            {stats.activeGoals > 0 ? ((stats.completedGoals / stats.activeGoals) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-slate-300">Taxa de Conclusão</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStatsOverview;
