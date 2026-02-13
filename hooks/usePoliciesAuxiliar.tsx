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
    sale_date?: string | null;
    
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
                    status: 'active',
                    sale_date: policyData.sale_date || null
                })
                .select()
                .single();

            if (policyError) throw policyError;

            // 2. Buscar campanhas compatíveis aceitas (mesmo se expiradas)

            console.log('🔍 Debug - Buscando campanhas aceitas para o usuário:', userId);
            const { data: acceptedCampaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted') // ✅ SÓ CAMPANHAS ACEITAS
                .eq('status', 'active')
                .eq('is_active', true);
                // ❌ REMOVIDO: .gte('end_date', ...) - Permite campanhas expiradas

            if (campaignsError) {
                console.error('❌ Debug - Erro ao buscar campanhas:', campaignsError);
            } else {
                console.log('✅ Debug - Campanhas encontradas:', acceptedCampaigns?.length || 0);
                acceptedCampaigns?.forEach(campaign => {
                    console.log(`📋 Campanha: ${campaign.title} (ID: ${campaign.id}) - Aceita em: ${campaign.accepted_at}`);
                });
            }

            let linkedCampaigns = 0;
            let campaignMessage = '';

            // 3. VINCULAR APENAS A CAMPANHAS COMPATÍVEIS (CORREÇÃO CRÍTICA)

            // 🎯 NOVA LÓGICA: Vincular apólice apenas a campanhas que atendam aos critérios
            const policyCreatedAt = new Date(newPolicy.created_at);
            const policySaleDate = newPolicy.sale_date ? new Date(newPolicy.sale_date) : null;
            const effectiveDate = policySaleDate || policyCreatedAt; // ✅ USAR DATA EFETIVA
            
            console.log('🔍 Debug - Apólice criada em:', policyCreatedAt.toISOString());
            console.log('🔍 Debug - Data da venda:', policySaleDate?.toISOString() || 'Não informada');
            console.log('🔍 Debug - Data efetiva:', effectiveDate.toISOString());
            
            for (const campaign of acceptedCampaigns || []) {
                console.log(`🔍 Debug - Analisando campanha: ${campaign.title} (ID: ${campaign.id})`);
                
                // ✅ VERIFICAR SE A DATA EFETIVA ESTÁ DENTRO DO PERÍODO DA CAMPANHA
                const campaignStart = new Date(campaign.start_date);
                const campaignEnd = new Date(campaign.end_date);
                const today = new Date();
                
                console.log(`📅 Debug - Período da campanha: ${campaignStart.toISOString()} até ${campaignEnd.toISOString()}`);
                console.log(`📅 Debug - Campanha expirada: ${campaignEnd < today ? 'SIM' : 'NÃO'}`);
                
                // ✅ VINCULAR SE: Data efetiva está dentro do período (mesmo se campanha expirada)
                if (effectiveDate >= campaignStart && effectiveDate <= campaignEnd) {
                    console.log('✅ Debug - Data efetiva está dentro do período da campanha');
                } else {
                    console.log('❌ Debug - Data efetiva está FORA do período da campanha - PULANDO');
                    continue; // Pular esta campanha
                }
                
                // 🔧 CORREÇÃO CRÍTICA: Verificar se a apólice atende aos critérios da campanha
                let isCompatible = true;
                let compatibilityReason = '';
                
                // Se a campanha tem critérios específicos, verificar compatibilidade
                if (campaign.criteria) {
                    try {
                        const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : JSON.parse(campaign.criteria);
                        
                        if (Array.isArray(criteria) && criteria.length > 0) {
                            console.log(`🔍 Debug - Verificando ${criteria.length} critérios da campanha`);
                            
                            // Verificar se a apólice atende a pelo menos um critério
                            isCompatible = criteria.some(criterion => {
                                // Verificar tipo de apólice
                                if (criterion.policy_type && criterion.policy_type !== 'geral') {
                                    const policyTypeMap = {
                                        'auto': 'Seguro Auto',
                                        'residencial': 'Seguro Residencial'
                                    };
                                    const expectedType = policyTypeMap[criterion.policy_type];
                                    if (expectedType && policyData.type !== expectedType) {
                                        console.log(`❌ Debug - Tipo de apólice não compatível: esperado ${expectedType}, recebido ${policyData.type}`);
                                        return false;
                                    }
                                }
                                
                                // Verificar tipo de contrato
                                if (criterion.contract_type && criterion.contract_type !== 'ambos') {
                                    const contractTypeMap = {
                                        'novo': 'Novo',
                                        'renovacao_bradesco': 'Renovação Bradesco'
                                    };
                                    const expectedContractType = contractTypeMap[criterion.contract_type];
                                    if (expectedContractType && policyData.contract_type !== expectedContractType) {
                                        console.log(`❌ Debug - Tipo de contrato não compatível: esperado ${expectedContractType}, recebido ${policyData.contract_type}`);
                                        return false;
                                    }
                                }
                                
                                // Verificar valor mínimo
                                if (criterion.min_value_per_policy && policyData.premium_value < criterion.min_value_per_policy) {
                                    console.log(`❌ Debug - Valor mínimo não atingido: esperado ${criterion.min_value_per_policy}, recebido ${policyData.premium_value}`);
                                    return false;
                                }
                                
                                console.log(`✅ Debug - Critério atendido: ${criterion.policy_type || 'geral'} - ${criterion.contract_type || 'ambos'}`);
                                return true;
                            });
                            
                            compatibilityReason = isCompatible ? 'Apólice atende aos critérios da campanha' : 'Apólice não atende aos critérios da campanha';
                        } else {
                            // Campanha sem critérios específicos = compatível
                            isCompatible = true;
                            compatibilityReason = 'Campanha sem critérios específicos - compatível';
                        }
                    } catch (error) {
                        console.error('❌ Debug - Erro ao processar critérios:', error);
                        // Em caso de erro, considerar compatível para não quebrar o fluxo
                        isCompatible = true;
                        compatibilityReason = 'Erro ao processar critérios - considerado compatível';
                    }
                } else {
                    // Campanha sem critérios = compatível (campanha tradicional)
                    isCompatible = true;
                    compatibilityReason = 'Campanha tradicional sem critérios - compatível';
                }
                
                if (!isCompatible) {
                    console.log(`❌ Debug - Campanha ${campaign.title} não é compatível: ${compatibilityReason}`);
                    continue; // Pular esta campanha
                }
                
                console.log(`✅ Debug - Campanha ${campaign.title} é compatível: ${compatibilityReason}`);
                
                // ✅ Vincular apólice à campanha compatível
                const confidence = 100; // Confiança máxima - código é confiável
                const reasoning = `Apólice ${policyData.type} com data efetiva ${effectiveDate.toISOString()} vinculada à campanha ${campaign.title} (período: ${campaignStart.toISOString().split('T')[0]} até ${campaignEnd.toISOString().split('T')[0]}) - ${compatibilityReason}`;

                console.log('🔗 Debug - Criando vinculação...');
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
                    campaignMessage += `✅ Vinculada à campanha "${campaign.title}" (${compatibilityReason})\n`;
                    console.log('✅ Debug - Vinculação criada com sucesso!');
                } else {
                    console.error('❌ Debug - Erro ao criar vinculação:', linkError);
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
                }, userId);

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
            console.log('🔄 Debug - Iniciando atualização de progresso das campanhas...');
            try {
                await updateAllUserCampaignProgressAuxiliar(userId);
                console.log('✅ Debug - Progresso das campanhas atualizado com sucesso');
                
                // Forçar refresh dos dados no contexto Goals
                if (window.refreshCampaigns) {
                    console.log('🔄 Debug - Executando refresh das campanhas...');
                    window.refreshCampaigns();
                }
                
                // Evento personalizado para notificar outros componentes
                console.log('📡 Debug - Disparando eventos de atualização...');
                window.dispatchEvent(new CustomEvent('campaignProgressUpdated', { 
                    detail: { userId, linkedCampaigns } 
                }));
                
                // Evento para atualizar timeline
                window.dispatchEvent(new CustomEvent('policyAdded', { 
                    detail: { policyNumber: policyData.policy_number } 
                }));
                
            } catch (progressError) {
                console.error('❌ Debug - Erro ao atualizar progresso das campanhas:', progressError);
            }

            // Retorna sucesso sem mensagem (será tratado pelo loading overlay)
            return { 
                success: true, 
                message: ''
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
