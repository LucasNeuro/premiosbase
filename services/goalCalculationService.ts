import { supabase } from '../lib/supabase';

export interface GoalCalculationResult {
    current: number;
    progress: number;
    isCompleted: boolean;
    periodData: {
        current: number;
        previous: number;
        growth: number;
    };
}

export interface PolicyStats {
    totalValue: number;
    totalCount: number;
    monthlyValue: number;
    monthlyCount: number;
    quarterlyValue: number;
    quarterlyCount: number;
    yearlyValue: number;
    yearlyCount: number;
    previousMonthValue: number;
    previousMonthCount: number;
    previousQuarterValue: number;
    previousQuarterCount: number;
    previousYearValue: number;
    previousYearCount: number;
}

export class GoalCalculationService {
    /**
     * Calcula o progresso de uma meta baseado no tipo e período
     */
    static async calculateGoalProgress(
        goalId: string,
        userId: string,
        goalType: 'valor' | 'apolices' | 'crescimento',
        targetPeriod: 'semana' | 'mes' | 'trimestre' | 'ano',
        target: number
    ): Promise<GoalCalculationResult> {
        try {
            // Buscar dados das apólices do usuário
            const policyStats = await this.getPolicyStats(userId);
            
            let current = 0;
            let periodData = {
                current: 0,
                previous: 0,
                growth: 0
            };

            switch (goalType) {
                case 'valor':
                    current = this.calculateValueProgress(policyStats, targetPeriod);
                    periodData = this.getPeriodValueData(policyStats, targetPeriod);
                    break;
                
                case 'apolices':
                    current = this.calculatePolicyCountProgress(policyStats, targetPeriod);
                    periodData = this.getPeriodCountData(policyStats, targetPeriod);
                    break;
                
                case 'crescimento':
                    current = this.calculateGrowthProgress(policyStats, targetPeriod);
                    periodData = this.getGrowthData(policyStats, targetPeriod);
                    break;
            }

            const progress = target > 0 ? (current / target) * 100 : 0;
            const isCompleted = progress >= 100;

            return {
                current,
                progress: Math.min(progress, 100),
                isCompleted,
                periodData
            };

        } catch (error) {
            console.error('Error calculating goal progress:', error);
            return {
                current: 0,
                progress: 0,
                isCompleted: false,
                periodData: { current: 0, previous: 0, growth: 0 }
            };
        }
    }

    /**
     * Busca estatísticas das apólices do usuário
     */
    private static async getPolicyStats(userId: string): Promise<PolicyStats> {
        const { data: policies, error } = await supabase
            .from('policies')
            .select('*')
            .eq('user_id', userId);
            // Removido temporariamente: .eq('status', 'active')

        if (error) {
            console.error('Error fetching policies:', error);
            return this.getEmptyStats();
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.floor(currentMonth / 3) + 1;
        
        // Períodos anteriores
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
        const previousQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;

        const stats: PolicyStats = {
            totalValue: 0,
            totalCount: 0,
            monthlyValue: 0,
            monthlyCount: 0,
            quarterlyValue: 0,
            quarterlyCount: 0,
            yearlyValue: 0,
            yearlyCount: 0,
            previousMonthValue: 0,
            previousMonthCount: 0,
            previousQuarterValue: 0,
            previousQuarterCount: 0,
            previousYearValue: 0,
            previousYearCount: 0
        };

        policies?.forEach(policy => {
            const policyDate = new Date(policy.created_at);
            const policyMonth = policyDate.getMonth();
            const policyYear = policyDate.getFullYear();
            const policyQuarter = Math.floor(policyMonth / 3) + 1;
            const policyValue = policy.premium_value || 0;

            // Totais
            stats.totalValue += policyValue;
            stats.totalCount += 1;

            // Mês atual
            if (policyMonth === currentMonth && policyYear === currentYear) {
                stats.monthlyValue += policyValue;
                stats.monthlyCount += 1;
            }

            // Trimestre atual
            if (policyQuarter === currentQuarter && policyYear === currentYear) {
                stats.quarterlyValue += policyValue;
                stats.quarterlyCount += 1;
            }

            // Ano atual
            if (policyYear === currentYear) {
                stats.yearlyValue += policyValue;
                stats.yearlyCount += 1;
            }

            // Mês anterior
            if (policyMonth === previousMonth && policyYear === previousYear) {
                stats.previousMonthValue += policyValue;
                stats.previousMonthCount += 1;
            }

            // Trimestre anterior
            if (policyQuarter === previousQuarter && policyYear === previousQuarterYear) {
                stats.previousQuarterValue += policyValue;
                stats.previousQuarterCount += 1;
            }

            // Ano anterior
            if (policyYear === currentYear - 1) {
                stats.previousYearValue += policyValue;
                stats.previousYearCount += 1;
            }
        });

        return stats;
    }

    /**
     * Calcula progresso para metas de valor
     */
    private static calculateValueProgress(stats: PolicyStats, period: string): number {
        switch (period) {
            case 'semana':
                // Para semana, usar dados mensais divididos por 4
                return stats.monthlyValue / 4;
            case 'mes':
                return stats.monthlyValue;
            case 'trimestre':
                return stats.quarterlyValue;
            case 'ano':
                return stats.yearlyValue;
            default:
                return stats.totalValue;
        }
    }

    /**
     * Calcula progresso para metas de apólices
     */
    private static calculatePolicyCountProgress(stats: PolicyStats, period: string): number {
        switch (period) {
            case 'semana':
                return Math.floor(stats.monthlyCount / 4);
            case 'mes':
                return stats.monthlyCount;
            case 'trimestre':
                return stats.quarterlyCount;
            case 'ano':
                return stats.yearlyCount;
            default:
                return stats.totalCount;
        }
    }

    /**
     * Calcula progresso para metas de crescimento
     */
    private static calculateGrowthProgress(stats: PolicyStats, period: string): number {
        let current = 0;
        let previous = 0;

        switch (period) {
            case 'mes':
                current = stats.monthlyValue;
                previous = stats.previousMonthValue;
                break;
            case 'trimestre':
                current = stats.quarterlyValue;
                previous = stats.previousQuarterValue;
                break;
            case 'ano':
                current = stats.yearlyValue;
                previous = stats.previousYearValue;
                break;
            default:
                current = stats.totalValue;
                previous = stats.previousYearValue;
        }

        if (previous === 0) {
            return current > 0 ? 100 : 0; // Se não havia vendas antes, qualquer venda é 100% de crescimento
        }

        return ((current - previous) / previous) * 100;
    }

    /**
     * Obtém dados de valor por período
     */
    private static getPeriodValueData(stats: PolicyStats, period: string) {
        let current = 0;
        let previous = 0;

        switch (period) {
            case 'semana':
                current = stats.monthlyValue / 4;
                previous = stats.previousMonthValue / 4;
                break;
            case 'mes':
                current = stats.monthlyValue;
                previous = stats.previousMonthValue;
                break;
            case 'trimestre':
                current = stats.quarterlyValue;
                previous = stats.previousQuarterValue;
                break;
            case 'ano':
                current = stats.yearlyValue;
                previous = stats.previousYearValue;
                break;
        }

        const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

        return { current, previous, growth };
    }

    /**
     * Obtém dados de quantidade por período
     */
    private static getPeriodCountData(stats: PolicyStats, period: string) {
        let current = 0;
        let previous = 0;

        switch (period) {
            case 'semana':
                current = Math.floor(stats.monthlyCount / 4);
                previous = Math.floor(stats.previousMonthCount / 4);
                break;
            case 'mes':
                current = stats.monthlyCount;
                previous = stats.previousMonthCount;
                break;
            case 'trimestre':
                current = stats.quarterlyCount;
                previous = stats.previousQuarterCount;
                break;
            case 'ano':
                current = stats.yearlyCount;
                previous = stats.previousYearCount;
                break;
        }

        const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

        return { current, previous, growth };
    }

    /**
     * Obtém dados de crescimento
     */
    private static getGrowthData(stats: PolicyStats, period: string) {
        return this.getPeriodValueData(stats, period);
    }

    /**
     * Retorna estatísticas vazias
     */
    private static getEmptyStats(): PolicyStats {
        return {
            totalValue: 0,
            totalCount: 0,
            monthlyValue: 0,
            monthlyCount: 0,
            quarterlyValue: 0,
            quarterlyCount: 0,
            yearlyValue: 0,
            yearlyCount: 0,
            previousMonthValue: 0,
            previousMonthCount: 0,
            previousQuarterValue: 0,
            previousQuarterCount: 0,
            previousYearValue: 0,
            previousYearCount: 0
        };
    }

    /**
     * Atualiza o progresso de uma meta no banco de dados
     */
    static async updateGoalProgress(
        goalId: string,
        current: number,
        isCompleted: boolean
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('goals')
                .update({
                    current: current,
                    status: isCompleted ? 'completed' : 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', goalId);

            if (error) {
                console.error('Error updating goal progress:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error updating goal progress:', error);
            return false;
        }
    }

    /**
     * Atualiza todas as metas de um usuário (chamado após inserir apólice)
     */
    static async updateAllUserGoals(userId: string): Promise<boolean> {
        try {
            // Buscar todas as metas ativas do usuário
            const { data: goals, error: goalsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (goalsError) {
                console.error('Error fetching user goals:', goalsError);
                return false;
            }

            // Atualizar cada meta
            for (const goal of goals || []) {
                const result = await this.calculateGoalProgress(
                    goal.id,
                    userId,
                    goal.type,
                    goal.target_period,
                    goal.target
                );

                await this.updateGoalProgress(goal.id, result.current, result.isCompleted);
            }

            return true;
        } catch (error) {
            console.error('Error updating all user goals:', error);
            return false;
        }
    }
}
