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
    
    // Debug: log do estado inicial

    // Debug: verificar se o estado está sendo atualizado
    useEffect(() => {

    }, [loading]);
    
    // Debug: verificar se o estado das políticas está sendo atualizado
    useEffect(() => {

    }, [policies]);
    
    // Debug: verificar se o userId está sendo atualizado
    useEffect(() => {

    }, [userId]);

    // Buscar apólices da nova tabela auxiliar
    const fetchPolicies = useCallback(async () => {
        if (!userId || userId === '') {

            return;
        }

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
                        campaign:campaign_id (
                            title
                        )
                    `)
                    .eq('policy_id', policy.id)
                    .eq('is_active', true);

                const linkedCampaigns = links?.map(link => ({
                    campaign_id: link.campaign_id,
                    campaign_title: (link.campaign as any)?.title || 'Campanha',
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

            // Debug: verificar se o estado foi atualizado
            setTimeout(() => {

            }, 100);

        } catch (error: any) {
            setPolicies([]);

        } finally {

            setLoading(false);
        }
    }, [userId]);

    // Adicionar nova apólice
    const addPolicy = useCallback(async (policyData: Omit<PolicyAuxiliar, 'id' | 'registration_date' | 'ticket_code' | 'created_at' | 'updated_at'>): Promise<{ success: boolean, message: string }> => {
        try {
            // 0. Verificar se a apólice já existe
            const { data: existingPolicy, error: checkError } = await supabase
                .from('policies')
                .select('policy_number, created_at')
                .eq('policy_number', policyData.policy_number)
                .eq('user_id', userId)
                .single();

            if (existingPolicy && !checkError) {
                const createdDate = new Date(existingPolicy.created_at).toLocaleDateString('pt-BR');
                return {
                    success: false,
                    message: `⚠️ Apólice ${policyData.policy_number} já foi cadastrada em ${createdDate}. Verifique o número da apólice.`
                };
            }

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

            // 3. VINCULAR A TODAS AS CAMPANHAS ATIVAS DO CORRETOR (VIA CÓDIGO - SEM IA)

            // 🎯 CORREÇÃO CRÍTICA: Só vincular apólices criadas APÓS aceite da campanha
            const policyCreatedAt = new Date(newPolicy.created_at);
            
            for (const campaign of acceptedCampaigns || []) {
                // ✅ REGRA FUNDAMENTAL: Só vincular se a apólice foi criada APÓS aceitar a campanha
                const campaignAcceptedAt = campaign.accepted_at ? new Date(campaign.accepted_at) : null;
                
                if (!campaignAcceptedAt) {

                    continue;
                }
                
                if (policyCreatedAt < campaignAcceptedAt) {

                    continue;
                }
                
                // ✅ Apólice foi criada APÓS aceite da campanha - pode vincular
                const confidence = 100; // Confiança máxima - código é confiável
                const reasoning = `Apólice ${policyData.type} criada em ${policyCreatedAt.toISOString()} vinculada à campanha aceita em ${campaignAcceptedAt.toISOString()}`;

                const { error: linkError } = await supabase
                    .from('policy_campaign_links')
                    .insert({
                        policy_id: newPolicy.id,
                        campaign_id: campaign.id,
                        user_id: userId,
                        linked_automatically: true,
                        is_active: true,
                        ai_confidence: confidence,
                        ai_reasoning: reasoning
                    });

                if (!linkError) {
                    linkedCampaigns++;
                    campaignMessage += `✅ Vinculada à campanha "${campaign.title}" (aceita em ${campaignAcceptedAt.toLocaleDateString()})\n`;

                } else {
                }
            }

            // Atualizar progresso de TODAS as campanhas ativas do corretor

            try {
                // Usar o serviço de progresso auxiliar para garantir cálculo correto
                const { updateAllUserCampaignProgressAuxiliar } = await import('../services/campaignProgressAuxiliar');

                // Atualizar progresso de todas as campanhas do usuário
                await updateAllUserCampaignProgressAuxiliar(userId);

                // Validar e corrigir automaticamente qualquer inconsistência
                const { CampaignProgressValidator } = await import('../services/campaignProgressValidator');
                const validationResult = await CampaignProgressValidator.validateUserCampaignProgress(userId);
                
                if (validationResult.corrected > 0) {

                    campaignMessage += `🔧 ${validationResult.corrected} campanhas corrigidas automaticamente\n`;
                }

                campaignMessage += `📊 Progresso atualizado em TODAS as campanhas ativas\n`;

            } catch (error) {
                campaignMessage += `⚠️ Erro ao atualizar progresso das campanhas\n`;
            }

            // Análise da IA APENAS para auditoria (não interfere na vinculação)
            let matches: any[] = [];
            try {

                const { CampaignCriteriaService } = await import('../services/campaignCriteriaService');
                matches = await CampaignCriteriaService.analyzePolicyCompatibility({
                    policy: {
                        type: policyData.type,
                        contract_type: policyData.contract_type,
                        premium_value: policyData.premium_value,
                        policy_number: policyData.policy_number
                    },
                    campaigns: acceptedCampaigns || []
                });

            } catch (aiError) {
                // Criar análise básica como fallback
                matches = (acceptedCampaigns || []).map(campaign => ({
                    campaign_id: campaign.id,
                    campaign_title: campaign.title,
                    match_score: 100,
                    reasoning: `Análise da IA falhou - vinculação via código com confiança máxima`
                }));

            }

            // Registrar na auditoria (sempre executar, mesmo se não houver matches)
            try {
                const { PolicyAuditService } = await import('../services/policyAuditService');
                
                // Criar dados de campanhas vinculadas baseado nas vinculações reais
                const linkedCampaignsData = (acceptedCampaigns || []).map(campaign => ({
                    campaign_id: campaign.id,
                    campaign_title: campaign.title,
                    match_score: 100, // Confiança máxima - vinculação via código
                    reasoning: `Apólice ${policyData.type} vinculada automaticamente a todas as campanhas ativas do corretor`
                }));

                await PolicyAuditService.recordPolicyLaunch(
                    {
                        policy_id: newPolicy.id,
                        policy_number: policyData.policy_number,
                        policy_type: policyData.type,
                        contract_type: policyData.contract_type,
                        premium_value: policyData.premium_value,
                        cpd_number: policyData.cpd_number,
                        cpd_name: `CPD ${policyData.cpd_number}`
                    },
                    userId,
                    linkedCampaignsData, // Usar dados reais das vinculações
                    { 
                        matches_count: linkedCampaigns, // Usar contagem real de vinculações
                        total_confidence: 100, // Confiança máxima para vinculação via código
                        ai_analysis: matches, // Análise da IA (pode estar vazia se falhou)
                        manual_linking: true // Indicar que foi vinculação manual/código
                    }
                );

            } catch (auditError) {

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
                
                // Evento para atualizar timeline
                window.dispatchEvent(new CustomEvent('policyAdded', { 
                    detail: { policyNumber: policyData.policy_number } 
                }));
                
            } catch (progressError) {
                }

            // Mensagem de sucesso com análise inteligente
            let successMessage = `✅ Apólice ${policyData.policy_number} salva com sucesso!`;
            if (linkedCampaigns > 0) {
                successMessage += `\n\n🎯 Vinculada automaticamente a TODAS as ${linkedCampaigns} campanha(s) ativa(s) do corretor`;
                successMessage += `\n\n📊 Esta apólice contará para:`;
                successMessage += `\n• Valor total de todas as campanhas`;
                successMessage += `\n• Quantidade de apólices de todas as campanhas`;
                successMessage += `\n• Critérios específicos compatíveis`;
            } else {
                successMessage += `\n\nℹ️ Nenhuma campanha ativa encontrada para vinculação`;
            }

            return { 
                success: true, 
                message: successMessage
            };

        } catch (error: any) {
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
            
            // Iniciar monitor de progresso para validação automática
            import('../services/campaignProgressMonitor').then(({ CampaignProgressMonitor }) => {
                if (!CampaignProgressMonitor.isActive()) {
                    CampaignProgressMonitor.start(userId, 2); // Validação a cada 2 minutos
                }
            });
        } else {

        }
        
        // Cleanup: parar monitor quando componente for desmontado
        return () => {
            import('../services/campaignProgressMonitor').then(({ CampaignProgressMonitor }) => {
                CampaignProgressMonitor.stop();
            });
        };
    }, [userId]); // Removido fetchPolicies da dependência para evitar loops

    // Listener para eventos em tempo real das apólices - DESABILITADO TEMPORARIAMENTE
    // useRealtimeListener('policies', useCallback(() => {
    //     fetchPolicies();
    // }, [fetchPolicies]), [fetchPolicies]);

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
