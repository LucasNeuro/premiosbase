import { supabase } from '../lib/supabase';
import { UnifiedCampaignProgressServiceV2 } from './UnifiedCampaignProgressServiceV2';

/**
 * 🚀 SERVIÇO DE RENDERIZAÇÃO EM TEMPO REAL
 * 
 * Este serviço gerencia atualizações automáticas da interface quando:
 * - Campanhas são completadas
 * - Progresso é atualizado
 * - Status muda
 * - Novas apólices são vinculadas
 */
export class RealtimeRenderService {
  private static instance: RealtimeRenderService;
  private listeners: Map<string, Set<() => void>> = new Map();
  private isConnected = false;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): RealtimeRenderService {
    if (!RealtimeRenderService.instance) {
      RealtimeRenderService.instance = new RealtimeRenderService();
    }
    return RealtimeRenderService.instance;
  }

  /**
   * 🎯 CONECTAR E CONFIGURAR LISTENERS EM TEMPO REAL
   */
  async connect(userId: string): Promise<void> {
    if (this.isConnected && this.userId === userId) {
      console.log('🔄 RealtimeRenderService: Já conectado para usuário', userId);
      return;
    }

    this.userId = userId;
    console.log('🚀 RealtimeRenderService: Conectando para usuário', userId);

    try {
      // 1. 📊 LISTENER: Mudanças na tabela goals (campanhas)
      const goalsChannel = supabase
        .channel(`realtime_goals_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goals',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            console.log('📊 RealtimeRenderService: Mudança em goals detectada', payload);
            
            if (payload.new && (payload.new as any).id) {
              const campaignId = (payload.new as any).id;
              const newStatus = (payload.new as any).status;
              const oldStatus = (payload.old as any)?.status;

              // Se status mudou para 'completed', notificar todos os listeners
              if (newStatus === 'completed' && oldStatus !== 'completed') {
                console.log('🎉 RealtimeRenderService: Campanha completada!', campaignId);
                await this.notifyListeners('campaign_completed', campaignId);
              }

              // Se status mudou de 'completed', notificar também
              if (oldStatus === 'completed' && newStatus !== 'completed') {
                console.log('🔄 RealtimeRenderService: Campanha voltou para ativa', campaignId);
                await this.notifyListeners('campaign_reactivated', campaignId);
              }

              // Notificar mudança geral
              await this.notifyListeners('campaign_updated', campaignId);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ RealtimeRenderService: Goals channel conectado');
          }
        });

      // 2. 🔗 LISTENER: Mudanças na tabela policy_campaign_links
      const linksChannel = supabase
        .channel(`realtime_links_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'policy_campaign_links'
          },
          async (payload) => {
            console.log('🔗 RealtimeRenderService: Mudança em links detectada', payload);
            
            if (payload.new && (payload.new as any).campaign_id) {
              const campaignId = (payload.new as any).campaign_id;
              
              // Recalcular progresso da campanha afetada
              await this.recalculateCampaignProgress(campaignId);
              
              // Notificar listeners
              await this.notifyListeners('policy_linked', campaignId);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ RealtimeRenderService: Links channel conectado');
          }
        });

      // 3. 📋 LISTENER: Mudanças na tabela policies
      const policiesChannel = supabase
        .channel(`realtime_policies_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'policies',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            console.log('📋 RealtimeRenderService: Mudança em policies detectada', payload);
            
            // Quando uma apólice é criada/atualizada, recalcular todas as campanhas
            await this.notifyListeners('policy_updated');
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ RealtimeRenderService: Policies channel conectado');
          }
        });

      this.isConnected = true;
      console.log('🎉 RealtimeRenderService: Conectado com sucesso!');

    } catch (error) {
      console.error('❌ RealtimeRenderService: Erro ao conectar:', error);
      this.isConnected = false;
    }
  }

  /**
   * 🔌 DESCONECTAR
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    console.log('🔌 RealtimeRenderService: Desconectando...');
    
    try {
      await supabase.removeAllChannels();
      this.listeners.clear();
      this.isConnected = false;
      this.userId = null;
      
      console.log('✅ RealtimeRenderService: Desconectado');
    } catch (error) {
      console.error('❌ RealtimeRenderService: Erro ao desconectar:', error);
    }
  }

  /**
   * 📢 REGISTRAR LISTENER PARA EVENTOS
   */
  on(event: string, callback: () => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    console.log(`📢 RealtimeRenderService: Listener registrado para evento '${event}'`);
    
    // Retornar função para remover o listener
    return () => {
      this.listeners.get(event)?.delete(callback);
      console.log(`🗑️ RealtimeRenderService: Listener removido para evento '${event}'`);
    };
  }

  /**
   * 📢 NOTIFICAR TODOS OS LISTENERS DE UM EVENTO
   */
  private async notifyListeners(event: string, campaignId?: string): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    console.log(`📢 RealtimeRenderService: Notificando ${eventListeners.size} listeners para evento '${event}'`);
    
    // Executar todos os callbacks
    eventListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ RealtimeRenderService: Erro ao executar callback:', error);
      }
    });
  }

  /**
   * 🔄 RECALCULAR PROGRESSO DE UMA CAMPANHA
   */
  private async recalculateCampaignProgress(campaignId: string): Promise<void> {
    try {
      console.log(`🔄 RealtimeRenderService: Recalculando progresso da campanha ${campaignId}`);
      
      // Limpar cache da campanha específica
      UnifiedCampaignProgressServiceV2.clearCacheForCampaign(campaignId);
      
      // Recalcular progresso
      await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaignId, true);
      
      console.log(`✅ RealtimeRenderService: Progresso recalculado para campanha ${campaignId}`);
    } catch (error) {
      console.error(`❌ RealtimeRenderService: Erro ao recalcular progresso da campanha ${campaignId}:`, error);
    }
  }

  /**
   * 🚀 FORÇAR ATUALIZAÇÃO DE TODAS AS CAMPANHAS
   */
  async forceUpdateAllCampaigns(): Promise<void> {
    if (!this.userId) {
      console.warn('⚠️ RealtimeRenderService: Usuário não definido para atualização');
      return;
    }

    console.log('🚀 RealtimeRenderService: Forçando atualização de todas as campanhas');
    
    try {
      // Buscar todas as campanhas do usuário
      const { data: campaigns, error } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', this.userId)
        .eq('record_type', 'campaign')
        .eq('acceptance_status', 'accepted');

      if (error) {
        console.error('❌ RealtimeRenderService: Erro ao buscar campanhas:', error);
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        console.log('📭 RealtimeRenderService: Nenhuma campanha encontrada');
        return;
      }

      // Recalcular progresso de cada campanha
      const promises = campaigns.map(campaign => 
        this.recalculateCampaignProgress(campaign.id)
      );

      await Promise.all(promises);
      
      // Notificar que todas as campanhas foram atualizadas
      await this.notifyListeners('all_campaigns_updated');
      
      console.log(`✅ RealtimeRenderService: ${campaigns.length} campanhas atualizadas`);
    } catch (error) {
      console.error('❌ RealtimeRenderService: Erro ao atualizar campanhas:', error);
    }
  }

  /**
   * 📊 OBTER STATUS DA CONEXÃO
   */
  getStatus(): { isConnected: boolean; userId: string | null; listenersCount: number } {
    const totalListeners = Array.from(this.listeners.values())
      .reduce((total, set) => total + set.size, 0);

    return {
      isConnected: this.isConnected,
      userId: this.userId,
      listenersCount: totalListeners
    };
  }
}

// Exportar instância singleton
export const realtimeRenderService = RealtimeRenderService.getInstance();
