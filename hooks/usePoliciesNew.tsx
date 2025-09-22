import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import type { Policy } from '../types';
import { PolicyType, ContractType } from '../types';
import { supabase } from '../lib/supabase';
import { generateTicketCode } from '../utils/ticketGenerator';
import { updateAllUserCampaignProgress, checkAndUpdateExpiredCampaigns } from '../services/campaignProgressService';

interface PoliciesContextType {
    policies: Policy[];
    loading: boolean;
    lastUpdate: Date;
    addPolicy: (policy: Omit<Policy, 'id' | 'registrationDate' | 'ticketCode' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean, message: string }>;
    refreshPolicies: () => void;
    getSummary: () => {
        autoCount: number;
        autoSum: number;
        residencialCount: number;
        residencialSum: number;
    };
}

const PoliciesContext = createContext<PoliciesContextType | undefined>(undefined);

export const PoliciesProvider: React.FC<{ children: React.ReactNode, userId: string }> = ({ children, userId }) => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Buscar apólices da nova estrutura (goals com record_type = 'policy_link')
    const fetchPolicies = useCallback(async () => {
        if (!userId || userId === '') return;

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('record_type', 'policy_link')
                .eq('is_policy_linked', true)
                .order('vinculada_em', { ascending: false });

            if (error) {
                return;
            }

            // Converter dados da nova estrutura para o formato antigo
            const convertedPolicies: Policy[] = (data || []).map(goal => ({
                id: goal.id,
                policyNumber: goal.policy_number || '',
                type: goal.policy_type as PolicyType,
                premiumValue: goal.policy_premium_value || 0,
                registrationDate: goal.policy_registration_date || goal.vinculada_em || '',
                ticketCode: goal.policy_ticket_code || '',
                contractType: goal.policy_contract_type as ContractType,
                cpdNumber: goal.policy_cpd_number,
                status: goal.policy_status || 'active',
                createdAt: goal.vinculada_em,
                updatedAt: goal.updated_at,
                // Novos campos para compatibilidade
                campaignId: goal.campaign_master_id,
                isLinkedToCampaign: goal.is_policy_linked
            }));

            setPolicies(convertedPolicies);
            setLastUpdate(new Date());

        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Adicionar nova apólice com lógica inteligente de campanhas
    const addPolicy = useCallback(async (policy: Omit<Policy, 'id' | 'registrationDate' | 'ticketCode' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, message: string }> => {
        try {
            // Gerar ticket code único
            const ticketCode = generateTicketCode();

            // 1. ESTRATÉGIA: Sempre salvar a apólice primeiro (como histórico)
            // Verificar se há campanhas aceitas disponíveis para vincular
            const { data: acceptedCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('id, title, target, type, unit, start_date, end_date, criteria')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted')
                .eq('is_active', true)
                .gte('end_date', new Date().toISOString().split('T')[0]);

            if (campaignsError) {
                // Mesmo com erro nas campanhas, salva a apólice como histórico
            }

            // 2. SALVAR APÓLICE COMO HISTÓRICO (sempre funciona)
            const { data: historicPolicy, error: historicError } = await supabase
                .from('goals')
                .insert({
                    user_id: userId,
                    title: `Apólice ${policy.policyNumber} - ${policy.type}`,
                    target: policy.premiumValue, // Meta = valor da própria apólice
                    unit: 'reais',
                    type: 'valor',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
                    status: 'completed', // Já está concluída
                    current_value: policy.premiumValue,
                    progress_percentage: 100,
                    achieved_at: new Date().toISOString(),
                    achieved_value: policy.premiumValue,
                    record_type: 'policy_link',
                    campaign_master_id: null, // Sem campanha = histórico geral
                    // Dados da apólice
                    policy_number: policy.policyNumber,
                    policy_type: policy.type,
                    policy_premium_value: policy.premiumValue,
                    policy_registration_date: new Date().toISOString(),
                    policy_ticket_code: ticketCode,
                    policy_contract_type: policy.contractType,
                    policy_cpd_number: policy.cpdNumber,
                    policy_status: 'active',
                    // Controle de vinculação
                    is_policy_linked: true,
                    vinculada_automaticamente: true,
                    vinculada_em: new Date().toISOString(),
                    vinculada_por: userId,
                    acceptance_status: 'accepted',
                    accepted_at: new Date().toISOString(),
                    accepted_by: userId
                })
                .select()
                .single();

            if (historicError) {
                return { success: false, message: 'Erro ao registrar apólice: ' + historicError.message };
            }

            let campaignMessage = '';

            // 3. TENTAR VINCULAR A CAMPANHAS (bonus, não obrigatório)
            if (acceptedCampaigns && acceptedCampaigns.length > 0) {
                // Filtrar campanhas compatíveis com a apólice
                const compatibleCampaigns = acceptedCampaigns.filter(campaign => {
                    if (!campaign.criteria) return true; // Campanha simples, aceita tudo
                    
                    try {
                        const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : [campaign.criteria];
                        return criteria.some(criterion => {
                            // Verificar se o tipo de apólice é compatível
                            if (criterion.policy_type && criterion.policy_type !== policy.type) {
                                return false;
                            }
                            // Verificar se o tipo de contrato é compatível
                            if (criterion.contract_type && criterion.contract_type !== policy.contractType) {
                                return false;
                            }
                            return true;
                        });
                    } catch (e) {
                        return true; // Se erro no critério, aceita
                    }
                });

                // Vincular a campanhas compatíveis
                for (const campaign of compatibleCampaigns) {
                    try {
                        // Criar registro de vinculação para a campanha
                        await supabase
                            .from('goals')
                            .insert({
                                user_id: userId,
                                title: `${campaign.title} - ${policy.policyNumber}`,
                                target: campaign.target,
                                unit: campaign.unit || 'reais',
                                type: campaign.type,
                                start_date: campaign.start_date,
                                end_date: campaign.end_date,
                                record_type: 'policy_link',
                                campaign_master_id: campaign.id,
                                // Dados da apólice (cópia)
                                policy_number: policy.policyNumber,
                                policy_type: policy.type,
                                policy_premium_value: policy.premiumValue,
                                policy_registration_date: new Date().toISOString(),
                                policy_ticket_code: ticketCode,
                                policy_contract_type: policy.contractType,
                                policy_cpd_number: policy.cpdNumber,
                                policy_status: 'active',
                                // Controle de vinculação
                                is_policy_linked: true,
                                vinculada_automaticamente: true,
                                vinculada_em: new Date().toISOString(),
                                vinculada_por: userId,
                                acceptance_status: 'accepted',
                                accepted_at: new Date().toISOString(),
                                accepted_by: userId
                            });

                        campaignMessage += `✅ Vinculada à campanha "${campaign.title}"\n`;
                    } catch (linkError) {
                        campaignMessage += `⚠️ Erro ao vincular à campanha "${campaign.title}"\n`;
                    }
                }
            }

            await fetchPolicies(); // Recarregar dados

            // Atualizar progresso de todas as campanhas do usuário e verificar expiradas
            try {
                await Promise.all([
                    updateAllUserCampaignProgress(userId),
                    checkAndUpdateExpiredCampaigns(userId)
                ]);
                } catch (error) {
                }

            // Mensagem de sucesso simples
            return { 
                success: true, 
                message: 'Apólice salva com sucesso!'
            };

        } catch (error: any) {
            return { success: false, message: 'Erro interno do sistema: ' + error.message };
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
                .reduce((sum, p) => sum + p.premiumValue, 0);

            const residencialCount = policies.filter(p => p.type === PolicyType.RESIDENCIAL).length;
            const residencialSum = policies
                .filter(p => p.type === PolicyType.RESIDENCIAL)
                .reduce((sum, p) => sum + p.premiumValue, 0);

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

    const contextValue: PoliciesContextType = {
        policies,
        loading,
        lastUpdate,
        addPolicy,
        refreshPolicies,
        getSummary
    };

    return (
        <PoliciesContext.Provider value={contextValue}>
            {children}
        </PoliciesContext.Provider>
    );
};

export const usePolicies = (): PoliciesContextType => {
    const context = useContext(PoliciesContext);
    if (context === undefined) {
        throw new Error('usePolicies must be used within a PoliciesProvider');
    }
    return context;
};
