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
      console.log(`🔄 [REALTIME] Recalculando progresso para campanha: ${campaignId}`);
      
      // Buscar dados da campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', campaignId)
        .eq('record_type', 'campaign')
        .single();

      if (campaignError || !campaign) {
        console.error('❌ [REALTIME] Erro ao buscar campanha:', campaignError);
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

        console.log(`✅ [REALTIME] Progresso atualizado para:`, updatedCampaign);
      }
    } catch (err: any) {
      console.error('❌ [REALTIME] Erro ao recalcular progresso:', err);
      setError(err.message);
    }
  }, []);

  // Função para buscar todas as campanhas do usuário
  const fetchUserCampaigns = useCallback(async () => {
    if (!userId) return;

    try {
      console.log(`🔍 [REALTIME] Buscando campanhas para usuário: ${userId}`);
      
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        console.error('❌ [REALTIME] Erro ao buscar campanhas:', campaignsError);
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
      console.log(`✅ [REALTIME] Campanhas carregadas:`, campaignsList.length);
    } catch (err: any) {
      console.error('❌ [REALTIME] Erro ao buscar campanhas:', err);
      setError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    console.log(`🔌 [REALTIME] Conectando ao tempo real para usuário: ${userId}`);

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
          console.log(`🔄 [REALTIME] Mudança em policy_campaign_links:`, payload);
          
          // Se a mudança afeta uma campanha do usuário, recalcular
          if (payload.new && (payload.new as any).campaign_id) {
            recalculateCampaignProgress((payload.new as any).campaign_id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Status da conexão policy_links:`, status);
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
          console.log(`🔄 [REALTIME] Mudança em goals:`, payload);
          
          if (payload.new && (payload.new as any).id) {
            recalculateCampaignProgress((payload.new as any).id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Status da conexão goals:`, status);
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
          console.log(`🔄 [REALTIME] Mudança em policies:`, payload);
          
          // Quando uma apólice é criada/atualizada, recalcular todas as campanhas
          fetchUserCampaigns();
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Status da conexão policies:`, status);
      });

    // Cleanup
    return () => {
      console.log(`🔌 [REALTIME] Desconectando canais para usuário: ${userId}`);
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
