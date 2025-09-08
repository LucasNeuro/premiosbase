
import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import type { Policy } from '../types';
import { PolicyType, ContractType } from '../types';
import { supabase } from '../lib/supabase';
import { useCache } from './useCache';
import { generateTicketCode } from '../utils/ticketGenerator';

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
            console.log('usePolicies: No userId, skipping fetch');
            return;
        }

        const cacheKey = `policies-${userId}`;
        
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log('usePolicies: Using cached data');
                setPolicies(cachedData);
                setLastUpdate(new Date());
                setLoading(false);
                return;
            }
        }

        console.log('usePolicies: Fetching policies for userId:', userId);
        try {
            const { data, error } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            console.log('usePolicies: Supabase response:', { data, error });

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
                city: policy.city || '',
                originalPolicyId: policy.original_policy_id || '',
                createdAt: policy.created_at,
                updatedAt: policy.updated_at,
            }));

            console.log('usePolicies: Formatted policies:', formattedPolicies);
            
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
        console.log('usePolicies: Manual refresh triggered');
        setLoading(true); // Set loading to true when refreshing
        fetchPolicies(true); // Force refresh, bypass cache
    }, [fetchPolicies]);

    useEffect(() => {
        console.log('usePolicies: useEffect triggered, userId:', userId);
        
        if (!userId) {
            console.log('usePolicies: No userId, skipping fetch');
            setLoading(false);
            return;
        }

        setLoading(true); // Ensure loading is true when starting fetch
        fetchPolicies();

        // Configurar real-time updates
        const channel = supabase
            .channel('policies-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'policies',
                    filter: `user_id=eq.${userId}`
                }, 
                (payload) => {
                    console.log('Real-time update received:', payload);
                    console.log('Event type:', payload.eventType);
                    console.log('New record:', payload.new);
                    console.log('Old record:', payload.old);
                    
                    // Recarregar dados quando houver mudanças
                    fetchPolicies();
                }
            )
            .subscribe((status) => {
                console.log('Real-time subscription status:', status);
            });

        return () => {
            console.log('Cleaning up real-time subscription');
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
                    type: policy.type,
                    premium_value: policy.premiumValue,
                    registration_date: new Date().toISOString(),
                    ticket_code: ticketCode,
                    contract_type: policy.contractType,
                    city: policy.city,
                    original_policy_id: policy.originalPolicyId,
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding policy:', error);
                return { success: false, message: 'Erro ao registrar apólice.' };
            }

            const newPolicy: Policy = {
                id: data.id,
                policyNumber: data.policy_number,
                type: data.type as PolicyType,
                premiumValue: data.premium_value,
                registrationDate: data.registration_date,
                ticketCode: data.ticket_code,
                contractType: data.contract_type as ContractType,
                city: data.city || '',
                originalPolicyId: data.original_policy_id || '',
            };

            setPolicies(prevPolicies => [newPolicy, ...prevPolicies]);
            
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
