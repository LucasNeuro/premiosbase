
import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import type { Policy } from '../types';
import { PolicyType, ContractType } from '../types';
import { supabase } from '../lib/supabase';
import { useCache } from './useCache';
import { generateTicketCode } from '../utils/ticketGenerator';
import { GoalCalculationService } from '../services/goalCalculationService';

interface PoliciesContextType {
    policies: Policy[];
    loading: boolean;
    lastUpdate: Date;
    addPolicy: (policy: Omit<Policy, 'id' | 'registrationDate'>) => Promise<{ success: boolean, message: string }>;
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
    const cache = useCache<Policy[]>({ ttl: 2 * 60 * 1000 }); // 2 minutes cache

    const fetchPolicies = useCallback(async (forceRefresh = false) => {
        if (!userId) {
            return;
        }

        const cacheKey = `policies-${userId}`;
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                setPolicies(cachedData);
                setLastUpdate(new Date());
                setLoading(false);
                return;
            }
        }

        try {
            const { data, error } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching policies:', error);
                return;
            }

            const formattedPolicies: Policy[] = data.map(policy => ({
                id: policy.id,
                policyNumber: policy.policy_number,
                type: policy.type as PolicyType,
                premiumValue: Number(policy.premium_value),
                registrationDate: policy.registration_date,
                ticketCode: policy.ticket_code,
                contractType: policy.contract_type as ContractType,
                cpdNumber: policy.cpd_number || '',
                createdAt: policy.created_at,
                updatedAt: policy.updated_at,
            }));

            // Cache the data
            cache.set(cacheKey, formattedPolicies);
            
            setPolicies(formattedPolicies);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, cache]);

    const refreshPolicies = useCallback(() => {
        setLoading(true); // Set loading to true when refreshing
        fetchPolicies(true); // Force refresh, bypass cache
    }, [fetchPolicies]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true); // Ensure loading is true when starting fetch
        fetchPolicies();

        // Configurar real-time updates
        const channel = supabase
            .channel(`policies-changes-${userId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'policies',
                    filter: `user_id=eq.${userId}`
                }, 
                (payload) => {
                    // Atualizar dados imediatamente
                    if (payload.eventType === 'INSERT' && payload.new) {
        const newPolicy: Policy = {
                            id: payload.new.id,
                            policyNumber: payload.new.policy_number,
                            type: payload.new.type as PolicyType,
                            premiumValue: payload.new.premium_value,
                            registrationDate: payload.new.registration_date,
                            ticketCode: payload.new.ticket_code,
                            contractType: payload.new.contract_type as ContractType,
                            cpdNumber: payload.new.cpd_number || '',
                            createdAt: payload.new.created_at,
                            updatedAt: payload.new.updated_at,
                        };
                        
                        setPolicies(prevPolicies => [newPolicy, ...prevPolicies]);
                        setLastUpdate(new Date());
                        
                        // Limpar cache
                        const cacheKey = `policies-${userId}`;
                        cache.clear(cacheKey);
                    } else {
                        // Para UPDATE e DELETE, recarregar todos os dados
                        fetchPolicies(true);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    } else if (status === 'CHANNEL_ERROR') {
                    console.error('Error subscribing to real-time updates');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const addPolicy = useCallback(async (policy: Omit<Policy, 'id' | 'registrationDate' | 'ticketCode' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, message: string }> => {
        try {
            // Check if policy number already exists for this user
            const { data: existingPolicy } = await supabase
                .from('policies')
                .select('policy_number')
                .eq('user_id', userId)
                .eq('policy_number', policy.policyNumber)
                .single();

            if (existingPolicy) {
                return { success: false, message: 'Número de apólice já cadastrado.' };
            }

            // Generate unique ticket code
            const ticketCode = generateTicketCode();

            const { data, error } = await supabase
                .from('policies')
                .insert({
                    user_id: userId,
                    policy_number: policy.policyNumber,
                    type: policy.type, // Já está usando PolicyType.AUTO = 'Seguro Auto'
                    premium_value: policy.premiumValue,
                    registration_date: new Date().toISOString(),
                    ticket_code: ticketCode,
                    contract_type: policy.contractType,
                    cpd_number: policy.cpdNumber,
                    status: 'active',
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding policy:', error);
                return { success: false, message: 'Erro ao registrar apólice.' };
            }

            // Atualizar progresso das metas do usuário
            try {
                await GoalCalculationService.updateAllUserGoals(userId);
            } catch (goalError) {
                // Não falhar a criação da apólice por causa do erro nas metas
            }

            const newPolicy: Policy = {
                id: data.id,
                policyNumber: data.policy_number,
                type: data.type as PolicyType,
                premiumValue: data.premium_value,
                registrationDate: data.registration_date,
                ticketCode: data.ticket_code,
                contractType: data.contract_type as ContractType,
                cpdNumber: data.cpd_number || '',
                status: data.status || 'active',
            };

            // Atualizar estado imediatamente
            setPolicies(prevPolicies => [newPolicy, ...prevPolicies]);
            setLastUpdate(new Date());
            
            // Clear cache to ensure fresh data
            const cacheKey = `policies-${userId}`;
            cache.clear(cacheKey);
            
            return { success: true, message: `Apólice registrada com sucesso! Ticket: ${ticketCode}` };
        } catch (error) {
            console.error('Error adding policy:', error);
            return { success: false, message: 'Erro interno do servidor.' };
        }
    }, [userId, cache]);

    const getSummary = useCallback(() => {
        return policies.reduce((summary, policy) => {
            if (policy.type === PolicyType.AUTO) {
                summary.autoCount++;
                summary.autoSum += policy.premiumValue;
            } else if (policy.type === PolicyType.RESIDENCIAL) {
                summary.residencialCount++;
                summary.residencialSum += policy.premiumValue;
            }
            return summary;
        }, { autoCount: 0, autoSum: 0, residencialCount: 0, residencialSum: 0 });
    }, [policies]);
    
    const policiesContextValue = useMemo(() => ({
        policies,
        loading,
        lastUpdate,
        addPolicy,
        refreshPolicies,
        getSummary,
    }), [policies, loading, lastUpdate, addPolicy, refreshPolicies, getSummary]);

    return (
        <PoliciesContext.Provider value={policiesContextValue}>
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
