import { CampaignProgressValidator } from './campaignProgressValidator';

/**
 * Monitor de progresso das campanhas - executa validações periódicas
 */
export class CampaignProgressMonitor {
    private static intervalId: NodeJS.Timeout | null = null;
    private static isRunning = false;

    /**
     * Inicia o monitor de progresso
     */
    static start(userId: string, intervalMinutes: number = 5): void {
        if (this.isRunning) {
            console.log('⚠️ Monitor de progresso já está rodando');
            return;
        }

        console.log(`🔄 Iniciando monitor de progresso (intervalo: ${intervalMinutes} minutos)`);
        
        this.isRunning = true;
        this.intervalId = setInterval(async () => {
            try {
                console.log('🔍 Executando validação periódica de progresso...');
                const result = await CampaignProgressValidator.validateUserCampaignProgress(userId);
                
                if (result.corrected > 0) {
                    console.log(`🔧 Validação periódica: ${result.corrected} campanhas corrigidas`);
                } else {
                    console.log('✅ Validação periódica: Nenhuma inconsistência encontrada');
                }
            } catch (error) {
                console.error('❌ Erro na validação periódica:', error);
            }
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Para o monitor de progresso
     */
    static stop(): void {
        if (this.intervalId) {
            console.log('🛑 Parando monitor de progresso');
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
        }
    }

    /**
     * Verifica se o monitor está rodando
     */
    static isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Executa uma validação manual
     */
    static async runManualValidation(userId: string): Promise<{
        validated: number;
        corrected: number;
        errors: string[];
    }> {
        console.log('🔍 Executando validação manual de progresso...');
        return await CampaignProgressValidator.validateUserCampaignProgress(userId);
    }
}
