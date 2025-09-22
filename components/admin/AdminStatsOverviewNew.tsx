import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, FileText, TrendingUp, DollarSign, Target, Award } from 'lucide-react';

const AdminStatsOverview: React.FC = () => {
    const [stats, setStats] = useState({
        totalPolicies: 0,
        totalUsers: 0,
        totalRevenue: 0,
        averageTicket: 0,
        activeGoals: 0,
        completedGoals: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Buscar dados reais do banco
            const [policiesResult, usersResult, goalsResult] = await Promise.all([
                supabase.from('policies').select('premium_value, created_at'),
                supabase.from('users').select('id, is_admin'),
                supabase.from('goals').select('status, is_active')
            ]);

            const policies = policiesResult.data || [];
            const users = usersResult.data || [];
            const goals = goalsResult.data || [];

            // Calcular estatísticas
            const totalPolicies = policies.length;
            const totalUsers = users.filter(u => !u.is_admin).length;
            const totalRevenue = policies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
            const averageTicket = totalPolicies > 0 ? totalRevenue / totalPolicies : 0;
            
            const activeGoals = goals.filter(g => g.status === 'active' && g.is_active).length;
            const completedGoals = goals.filter(g => g.status === 'completed' && g.is_active).length;

            setStats({
                totalPolicies,
                totalUsers,
                totalRevenue,
                averageTicket,
                activeGoals,
                completedGoals
            });
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
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
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
                <p className="text-gray-600 mt-1">Estatísticas gerais da plataforma</p>
            </div>

            {/* Estatísticas - Cards Brancos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Apólices</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalPolicies}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Corretores Ativos</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ticket Médio</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.averageTicket)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Metas Ativas</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.activeGoals}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Metas Concluídas</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.completedGoals}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStatsOverview;
