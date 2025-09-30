import { useCampaignsStore } from '../stores/useCampaignsStore';
import { usePoliciesStore } from '../stores/usePoliciesStore';
import { useUserStore } from '../stores/useUserStore';

/**
 * 🔧 SERVIÇO DE LIMPEZA DE CACHE
 * 
 * Este serviço limpa o cache local quando necessário,
 * especialmente quando o usuário desloga.
 */
export class CacheCleanupService {
  
  /**
   * Limpar todo o cache local
   */
  static clearAllCache(): void {
    try {
      console.log('🧹 CacheCleanupService: Limpando todo o cache local...');
      
      // Limpar cache de campanhas
      const campaignsStore = useCampaignsStore.getState();
      campaignsStore.clearCache();
      
      // Limpar cache de apólices
      const policiesStore = usePoliciesStore.getState();
      policiesStore.clearCache();
      
      // Limpar cache do usuário
      const userStore = useUserStore.getState();
      userStore.clearCache();
      
      // Limpar localStorage manualmente para garantir
      localStorage.removeItem('campaigns-storage');
      localStorage.removeItem('policies-storage');
      localStorage.removeItem('user-storage');
      localStorage.removeItem('settings-storage');
      
      console.log('✅ Cache local limpo com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }
  
  /**
   * Limpar cache apenas de campanhas (manter outros caches)
   */
  static clearCampaignsCache(): void {
    try {
      console.log('🧹 CacheCleanupService: Limpando cache de campanhas...');
      
      const campaignsStore = useCampaignsStore.getState();
      campaignsStore.clearCache();
      
      localStorage.removeItem('campaigns-storage');
      
      console.log('✅ Cache de campanhas limpo');
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache de campanhas:', error);
    }
  }
  
  /**
   * Limpar cache quando usuário desloga
   */
  static clearCacheOnLogout(): void {
    try {
      console.log('🧹 CacheCleanupService: Limpando cache no logout...');
      
      this.clearAllCache();
      
      // Limpar também dados de sessão
      sessionStorage.clear();
      
      console.log('✅ Cache limpo no logout');
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache no logout:', error);
    }
  }
  
  /**
   * Limpar cache expirado (manter dados válidos)
   */
  static clearExpiredCache(): void {
    try {
      console.log('🧹 CacheCleanupService: Limpando cache expirado...');
      
      const campaignsStore = useCampaignsStore.getState();
      const policiesStore = usePoliciesStore.getState();
      const userStore = useUserStore.getState();
      
      // Verificar e limpar apenas caches expirados
      if (!campaignsStore.isCacheValid()) {
        campaignsStore.clearCache();
        console.log('🗑️ Cache de campanhas expirado removido');
      }
      
      if (!policiesStore.isCacheValid()) {
        policiesStore.clearCache();
        console.log('🗑️ Cache de apólices expirado removido');
      }
      
      if (!userStore.isCacheValid()) {
        userStore.clearCache();
        console.log('🗑️ Cache do usuário expirado removido');
      }
      
      console.log('✅ Cache expirado limpo');
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache expirado:', error);
    }
  }
}
