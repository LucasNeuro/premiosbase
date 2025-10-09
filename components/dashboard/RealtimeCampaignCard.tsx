import React, { useState, useEffect } from 'react';
import { Goal } from '../../types';
import { UnifiedCampaignProgressServiceV2 } from '../../services/UnifiedCampaignProgressServiceV2';
import UnifiedCampaignCard from './UnifiedCampaignCard';
import CompletedCampaignsCard from './CompletedCampaignsCard';

interface RealtimeCampaignCardProps {
  campaign: Goal;
  onDetailsClick?: (campaign: Goal) => void;
}

/**
 * 🚀 COMPONENTE DE CARD COM RENDERIZAÇÃO EM TEMPO REAL
 * 
 * Este componente:
 * - Atualiza automaticamente quando o progresso muda
 * - Força re-render quando necessário
 * - Usa o serviço unificado de progresso
 * - Mantém estado local sincronizado
 */
export const RealtimeCampaignCard: React.FC<RealtimeCampaignCardProps> = ({
  campaign,
  onDetailsClick
}) => {
  const [localCampaign, setLocalCampaign] = useState<Goal>(campaign);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Atualizar campanha local quando props mudarem
  useEffect(() => {
    setLocalCampaign(campaign);
    setLastUpdateTime(new Date());
  }, [campaign]);

  // Função para forçar atualização do progresso
  const updateProgress = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      console.log(`🔄 RealtimeCampaignCard: Atualizando progresso da campanha ${campaign.id}`);
      
      // Limpar cache e recalcular
      UnifiedCampaignProgressServiceV2.clearCache(campaign.id);
      const progressResult = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(
        campaign.id, 
        true // force refresh
      );

      if (progressResult) {
        // Atualizar campanha local com novos dados
        setLocalCampaign(prev => ({
          ...prev,
          progress_percentage: progressResult.progressPercentage,
          current_value: progressResult.currentValue.toString(),
          status: progressResult.isCompleted ? 'completed' : prev.status,
          achieved_at: progressResult.isCompleted ? new Date().toISOString() : prev.achieved_at,
          last_updated: new Date().toISOString()
        }));
        
        setLastUpdateTime(new Date());
        console.log(`✅ RealtimeCampaignCard: Progresso atualizado para ${progressResult.progressPercentage.toFixed(2)}%`);
      }
    } catch (error) {
      console.error('❌ RealtimeCampaignCard: Erro ao atualizar progresso:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-atualização periódica para campanhas ativas
  useEffect(() => {
    if (localCampaign.status !== 'active') return;

    const interval = setInterval(() => {
      updateProgress();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [localCampaign.status, localCampaign.id]);

  // Determinar qual componente usar baseado no status
  const renderCard = () => {
    if (localCampaign.status === 'completed') {
      return (
        <CompletedCampaignsCard
          campaign={localCampaign}
          onDetailsClick={onDetailsClick}
        />
      );
    }

    return (
      <UnifiedCampaignCard
        campaign={localCampaign}
        onDetailsClick={onDetailsClick}
        isUpdating={isUpdating}
      />
    );
  };

  return (
    <div className="relative">
      {/* Indicador de atualização */}
      {isUpdating && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Atualizando...</span>
          </div>
        </div>
      )}
      
      {/* Card principal */}
      {renderCard()}
      
      {/* Timestamp da última atualização (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-1">
          Última atualização: {lastUpdateTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

