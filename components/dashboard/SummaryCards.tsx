
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

const SummaryCard: React.FC<{ title: string; count: number; sum: number; icon: React.ReactNode; showCount?: boolean }> = ({ title, count, sum, icon, showCount = true }) => (
    <div className="bg-[#1E293B] rounded-xl shadow-lg animate-fade-in relative overflow-hidden">
        {/* Decorative quarter circle */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-green-600 opacity-20 rounded-bl-full"></div>
        
        <div className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-[#49de80] text-white shadow-lg">
                    {icon}
                </div>
                <p className="text-sm font-medium text-white text-right">{title}</p>
            </div>
            
            {showCount && (
                <p className="text-2xl font-bold text-white mb-2">{count} apólices</p>
            )}
            <p className="text-lg font-bold text-[#49de80]">{formatCurrency(sum)}</p>
        </div>
    </div>
);

const SummaryCards: React.FC<SummaryCardsProps> = ({ selectedPeriod = 'geral' }) => {
    try {
        const { getSummary, policies, loading, refreshPolicies } = usePoliciesAuxiliar();
        
        // Debug: verificar se o componente está sendo montado
        useEffect(() => {

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

        // Mostrar loading se ainda estiver carregando
        if (loading) {
            return (
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumo Geral</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="bg-gray-800 rounded-xl shadow-lg animate-pulse relative overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        {/* Círculo verde brilhante no canto superior esquerdo */}
                                        <div className="flex-shrink-0 h-12 w-12 bg-green-400 rounded-lg"></div>
                                        
                                        {/* Retângulo cinza claro no canto superior direito */}
                                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                                    </div>
                                    
                                    {/* Retângulo cinza claro mais longo no centro-esquerda */}
                                    <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                                    
                                    {/* Retângulo cinza claro mais curto abaixo */}
                                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                                    
                                    {/* Retângulo verde escuro no canto inferior esquerdo */}
                                    <div className="h-4 bg-green-600 rounded w-20 mt-2"></div>
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
                    {/* Seguro Auto */}
                    <SummaryCard
                        title="Seguro Auto"
                        count={autoCount}
                        sum={autoSum}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    
                    {/* Seguro Residencial */}
                    <SummaryCard
                        title="Seguro Residencial"
                        count={residencialCount}
                        sum={residencialSum}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                    />
                    
                    {/* Total de Apólices */}
                    <SummaryCard
                        title="Total de Apólices"
                        count={autoCount + residencialCount}
                        sum={autoSum + residencialSum}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                    />
                    
                    {/* Prêmio Médio Auto */}
                    <SummaryCard
                        title="Prêmio Médio Auto"
                        count={0}
                        sum={autoCount > 0 ? autoSum / autoCount : 0}
                        showCount={false}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                    />
                    
                    {/* Prêmio Médio Residencial */}
                    <SummaryCard
                        title="Prêmio Médio Residencial"
                        count={0}
                        sum={residencialCount > 0 ? residencialSum / residencialCount : 0}
                        showCount={false}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                </div>
            </div>
        );
    } catch (error) {
        return (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Resumo Geral</h2>
                <p className="text-gray-600">Carregando dados...</p>
            </div>
        );
    }
};

export default SummaryCards;
