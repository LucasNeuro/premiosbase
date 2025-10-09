import React from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { DashboardStatsCards } from './DashboardStatsCards';
import { RankingCorretoresTable } from './RankingCorretoresTable';
import { DistribuicaoApolicesChart } from './DistribuicaoApolicesChart';

// Interface removida - usando dados do hook useAdminDashboard

const AdminStatsOverview: React.FC = () => {
    // 🚀 USAR HOOK DO DASHBOARD ADMINISTRATIVO
    const { 
        dashboardData, 
        loading, 
        error, 
        refreshData,
        lastRefresh 
    } = useAdminDashboard();

    // Função formatCurrency removida - usando componente DashboardStatsCards

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
                        onClick={refreshData}
                        className="px-4 py-2 bg-[#1e293b] text-white rounded-lg hover:bg-[#334155] transition-colors"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            {/* 🚀 USAR COMPONENTE DE ESTATÍSTICAS DO DASHBOARD */}
            <DashboardStatsCards 
                estatisticas={dashboardData?.estatisticas || null} 
                loading={loading} 
            />

            {/* 🚀 GRÁFICOS DE DISTRIBUIÇÃO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição por Tipo */}
                <DistribuicaoApolicesChart 
                    distribuicao={dashboardData?.distribuicoes?.tipos || []}
                    tipo="Tipo de Apólice"
                    loading={loading}
                />

                {/* Distribuição por Contrato */}
                <DistribuicaoApolicesChart 
                    distribuicao={dashboardData?.distribuicoes?.contratos || []}
                    tipo="Tipo de Contrato"
                    loading={loading}
                />
            </div>

            {/* 🚀 TABELA DE RANKING */}
            <div className="grid grid-cols-1 gap-6">
                <RankingCorretoresTable 
                    ranking={dashboardData?.ranking || []}
                    loading={loading}
                />
            </div>

        </div>
    );
};

export default AdminStatsOverview;

