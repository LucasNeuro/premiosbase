import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Policy {
  id: string;
  user_id: string;
  policy_number: string;
  type: 'Seguro Auto' | 'Seguro Residencial';
  premium_value: number;
  registration_date: string;
  contract_type: 'Novo' | 'Renovação Bradesco';
  cpd_number: string;
  city?: string;
  ticket_code?: string;
  status: 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface PoliciesState {
  // Dados das apólices
  policies: Policy[];
  
  // Estatísticas
  totalPolicies: number;
  totalValue: number;
  autoPolicies: number;
  residentialPolicies: number;
  
  // Estado de loading
  loading: boolean;
  error: string | null;
  
  // Timestamps para cache
  lastFetched: number | null;
  cacheExpiry: number; // 5 minutos em ms
  
  // Ações
  setPolicies: (policies: Policy[]) => void;
  addPolicy: (policy: Policy) => void;
  updatePolicy: (policyId: string, updates: Partial<Policy>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  calculateStats: () => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const usePoliciesStore = create<PoliciesState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      policies: [],
      totalPolicies: 0,
      totalValue: 0,
      autoPolicies: 0,
      residentialPolicies: 0,
      loading: false,
      error: null,
      lastFetched: null,
      cacheExpiry: 5 * 60 * 1000, // 5 minutos
      
      // Ações
      setPolicies: (policies) => {
        console.log('🔄 Store: Atualizando apólices', policies.length);
        set({ 
          policies,
          lastFetched: Date.now(),
          error: null 
        });
        
        // Recalcular estatísticas
        get().calculateStats();
      },
      
      addPolicy: (policy) => {
        const { policies } = get();
        const newPolicies = [...policies, policy];
        
        set({ 
          policies: newPolicies,
          lastFetched: Date.now()
        });
        
        // Recalcular estatísticas
        get().calculateStats();
        
        console.log('➕ Store: Nova apólice adicionada', policy.policy_number);
      },
      
      updatePolicy: (policyId, updates) => {
        const { policies } = get();
        const updatedPolicies = policies.map(policy => 
          policy.id === policyId 
            ? { ...policy, ...updates }
            : policy
        );
        
        set({ 
          policies: updatedPolicies,
          lastFetched: Date.now()
        });
        
        // Recalcular estatísticas
        get().calculateStats();
        
        console.log('🔄 Store: Apólice atualizada', policyId, updates);
      },
      
      setLoading: (loading) => {
        set({ loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      calculateStats: () => {
        const { policies } = get();
        
        const totalPolicies = policies.length;
        const totalValue = policies.reduce((sum, policy) => sum + policy.premium_value, 0);
        const autoPolicies = policies.filter(p => p.type === 'Seguro Auto').length;
        const residentialPolicies = policies.filter(p => p.type === 'Seguro Residencial').length;
        
        set({
          totalPolicies,
          totalValue,
          autoPolicies,
          residentialPolicies
        });
        
        console.log('📊 Store: Estatísticas recalculadas', {
          totalPolicies,
          totalValue,
          autoPolicies,
          residentialPolicies
        });
      },
      
      clearCache: () => {
        set({
          policies: [],
          totalPolicies: 0,
          totalValue: 0,
          autoPolicies: 0,
          residentialPolicies: 0,
          lastFetched: null,
          error: null
        });
        console.log('🗑️ Store: Cache de apólices limpo');
      },
      
      isCacheValid: () => {
        const { lastFetched, cacheExpiry } = get();
        if (!lastFetched) return false;
        return Date.now() - lastFetched < cacheExpiry;
      }
    }),
    {
      name: 'policies-storage', // Nome da chave no localStorage
      partialize: (state) => ({
        policies: state.policies,
        totalPolicies: state.totalPolicies,
        totalValue: state.totalValue,
        autoPolicies: state.autoPolicies,
        residentialPolicies: state.residentialPolicies,
        lastFetched: state.lastFetched
      })
    }
  )
);
