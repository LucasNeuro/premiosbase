import { supabase } from '../lib/supabase';
import { calculateCampaignProgressAuxiliar } from './campaignProgressAuxiliar';

/**
 * 🔧 SERVIÇO DE CORREÇÃO DE STATUS DAS CAMPANHAS
 * 
 * Este serviço corrige campanhas que estão com status incorreto,
 * especialmente aquelas que aparecem como "completed" mas não deveriam.
 */
export class CampaignStatusCorrectionService {
  
  /**
   * Corrigir status de todas as campanhas de um usuário
   */
  static async correctUserCampaignStatuses(userId: string): Promise<void> {
    try {
      console.log(`🔧 CampaignStatusCorrectionService: Corrigindo status das campanhas do usuário ${userId}`);
      
      // Buscar todas as campanhas do usuário
      const { data: campaigns, error } = await supabase
                .from('goals')
        .select('id, title, status, progress_percentage, acceptance_status')
        .eq('user_id', userId)
                .eq('record_type', 'campaign')
        .eq('is_active', true)
        .in('status', ['active', 'completed', 'cancelled']);
      
      if (error) {
        console.error('❌ Erro ao buscar campanhas:', error);
        return;
      }
      
      if (!campaigns || campaigns.length === 0) {
        console.log('ℹ️ Nenhuma campanha encontrada para correção');
        return;
      }
      
      console.log(`📊 Encontradas ${campaigns.length} campanhas para verificação`);
      
      // Verificar cada campanha
      for (const campaign of campaigns) {
        await this.correctCampaignStatus(campaign.id, campaign.title);
      }
      
      console.log('✅ Correção de status concluída');

        } catch (error) {
      console.error('❌ Erro na correção de status:', error);
        }
    }

    /**
   * Corrigir status de uma campanha específica
   */
  static async correctCampaignStatus(campaignId: string, campaignTitle: string): Promise<void> {
    try {
      // Calcular progresso atual
      const progressData = await calculateCampaignProgressAuxiliar(campaignId);
      
      if (!progressData) {
        console.log(`⚠️ Não foi possível calcular progresso da campanha ${campaignTitle}`);
        return;
      }
      
      // Buscar status atual
      const { data: currentCampaign, error: fetchError } = await supabase
        .from('goals')
        .select('status, progress_percentage, acceptance_status')
        .eq('id', campaignId)
        .single();
      
      if (fetchError) {
        console.error(`❌ Erro ao buscar campanha ${campaignTitle}:`, fetchError);
        return;
      }
      
      const currentStatus = currentCampaign.status;
      const currentProgress = currentCampaign.progress_percentage || 0;
      const isAccepted = currentCampaign.acceptance_status === 'accepted';
      
      // 🔧 CORREÇÃO: Lógica mais rigorosa para status correto
      let correctStatus = 'active';
      
      if (!isAccepted) {
        // Campanha não aceita = pending (não deveria estar em completed)
        if (currentStatus === 'completed') {
          console.log(`🔧 CORREÇÃO: Campanha "${campaignTitle}" estava como completed mas não foi aceita`);
          correctStatus = 'active'; // Voltar para active
        }
      } else if (progressData.isCompleted && progressData.progressPercentage >= 100) {
        // 🔧 VALIDAÇÃO RIGOROSA: Só completed se TODOS os critérios foram atingidos
        const allCriteriaMet = progressData.criteriaDetails?.every(criterion => 
          criterion.isThisCriterionMet && criterion.percentage >= 100
        ) || false;
        
        if (allCriteriaMet) {
          correctStatus = 'completed';
          console.log(`✅ Campanha "${campaignTitle}" realmente atingiu TODOS os critérios`);
        } else {
          correctStatus = 'active';
          console.log(`⚠️ Campanha "${campaignTitle}" não atingiu todos os critérios (${progressData.progressPercentage}%)`);
        }
      } else if (progressData.progressPercentage < 100) {
        // Campanha aceita mas progresso < 100% = active
        correctStatus = 'active';
      }
      
      // Verificar se precisa corrigir
      if (currentStatus !== correctStatus) {
        console.log(`🔧 CORREÇÃO: Campanha "${campaignTitle}"`);
        console.log(`   Status atual: ${currentStatus}`);
        console.log(`   Status correto: ${correctStatus}`);
        console.log(`   Progresso: ${progressData.progressPercentage}%`);
        console.log(`   Critérios atendidos: ${progressData.isCompleted}`);
        
        // Atualizar status
        const updateData: any = {
          status: correctStatus,
          progress_percentage: progressData.progressPercentage,
          current_value: progressData.currentValue,
          last_updated: new Date().toISOString()
        };
        
        // Se marcando como completed, adicionar timestamp
        if (correctStatus === 'completed' && currentStatus !== 'completed') {
          updateData.achieved_at = new Date().toISOString();
          updateData.achieved_value = progressData.currentValue;
        }
        
        // Se voltando para active, limpar timestamps
        if (correctStatus === 'active' && currentStatus === 'completed') {
          updateData.achieved_at = null;
          updateData.achieved_value = null;
        }
        
        const { error: updateError } = await supabase
          .from('goals')
          .update(updateData)
          .eq('id', campaignId);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar campanha ${campaignTitle}:`, updateError);
        } else {
          console.log(`✅ Campanha "${campaignTitle}" corrigida para ${correctStatus}`);
        }
      } else {
        console.log(`✅ Campanha "${campaignTitle}" já está com status correto (${currentStatus})`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao corrigir campanha ${campaignTitle}:`, error);
    }
  }
  
  /**
   * Corrigir todas as campanhas com status incorreto no sistema
   */
  static async correctAllCampaignStatuses(): Promise<void> {
    try {
      console.log('🔧 CampaignStatusCorrectionService: Iniciando correção global de status');
      
      // Buscar todos os usuários com campanhas
      const { data: users, error: usersError } = await supabase
        .from('goals')
        .select('user_id')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .not('user_id', 'is', null);
      
      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError);
        return;
      }
      
      // Obter IDs únicos de usuários
      const uniqueUserIds = [...new Set(users?.map(u => u.user_id) || [])];
      
      console.log(`📊 Encontrados ${uniqueUserIds.length} usuários com campanhas`);
      
      // Corrigir campanhas de cada usuário
      for (const userId of uniqueUserIds) {
        await this.correctUserCampaignStatuses(userId);
      }
      
      console.log('✅ Correção global de status concluída');
      
    } catch (error) {
      console.error('❌ Erro na correção global:', error);
    }
  }
}