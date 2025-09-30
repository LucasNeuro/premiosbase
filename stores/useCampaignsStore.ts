import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Goal } from '../types';

interface CampaignsState {
  // Dados das campanhas
  campaigns: Goal[];
  pendingCampaigns: Goal[];
  activeCampaigns: Goal[];
  completedCampaigns: Goal[];
  
  // Estado de loading
  loading: boolean;
  error: string | null;
  
  // Timestamps para cache
  lastFetched: number | null;
  cacheExpiry: number; // 5 minutos em ms
  
  // Ações
  setCampaigns: (campaigns: Goal[]) => void;
  setPendingCampaigns: (campaigns: Goal[]) => void;
  setActiveCampaigns: (campaigns: Goal[]) => void;
  setCompletedCampaigns: (campaigns: Goal[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCampaign: (campaignId: string, updates: Partial<Goal>) => void;
  acceptCampaign: (campaignId: string) => void;
  rejectCampaign: (campaignId: string) => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const useCampaignsStore = create<CampaignsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      campaigns: [],
      pendingCampaigns: [],
      activeCampaigns: [],
      completedCampaigns: [],
      loading: false,
      error: null,
      lastFetched: null,
      cacheExpiry: 5 * 60 * 1000, // 5 minutos
      
      // Ações
      setCampaigns: (campaigns) => {
        console.log('🔄 Store: Atualizando campanhas', campaigns.length);
        set({ 
          campaigns,
          lastFetched: Date.now(),
          error: null 
        });
      },
      
      setPendingCampaigns: (campaigns) => {
        set({ pendingCampaigns: campaigns });
      },
      
      setActiveCampaigns: (campaigns) => {
        set({ activeCampaigns: campaigns });
      },
      
      setCompletedCampaigns: (campaigns) => {
        set({ completedCampaigns: campaigns });
      },
      
      setLoading: (loading) => {
        set({ loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      updateCampaign: (campaignId, updates) => {
        const { campaigns, pendingCampaigns, activeCampaigns, completedCampaigns } = get();
        
        const updateInArray = (arr: Goal[]) => 
          arr.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, ...updates }
              : campaign
          );
        
        set({
          campaigns: updateInArray(campaigns),
          pendingCampaigns: updateInArray(pendingCampaigns),
          activeCampaigns: updateInArray(activeCampaigns),
          completedCampaigns: updateInArray(completedCampaigns)
        });
        
        console.log('🔄 Store: Campanha atualizada', campaignId, updates);
      },
      
      acceptCampaign: (campaignId) => {
        const { campaigns, pendingCampaigns, activeCampaigns } = get();
        
        // Encontrar a campanha
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) return;
        
        // Atualizar status
        const updatedCampaign = {
          ...campaign,
          acceptance_status: 'accepted' as const,
          accepted_at: new Date().toISOString()
        };
        
        // Remover das pendentes e adicionar às ativas
        const newPendingCampaigns = pendingCampaigns.filter(c => c.id !== campaignId);
        const newActiveCampaigns = [...activeCampaigns, updatedCampaign];
        
        set({
          campaigns: campaigns.map(c => c.id === campaignId ? updatedCampaign : c),
          pendingCampaigns: newPendingCampaigns,
          activeCampaigns: newActiveCampaigns
        });
        
        console.log('✅ Store: Campanha aceita', campaignId);
      },
      
      rejectCampaign: (campaignId) => {
        const { campaigns, pendingCampaigns } = get();
        
        // Encontrar a campanha
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) return;
        
        // Atualizar status
        const updatedCampaign = {
          ...campaign,
          acceptance_status: 'rejected' as const,
          rejected_at: new Date().toISOString()
        };
        
        // Remover das pendentes
        const newPendingCampaigns = pendingCampaigns.filter(c => c.id !== campaignId);
        
        set({
          campaigns: campaigns.map(c => c.id === campaignId ? updatedCampaign : c),
          pendingCampaigns: newPendingCampaigns
        });
        
        console.log('❌ Store: Campanha rejeitada', campaignId);
      },
      
      clearCache: () => {
        set({
          campaigns: [],
          pendingCampaigns: [],
          activeCampaigns: [],
          completedCampaigns: [],
          lastFetched: null,
          error: null
        });
        console.log('🗑️ Store: Cache limpo');
      },
      
      isCacheValid: () => {
        const { lastFetched, cacheExpiry } = get();
        if (!lastFetched) return false;
        return Date.now() - lastFetched < cacheExpiry;
      }
    }),
    {
      name: 'campaigns-storage', // Nome da chave no localStorage
      partialize: (state) => ({
        campaigns: state.campaigns,
        pendingCampaigns: state.pendingCampaigns,
        activeCampaigns: state.activeCampaigns,
        completedCampaigns: state.completedCampaigns,
        lastFetched: state.lastFetched
      })
    }
  )
);
