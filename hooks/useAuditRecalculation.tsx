import { useState, useEffect, useCallback } from 'react';
import { AuditRecalculationService, AuditRecalculationResult, CampaignProgressData } from '../services/auditRecalculationService';

export interface RecalculationStats {
    totalRuns: number;
    successfulRuns: number;
    totalCampaignsRecalculated: number;
    lastRun?: string;
    errors: string[];
}

export const useAuditRecalculation = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState<RecalculationStats>({
        totalRuns: 0,
        successfulRuns: 0,
        totalCampaignsRecalculated: 0,
        errors: []
    });
    const [lastResult, setLastResult] = useState<AuditRecalculationResult | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Inicia o serviço de recálculo automático
     */
    const startAutoRecalculation = useCallback(() => {
        try {
            AuditRecalculationService.startAutoRecalculation();
            setIsRunning(true);
            console.log('✅ Serviço de recálculo automático iniciado');
        } catch (error: any) {
            console.error('❌ Erro ao iniciar serviço de recálculo:', error);
        }
    }, []);

    /**
     * Para o serviço de recálculo automático
     */
    const stopAutoRecalculation = useCallback(() => {
        try {
            AuditRecalculationService.stopAutoRecalculation();
            setIsRunning(false);
            console.log('⏹️ Serviço de recálculo automático parado');
        } catch (error: any) {
            console.error('❌ Erro ao parar serviço de recálculo:', error);
        }
    }, []);

    /**
     * Executa recálculo manual
     */
    const performManualRecalculation = useCallback(async (): Promise<AuditRecalculationResult> => {
        setLoading(true);
        try {
            console.log('🔄 Executando recálculo manual...');
            const result = await AuditRecalculationService.performRecalculation();
            
            setLastResult(result);
            setStats(prev => ({
                totalRuns: prev.totalRuns + 1,
                successfulRuns: prev.successfulRuns + (result.success ? 1 : 0),
                totalCampaignsRecalculated: prev.totalCampaignsRecalculated + result.recalculatedCampaigns,
                lastRun: result.timestamp,
                errors: [...prev.errors, ...result.errors]
            }));

            return result;
        } catch (error: any) {
            console.error('❌ Erro no recálculo manual:', error);
            const errorResult: AuditRecalculationResult = {
                success: false,
                recalculatedCampaigns: 0,
                errors: [error.message],
                timestamp: new Date().toISOString()
            };
            setLastResult(errorResult);
            return errorResult;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Força recálculo de uma campanha específica
     */
    const forceRecalculateCampaign = useCallback(async (campaignId: string): Promise<CampaignProgressData> => {
        setLoading(true);
        try {
            console.log(`🔄 Forçando recálculo da campanha: ${campaignId}`);
            const result = await AuditRecalculationService.forceRecalculateCampaign(campaignId);
            console.log(`✅ Campanha recalculada: ${result.campaignTitle}`);
            return result;
        } catch (error: any) {
            console.error('❌ Erro ao recalcular campanha:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Obtém status do serviço
     */
    const getServiceStatus = useCallback(() => {
        return AuditRecalculationService.getServiceStatus();
    }, []);

    /**
     * Limpa estatísticas de erro
     */
    const clearErrors = useCallback(() => {
        setStats(prev => ({
            ...prev,
            errors: []
        }));
    }, []);

    /**
     * Configurar listener para mudanças no serviço
     */
    useEffect(() => {
        // Verificar status inicial
        const status = getServiceStatus();
        setIsRunning(status.isRunning);

        // Configurar intervalo para verificar status
        const interval = setInterval(() => {
            const currentStatus = getServiceStatus();
            setIsRunning(currentStatus.isRunning);
        }, 10000); // Verificar a cada 10 segundos

        return () => {
            clearInterval(interval);
        };
    }, [getServiceStatus]);

    return {
        // Estado
        isRunning,
        stats,
        lastResult,
        loading,

        // Ações
        startAutoRecalculation,
        stopAutoRecalculation,
        performManualRecalculation,
        forceRecalculateCampaign,
        clearErrors,

        // Utilitários
        getServiceStatus
    };
};
