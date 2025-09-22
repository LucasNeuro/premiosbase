import { supabase } from '../lib/supabase';

export interface BackgroundAuditResult {
    success: boolean;
    recalculatedCampaigns: number;
    errors: string[];
    timestamp: string;
    details: string[];
}

export interface CampaignCriteriaProgress {
    criterionId: string;
    criterionName: string;
    progress: number;
    target: number;
    current: number;
    isCompleted: boolean;
}

export class BackgroundAuditService {
    private static readonly RECALCULATION_INTERVAL = 90 * 1000; // 1 minuto e 30 segundos
    private static isRunning = false;
    private static intervalId: NodeJS.Timeout | null = null;
    private static lastRun: string | null = null;

    /**
     * Inicia o serviço de auditoria em background
     */
    static startBackgroundAudit(): void {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;

        // Executar imediatamente
        this.performBackgroundAudit();

        // Configurar intervalo
        this.intervalId = setInterval(() => {
            this.performBackgroundAudit();
        }, this.RECALCULATION_INTERVAL);
    }

    /**
     * Para o serviço de auditoria em background
     */
    static stopBackgroundAudit(): void {
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Executa auditoria em background (sem piscar interface)
     */
    static async performBackgroundAudit(): Promise<BackgroundAuditResult> {
        const startTime = new Date();
        this.lastRun = startTime.toISOString();
        
        const result: BackgroundAuditResult = {
            success: true,
            recalculatedCampaigns: 0,
            errors: [],
            timestamp: startTime.toISOString(),
            details: []
        };

        try {
            // 1. Buscar todas as campanhas ativas
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .eq('acceptance_status', 'accepted');

            if (campaignsError) {
                throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
            }

            if (!campaigns || campaigns.length === 0) {
                result.details.push('Nenhuma campanha ativa encontrada');
                return result;
            }

            result.details.push(`Encontradas ${campaigns.length} campanhas para auditoria`);

            // 2. Para cada campanha, recalcular progresso considerando TODOS os critérios
            for (const campaign of campaigns) {
                try {
                    const progressData = await this.recalculateCampaignWithAllCriteria(campaign);
                    
                    if (progressData.difference !== 0) {
                        result.recalculatedCampaigns++;
                        result.details.push(`Campanha "${campaign.title}": ${progressData.previousProgress}% → ${progressData.currentProgress}%`);
                    }
                } catch (error: any) {
                    const errorMsg = `Erro ao recalcular campanha ${campaign.id}: ${error.message}`;
                    result.errors.push(errorMsg);
                }
            }

            // 3. Salvar resultado na tabela de auditoria
            await this.saveAuditResult(result);

        } catch (error: any) {
            result.success = false;
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Recalcula campanha considerando TODOS os critérios
     */
    private static async recalculateCampaignWithAllCriteria(campaign: any): Promise<{
        campaignId: string;
        campaignTitle: string;
        currentProgress: number;
        previousProgress: number;
        difference: number;
        allCriteriaCompleted: boolean;
    }> {
        const previousProgress = campaign.progress_percentage || 0;

        // Buscar todas as apólices vinculadas
        const { data: policyLinks, error: linksError } = await supabase
            .from('policy_campaign_links')
            .select(`
                policy_id,
                policies!inner(
                    id,
                    premium_value,
                    type,
                    contract_type,
                    created_at
                )
            `)
            .eq('campaign_id', campaign.id)
            .eq('is_active', true);

        if (linksError) {
            throw new Error(`Erro ao buscar vinculações: ${linksError.message}`);
        }

        let currentProgress = 0;
        let allCriteriaCompleted = true;

        // Se tem critérios específicos, calcular cada um
        if (campaign.criteria && typeof campaign.criteria === 'object') {
            const criteriaProgress = this.calculateAllCriteriaProgress(campaign, policyLinks || []);
            
            // Progresso geral é a média dos critérios
            currentProgress = criteriaProgress.reduce((sum, c) => sum + c.progress, 0) / criteriaProgress.length;
            
            // Só considera concluída se TODOS os critérios estiverem 100%
            allCriteriaCompleted = criteriaProgress.every(c => c.progress >= 100);
            
            // Se não todos os critérios estão 100%, força não concluída
            if (!allCriteriaCompleted) {
                currentProgress = Math.min(currentProgress, 99.9);
            }
        } else {
            // Cálculo simples para campanhas sem critérios específicos
            const totalValue = (policyLinks || []).reduce((sum, link) => sum + (link.policies?.premium_value || 0), 0);
            const policiesCount = (policyLinks || []).length;

            if (campaign.type === 'valor') {
                currentProgress = Math.min((totalValue / campaign.target) * 100, 100);
            } else if (campaign.type === 'apolices') {
                currentProgress = Math.min((policiesCount / campaign.target) * 100, 100);
            }
        }

        // Atualizar progresso na campanha se houver diferença
        if (Math.abs(currentProgress - previousProgress) > 0.1) {
            const { error: updateError } = await supabase
                .from('goals')
                .update({
                    current_value: currentProgress,
                    progress_percentage: currentProgress,
                    status: allCriteriaCompleted && currentProgress >= 100 ? 'completed' : 'active',
                    achieved_at: allCriteriaCompleted && currentProgress >= 100 ? new Date().toISOString() : null,
                    last_updated: new Date().toISOString()
                })
                .eq('id', campaign.id);

            if (updateError) {
                throw new Error(`Erro ao atualizar progresso: ${updateError.message}`);
            }
        }

        return {
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            currentProgress,
            previousProgress,
            difference: currentProgress - previousProgress,
            allCriteriaCompleted
        };
    }

    /**
     * Calcula progresso de todos os critérios
     */
    private static calculateAllCriteriaProgress(campaign: any, policyLinks: any[]): CampaignCriteriaProgress[] {
        const criteria = campaign.criteria;
        if (!criteria || typeof criteria !== 'object') {
            return [];
        }

        const results: CampaignCriteriaProgress[] = [];

        // Processar cada critério
        Object.keys(criteria).forEach((key, index) => {
            const criterion = criteria[key];
            if (!criterion) return;
            let progress = 0;
            let current = 0;
            let target = 0;
            let isCompleted = false;

            // Filtrar apólices que atendem este critério
            const matchingPolicies = policyLinks.filter(link => {
                const policy = link.policies;
                if (!policy) return false;

                // Mapear tipos de apólice
                const policyTypeMap: { [key: string]: string } = {
                    'Seguro Auto': 'auto',
                    'Seguro Residencial': 'residencial'
                };

                // Verificar tipo de seguro
                if (criterion.policy_type && policyTypeMap[policy.type] !== criterion.policy_type) {
                    return false;
                }

                // Verificar valor mínimo por apólice
                if (criterion.min_value_per_policy && policy.premium_value < criterion.min_value_per_policy) {
                    return false;
                }

                return true;
            });

            // Calcular progresso baseado no tipo de meta
            if (criterion.target_type === 'quantity') {
                // Critério por quantidade
                current = matchingPolicies.length;
                target = criterion.target_value || 0; // Para quantidade, o valor está em target_value
                progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            } else if (criterion.target_type === 'value') {
                // Critério por valor
                current = matchingPolicies.reduce((sum, link) => sum + (link.policies?.premium_value || 0), 0);
                target = criterion.target_value || 0;
                progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            } else {
                // Fallback para compatibilidade com estruturas antigas
                if (criterion.target_count || criterion.target_quantity) {
                    // Critério por quantidade (estrutura antiga)
                    current = matchingPolicies.length;
                    target = criterion.target_count || criterion.target_quantity || 0;
                    progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                } else if (criterion.target_value) {
                    // Critério por valor (estrutura antiga)
                    current = matchingPolicies.reduce((sum, link) => sum + (link.policies?.premium_value || 0), 0);
                    target = criterion.target_value;
                    progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                } else {
                }
            }

            isCompleted = progress >= 100;
            results.push({
                criterionId: key,
                criterionName: `Critério ${index + 1}`,
                progress,
                target,
                current,
                isCompleted
            });
        });

        return results;
    }

    /**
     * Salva resultado da auditoria em tabela
     */
    private static async saveAuditResult(result: BackgroundAuditResult): Promise<void> {
        try {
            const { error } = await supabase
                .from('audit_results')
                .insert({
                    timestamp: result.timestamp,
                    success: result.success,
                    recalculated_campaigns: result.recalculatedCampaigns,
                    errors: result.errors,
                    details: result.details
                });

            if (error) {
            }
        } catch (error) {
        }
    }

    /**
     * Obtém status do serviço
     */
    static getServiceStatus(): {
        isRunning: boolean;
        lastRun?: string;
        interval: number;
    } {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun || undefined,
            interval: this.RECALCULATION_INTERVAL
        };
    }
}
