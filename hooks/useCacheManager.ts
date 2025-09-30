import { useEffect, useCallback } from 'react';
import { useCampaignsStore } from '../stores/useCampaignsStore';
import { usePoliciesStore } from '../stores/usePoliciesStore';
import { useUserStore } from '../stores/useUserStore';
import { useSettingsStore } from '../stores/useSettingsStore';

/**
 * Hook para gerenciar cache e sincronização de dados
 * Integra com Zustand stores e fornece funcionalidades de cache
 */
export const useCacheManager = () => {
  const campaignsStore = useCampaignsStore();
  const policiesStore = usePoliciesStore();
  const userStore = useUserStore();
  const settingsStore = useSettingsStore();

  // Verificar se cache está válido
  const isCacheValid = useCallback(() => {
    const campaignsValid = campaignsStore.isCacheValid();
    const policiesValid = policiesStore.isCacheValid();
    const userValid = userStore.isCacheValid();
    
    return {
      campaigns: campaignsValid,
      policies: policiesValid,
      user: userValid,
      all: campaignsValid && policiesValid && userValid
    };
  }, [campaignsStore, policiesStore, userStore]);

  // Limpar cache de todos os stores
  const clearAllCache = useCallback(() => {
    console.log('🗑️ CacheManager: Limpando todo o cache...');
    campaignsStore.clearCache();
    policiesStore.clearCache();
    userStore.clearCache();
  }, [campaignsStore, policiesStore, userStore]);

  // Limpar cache expirado
  const clearExpiredCache = useCallback(() => {
    const cacheStatus = isCacheValid();
    
    if (!cacheStatus.campaigns) {
      console.log('🔄 CacheManager: Cache de campanhas expirado, limpando...');
      campaignsStore.clearCache();
    }
    
    if (!cacheStatus.policies) {
      console.log('🔄 CacheManager: Cache de apólices expirado, limpando...');
      policiesStore.clearCache();
    }
    
    if (!cacheStatus.user) {
      console.log('🔄 CacheManager: Cache do usuário expirado, limpando...');
      userStore.clearCache();
    }
  }, [campaignsStore, policiesStore, userStore, isCacheValid]);

  // Verificar status de conexão
  const checkConnection = useCallback(() => {
    const isOnline = navigator.onLine;
    const { settings } = settingsStore;
    
    if (!isOnline && !settings.offlineMode) {
      console.log('📡 CacheManager: Modo offline detectado');
      settingsStore.updateSettings({ offlineMode: true });
    } else if (isOnline && settings.offlineMode) {
      console.log('📡 CacheManager: Conexão restaurada');
      settingsStore.updateSettings({ offlineMode: false });
      
      // Sincronizar dados quando voltar online
      if (settings.syncWhenOnline) {
        console.log('🔄 CacheManager: Sincronizando dados...');
        clearExpiredCache();
      }
    }
    
    return isOnline;
  }, [settingsStore, clearExpiredCache]);

  // Auto-refresh baseado nas configurações
  useEffect(() => {
    const { settings } = settingsStore;
    
    if (!settings.autoRefresh || !settings.cacheEnabled) return;
    
    const interval = setInterval(() => {
      console.log('🔄 CacheManager: Auto-refresh executado');
      clearExpiredCache();
    }, settings.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [settingsStore, clearExpiredCache]);

  // Listener para mudanças de conexão
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 CacheManager: Conexão restaurada');
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log('📡 CacheManager: Conexão perdida');
      checkConnection();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  // Verificar cache na inicialização (apenas uma vez)
  useEffect(() => {
    console.log('🚀 CacheManager: Inicializando...');
    checkConnection();
    clearExpiredCache();
  }, []); // Removendo dependências que causam loop

  return {
    // Status do cache
    isCacheValid,
    
    // Ações de cache
    clearAllCache,
    clearExpiredCache,
    
    // Status de conexão
    checkConnection,
    isOnline: navigator.onLine,
    
    // Stores
    campaignsStore,
    policiesStore,
    userStore,
    settingsStore,
    
    // Configurações
    settings: settingsStore.settings
  };
};
