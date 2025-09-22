import { supabase } from '../lib/supabase';

export interface MonthlySalesData {
    month: string;
    auto: number;
    residencial: number;
    total: number;
}

export interface BrokerPerformanceData {
    name: string;
    policies: number;
    revenue: number;
    campaigns: number;
}

export interface PolicyDistributionData {
    type: string;
    count: number;
    percentage: number;
    revenue: number;
}

export class AdminChartsService {
    
    /**
     * Buscar dados de vendas por mês usando view otimizada
     */
    static async getMonthlySalesData(): Promise<MonthlySalesData[]> {
        try {
            const { data, error } = await supabase
                .from('v_monthly_sales')
                .select('*')
                .order('month', { ascending: true });

            if (error) throw error;

            return data?.map(item => ({
                month: item.month_name,
                auto: Number(item.auto_revenue),
                residencial: Number(item.residencial_revenue),
                total: Number(item.total_revenue)
            })) || [];

        } catch (error) {
            console.error('Erro ao buscar dados de vendas mensais:', error);
            return [];
        }
    }

    /**
     * Buscar dados de performance por corretor usando view otimizada
     */
    static async getBrokerPerformanceData(): Promise<BrokerPerformanceData[]> {
        try {
            const { data, error } = await supabase
                .from('v_broker_performance')
                .select('*')
                .limit(10);

            if (error) throw error;

            return data?.map(item => ({
                name: item.name,
                policies: Number(item.total_policies),
                revenue: Number(item.total_revenue),
                campaigns: Number(item.total_campaigns)
            })) || [];

        } catch (error) {
            console.error('Erro ao buscar dados de performance:', error);
            return [];
        }
    }

    /**
     * Buscar dados de distribuição de apólices usando view otimizada
     */
    static async getPolicyDistributionData(): Promise<PolicyDistributionData[]> {
        try {
            const { data, error } = await supabase
                .from('v_policy_distribution')
                .select('*');

            if (error) throw error;

            return data?.map(item => ({
                type: item.type_short,
                count: Number(item.count),
                percentage: Math.round(Number(item.percentage)),
                revenue: Number(item.total_revenue)
            })) || [];

        } catch (error) {
            console.error('Erro ao buscar dados de distribuição:', error);
            return [];
        }
    }

    /**
     * Buscar dados de crescimento mensal
     */
    static async getMonthlyGrowthData(): Promise<{ current: number; previous: number; growth: number }> {
        try {
            const currentMonth = new Date();
            const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

            const { data: currentData, error: currentError } = await supabase
                .from('policies')
                .select('premium_value')
                .gte('created_at', currentMonthStart.toISOString())
                .lt('created_at', new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString());

            const { data: previousData, error: previousError } = await supabase
                .from('policies')
                .select('premium_value')
                .gte('created_at', previousMonth.toISOString())
                .lt('created_at', currentMonthStart.toISOString());

            if (currentError || previousError) throw currentError || previousError;

            const current = currentData?.reduce((sum, policy) => sum + Number(policy.premium_value), 0) || 0;
            const previous = previousData?.reduce((sum, policy) => sum + Number(policy.premium_value), 0) || 0;
            const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

            return { current, previous, growth };

        } catch (error) {
            console.error('Erro ao buscar dados de crescimento:', error);
            return { current: 0, previous: 0, growth: 0 };
        }
    }
}
