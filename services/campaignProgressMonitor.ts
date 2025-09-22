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
            return;
        }
        this.isRunning = true;
        this.intervalId = setInterval(async () => {
            try {
                const result = await CampaignProgressValidator.validateUserCampaignProgress(userId);
                
                if (result.corrected > 0) {
                } else {
                }
            } catch (error) {
            }
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Para o monitor de progresso
     */
    static stop(): void {
        if (this.intervalId) {
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
        return await CampaignProgressValidator.validateUserCampaignProgress(userId);
    }
}
