import React, { createContext, useContext, useEffect, useState } from 'react';
import { UnifiedCampaignProgressServiceV2, CampaignProgressResult } from '../../services/UnifiedCampaignProgressServiceV2';

/**
 * 🎯 PROVIDER DE PROGRESSO DE CAMPANHAS
 * 
 * Este provider centraliza o gerenciamento de progresso de campanhas
 * e fornece acesso aos dados para todos os componentes da aplicação.
 */

interface CampaignProgressContextType {
  // Dados de progresso
  campaignProgress: Record<string, CampaignProgressResult>;
  
  // Estados
  loading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  
  // Ações
  getCampaignProgress: (campaignId: string) => CampaignProgressResult | null;
  refreshCampaignProgress: (campaignId: string) => Promise<void>;
  refreshAllCampaigns: () => Promise<void>;
  clearCache: () => void;
  
  // Estatísticas
  getOverallStats: () => {
    totalCampaigns: number;
    completedCampaigns: number;
    averageProgress: number;
    totalValue: number;
  };
}

const CampaignProgressContext = createContext<CampaignProgressContextType | null>(null);

interface CampaignProgressProviderProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // Em milissegundos
  campaignIds?: string[]; // IDs específicos para monitorar
}

export const CampaignProgressProvider: React.FC<CampaignProgressProviderProps> = ({
  children,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  campaignIds = []
}) => {
  const [campaignProgress, setCampaignProgress] = useState<Record<string, CampaignProgressResult>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🔄 Busca progresso de uma campanha específica
   */
  const getCampaignProgress = (campaignId: string): CampaignProgressResult | null => {
    return campaignProgress[campaignId] || null;
  };

  /**
   * 🔄 Atualiza progresso de uma campanha específica
   */
  const refreshCampaignProgress = async (campaignId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaignId, true);
      
      if (result) {
        setCampaignProgress(prev => ({
          ...prev,
          [campaignId]: result
        }));
        setLastUpdated(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao atualizar progresso da campanha ${campaignId}: ${errorMessage}`);
      console.error('❌ Erro no CampaignProgressProvider:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 Atualiza progresso de todas as campanhas
   */
  const refreshAllCampaigns = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await UnifiedCampaignProgressServiceV2.recalculateAllActiveCampaigns();
      
      if (result.success > 0) {
        // Buscar progresso atualizado das campanhas monitoradas
        const promises = campaignIds.map(id => 
          UnifiedCampaignProgressServiceV2.calculateCampaignProgress(id)
        );
        
        const results = await Promise.all(promises);
        const newProgress: Record<string, CampaignProgressResult> = {};
        
        results.forEach((result, index) => {
          if (result) {
            newProgress[campaignIds[index]] = result;
          }
        });
        
        setCampaignProgress(newProgress);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao atualizar todas as campanhas: ${errorMessage}`);
      console.error('❌ Erro no refreshAllCampaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🧹 Limpa cache de todas as campanhas
   */
  const clearCache = (): void => {
    UnifiedCampaignProgressServiceV2.clearCache();
    setCampaignProgress({});
    setError(null);
  };

  /**
   * 📊 Calcula estatísticas gerais
   */
  const getOverallStats = () => {
    const progressList = Object.values(campaignProgress);
    
    if (progressList.length === 0) {
      return {
        totalCampaigns: 0,
        completedCampaigns: 0,
        averageProgress: 0,
        totalValue: 0
      };
    }

    const completedCampaigns = progressList.filter(p => p.isCompleted).length;
    const averageProgress = progressList.reduce((sum, p) => sum + p.progressPercentage, 0) / progressList.length;
    const totalValue = progressList.reduce((sum, p) => sum + p.currentValue, 0);

    return {
      totalCampaigns: progressList.length,
      completedCampaigns,
      averageProgress,
      totalValue
    };
  };

  // Effect para carregar progresso inicial das campanhas especificadas
  useEffect(() => {
    if (campaignIds.length > 0) {
      const loadInitialProgress = async () => {
        setLoading(true);
        
        try {
          const promises = campaignIds.map(id => 
            UnifiedCampaignProgressServiceV2.calculateCampaignProgress(id)
          );
          
          const results = await Promise.all(promises);
          const initialProgress: Record<string, CampaignProgressResult> = {};
          
          results.forEach((result, index) => {
            if (result) {
              initialProgress[campaignIds[index]] = result;
            }
          });
          
          setCampaignProgress(initialProgress);
          setLastUpdated(new Date());
        } catch (err) {
          console.error('❌ Erro ao carregar progresso inicial:', err);
        } finally {
          setLoading(false);
        }
      };

      loadInitialProgress();
    }
  }, [campaignIds]);

  // Effect para auto-refresh
  useEffect(() => {
    if (!autoRefresh || campaignIds.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      campaignIds.forEach(id => {
        refreshCampaignProgress(id);
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, campaignIds]);

  const contextValue: CampaignProgressContextType = {
    campaignProgress,
    loading,
    lastUpdated,
    error,
    getCampaignProgress,
    refreshCampaignProgress,
    refreshAllCampaigns,
    clearCache,
    getOverallStats
  };

  return (
    <CampaignProgressContext.Provider value={contextValue}>
      {children}
    </CampaignProgressContext.Provider>
  );
};

/**
 * 🎯 Hook para usar o contexto de progresso de campanhas
 */
export const useCampaignProgress = (): CampaignProgressContextType => {
  const context = useContext(CampaignProgressContext);
  
  if (!context) {
    throw new Error('useCampaignProgress deve ser usado dentro de um CampaignProgressProvider');
  }
  
  return context;
};

/**
 * 🎯 Hook para uma campanha específica
 */
export const useCampaignProgressForCampaign = (campaignId: string) => {
  const { getCampaignProgress, refreshCampaignProgress, loading, error } = useCampaignProgress();
  
  const progress = getCampaignProgress(campaignId);
  
  const refresh = () => refreshCampaignProgress(campaignId);
  
  return {
    progress,
    loading,
    error,
    refresh,
    isCompleted: progress?.isCompleted || false,
    progressPercentage: progress?.progressPercentage || 0,
    currentValue: progress?.currentValue || 0,
    linkedPolicies: progress?.linkedPolicies || 0,
    dataIntegrityScore: progress?.dataIntegrityScore || 0
  };
};

/**
 * 🎯 Hook para estatísticas gerais
 */
export const useCampaignProgressStats = () => {
  const { getOverallStats, refreshAllCampaigns, loading } = useCampaignProgress();
  
  const stats = getOverallStats();
  
  return {
    ...stats,
    loading,
    refreshAll: refreshAllCampaigns,
    completionRate: stats.totalCampaigns > 0 ? (stats.completedCampaigns / stats.totalCampaigns) * 100 : 0
  };
};

/**
 * 🎯 Componente de Debug para o Provider
 */
export const CampaignProgressDebugPanel: React.FC = () => {
  const { campaignProgress, loading, lastUpdated, error, getOverallStats } = useCampaignProgress();
  const stats = getOverallStats();

  return (
    <div className="bg-gray-100 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-gray-800">Debug - Campaign Progress Provider</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Campanhas Monitoradas</div>
          <div className="font-bold">{stats.totalCampaigns}</div>
        </div>
        <div>
          <div className="text-gray-600">Completadas</div>
          <div className="font-bold text-green-600">{stats.completedCampaigns}</div>
        </div>
        <div>
          <div className="text-gray-600">Progresso Médio</div>
          <div className="font-bold">{stats.averageProgress.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-600">Valor Total</div>
          <div className="font-bold">
            {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-blue-600 text-sm">🔄 Atualizando progresso...</div>
      )}

      {error && (
        <div className="text-red-600 text-sm">❌ {error}</div>
      )}

      {lastUpdated && (
        <div className="text-gray-600 text-sm">
          📅 Última atualização: {lastUpdated.toLocaleString('pt-BR')}
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-700">Ver detalhes das campanhas</summary>
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
          {Object.entries(campaignProgress).map(([id, progress]) => (
            <div key={id} className="bg-white p-2 rounded text-xs">
              <div className="font-medium">{id.slice(0, 8)}...</div>
              <div>Progresso: {progress.progressPercentage.toFixed(1)}%</div>
              <div>Integridade: {progress.dataIntegrityScore}%</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
