import { useState, useEffect, useCallback } from 'react';
import { UnifiedCampaignProgressServiceV2, CampaignProgressResult } from '../services/UnifiedCampaignProgressServiceV2';

/**
 * 🎯 HOOK UNIFICADO PARA PROGRESSO DE CAMPANHAS
 * 
 * Este hook substitui todos os hooks anteriores de progresso de campanhas
 * e usa o novo serviço unificado para cálculos consistentes.
 */

export interface UseCampaignProgressOptions {
  refreshInterval?: number; // Em milissegundos
  autoRefresh?: boolean;
  forceRefresh?: boolean;
}

export interface UseCampaignProgressResult {
  progress: CampaignProgressResult | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  dataIntegrityScore: number;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

export const useUnifiedCampaignProgress = (
  campaignId: string | null,
  options: UseCampaignProgressOptions = {}
): UseCampaignProgressResult => {
  const {
    refreshInterval = 30000, // 30 segundos por padrão
    autoRefresh = true,
    forceRefresh = false
  } = options;

  const [progress, setProgress] = useState<CampaignProgressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * 🔄 Função para buscar progresso da campanha
   */
  const fetchProgress = useCallback(async (force = false) => {
    if (!campaignId) {
      setProgress(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 useUnifiedCampaignProgress - Buscando progresso da campanha: ${campaignId}`);
      
      const result = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(
        campaignId, 
        force || forceRefresh
      );

      if (result) {
        setProgress(result);
        setLastUpdated(new Date());
        console.log(`✅ Progresso atualizado: ${result.progressPercentage.toFixed(2)}%`);
      } else {
        setError('Não foi possível calcular o progresso da campanha');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao buscar progresso: ${errorMessage}`);
      console.error('❌ Erro no useUnifiedCampaignProgress:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, forceRefresh]);

  /**
   * 🧹 Função para limpar cache
   */
  const clearCache = useCallback(() => {
    if (campaignId) {
      UnifiedCampaignProgressServiceV2.clearCache(campaignId);
      console.log(`🧹 Cache limpo para campanha: ${campaignId}`);
    }
  }, [campaignId]);

  /**
   * 🔄 Função para refresh manual
   */
  const refresh = useCallback(async () => {
    await fetchProgress(true);
  }, [fetchProgress]);

  // Effect para buscar progresso inicial
  useEffect(() => {
    if (campaignId) {
      fetchProgress();
    }
  }, [campaignId, fetchProgress]);

  // Effect para auto-refresh
  useEffect(() => {
    if (!autoRefresh || !campaignId) {
      return;
    }

    const interval = setInterval(() => {
      fetchProgress();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, campaignId, fetchProgress]);

  return {
    progress,
    loading,
    error,
    lastUpdated,
    dataIntegrityScore: progress?.dataIntegrityScore || 0,
    refresh,
    clearCache
  };
};

/**
 * 🎯 HOOK PARA MÚLTIPLAS CAMPANHAS
 */
export interface UseMultipleCampaignsProgressOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  forceRefresh?: boolean;
}

export interface UseMultipleCampaignsProgressResult {
  campaignsProgress: Record<string, CampaignProgressResult>;
  loading: boolean;
  errors: Record<string, string>;
  lastUpdated: Date | null;
  refresh: (campaignIds?: string[]) => Promise<void>;
  clearCache: () => void;
  getOverallStats: () => {
    totalCampaigns: number;
    completedCampaigns: number;
    averageProgress: number;
    totalValue: number;
  };
}

export const useMultipleCampaignsProgress = (
  campaignIds: string[],
  options: UseMultipleCampaignsProgressOptions = {}
): UseMultipleCampaignsProgressResult => {
  const {
    refreshInterval = 30000,
    autoRefresh = true,
    forceRefresh = false
  } = options;

  const [campaignsProgress, setCampaignsProgress] = useState<Record<string, CampaignProgressResult>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * 🔄 Função para buscar progresso de múltiplas campanhas
   */
  const fetchMultipleProgress = useCallback(async (ids?: string[], force = false) => {
    const targetIds = ids || campaignIds;
    if (targetIds.length === 0) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log(`🔄 useMultipleCampaignsProgress - Buscando progresso de ${targetIds.length} campanhas`);
      
      const promises = targetIds.map(async (id) => {
        try {
          const result = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(
            id, 
            force || forceRefresh
          );
          return { id, result, error: null };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          return { id, result: null, error: errorMessage };
        }
      });

      const results = await Promise.all(promises);
      
      const newProgress: Record<string, CampaignProgressResult> = {};
      const newErrors: Record<string, string> = {};

      results.forEach(({ id, result, error }) => {
        if (result) {
          newProgress[id] = result;
        } else if (error) {
          newErrors[id] = error;
        }
      });

      setCampaignsProgress(newProgress);
      setErrors(newErrors);
      setLastUpdated(new Date());

      console.log(`✅ Progresso de ${Object.keys(newProgress).length} campanhas atualizado`);

    } catch (err) {
      console.error('❌ Erro no useMultipleCampaignsProgress:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignIds, forceRefresh]);

  /**
   * 🧹 Função para limpar cache de todas as campanhas
   */
  const clearCache = useCallback(() => {
    UnifiedCampaignProgressServiceV2.clearCache();
    console.log('🧹 Cache limpo para todas as campanhas');
  }, []);

  /**
   * 🔄 Função para refresh manual
   */
  const refresh = useCallback(async (ids?: string[]) => {
    await fetchMultipleProgress(ids, true);
  }, [fetchMultipleProgress]);

  /**
   * 📊 Função para obter estatísticas gerais
   */
  const getOverallStats = useCallback(() => {
    const progressList = Object.values(campaignsProgress);
    
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
  }, [campaignsProgress]);

  // Effect para buscar progresso inicial
  useEffect(() => {
    if (campaignIds.length > 0) {
      fetchMultipleProgress();
    }
  }, [campaignIds, fetchMultipleProgress]);

  // Effect para auto-refresh
  useEffect(() => {
    if (!autoRefresh || campaignIds.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchMultipleProgress();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, campaignIds, fetchMultipleProgress]);

  return {
    campaignsProgress,
    loading,
    errors,
    lastUpdated,
    refresh,
    clearCache,
    getOverallStats
  };
};

/**
 * 🎯 HOOK PARA AUDITORIA DE INTEGRIDADE
 */
export interface UseIntegrityAuditOptions {
  autoRun?: boolean;
  interval?: number; // Em milissegundos
}

export interface UseIntegrityAuditResult {
  report: any | null;
  loading: boolean;
  error: string | null;
  lastAudit: Date | null;
  runAudit: () => Promise<void>;
  autoFix: () => Promise<void>;
}

export const useIntegrityAudit = (
  options: UseIntegrityAuditOptions = {}
): UseIntegrityAuditResult => {
  const { autoRun = false, interval = 300000 } = options; // 5 minutos por padrão

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAudit, setLastAudit] = useState<Date | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Executando auditoria de integridade...');
      
      // Importar dinamicamente para evitar dependência circular
      const { CampaignDataIntegrityService } = await import('../services/CampaignDataIntegrityService');
      
      const auditReport = await CampaignDataIntegrityService.performFullIntegrityAudit();
      setReport(auditReport);
      setLastAudit(new Date());
      
      console.log(`✅ Auditoria concluída: ${auditReport.totalIssues} problemas encontrados`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro na auditoria: ${errorMessage}`);
      console.error('❌ Erro na auditoria de integridade:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const autoFix = useCallback(async () => {
    if (!report) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔧 Executando correções automáticas...');
      
      const { CampaignDataIntegrityService } = await import('../services/CampaignDataIntegrityService');
      
      const fixedReport = await CampaignDataIntegrityService.executeAutoFixes(report);
      setReport(fixedReport);
      
      console.log(`✅ ${fixedReport.autoFixed} problemas corrigidos automaticamente`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro nas correções: ${errorMessage}`);
      console.error('❌ Erro nas correções automáticas:', err);
    } finally {
      setLoading(false);
    }
  }, [report]);

  // Effect para auto-run
  useEffect(() => {
    if (!autoRun) {
      return;
    }

    // Executar auditoria inicial
    runAudit();

    // Configurar intervalo
    const intervalId = setInterval(runAudit, interval);

    return () => clearInterval(intervalId);
  }, [autoRun, interval, runAudit]);

  return {
    report,
    loading,
    error,
    lastAudit,
    runAudit,
    autoFix
  };
};
