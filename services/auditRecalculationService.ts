import { supabase } from '../lib/supabase';

export interface AuditRecalculationResult {
    success: boolean;
    recalculatedCampaigns: number;
    errors: string[];
    timestamp: string;
}

export interface CampaignProgressData {
    campaignId: string;
    campaignTitle: string;
    currentProgress: number;
    previousProgress: number;
    difference: number;
    policiesCount: number;
    totalValue: number;
}

export class AuditRecalculationService {
    private static readonly RECALCULATION_INTERVAL = 90 * 1000; // 1 minuto e 30 segundos
    private static readonly BATCH_SIZE = 50;
    private static isRunning = false;

    /**
     * Inicia o serviço de recálculo automático
     */
    static startAutoRecalculation(): void {
        if (this.isRunning) {
            console.log('🔄 Serviço de recálculo já está rodando');
            return;
        }

        console.log('🚀 Iniciando serviço de recálculo automático...');
        this.isRunning = true;

        // Executar imediatamente
        this.performRecalculation();

        // Configurar intervalo
        setInterval(() => {
            this.performRecalculation();
        }, this.RECALCULATION_INTERVAL);
    }

    /**
     * Para o serviço de recálculo automático
     */
    static stopAutoRecalculation(): void {
        console.log('⏹️ Parando serviço de recálculo automático...');
        this.isRunning = false;
    }

    /**
     * Executa o recálculo completo
     */
    static async performRecalculation(): Promise<AuditRecalculationResult> {
        const startTime = new Date();
        const result: AuditRecalculationResult = {
            success: true,
            recalculatedCampaigns: 0,
            errors: [],
            timestamp: startTime.toISOString()
        };

        try {
            console.log('🔄 Iniciando recálculo automático...');

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
                console.log('ℹ️ Nenhuma campanha ativa encontrada');
                return result;
            }

            console.log(`📊 Encontradas ${campaigns.length} campanhas para recálculo`);

            // 2. Para cada campanha, recalcular progresso
            for (const campaign of campaigns) {
                try {
                    const progressData = await this.recalculateCampaignProgress(campaign);
                    
                    if (progressData.difference !== 0) {
                        console.log(`📈 Campanha "${campaign.title}": ${progressData.previousProgress}% → ${progressData.currentProgress}% (${progressData.difference > 0 ? '+' : ''}${progressData.difference}%)`);
                        result.recalculatedCampaigns++;
                    }
                } catch (error: any) {
                    const errorMsg = `Erro ao recalcular campanha ${campaign.id}: ${error.message}`;
                    console.error('❌', errorMsg);
                    result.errors.push(errorMsg);
                }
            }

            // 3. Verificar inconsistências na auditoria
            await this.auditDataConsistency();

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            
            console.log(`✅ Recálculo concluído em ${duration}ms. ${result.recalculatedCampaigns} campanhas recalculadas.`);

        } catch (error: any) {
            console.error('❌ Erro no recálculo automático:', error);
            result.success = false;
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Recalcula o progresso de uma campanha específica
     */
    private static async recalculateCampaignProgress(campaign: any): Promise<CampaignProgressData> {
        const previousProgress = campaign.progress_percentage || 0;

        // Buscar todas as apólices vinculadas a esta campanha
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

        // Calcular progresso baseado nos critérios da campanha
        let currentProgress = 0;
        let totalValue = 0;
        let policiesCount = 0;

        if (policyLinks && policyLinks.length > 0) {
            policiesCount = policyLinks.length;
            totalValue = policyLinks.reduce((sum, link) => sum + (link.policies?.premium_value || 0), 0);

            // Aplicar critérios específicos da campanha
            if (campaign.criteria && typeof campaign.criteria === 'object') {
                currentProgress = this.calculateProgressWithCriteria(campaign, policyLinks);
            } else {
                // Cálculo simples baseado no tipo da campanha
                if (campaign.type === 'valor') {
                    currentProgress = Math.min((totalValue / campaign.target) * 100, 100);
                } else if (campaign.type === 'apolices') {
                    currentProgress = Math.min((policiesCount / campaign.target) * 100, 100);
                }
            }
        }

        // Atualizar progresso na campanha se houver diferença
        if (Math.abs(currentProgress - previousProgress) > 0.1) {
            const { error: updateError } = await supabase
                .from('goals')
                .update({
                    current_value: campaign.type === 'valor' ? totalValue : policiesCount,
                    progress_percentage: currentProgress,
                    status: currentProgress >= 100 ? 'completed' : 'active',
                    achieved_at: currentProgress >= 100 ? new Date().toISOString() : null,
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
            policiesCount,
            totalValue
        };
    }

    /**
     * Calcula progresso considerando critérios específicos
     */
    private static calculateProgressWithCriteria(campaign: any, policyLinks: any[]): number {
        // Implementar lógica específica baseada nos critérios
        // Por exemplo: critérios por tipo de seguro, valor mínimo, etc.
        
        let validPolicies = 0;
        let totalValue = 0;

        for (const link of policyLinks) {
            const policy = link.policies;
            if (!policy) continue;

            // Verificar se a apólice atende aos critérios
            if (this.policyMeetsCriteria(policy, campaign.criteria)) {
                validPolicies++;
                totalValue += policy.premium_value;
            }
        }

        // Calcular progresso baseado no tipo da campanha
        if (campaign.type === 'valor') {
            return Math.min((totalValue / campaign.target) * 100, 100);
        } else if (campaign.type === 'apolices') {
            return Math.min((validPolicies / campaign.target) * 100, 100);
        }

        return 0;
    }

    /**
     * Verifica se uma apólice atende aos critérios da campanha
     */
    private static policyMeetsCriteria(policy: any, criteria: any): boolean {
        // Implementar lógica de validação de critérios
        // Por exemplo: tipo de seguro, valor mínimo, período, etc.
        
        if (!criteria) return true;

        // Exemplo: verificar tipo de seguro
        if (criteria.required_type && policy.type !== criteria.required_type) {
            return false;
        }

        // Exemplo: verificar valor mínimo
        if (criteria.min_value && policy.premium_value < criteria.min_value) {
            return false;
        }

        return true;
    }

    /**
     * Verifica consistência dos dados entre auditoria e políticas
     */
    private static async auditDataConsistency(): Promise<void> {
        console.log('🔍 Verificando consistência dos dados...');

        // Buscar registros de auditoria sem apólice correspondente
        const { data: orphanAudits, error: orphanError } = await supabase
            .from('policy_launch_audit')
            .select('id, policy_id, policy_number')
            .is('policy_id', null);

        if (orphanError) {
            console.error('❌ Erro ao verificar auditorias órfãs:', orphanError);
            return;
        }

        if (orphanAudits && orphanAudits.length > 0) {
            console.warn(`⚠️ Encontradas ${orphanAudits.length} auditorias órfãs (sem apólice correspondente)`);
        }

        // Buscar apólices sem registro de auditoria
        const { data: policiesWithoutAudit, error: policiesError } = await supabase
            .from('policies')
            .select('id, policy_number')
            .not('id', 'in', `(SELECT policy_id FROM policy_launch_audit WHERE policy_id IS NOT NULL)`);

        if (policiesError) {
            console.error('❌ Erro ao verificar políticas sem auditoria:', policiesError);
            return;
        }

        if (policiesWithoutAudit && policiesWithoutAudit.length > 0) {
            console.warn(`⚠️ Encontradas ${policiesWithoutAudit.length} políticas sem registro de auditoria`);
        }

        console.log('✅ Verificação de consistência concluída');
    }

    /**
     * Força recálculo de uma campanha específica
     */
    static async forceRecalculateCampaign(campaignId: string): Promise<CampaignProgressData> {
        const { data: campaign, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error || !campaign) {
            throw new Error(`Campanha não encontrada: ${campaignId}`);
        }

        return await this.recalculateCampaignProgress(campaign);
    }

    /**
     * Obtém estatísticas do serviço
     */
    static getServiceStatus(): {
        isRunning: boolean;
        interval: number;
        lastRun?: string;
    } {
        return {
            isRunning: this.isRunning,
            interval: this.RECALCULATION_INTERVAL,
            lastRun: this.isRunning ? new Date().toISOString() : undefined
        };
    }
}
