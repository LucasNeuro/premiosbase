import React, { useEffect } from 'react';
import { useCacheManager } from '../../hooks/useCacheManager';

interface CacheProviderProps {
  children: React.ReactNode;
}

/**
 * Provider global para gerenciar cache em toda a aplicação
 * Inicializa o cache manager e configura auto-refresh
 */
const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  const cacheManager = useCacheManager();

  // Configurar auto-refresh global
  useEffect(() => {
    const { settings } = cacheManager;
    
    if (!settings.autoRefresh || !settings.cacheEnabled) return;
    
    console.log('🚀 CacheProvider: Inicializando cache global...');
    
    const interval = setInterval(() => {
      console.log('🔄 CacheProvider: Auto-refresh global executado');
      cacheManager.clearExpiredCache();
    }, settings.refreshInterval * 1000);
    
    return () => {
      console.log('🛑 CacheProvider: Limpando auto-refresh global');
      clearInterval(interval);
    };
  }, []);

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 CacheProvider: Conexão restaurada');
      cacheManager.checkConnection();
    };
    
    const handleOffline = () => {
      console.log('📡 CacheProvider: Conexão perdida');
      cacheManager.checkConnection();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cacheManager]);

  return <>{children}</>;
};

export default CacheProvider;
