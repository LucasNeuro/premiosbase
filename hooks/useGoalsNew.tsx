import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Goal } from '../types';
import { updateAllUserCampaignProgressAuxiliar } from '../services/campaignProgressAuxiliar';
import { CampaignStatusCorrectionService } from '../services/campaignStatusCorrectionService';
import { useRealtimeListener } from './useRealtimeEvents';

// Declaração global para TypeScript
declare global {
    interface Window {
        refreshCampaigns?: () => Promise<void>;
    }
}

interface GoalsContextType {
    // Campanhas
    campaigns: Goal[];
    acceptedCampaigns: Goal[];
    pendingCampaigns: Goal[];
    
    // Apólices vinculadas
    linkedPolicies: Goal[];
    
    // Estados
    loading: boolean;
    error: string | null;
    
    // Funções
    fetchCampaigns: () => Promise<void>;
    acceptCampaign: (campaignId: string) => Promise<{ success: boolean; message: string }>;
    rejectCampaign: (campaignId: string) => Promise<{ success: boolean; message: string }>;
    linkPolicyToCampaign: (policyData: PolicyLinkData) => Promise<{ success: boolean; message: string }>;
    unlinkPolicy: (policyLinkId: string) => Promise<{ success: boolean; message: string }>;
    refreshCampaigns: () => Promise<void>;
}

interface PolicyLinkData {
    campaignId: string;
    policyNumber: string;
    policyType: 'Seguro Auto' | 'Seguro Residencial';
    premiumValue: number;
    contractType: 'Novo' | 'Renovação Bradesco';
    cpdNumber?: string;
    city?: string;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: ReactNode; userId: string }> = ({ 
    children, 
    userId 
}) => {
    const [campaigns, setCampaigns] = useState<Goal[]>([]);
    const [acceptedCampaigns, setAcceptedCampaigns] = useState<Goal[]>([]);
    const [pendingCampaigns, setPendingCampaigns] = useState<Goal[]>([]);
    const [linkedPolicies, setLinkedPolicies] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaignsSimple = async () => {
        if (!userId || userId === '') return;
        
        try {
            setLoading(true);
            setError(null);

            // Buscar apenas campanhas do usuário logado (sem prêmios)

            const { data: campaignsData, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (campaignsError) {
                throw campaignsError;
            }

            const allCampaigns = campaignsData || [];

            
            // Campanhas já filtradas por user_id no banco de dados
            const accepted = allCampaigns.filter(c => c.acceptance_status === 'accepted');
            const pending = allCampaigns.filter(c => c.acceptance_status === 'pending');

            setCampaigns(allCampaigns);
            setAcceptedCampaigns(accepted);
            setPendingCampaigns(pending);

            // Buscar apólices vinculadas às campanhas aceitas
            if (accepted.length > 0) {
                const acceptedIds = accepted.map(c => c.id);
                
                const { data: policiesData, error: policiesError } = await supabase
                    .from('policy_campaign_links')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .in('campaign_id', acceptedIds)
                    .order('linked_at', { ascending: false });

                if (policiesError) throw policiesError;

                setLinkedPolicies(policiesData || []);
            } else {
                setLinkedPolicies([]);
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        if (!userId || userId === '') return;
        
        try {
            setLoading(true);
            setError(null);
            
            // 🔧 CORREÇÃO: Corrigir status das campanhas antes de buscar dados
            console.log('🔧 Corrigindo status das campanhas...');
            await CampaignStatusCorrectionService.correctUserCampaignStatuses(userId);

            // Buscar apenas campanhas do usuário logado
            const { data: campaignsData, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (campaignsError) throw campaignsError;

            // Buscar prêmios associados às campanhas (com tratamento de erro)
            let campaignsWithPrizes = campaignsData || [];
            
            if (campaignsData && campaignsData.length > 0) {
                try {
                    const campaignIds = campaignsData.map(c => c.id);
                    
                    const { data: prizesData, error: prizesError } = await supabase
                        .from('campanhas_premios')
                        .select('*')
                        .in('goal_id', campaignIds);
                    
                    // Buscar dados dos prêmios separadamente se houver vinculações
                    let prizesWithDetails = [];
                    if (!prizesError && prizesData && prizesData.length > 0) {
                        const prizeIds = prizesData.map(p => p.premio_id);
                        const { data: premiosData, error: premiosError } = await supabase
                            .from('premios')
                            .select('id, nome, descricao, valor_estimado, imagem_url, imagem_miniatura_url')
                            .in('id', prizeIds);
                        
                        if (!premiosError && premiosData) {
                            prizesWithDetails = prizesData.map(vinculacao => ({
                                ...vinculacao,
                                premio: premiosData.find(p => p.id === vinculacao.premio_id)
                            }));
                        }
                    }

                    if (!prizesError) {
                        campaignsWithPrizes = campaignsData.map(campaign => ({
                            ...campaign,
                            campanhas_premios: prizesWithDetails.filter(p => p.goal_id === campaign.id)
                        }));
                    }
                } catch (prizesError) {
                    // Continuar sem os prêmios para não quebrar a funcionalidade principal
                    campaignsWithPrizes = campaignsData.map(campaign => ({
                        ...campaign,
                        campanhas_premios: []
                    }));
                }
            }

            const allCampaigns = campaignsWithPrizes;
            
            // Campanhas já filtradas por user_id no banco de dados
            const accepted = allCampaigns.filter(c => c.acceptance_status === 'accepted');
            const pending = allCampaigns.filter(c => c.acceptance_status === 'pending');

            setCampaigns(allCampaigns);
            setAcceptedCampaigns(accepted);
            setPendingCampaigns(pending);

            // DESABILITADO: Atualização automática de progresso para evitar loops
            // O progresso será atualizado apenas quando necessário (criação de apólices)
            // Buscar apólices vinculadas às campanhas aceitas (record_type = 'policy_link')
            if (accepted.length > 0) {
                const acceptedIds = accepted.map(c => c.id);
                
                const { data: policiesData, error: policiesError } = await supabase
                    .from('policy_campaign_links')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .in('campaign_id', acceptedIds)
                    .order('linked_at', { ascending: false });

                if (policiesError) throw policiesError;

                setLinkedPolicies(policiesData || []);
            } else {
                setLinkedPolicies([]);
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const acceptCampaign = async (campaignId: string): Promise<{ success: boolean; message: string }> => {
        try {

            // SOLUÇÃO ALTERNATIVA: Usar RPC (função do banco) em vez de UPDATE direto
            const { error } = await supabase.rpc('accept_campaign', {
                campaign_id_param: campaignId,
                user_id_param: userId
            });

            if (error) {
                
                // FALLBACK: Tentar UPDATE direto como último recurso

                const { error: updateError } = await supabase
                    .from('goals')
                    .update({ acceptance_status: 'accepted' })
                    .eq('id', campaignId)
                    .eq('user_id', userId);
                    
                if (updateError) {
                    throw updateError;
                }
            }

            // Recarregar dados
            await fetchCampaignsSimple();
            return { success: true, message: 'Campanha aceita com sucesso!' };

        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao aceitar campanha' };
        }
    };

    const rejectCampaign = async (campaignId: string): Promise<{ success: boolean; message: string }> => {
        try {

            // SOLUÇÃO ALTERNATIVA: Usar RPC (função do banco) em vez de UPDATE direto
            const { error } = await supabase.rpc('reject_campaign', {
                campaign_id_param: campaignId,
                user_id_param: userId
            });

            if (error) {
                
                // FALLBACK: Tentar UPDATE direto como último recurso

                const { error: updateError } = await supabase
                    .from('goals')
                    .update({ acceptance_status: 'rejected' })
                    .eq('id', campaignId)
                    .eq('user_id', userId);
                    
                if (updateError) {
                    throw updateError;
                }
            }

            // Recarregar dados
            await fetchCampaignsSimple();
            return { success: true, message: 'Campanha rejeitada' };

        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao rejeitar campanha' };
        }
    };

    const linkPolicyToCampaign = async (policyData: PolicyLinkData): Promise<{ success: boolean; message: string }> => {
        try {
            // Verificar se a campanha existe e está aceita
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', policyData.campaignId)
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted')
                .single();

            if (campaignError || !campaign) {
                return { success: false, message: 'Campanha não encontrada ou não aceita' };
            }

            // Verificar se a apólice já está vinculada
            const { data: existingPolicy } = await supabase
                .from('goals')
                .select('id')
                .eq('campaign_master_id', policyData.campaignId)
                .eq('policy_number', policyData.policyNumber)
                .eq('record_type', 'policy_link')
                .single();

            if (existingPolicy) {
                return { success: false, message: 'Apólice já vinculada a esta campanha' };
            }

            // Gerar ticket code único
            const ticketCode = generateTicketCode();

            // Inserir apólice vinculada
            const { error: insertError } = await supabase
                .from('goals')
                .insert({
                    user_id: userId,
                    title: `${campaign.title} - ${policyData.policyNumber}`,
                    target: campaign.target,
                    unit: campaign.unit,
                    type: campaign.type,
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                    record_type: 'policy_link',
                    campaign_master_id: policyData.campaignId,
                    // Dados da apólice
                    policy_number: policyData.policyNumber,
                    policy_type: policyData.policyType,
                    policy_premium_value: policyData.premiumValue,
                    policy_registration_date: new Date().toISOString(),
                    policy_ticket_code: ticketCode,
                    policy_contract_type: policyData.contractType,
                    policy_city: policyData.city,
                    policy_cpd_number: policyData.cpdNumber,
                    policy_status: 'active',
                    // Dados básicos da apólice (histórico na tabela goals)
                    linked_to_campaign: campaign.id,
                    acceptance_status: 'accepted',
                    accepted_at: new Date().toISOString(),
                    accepted_by: userId
                });

            if (insertError) throw insertError;

            await fetchCampaigns(); // Recarregar dados
            return { success: true, message: 'Apólice vinculada à campanha com sucesso!' };

        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao vincular apólice' };
        }
    };

    const unlinkPolicy = async (policyLinkId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('policy_campaign_links')
                .update({
                    is_active: false,
                    unlinked_at: new Date().toISOString(),
                    unlink_reason: 'Desvinculada pelo usuário'
                })
                .eq('id', policyLinkId)
                .eq('user_id', userId);

            if (error) throw error;

            await fetchCampaigns(); // Recarregar dados
            return { success: true, message: 'Apólice desvinculada com sucesso!' };

        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao desvincular apólice' };
        }
    };

    // Gerar código de ticket único
    const generateTicketCode = (): string => {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `TKT${timestamp.slice(-6)}${random.toUpperCase()}`;
    };

    useEffect(() => {
        if (userId && userId !== '') {
            fetchCampaigns();
        }
    }, [userId]);

    // Função para refresh manual
    const refreshCampaigns = useCallback(async () => {
        if (userId && userId !== '') {
            await fetchCampaigns();
        }
    }, [userId, fetchCampaigns]);

    // Disponibilizar função globalmente para outros hooks
    useEffect(() => {
        window.refreshCampaigns = refreshCampaigns;
        return () => {
            delete window.refreshCampaigns;
        };
    }, [refreshCampaigns]);

    // DESABILITADO: Listener de eventos em tempo real para evitar loops
    // useRealtimeListener('campaigns', useCallback(() => {
    //     //     fetchCampaigns();
    // }, [fetchCampaigns]), [fetchCampaigns]);

    const contextValue: GoalsContextType = {
        campaigns,
        acceptedCampaigns,
        pendingCampaigns,
        linkedPolicies,
        loading,
        error,
        fetchCampaigns,
        acceptCampaign,
        rejectCampaign,
        linkPolicyToCampaign,
        unlinkPolicy,
        refreshCampaigns
    };

    return (
        <GoalsContext.Provider value={contextValue}>
            {children}
        </GoalsContext.Provider>
    );
};

export const useGoalsNew = (): GoalsContextType => {
    const context = useContext(GoalsContext);
    if (!context) {
        throw new Error('useGoalsNew deve ser usado dentro de GoalsProvider');
    }
    return context;
};
