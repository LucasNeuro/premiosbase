import { supabase } from '../lib/supabase';

export interface BrokerEfficiencyData {
    broker_id: string;
    broker_name: string;
    total_policies: number;
    total_revenue: number;
    ranking_position: number;
    efficiency_percentage: number;
}

export interface BrokerEfficiencyResult {
    brokers: BrokerEfficiencyData[];
    total_revenue: number;
    total_policies: number;
}

/**
 * Service para calcular eficiência dos corretores de forma robusta
 * Lógica: Posição no ranking + Total de vendas + Apólices
 * Fórmula: (100 - posição) * 0.4 + (receita/total_receita) * 0.4 + (apólices/total_apólices) * 0.2
 */
export class BrokerEfficiencyService {
    
    /**
     * Calcula eficiência para todos os corretores
     */
    static async calculateBrokerEfficiency(): Promise<BrokerEfficiencyResult> {
        try {

            // TESTE SIMPLES PRIMEIRO

            // Buscar dados dos corretores com suas vendas
            const { data: brokersData, error } = await supabase
                .from('users')
                .select(`
                    id,
                    name,
                    policies (
                        id,
                        valor_apolice
                    )
                `)
                .eq('role', 'broker')
                .eq('is_active', true);

            if (error) {
                throw error;
            }

            if (!brokersData || brokersData.length === 0) {

                return { brokers: [], total_revenue: 0, total_policies: 0 };
            }

            // Processar dados de cada corretor
            const brokersWithData = brokersData.map(broker => {
                const policies = broker.policies || [];
                const totalPolicies = policies.length;
                const totalRevenue = policies.reduce((sum, policy) => {
                    const valor = parseFloat(policy.valor_apolice) || 0;
                    return sum + valor;
                }, 0);

                return {
                    broker_id: broker.id,
                    broker_name: broker.name,
                    total_policies: totalPolicies,
                    total_revenue: totalRevenue
                };
            }).filter(broker => broker.total_policies > 0); // Apenas corretores com apólices

            if (brokersWithData.length === 0) {

                return { brokers: [], total_revenue: 0, total_policies: 0 };
            }

            // Calcular totais
            const totalRevenue = brokersWithData.reduce((sum, broker) => sum + broker.total_revenue, 0);
            const totalPolicies = brokersWithData.reduce((sum, broker) => sum + broker.total_policies, 0);

            // Ordenar por receita (critério principal) e depois por apólices
            brokersWithData.sort((a, b) => {
                if (b.total_revenue !== a.total_revenue) {
                    return b.total_revenue - a.total_revenue;
                }
                return b.total_policies - a.total_policies;
            });

            // Calcular eficiência para cada corretor
            const brokersWithEfficiency = brokersWithData.map((broker, index) => {
                const rankingPosition = index + 1;
                
                // Nova lógica de eficiência: Posição no ranking + Total de vendas + Apólices
                // Fórmula: (100 - posição) * 0.4 + (receita/total_receita) * 0.4 + (apólices/total_apólices) * 0.2
                const positionScore = (100 - rankingPosition) * 0.4; // Melhor posição = maior score
                const revenueScore = totalRevenue > 0 ? (broker.total_revenue / totalRevenue) * 100 * 0.4 : 0;
                const policiesScore = totalPolicies > 0 ? (broker.total_policies / totalPolicies) * 100 * 0.2 : 0;
                
                const efficiencyPercentage = Math.round((positionScore + revenueScore + policiesScore) * 10) / 10;

                return {
                    ...broker,
                    ranking_position: rankingPosition,
                    efficiency_percentage: efficiencyPercentage
                };
            });

            return {
                brokers: brokersWithEfficiency,
                total_revenue: totalRevenue,
                total_policies: totalPolicies
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Calcula eficiência para um corretor específico
     */
    static async calculateSingleBrokerEfficiency(brokerId: string): Promise<BrokerEfficiencyData | null> {
        try {
            const result = await this.calculateBrokerEfficiency();
            return result.brokers.find(broker => broker.broker_id === brokerId) || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Valida se os dados de eficiência estão corretos
     */
    static validateEfficiencyData(data: BrokerEfficiencyData[]): boolean {
        if (!data || data.length === 0) return false;
        
        // Verificar se todos têm eficiência calculada
        const hasValidEfficiency = data.every(broker => 
            typeof broker.efficiency_percentage === 'number' && 
            broker.efficiency_percentage >= 0 && 
            broker.efficiency_percentage <= 100
        );
        
        // Verificar se as posições estão corretas
        const positions = data.map(b => b.ranking_position).sort((a, b) => a - b);
        const hasValidPositions = positions.every((pos, index) => pos === index + 1);
        
        return hasValidEfficiency && hasValidPositions;
    }
}
