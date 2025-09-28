/**
 * 🔥 SERVIÇO GLOBAL DE NOTIFICAÇÕES
 * Consolida TODOS os serviços de notificação em um único ponto
 * Substitui: notificationService
 */

import { supabase } from '../lib/supabase';
import { GlobalCacheService } from './GlobalCacheService';

export interface GlobalNotification {
  id: string;
  user_id: string;
  type: 'policy_added' | 'campaign_completed' | 'goal_achieved' | 'system_alert' | 'campaign_accepted' | 'campaign_rejected' | 'progress_update' | 'audit_completed';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: { [key: string]: number };
  by_priority: { [key: string]: number };
}

export class GlobalNotificationService {
  
  /**
   * 🔥 ENVIAR NOTIFICAÇÃO: Método principal para enviar notificações
   */
  static async sendNotification(
    userId: string,
    type: GlobalNotification['type'],
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<string | null> {
    try {
      console.log(`📢 GlobalNotificationService - Enviando notificação para usuário ${userId}: ${title}`);

      const notification: Omit<GlobalNotification, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false,
        priority,
        expires_at: this.calculateExpirationDate(type)
      };

      const { data: result, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select('id')
        .single();

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao enviar notificação:`, error);
        return null;
      }

      // Invalidar cache de notificações do usuário
      GlobalCacheService.remove(`notifications_${userId}`);
      GlobalCacheService.remove(`notification_stats_${userId}`);

      console.log(`✅ GlobalNotificationService - Notificação enviada: ${result.id}`);
      return result.id;

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao enviar notificação:`, error);
      return null;
    }
  }

  /**
   * 🔥 BUSCAR NOTIFICAÇÕES: Não lidas do usuário
   */
  static async getUnreadNotifications(userId: string): Promise<GlobalNotification[]> {
    try {
      // Verificar cache primeiro
      const cached = GlobalCacheService.getNotificationData(userId);
      if (cached) {
        return cached;
      }

      console.log(`📢 GlobalNotificationService - Buscando notificações não lidas para usuário ${userId}`);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao buscar notificações:`, error);
        return [];
      }

      // Cachear resultado
      GlobalCacheService.setNotificationData(userId, data || []);

      return data || [];

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao buscar notificações:`, error);
      return [];
    }
  }

  /**
   * 🔥 BUSCAR TODAS AS NOTIFICAÇÕES: Com paginação
   */
  static async getAllNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<GlobalNotification[]> {
    try {
      console.log(`📢 GlobalNotificationService - Buscando todas as notificações para usuário ${userId}`);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao buscar notificações:`, error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao buscar notificações:`, error);
      return [];
    }
  }

  /**
   * 🔥 MARCAR COMO LIDA: Notificação específica
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      console.log(`📢 GlobalNotificationService - Marcando notificação como lida: ${notificationId}`);

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao marcar como lida:`, error);
        return false;
      }

      console.log(`✅ GlobalNotificationService - Notificação marcada como lida`);
      return true;

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao marcar como lida:`, error);
      return false;
    }
  }

  /**
   * 🔥 MARCAR TODAS COMO LIDAS: Do usuário
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      console.log(`📢 GlobalNotificationService - Marcando todas as notificações como lidas para usuário ${userId}`);

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao marcar todas como lidas:`, error);
        return false;
      }

      // Invalidar cache
      GlobalCacheService.remove(`notifications_${userId}`);
      GlobalCacheService.remove(`notification_stats_${userId}`);

      console.log(`✅ GlobalNotificationService - Todas as notificações marcadas como lidas`);
      return true;

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao marcar todas como lidas:`, error);
      return false;
    }
  }

  /**
   * 🔥 DELETAR NOTIFICAÇÃO: Remover notificação específica
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      console.log(`📢 GlobalNotificationService - Deletando notificação: ${notificationId}`);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao deletar notificação:`, error);
        return false;
      }

      console.log(`✅ GlobalNotificationService - Notificação deletada`);
      return true;

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao deletar notificação:`, error);
      return false;
    }
  }

  /**
   * 🔥 LIMPAR NOTIFICAÇÕES ANTIGAS: Remover notificações expiradas
   */
  static async clearExpiredNotifications(): Promise<number> {
    try {
      console.log(`📢 GlobalNotificationService - Limpando notificações expiradas`);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao limpar notificações expiradas:`, error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`✅ GlobalNotificationService - ${deletedCount} notificações expiradas removidas`);
      return deletedCount;

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao limpar notificações expiradas:`, error);
      return 0;
    }
  }

  /**
   * 🔥 ESTATÍSTICAS: Obter estatísticas de notificações
   */
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      // Verificar cache primeiro
      const cached = GlobalCacheService.get(`notification_stats_${userId}`);
      if (cached) {
        return cached;
      }

      console.log(`📢 GlobalNotificationService - Calculando estatísticas para usuário ${userId}`);

      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read, priority')
        .eq('user_id', userId);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao buscar estatísticas:`, error);
        return {
          total: 0,
          unread: 0,
          by_type: {},
          by_priority: {}
        };
      }

      const stats: NotificationStats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.is_read).length || 0,
        by_type: {},
        by_priority: {}
      };

      // Calcular estatísticas por tipo e prioridade
      data?.forEach(notification => {
        // Por tipo
        stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;
        
        // Por prioridade
        stats.by_priority[notification.priority] = (stats.by_priority[notification.priority] || 0) + 1;
      });

      // Cachear resultado
      GlobalCacheService.set(`notification_stats_${userId}`, stats, 2 * 60 * 1000); // 2 minutos

      console.log(`✅ GlobalNotificationService - Estatísticas calculadas: ${stats.total} total, ${stats.unread} não lidas`);
      return stats;

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao calcular estatísticas:`, error);
      return {
        total: 0,
        unread: 0,
        by_type: {},
        by_priority: {}
      };
    }
  }

  /**
   * 🔥 NOTIFICAÇÕES AUTOMÁTICAS: Baseadas em eventos do sistema
   */
  static async notifyPolicyAdded(userId: string, policyData: any): Promise<void> {
    const title = 'Nova Apólice Adicionada';
    const message = `Apólice ${policyData.policy_number} foi adicionada com sucesso.`;
    
    await this.sendNotification(userId, 'policy_added', title, message, policyData, 'medium');
  }

  static async notifyCampaignCompleted(userId: string, campaignData: any): Promise<void> {
    const title = 'Campanha Concluída!';
    const message = `Parabéns! A campanha "${campaignData.title}" foi concluída com sucesso.`;
    
    await this.sendNotification(userId, 'campaign_completed', title, message, campaignData, 'high');
  }

  static async notifyGoalAchieved(userId: string, goalData: any): Promise<void> {
    const title = 'Meta Atingida!';
    const message = `Você atingiu a meta "${goalData.title}". Continue assim!`;
    
    await this.sendNotification(userId, 'goal_achieved', title, message, goalData, 'high');
  }

  static async notifySystemAlert(userId: string, alertData: any): Promise<void> {
    const title = 'Alerta do Sistema';
    const message = alertData.message || 'Ocorreu um problema no sistema.';
    
    await this.sendNotification(userId, 'system_alert', title, message, alertData, 'urgent');
  }

  static async notifyCampaignAccepted(userId: string, campaignData: any): Promise<void> {
    const title = 'Campanha Aceita';
    const message = `A campanha "${campaignData.title}" foi aceita e está ativa.`;
    
    await this.sendNotification(userId, 'campaign_accepted', title, message, campaignData, 'medium');
  }

  static async notifyProgressUpdate(userId: string, progressData: any): Promise<void> {
    const title = 'Progresso Atualizado';
    const message = `Seu progresso na campanha foi atualizado: ${progressData.progress}% concluído.`;
    
    await this.sendNotification(userId, 'progress_update', title, message, progressData, 'low');
  }

  /**
   * 🔥 TEMPLATES DE NOTIFICAÇÃO: Para diferentes tipos
   */
  static getNotificationTemplate(type: string): NotificationTemplate {
    const templates: { [key: string]: NotificationTemplate } = {
      policy_added: {
        type: 'policy_added',
        title: 'Nova Apólice',
        message: 'Uma nova apólice foi adicionada ao sistema.',
        priority: 'medium'
      },
      campaign_completed: {
        type: 'campaign_completed',
        title: 'Campanha Concluída',
        message: 'Parabéns! Uma campanha foi concluída com sucesso.',
        priority: 'high'
      },
      goal_achieved: {
        type: 'goal_achieved',
        title: 'Meta Atingida',
        message: 'Você atingiu uma meta importante!',
        priority: 'high'
      },
      system_alert: {
        type: 'system_alert',
        title: 'Alerta do Sistema',
        message: 'Ocorreu um problema que requer sua atenção.',
        priority: 'urgent'
      }
    };

    return templates[type] || {
      type,
      title: 'Notificação',
      message: 'Você recebeu uma nova notificação.',
      priority: 'medium'
    };
  }

  /**
   * 🔥 CALCULAR DATA DE EXPIRAÇÃO: Baseada no tipo
   */
  private static calculateExpirationDate(type: string): string {
    const now = new Date();
    let expirationDays = 7; // Padrão: 7 dias

    switch (type) {
      case 'system_alert':
        expirationDays = 30; // Alertas do sistema: 30 dias
        break;
      case 'campaign_completed':
      case 'goal_achieved':
        expirationDays = 14; // Conquistas: 14 dias
        break;
      case 'progress_update':
        expirationDays = 3; // Atualizações de progresso: 3 dias
        break;
      default:
        expirationDays = 7; // Padrão: 7 dias
    }

    now.setDate(now.getDate() + expirationDays);
    return now.toISOString();
  }

  /**
   * 🔥 NOTIFICAÇÃO EM LOTE: Para múltiplos usuários
   */
  static async sendBulkNotification(
    userIds: string[],
    type: GlobalNotification['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<{ success: number; errors: string[] }> {
    try {
      console.log(`📢 GlobalNotificationService - Enviando notificação em lote para ${userIds.length} usuários`);

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false,
        priority: 'medium' as const,
        expires_at: this.calculateExpirationDate(type)
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error(`❌ GlobalNotificationService - Erro ao enviar notificação em lote:`, error);
        return { success: 0, errors: [error.message] };
      }

      console.log(`✅ GlobalNotificationService - Notificação em lote enviada com sucesso`);
      return { success: userIds.length, errors: [] };

    } catch (error) {
      console.error(`❌ GlobalNotificationService - Erro geral ao enviar notificação em lote:`, error);
      return { success: 0, errors: [`Erro geral: ${error}`] };
    }
  }
}
