
import React, { useEffect } from 'react';
import { usePoliciesAuxiliar } from '../../hooks/usePoliciesAuxiliar';
import Card from '../ui/Card';
import { PolicyType } from '../../types';

interface SummaryCardsProps {
    selectedPeriod?: '30' | '60' | 'geral';
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const SummaryCard: React.FC<{ title: string; count: number; sum: number; icon: React.ReactNode }> = ({ title, count, sum, icon }) => (
    <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg animate-fade-in">
        <div className="p-6">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[#49de80] text-white shadow-lg">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-300 truncate">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{count} apólices</p>
                    <p className="text-sm font-medium text-[#49de80]">{formatCurrency(sum)}</p>
                </div>
            </div>
        </div>
    </div>
);

const SummaryCards: React.FC<SummaryCardsProps> = ({ selectedPeriod = 'geral' }) => {
    try {
        const { getSummary, policies, loading, refreshPolicies } = usePoliciesAuxiliar();
        
        // Debug: verificar se o componente está sendo montado
        useEffect(() => {
            console.log('🔄 SummaryCards montado - policies:', policies?.length || 0, 'loading:', loading);
        }, [policies, loading]);
        
        // Função para filtrar políticas por período
        const getFilteredPolicies = () => {
            if (!policies || policies.length === 0) return [];
            
            const now = new Date();
            let startDate: Date;
            
            switch (selectedPeriod) {
                case '30':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '60':
                    startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                    break;
                case 'geral':
                default:
                    return policies; // Retorna todas as políticas
            }
            
            return policies.filter(policy => {
                const policyDate = new Date(policy.registration_date);
                return policyDate >= startDate && policyDate <= now;
            });
        };

        // Calcular métricas filtradas
        const filteredPolicies = getFilteredPolicies();
        const autoPolicies = filteredPolicies.filter(p => p.type === 'Seguro Auto');
        const residentialPolicies = filteredPolicies.filter(p => p.type === 'Seguro Residencial');
        
        const autoCount = autoPolicies.length;
        const autoSum = autoPolicies.reduce((sum, p) => sum + p.premium_value, 0);
        const residencialCount = residentialPolicies.length;
        const residencialSum = residentialPolicies.reduce((sum, p) => sum + p.premium_value, 0);

        // Debug logs
        console.log('📊 SummaryCards Debug:', {
            loading,
            selectedPeriod,
            totalPolicies: policies?.length || 0,
            filteredPolicies: filteredPolicies.length,
            autoCount,
            autoSum,
            residencialCount,
            residencialSum
        });

        // Mostrar loading se ainda estiver carregando
        if (loading) {
            return (
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumo Geral</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg animate-pulse">
                                <div className="p-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 h-12 w-12 bg-slate-600 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-slate-600 rounded mb-2"></div>
                                            <div className="h-6 bg-slate-600 rounded mb-1"></div>
                                            <div className="h-4 bg-slate-600 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumo Geral</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <SummaryCard
                        title={PolicyType.AUTO}
                        count={autoCount}
                        sum={autoSum}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <SummaryCard
                        title={PolicyType.RESIDENCIAL}
                        count={residencialCount}
                        sum={residencialSum}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                    />
                    <SummaryCard
                        title="Total de Apólices"
                        count={autoCount + residencialCount}
                        sum={autoSum + residencialSum}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                    />
                    <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg animate-fade-in">
                        <div className="p-6 flex flex-col justify-center">
                            <p className="text-sm font-medium text-slate-300">Prêmio Médio Auto</p>
                            <p className="mt-1 text-2xl font-semibold text-[#49de80]">{formatCurrency(autoCount > 0 ? autoSum / autoCount : 0)}</p>
                        </div>
                    </div>
                    <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg animate-fade-in">
                        <div className="p-6 flex flex-col justify-center">
                            <p className="text-sm font-medium text-slate-300">Prêmio Médio Residencial</p>
                            <p className="mt-1 text-2xl font-semibold text-[#49de80]">{formatCurrency(residencialCount > 0 ? residencialSum / residencialCount : 0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('Erro no SummaryCards:', error);
        return (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Resumo Geral</h2>
                <p className="text-gray-600">Carregando dados...</p>
            </div>
        );
    }
};

export default SummaryCards;
