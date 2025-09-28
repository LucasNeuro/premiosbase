import { supabase } from '../lib/supabase';
import { calculateCampaignProgressAuxiliar } from './campaignProgressAuxiliar';

/**
 * Serviço unificado para cálculo de progresso
 * Garante que admin e corretor usem a mesma lógica
 */
export class UnifiedProgressService {
    /**
     * Calcula progresso usando a MESMA lógica do corretor
     * Aplica todos os filtros: data, critérios, status, etc.
     */
    static async calculateProgress(campaignId: string): Promise<{
        currentValue: number;
        progressPercentage: number;
        isCompleted: boolean;
        totalPolicies: number;
        criteriaDetails?: any[];
    } | null> {
        try {
            console.log(`🔄 UnifiedProgressService - Calculando progresso unificado para campanha: ${campaignId}`);

            // Usar EXATAMENTE a mesma lógica do corretor
            const progressData = await calculateCampaignProgressAuxiliar(campaignId);
            
            if (!progressData) {
                console.log('❌ UnifiedProgressService - Nenhum dado de progresso retornado');
                return null;
            }

            console.log('✅ UnifiedProgressService - Progresso calculado:', {
                currentValue: progressData.currentValue,
                progressPercentage: progressData.progressPercentage,
                isCompleted: progressData.isCompleted,
                totalPolicies: progressData.totalPolicies
            });

            return {
                currentValue: progressData.currentValue,
                progressPercentage: progressData.progressPercentage,
                isCompleted: progressData.isCompleted,
                totalPolicies: progressData.totalPolicies,
                criteriaDetails: progressData.criteriaDetails
            };

        } catch (error) {
            console.error('❌ UnifiedProgressService - Erro ao calcular progresso:', error);
            return null;
        }
    }

    /**
     * Atualiza o progresso no banco usando a lógica unificada
     */
    static async updateProgressInDatabase(campaignId: string): Promise<boolean> {
        try {
            console.log(`🔄 UnifiedProgressService - Atualizando progresso no banco para campanha: ${campaignId}`);

            // Calcular progresso usando lógica unificada
            const progressData = await this.calculateProgress(campaignId);
            
            if (!progressData) {
                console.log('❌ UnifiedProgressService - Não foi possível calcular progresso');
                return false;
            }

            // Atualizar no banco
            const { error } = await supabase
                .from('goals')
                .update({
                    current_value: progressData.currentValue,
                    progress_percentage: progressData.progressPercentage,
                    last_updated: new Date().toISOString(),
                    status: progressData.isCompleted ? 'completed' : 'active',
                    achieved_at: progressData.isCompleted ? new Date().toISOString() : null,
                    achieved_value: progressData.isCompleted ? progressData.currentValue : null
                })
                .eq('id', campaignId)
                .eq('record_type', 'campaign');

            if (error) {
                console.error('❌ UnifiedProgressService - Erro ao atualizar banco:', error);
                return false;
            }

            console.log('✅ UnifiedProgressService - Progresso atualizado no banco');
            return true;

        } catch (error) {
            console.error('❌ UnifiedProgressService - Erro ao atualizar progresso:', error);
            return false;
        }
    }

    /**
     * Recalcula progresso de todas as campanhas de um usuário
     */
    static async recalculateUserCampaigns(userId: string): Promise<void> {
        try {
            console.log(`🔄 UnifiedProgressService - Recalculando campanhas do usuário: ${userId}`);

            // Buscar campanhas ativas do usuário
            const { data: campaigns, error } = await supabase
                .from('goals')
                .select('id, title')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .in('status', ['active', 'completed']);

            if (error) {
                console.error('❌ UnifiedProgressService - Erro ao buscar campanhas:', error);
                return;
            }

            if (!campaigns || campaigns.length === 0) {
                console.log('ℹ️ UnifiedProgressService - Nenhuma campanha encontrada');
                return;
            }

            // Atualizar cada campanha
            for (const campaign of campaigns) {
                try {
                    await this.updateProgressInDatabase(campaign.id);
                    console.log(`✅ UnifiedProgressService - Campanha ${campaign.title} atualizada`);
                } catch (error) {
                    console.error(`❌ UnifiedProgressService - Erro ao atualizar campanha ${campaign.id}:`, error);
                }
            }

            console.log('✅ UnifiedProgressService - Todas as campanhas recalculadas');

        } catch (error) {
            console.error('❌ UnifiedProgressService - Erro ao recalcular campanhas:', error);
        }
    }

    /**
     * Recalcula progresso de todas as campanhas (admin)
     */
    static async recalculateAllCampaigns(): Promise<void> {
        try {
            console.log('🔄 UnifiedProgressService - Recalculando todas as campanhas');

            // Buscar todas as campanhas ativas
            const { data: campaigns, error } = await supabase
                .from('goals')
                .select('id, title, user_id')
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .in('status', ['active', 'completed']);

            if (error) {
                console.error('❌ UnifiedProgressService - Erro ao buscar campanhas:', error);
                return;
            }

            if (!campaigns || campaigns.length === 0) {
                console.log('ℹ️ UnifiedProgressService - Nenhuma campanha encontrada');
                return;
            }

            // Atualizar cada campanha
            for (const campaign of campaigns) {
                try {
                    await this.updateProgressInDatabase(campaign.id);
                    console.log(`✅ UnifiedProgressService - Campanha ${campaign.title} atualizada`);
                } catch (error) {
                    console.error(`❌ UnifiedProgressService - Erro ao atualizar campanha ${campaign.id}:`, error);
                }
            }

            console.log('✅ UnifiedProgressService - Todas as campanhas recalculadas');

        } catch (error) {
            console.error('❌ UnifiedProgressService - Erro ao recalcular todas as campanhas:', error);
        }
    }
}
