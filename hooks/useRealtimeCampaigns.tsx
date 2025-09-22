import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCampaignProgressAuxiliar } from '../services/campaignProgressAuxiliar';

interface CampaignProgress {
  id: string;
  title: string;
  progress: number;
  currentValue: number;
  isCompleted: boolean;
  lastUpdated: Date;
}

export const useRealtimeCampaigns = (userId?: string) => {
  const [campaigns, setCampaigns] = useState<CampaignProgress[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para recalcular progresso de uma campanha específica
  const recalculateCampaignProgress = useCallback(async (campaignId: string) => {
    try {

      // Buscar dados da campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', campaignId)
        .eq('record_type', 'campaign')
        .single();

      if (campaignError || !campaign) {
        return;
      }

      // Calcular progresso usando o mesmo serviço
      const progressResult = await calculateCampaignProgressAuxiliar(campaign);
      
      if (progressResult) {
        const updatedCampaign: CampaignProgress = {
          id: campaignId,
          title: campaign.title,
          progress: progressResult.progressPercentage,
          currentValue: progressResult.currentValue,
          isCompleted: progressResult.isCompleted,
          lastUpdated: new Date()
        };

        setCampaigns(prev => {
          const existing = prev.find(c => c.id === campaignId);
          if (existing) {
            return prev.map(c => c.id === campaignId ? updatedCampaign : c);
          } else {
            return [...prev, updatedCampaign];
          }
        });

      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Função para buscar todas as campanhas do usuário
  const fetchUserCampaigns = useCallback(async () => {
    if (!userId) return;

    try {

      const { data: campaignsData, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        return;
      }

      const campaignsList: CampaignProgress[] = [];
      
      for (const campaign of campaignsData || []) {
        const progressResult = await calculateCampaignProgressAuxiliar(campaign);
        if (progressResult) {
          campaignsList.push({
            id: campaign.id,
            title: campaign.title,
            progress: progressResult.progressPercentage,
            currentValue: progressResult.currentValue,
            isCompleted: progressResult.isCompleted,
            lastUpdated: new Date()
          });
        }
      }

      setCampaigns(campaignsList);

    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Buscar campanhas iniciais
    fetchUserCampaigns();

    // Configurar listeners para mudanças nas tabelas relevantes
    const policyLinksChannel = supabase
      .channel(`user_policy_links_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'policy_campaign_links'
        },
        (payload) => {

          // Se a mudança afeta uma campanha do usuário, recalcular
          if (payload.new && (payload.new as any).campaign_id) {
            recalculateCampaignProgress((payload.new as any).campaign_id);
          }
        }
      )
      .subscribe((status) => {

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        }
      });

    const goalsChannel = supabase
      .channel(`user_goals_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {

          if (payload.new && (payload.new as any).id) {
            recalculateCampaignProgress((payload.new as any).id);
          }
        }
      )
      .subscribe((status) => {

      });

    const policiesChannel = supabase
      .channel(`user_policies_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policies',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {

          // Quando uma apólice é criada/atualizada, recalcular todas as campanhas
          fetchUserCampaigns();
        }
      )
      .subscribe((status) => {

      });

    // Cleanup
    return () => {

      supabase.removeChannel(policyLinksChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(policiesChannel);
      setIsConnected(false);
    };
  }, [userId, fetchUserCampaigns, recalculateCampaignProgress]);

  return {
    campaigns,
    isConnected,
    error,
    refetch: fetchUserCampaigns
  };
};
