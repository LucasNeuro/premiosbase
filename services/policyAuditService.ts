import { supabase } from '../lib/supabase';

export interface PolicyLaunchAudit {
    id?: string;
    policy_id: string;
    user_id: string;
    policy_number: string;
    policy_type: string;
    contract_type: string;
    premium_value: number;
    cpd_number: string;
    cpd_name?: string;
    linked_campaigns_count: number;
    linked_campaigns_details?: any[];
    ai_analysis?: any;
    created_at?: string;
    updated_at?: string;
}

export interface CampaignLink {
    campaign_id: string;
    campaign_title: string;
    match_score: number;
    reasoning: string;
}

export class PolicyAuditService {
    /**
     * Registra um lançamento de apólice na auditoria
     */
    static async recordPolicyLaunch(
        policyData: {
            policy_id: string;
            policy_number: string;
            policy_type: string;
            contract_type: string;
            premium_value: number;
            cpd_number: string;
            cpd_name?: string;
        },
        userId: string,
        linkedCampaigns: CampaignLink[] = [],
        aiAnalysis?: any
    ): Promise<PolicyLaunchAudit> {
        try {
            const auditData: Omit<PolicyLaunchAudit, 'id' | 'created_at' | 'updated_at'> = {
                policy_id: policyData.policy_id,
                user_id: userId,
                policy_number: policyData.policy_number,
                policy_type: policyData.policy_type,
                contract_type: policyData.contract_type,
                premium_value: policyData.premium_value,
                cpd_number: policyData.cpd_number,
                cpd_name: policyData.cpd_name,
                linked_campaigns_count: linkedCampaigns.length,
                linked_campaigns_details: linkedCampaigns,
                ai_analysis: aiAnalysis
            };

            const { data, error } = await supabase
                .from('policy_launch_audit')
                .insert(auditData)
                .select()
                .single();

            if (error) {
                console.error('Erro ao registrar auditoria:', error);
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Erro no PolicyAuditService.recordPolicyLaunch:', error);
            throw error;
        }
    }

    /**
     * Busca o histórico de lançamentos de apólices para o usuário
     */
    static async getPolicyLaunchHistory(
        userId: string,
        limit: number = 50
    ): Promise<PolicyLaunchAudit[]> {
        try {
            const { data, error } = await supabase
                .from('policy_launch_audit')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Erro ao buscar histórico:', error);
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('Erro no PolicyAuditService.getPolicyLaunchHistory:', error);
            throw error;
        }
    }

    /**
     * Busca estatísticas de lançamentos
     */
    static async getLaunchStatistics(userId: string): Promise<{
        total_policies: number;
        total_premium_value: number;
        auto_policies: number;
        residential_policies: number;
        auto_premium_value: number;
        residential_premium_value: number;
        average_premium: number;
    }> {
        try {
            const { data, error } = await supabase
                .from('policy_launch_audit')
                .select('policy_type, premium_value')
                .eq('user_id', userId);

            if (error) {
                console.error('Erro ao buscar estatísticas:', error);
                throw error;
            }

            const policies = data || [];
            
            const total_policies = policies.length;
            const total_premium_value = policies.reduce((sum, p) => sum + p.premium_value, 0);
            
            const auto_policies = policies.filter(p => p.policy_type === 'Seguro Auto').length;
            const residential_policies = policies.filter(p => p.policy_type === 'Seguro Residencial').length;
            
            const auto_premium_value = policies
                .filter(p => p.policy_type === 'Seguro Auto')
                .reduce((sum, p) => sum + p.premium_value, 0);
            
            const residential_premium_value = policies
                .filter(p => p.policy_type === 'Seguro Residencial')
                .reduce((sum, p) => sum + p.premium_value, 0);
            
            const average_premium = total_policies > 0 ? total_premium_value / total_policies : 0;

            return {
                total_policies,
                total_premium_value,
                auto_policies,
                residential_policies,
                auto_premium_value,
                residential_premium_value,
                average_premium
            };

        } catch (error) {
            console.error('Erro no PolicyAuditService.getLaunchStatistics:', error);
            throw error;
        }
    }

    /**
     * Formata dados para o timeline
     */
    static formatForTimeline(auditRecord: PolicyLaunchAudit): {
        id: string;
        policyNumber: string;
        policyType: string;
        contractType: string;
        premiumValue: number;
        cpdNumber: string;
        cpdName: string;
        linkedCampaignsCount: number;
        linkedCampaignsDetails: CampaignLink[];
        createdAt: string;
        timeAgo: string;
    } {
        return {
            id: auditRecord.id!,
            policyNumber: auditRecord.policy_number,
            policyType: auditRecord.policy_type,
            contractType: auditRecord.contract_type,
            premiumValue: auditRecord.premium_value,
            cpdNumber: auditRecord.cpd_number,
            cpdName: auditRecord.cpd_name || `CPD ${auditRecord.cpd_number}`,
            linkedCampaignsCount: auditRecord.linked_campaigns_count,
            linkedCampaignsDetails: auditRecord.linked_campaigns_details || [],
            createdAt: auditRecord.created_at!,
            timeAgo: this.formatTimeAgo(auditRecord.created_at!)
        };
    }

    /**
     * Formata tempo relativo (ex: "2 horas atrás")
     */
    private static formatTimeAgo(dateString: string): string {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return 'Agora mesmo';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
        } else if (diffInDays === 1) {
            return 'Ontem';
        } else if (diffInDays < 7) {
            return `${diffInDays} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    /**
     * Configura listener em tempo real para mudanças na auditoria
     */
    static setupRealtimeListener(
        userId: string,
        onUpdate: (auditRecord: PolicyLaunchAudit) => void
    ) {
        console.log('🔴 Configurando listener realtime para user:', userId);
        
        const channel = supabase
            .channel('policy_launch_audit_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'policy_launch_audit',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('🟢 Nova apólice lançada via realtime:', payload.new);
                    onUpdate(payload.new as PolicyLaunchAudit);
                }
            )
            .subscribe((status) => {
                console.log('🟡 Status do realtime:', status);
            });

        console.log('🔴 Listener realtime configurado:', channel);

        return () => {
            console.log('🔴 Removendo listener realtime');
            supabase.removeChannel(channel);
        };
    }
}
