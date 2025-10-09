import { useEffect, useCallback, useRef, useState } from 'react';
import { realtimeRenderService } from '../services/RealtimeRenderService';
import { useAuth } from './useAuth';

/**
 * 🚀 HOOK PARA RENDERIZAÇÃO EM TEMPO REAL
 * 
 * Este hook gerencia atualizações automáticas da interface quando:
 * - Campanhas são completadas
 * - Progresso é atualizado  
 * - Status muda
 * - Novas apólices são vinculadas
 */
export const useRealtimeRender = () => {
  const { user } = useAuth();
  const forceUpdateRef = useRef(0);
  const [, forceUpdate] = useState({});

  // Função para forçar re-render
  const triggerRender = useCallback(() => {
    forceUpdateRef.current += 1;
    forceUpdate({});
  }, []);

  // Conectar ao serviço de tempo real
  useEffect(() => {
    if (!user?.id) {
      console.log('⚠️ useRealtimeRender: Usuário não autenticado');
      return;
    }

    console.log('🚀 useRealtimeRender: Conectando para usuário', user.id);
    
    // Conectar ao serviço
    realtimeRenderService.connect(user.id).catch(error => {
      console.error('❌ useRealtimeRender: Erro ao conectar:', error);
    });

    // Cleanup na desmontagem
    return () => {
      console.log('🔌 useRealtimeRender: Desconectando...');
      realtimeRenderService.disconnect().catch(error => {
        console.error('❌ useRealtimeRender: Erro ao desconectar:', error);
      });
    };
  }, [user?.id]);

  // Registrar listeners para eventos específicos
  useEffect(() => {
    if (!user?.id) return;

    console.log('📢 useRealtimeRender: Registrando listeners...');

    // Listener para campanha completada
    const removeCampaignCompletedListener = realtimeRenderService.on(
      'campaign_completed',
      () => {
        console.log('🎉 useRealtimeRender: Campanha completada detectada, forçando renderização...');
        triggerRender();
      }
    );

    // Listener para campanha reativada
    const removeCampaignReactivatedListener = realtimeRenderService.on(
      'campaign_reactivated', 
      () => {
        console.log('🔄 useRealtimeRender: Campanha reativada detectada, forçando renderização...');
        triggerRender();
      }
    );

    // Listener para atualização de campanha
    const removeCampaignUpdatedListener = realtimeRenderService.on(
      'campaign_updated',
      () => {
        console.log('📊 useRealtimeRender: Campanha atualizada detectada, forçando renderização...');
        triggerRender();
      }
    );

    // Listener para apólice vinculada
    const removePolicyLinkedListener = realtimeRenderService.on(
      'policy_linked',
      () => {
        console.log('🔗 useRealtimeRender: Apólice vinculada detectada, forçando renderização...');
        triggerRender();
      }
    );

    // Listener para apólice atualizada
    const removePolicyUpdatedListener = realtimeRenderService.on(
      'policy_updated',
      () => {
        console.log('📋 useRealtimeRender: Apólice atualizada detectada, forçando renderização...');
        triggerRender();
      }
    );

    // Listener para todas as campanhas atualizadas
    const removeAllCampaignsUpdatedListener = realtimeRenderService.on(
      'all_campaigns_updated',
      () => {
        console.log('🚀 useRealtimeRender: Todas as campanhas atualizadas, forçando renderização...');
        triggerRender();
      }
    );

    // Cleanup dos listeners
    return () => {
      console.log('🗑️ useRealtimeRender: Removendo listeners...');
      removeCampaignCompletedListener();
      removeCampaignReactivatedListener();
      removeCampaignUpdatedListener();
      removePolicyLinkedListener();
      removePolicyUpdatedListener();
      removeAllCampaignsUpdatedListener();
    };
  }, [user?.id, triggerRender]);

  // Função para forçar atualização manual
  const forceUpdateAllCampaigns = useCallback(async () => {
    console.log('🚀 useRealtimeRender: Forçando atualização manual de todas as campanhas...');
    await realtimeRenderService.forceUpdateAllCampaigns();
  }, []);

  // Função para obter status do serviço
  const getServiceStatus = useCallback(() => {
    return realtimeRenderService.getStatus();
  }, []);

  return {
    // Estado do hook
    isConnected: realtimeRenderService.getStatus().isConnected,
    userId: user?.id,
    
    // Funções
    forceUpdateAllCampaigns,
    getServiceStatus,
    triggerRender
  };
};
