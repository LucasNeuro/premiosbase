import { useState, useEffect, useCallback } from 'react';
import { AdminDashboardServiceV2 } from '../services/AdminDashboardServiceV2';
import type {
  RankingCorretor,
  DistribuicaoApolices,
  EstatisticasGerais,
  DashboardData
} from '../services/AdminDashboardServiceV2';

/**
 * 🎯 INTERFACE PARA DADOS COMPLETOS DO DASHBOARD
 */
// Interface já definida no AdminDashboardServiceV2

/**
 * 🚀 HOOK PARA DASHBOARD ADMINISTRATIVO
 */
export const useAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  /**
   * 🔄 CARREGAR TODOS OS DADOS DO DASHBOARD
   */
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 useAdminDashboard: Carregando dados do dashboard...');
      
      const data = await AdminDashboardServiceV2.getAllDashboardData();
      
      if (data) {
        setDashboardData(data);
        setLastRefresh(new Date());
        console.log('✅ useAdminDashboard: Dados carregados com sucesso');
      } else {
        setError('Falha ao carregar dados do dashboard');
        console.error('❌ useAdminDashboard: Dados não carregados');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ useAdminDashboard: Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔄 FORÇAR ATUALIZAÇÃO
   */
  const refreshData = useCallback(async () => {
    console.log('🔄 useAdminDashboard: Forçando atualização...');
    await AdminDashboardServiceV2.forceRefresh();
    await loadDashboardData();
  }, [loadDashboardData]);

  /**
   * 📊 CARREGAR ESTATÍSTICAS GERAIS
   */
  const loadEstatisticas = useCallback(async () => {
    try {
      console.log('📊 useAdminDashboard: Carregando estatísticas...');
      const estatisticas = await AdminDashboardServiceV2.getEstatisticasGerais();
      
      setDashboardData(prev => prev ? { ...prev, estatisticas } : null);
      return estatisticas;
    } catch (err) {
      console.error('❌ useAdminDashboard: Erro ao carregar estatísticas:', err);
      return null;
    }
  }, []);

  /**
   * 🏆 CARREGAR RANKING DE CORRETORES
   */
  const loadRanking = useCallback(async (limit: number = 10) => {
    try {
      console.log(`🏆 useAdminDashboard: Carregando ranking (${limit})...`);
      const ranking = await AdminDashboardServiceV2.getRankingCorretores(limit);
      
      setDashboardData(prev => prev ? { ...prev, ranking } : null);
      return ranking;
    } catch (err) {
      console.error('❌ useAdminDashboard: Erro ao carregar ranking:', err);
      return [];
    }
  }, []);

  /**
   * 🍩 CARREGAR DISTRIBUIÇÃO DE APÓLICES
   */
  const loadDistribuicao = useCallback(async () => {
    try {
      console.log('🍩 useAdminDashboard: Carregando distribuições...');
      
      const [tipos, contratos, valores] = await Promise.all([
        AdminDashboardServiceV2.getDistribuicaoApolices('Tipo de Apólice'),
        AdminDashboardServiceV2.getDistribuicaoApolices('Tipo de Contrato'),
        AdminDashboardServiceV2.getDistribuicaoApolices('Faixa de Valor')
      ]);

      const distribuicoes = { tipos, contratos, valores };
      
      setDashboardData(prev => prev ? { ...prev, distribuicoes } : null);
      return distribuicoes;
    } catch (err) {
      console.error('❌ useAdminDashboard: Erro ao carregar distribuições:', err);
      return { tipos: [], contratos: [], valores: [] };
    }
  }, []);

  /**
   * 🎯 CARREGAR DADOS ESPECÍFICOS
   */
  const loadSpecificData = useCallback(async (dataType: keyof DashboardData) => {
    switch (dataType) {
      case 'estatisticas':
        return await loadEstatisticas();
      case 'ranking':
        return await loadRanking();
      case 'distribuicoes':
        return await loadDistribuicao();
      default:
        console.warn('⚠️ useAdminDashboard: Tipo de dado não reconhecido:', dataType);
        return null;
    }
  }, [loadEstatisticas, loadRanking, loadDistribuicao]);

  /**
   * 🔄 AUTO-REFRESH PERIÓDICO
   */
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 useAdminDashboard: Auto-refresh executado');
      refreshData();
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [refreshData]);

  /**
   * 🚀 CARREGAR DADOS INICIAIS
   */
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    // Dados
    dashboardData,
    loading,
    error,
    lastRefresh,

    // Funções principais
    loadDashboardData,
    refreshData,
    loadSpecificData,

    // Funções específicas
    loadEstatisticas,
    loadRanking,
    loadDistribuicao,

    // Estado
    isDataLoaded: !!dashboardData,
    hasError: !!error,
    isLoading: loading
  };
};
