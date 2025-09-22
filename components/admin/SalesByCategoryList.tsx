import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

interface SalesByCategory {
    category_name: string;
    category_color: string;
    total_brokers: number;
    total_policies: number;
    total_revenue: number;
    avg_policy_value: number;
    percentage_of_total: number;
}

const SalesByCategoryList: React.FC = () => {
    const [categories, setCategories] = useState<SalesByCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            
            // Primeiro tentar buscar da view
            let { data, error } = await supabase
                .from('v_sales_by_broker_category')
                .select('*');

            // Se a view não existir, buscar dados diretamente das tabelas
            if (error && error.code === 'PGRST116') {

                // Buscar dados diretamente das tabelas - TODAS as categorias ativas
                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('categorias_corretores')
                    .select(`
                        id,
                        nome,
                        cor,
                        corretores_categorias!categoria_id(
                            corretor_id,
                            users!corretor_id(
                                id,
                                policies!policies_user_id_fkey(
                                    id,
                                    premium_value,
                                    created_at
                                )
                            )
                        )
                    `)
                    .eq('is_ativo', true) // Buscar apenas categorias ativas
                    .order('nome'); // Ordenar por nome para consistência

                if (categoriesError) throw categoriesError;

                // Processar dados para criar estatísticas por categoria
                const processedData = categoriesData?.map(category => {
                    const corretoresCategorias = category.corretores_categorias || [];
                    const users = corretoresCategorias.map((cc: any) => cc.users).filter(Boolean);
                    const allPolicies = users.flatMap((user: any) => user.policies || []);
                    const totalBrokers = users.length;
                    const totalPolicies = allPolicies.length;
                    const totalRevenue = allPolicies.reduce((sum: number, policy: any) => sum + (policy.premium_value || 0), 0);
                    const avgPolicyValue = totalPolicies > 0 ? totalRevenue / totalPolicies : 0;

                    return {
                        category_name: category.nome,
                        category_color: category.cor || '#1e293b',
                        total_brokers: totalBrokers,
                        total_policies: totalPolicies,
                        total_revenue: totalRevenue,
                        avg_policy_value: avgPolicyValue,
                        percentage_of_total: 0 // Será calculado depois
                    };
                }) || []; // Removido filtro para mostrar todas as categorias

                // Calcular percentual do total
                const totalAllPolicies = processedData.reduce((sum, category) => sum + category.total_policies, 0);
                processedData.forEach(category => {
                    category.percentage_of_total = totalAllPolicies > 0 ? 
                        Math.round((category.total_policies / totalAllPolicies) * 100 * 10) / 10 : 0;
                });

                // Ordenar por receita total
                processedData.sort((a, b) => b.total_revenue - a.total_revenue);

                data = processedData;
                error = null;
            }

            if (error) throw error;

            setCategories(data || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Vendas por Categoria</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Vendas por Categoria</h3>
                </div>
                <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum dado disponível</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Vendas por Categoria</h3>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {categories.map((category, index) => (
                    <div 
                        key={category.category_name}
                        className="p-4 rounded-lg border border-gray-200 transition-all hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: category.category_color }}
                                ></div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">
                                        {category.category_name}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {category.total_brokers} corretores • {category.total_policies} apólices
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-[#1e293b]">
                                    {formatCurrency(category.total_revenue)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {category.percentage_of_total}% do total
                                </p>
                            </div>
                        </div>
                        
                        {/* Participação - Seção Separada com Donut Chart */}
                        <div className="mt-3 border-t border-gray-100 pt-3">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-2">Participação</div>
                                </div>
                                <div className="relative w-16 h-16">
                                    {/* Donut Chart SVG */}
                                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                                        {/* Background Circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                        />
                                        {/* Progress Circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke={category.category_color}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - category.percentage_of_total / 100)}`}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-sm font-bold text-[#1e293b]">
                                            {category.percentage_of_total.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SalesByCategoryList;
