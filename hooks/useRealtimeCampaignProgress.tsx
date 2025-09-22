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
        const newProgressData: RealtimeProgressData = {
          campaignId,
          progress: progressResult.progressPercentage,
          currentValue: progressResult.currentValue,
          isCompleted: progressResult.isCompleted,
          lastUpdated: new Date()
        };

        setProgressData(newProgressData);

      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!campaignId) return;

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

          recalculateProgress(campaignId);
        }
      )
      .subscribe((status) => {

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

          recalculateProgress(campaignId);
        }
      )
      .subscribe((status) => {

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

          recalculateProgress(campaignId);
        }
      )
      .subscribe((status) => {

      });

    // Recalcular progresso inicial
    recalculateProgress(campaignId);

    // Cleanup
    return () => {

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
