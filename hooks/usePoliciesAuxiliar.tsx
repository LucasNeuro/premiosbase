import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PolicyType, ContractType } from '../types';
import { generateTicketCode } from '../utils/ticketGenerator';
import { updateAllUserCampaignProgressAuxiliar } from '../services/campaignProgressAuxiliar';
import { useRealtimeListener } from './useRealtimeEvents';

// Interface para a nova estrutura de Policy
export interface PolicyAuxiliar {
    id: string;
    user_id: string;
    policy_number: string;
    type: PolicyType;
    premium_value: number;
    registration_date: string;
    contract_type: ContractType;
    cpd_number: string;
    city?: string;
    ticket_code: string;
    status: 'active' | 'cancelled';
    created_at: string;
    updated_at: string;
    
    // Dados de vinculação (se existir)
    linked_campaigns?: {
        campaign_id: string;
        campaign_title: string;
        linked_at: string;
        linked_automatically: boolean;
    }[];
}

// Interface para vinculação Policy <-> Campaign
export interface PolicyCampaignLink {
    id: string;
    policy_id: string;
    campaign_id: string;
    user_id: string;
    linked_at: string;
    linked_by?: string;
    linked_automatically: boolean;
    is_active: boolean;
}

interface PoliciesAuxiliarContextType {
    policies: PolicyAuxiliar[];
    loading: boolean;
    lastUpdate: Date;
    addPolicy: (policy: Omit<PolicyAuxiliar, 'id' | 'registration_date' | 'ticket_code' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean, message: string }>;
    linkPolicyToCampaign: (policyId: string, campaignId: string) => Promise<{ success: boolean, message: string }>;
    unlinkPolicyFromCampaign: (policyId: string, campaignId: string) => Promise<{ success: boolean, message: string }>;
    refreshPolicies: () => void;
    getSummary: () => {
        autoCount: number;
        autoSum: number;
        residencialCount: number;
        residencialSum: number;
    };
}

const PoliciesAuxiliarContext = createContext<PoliciesAuxiliarContextType | undefined>(undefined);

export const PoliciesAuxiliarProvider: React.FC<{ children: React.ReactNode, userId: string }> = ({ children, userId }) => {
    const [policies, setPolicies] = useState<PolicyAuxiliar[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Buscar apólices da nova tabela auxiliar
    const fetchPolicies = useCallback(async () => {
        if (!userId || userId === '') return;

        try {
            setLoading(true);

            // Buscar todas as apólices (sem joins complexos)
            const { data, error } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('registration_date', { ascending: false });

            if (error) throw error;

            // Para cada apólice, buscar suas vinculações separadamente
            const transformedPolicies: PolicyAuxiliar[] = [];
            
            for (const policy of data || []) {
                // Buscar vinculações desta apólice
                const { data: links } = await supabase
                    .from('policy_campaign_links')
                    .select(`
                        campaign_id,
                        linked_at,
                        linked_automatically,
                        is_active,
                        campaign:goals!campaign_id(title)
                    `)
                    .eq('policy_id', policy.id)
                    .eq('is_active', true);

                const linkedCampaigns = links?.map(link => ({
                    campaign_id: link.campaign_id,
                    campaign_title: link.campaign?.title || 'Campanha',
                    linked_at: link.linked_at,
                    linked_automatically: link.linked_automatically
                })) || [];

                transformedPolicies.push({
                    ...policy,
                    linked_campaigns: linkedCampaigns
                });
            }

            setPolicies(transformedPolicies);
            setLastUpdate(new Date());

        } catch (error: any) {
            console.error('Erro ao buscar apólices:', error);
            setPolicies([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Adicionar nova apólice
    const addPolicy = useCallback(async (policyData: Omit<PolicyAuxiliar, 'id' | 'registration_date' | 'ticket_code' | 'created_at' | 'updated_at'>): Promise<{ success: boolean, message: string }> => {
        try {
            const ticketCode = generateTicketCode();

            // 1. Salvar apólice na tabela auxiliar
            const { data: newPolicy, error: policyError } = await supabase
                .from('policies')
                .insert({
                    user_id: userId,
                    policy_number: policyData.policy_number,
                    type: policyData.type,
                    premium_value: policyData.premium_value,
                    contract_type: policyData.contract_type,
                    cpd_number: policyData.cpd_number,
                    city: policyData.city,
                    ticket_code: ticketCode,
                    status: 'active'
                })
                .select()
                .single();

            if (policyError) throw policyError;

            // 2. Buscar campanhas compatíveis aceitas
            const { data: acceptedCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted')
                .eq('status', 'active')
                .eq('is_active', true);

            if (campaignsError) {
                }

            let linkedCampaigns = 0;
            let campaignMessage = '';

            // 3. Vincular automaticamente a campanhas compatíveis
            if (acceptedCampaigns && acceptedCampaigns.length > 0) {
                for (const campaign of acceptedCampaigns) {
                    // Verificar compatibilidade - APENAS campanhas com critérios compatíveis
                    let isCompatible = false;

                    if (campaign.criteria && Array.isArray(campaign.criteria) && campaign.criteria.length > 0) {
                        isCompatible = campaign.criteria.some((criterion: any) => {
                            // Verificar tipo de apólice
                            const policyTypeMap: { [key: string]: string } = {
                                'Seguro Auto': 'auto',
                                'Seguro Residencial': 'residencial'
                            };
                            
                            if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policyData.type]) {
                                return false;
                            }

                            // Verificar tipo de contrato
                            if (criterion.contract_type && criterion.contract_type !== policyData.contract_type) {
                                return false;
                            }

                            // Verificar valor mínimo
                            if (criterion.min_value_per_policy && policyData.premium_value < criterion.min_value_per_policy) {
                                return false;
                            }

                            return true;
                        });
                    } else {
                        }

                    if (isCompatible) {
                        // Criar vinculação
                        const { error: linkError } = await supabase
                            .from('policy_campaign_links')
                            .insert({
                                policy_id: newPolicy.id,
                                campaign_id: campaign.id,
                                user_id: userId,
                                linked_automatically: true,
                                is_active: true
                            });

                        if (!linkError) {
                            linkedCampaigns++;
                            campaignMessage += `✅ Vinculada à campanha "${campaign.title}"\n`;
                        } else {
                            }
                    }
                }
            }

            await fetchPolicies(); // Recarregar dados
            
            // Atualizar progresso das campanhas e refresh em tempo real
            try {
                await updateAllUserCampaignProgressAuxiliar(userId);
                // Forçar refresh dos dados no contexto Goals
                if (window.refreshCampaigns) {
                    window.refreshCampaigns();
                }
                
                // Evento personalizado para notificar outros componentes
                window.dispatchEvent(new CustomEvent('campaignProgressUpdated', { 
                    detail: { userId, linkedCampaigns } 
                }));
                
            } catch (progressError) {
                }

            // Mensagem de sucesso
            let successMessage = `Apólice ${policyData.policy_number} salva com sucesso!`;
            if (linkedCampaigns > 0) {
                successMessage += `\n\n🎯 Vinculada a ${linkedCampaigns} campanha(s) automaticamente`;
            }

            return { 
                success: true, 
                message: successMessage
            };

        } catch (error: any) {
            console.error('Erro ao adicionar apólice:', error);
            return { success: false, message: 'Erro ao salvar apólice: ' + error.message };
        }
    }, [userId, fetchPolicies]);

    // Vincular apólice a campanha
    const linkPolicyToCampaign = useCallback(async (policyId: string, campaignId: string): Promise<{ success: boolean, message: string }> => {
        try {
            const { error } = await supabase
                .from('policy_campaign_links')
                .insert({
                    policy_id: policyId,
                    campaign_id: campaignId,
                    user_id: userId,
                    linked_automatically: false,
                    is_active: true
                });

            if (error) throw error;

            await fetchPolicies();
            return { success: true, message: 'Apólice vinculada à campanha com sucesso!' };

        } catch (error: any) {
            console.error('Erro ao vincular apólice:', error);
            return { success: false, message: 'Erro ao vincular apólice: ' + error.message };
        }
    }, [userId, fetchPolicies]);

    // Desvincular apólice de campanha
    const unlinkPolicyFromCampaign = useCallback(async (policyId: string, campaignId: string): Promise<{ success: boolean, message: string }> => {
        try {
            const { error } = await supabase
                .from('policy_campaign_links')
                .update({ is_active: false, unlinked_at: new Date().toISOString() })
                .eq('policy_id', policyId)
                .eq('campaign_id', campaignId);

            if (error) throw error;

            await fetchPolicies();
            return { success: true, message: 'Apólice desvinculada da campanha com sucesso!' };

        } catch (error: any) {
            console.error('Erro ao desvincular apólice:', error);
            return { success: false, message: 'Erro ao desvincular apólice: ' + error.message };
        }
    }, [userId, fetchPolicies]);

    const refreshPolicies = useCallback(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const getSummary = useMemo(() => {
        return () => {
            const autoCount = policies.filter(p => p.type === PolicyType.AUTO).length;
            const autoSum = policies
                .filter(p => p.type === PolicyType.AUTO)
                .reduce((sum, p) => sum + p.premium_value, 0);

            const residencialCount = policies.filter(p => p.type === PolicyType.RESIDENCIAL).length;
            const residencialSum = policies
                .filter(p => p.type === PolicyType.RESIDENCIAL)
                .reduce((sum, p) => sum + p.premium_value, 0);

            return {
                autoCount,
                autoSum,
                residencialCount,
                residencialSum
            };
        };
    }, [policies]);

    useEffect(() => {
        if (userId && userId !== '') {
            fetchPolicies();
        }
    }, [userId, fetchPolicies]);

    // Listener para eventos em tempo real das apólices
    useRealtimeListener('policies', useCallback(() => {
        fetchPolicies();
    }, [fetchPolicies]), [fetchPolicies]);

    const contextValue: PoliciesAuxiliarContextType = {
        policies,
        loading,
        lastUpdate,
        addPolicy,
        linkPolicyToCampaign,
        unlinkPolicyFromCampaign,
        refreshPolicies,
        getSummary
    };

    return (
        <PoliciesAuxiliarContext.Provider value={contextValue}>
            {children}
        </PoliciesAuxiliarContext.Provider>
    );
};

export const usePoliciesAuxiliar = (): PoliciesAuxiliarContextType => {
    const context = useContext(PoliciesAuxiliarContext);
    if (context === undefined) {
        throw new Error('usePoliciesAuxiliar must be used within a PoliciesAuxiliarProvider');
    }
    return context;
};
