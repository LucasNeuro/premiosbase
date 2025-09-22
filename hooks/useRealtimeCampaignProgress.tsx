import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCampaignProgressAuxiliar } from '../services/campaignProgressAuxiliar';

interface RealtimeProgressData {
  campaignId: string;
  progress: number;
  currentValue: number;
  isCompleted: boolean;
  lastUpdated: Date;
}

export const useRealtimeCampaignProgress = (campaignId?: string) => {
  const [progressData, setProgressData] = useState<RealtimeProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para recalcular progresso
  const recalculateProgress = useCallback(async (campaignId: string) => {
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
        const newProgressData: RealtimeProgressData = {
          campaignId,
          progress: progressResult.progressPercentage,
          currentValue: progressResult.currentValue,
          isCompleted: progressResult.isCompleted,
          lastUpdated: new Date()
        };

        setProgressData(newProgressData);
        console.log(`✅ [REALTIME] Progresso atualizado:`, newProgressData);
      }
    } catch (err: any) {
      console.error('❌ [REALTIME] Erro ao recalcular progresso:', err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!campaignId) return;

    console.log(`🔌 [REALTIME] Conectando ao tempo real para campanha: ${campaignId}`);

    // Configurar listeners para mudanças nas tabelas relevantes
    const policyLinksChannel = supabase
      .channel(`policy_links_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'policy_campaign_links',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          console.log(`🔄 [REALTIME] Mudança em policy_campaign_links:`, payload);
          recalculateProgress(campaignId);
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
      .channel(`goals_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'goals',
          filter: `id=eq.${campaignId}`
        },
        (payload) => {
          console.log(`🔄 [REALTIME] Mudança em goals:`, payload);
          recalculateProgress(campaignId);
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Status da conexão goals:`, status);
      });

    const policiesChannel = supabase
      .channel(`policies_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policies',
          filter: `user_id=eq.${campaignId}` // Assumindo que queremos ouvir mudanças nas apólices do usuário
        },
        (payload) => {
          console.log(`🔄 [REALTIME] Mudança em policies:`, payload);
          recalculateProgress(campaignId);
        }
      )
      .subscribe((status) => {
        console.log(`📡 [REALTIME] Status da conexão policies:`, status);
      });

    // Recalcular progresso inicial
    recalculateProgress(campaignId);

    // Cleanup
    return () => {
      console.log(`🔌 [REALTIME] Desconectando canais para campanha: ${campaignId}`);
      supabase.removeChannel(policyLinksChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(policiesChannel);
      setIsConnected(false);
    };
  }, [campaignId, recalculateProgress]);

  return {
    progressData,
    isConnected,
    error,
    recalculateProgress: () => campaignId ? recalculateProgress(campaignId) : Promise.resolve()
  };
};
