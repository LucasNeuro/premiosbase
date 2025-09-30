import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettings {
  // Configurações de cache
  cacheEnabled: boolean;
  cacheExpiry: number; // em minutos
  autoRefresh: boolean;
  refreshInterval: number; // em segundos
  
  // Configurações de UI
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  
  // Configurações de notificações
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  
  // Configurações de desenvolvimento
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  // Configurações de offline
  offlineMode: boolean;
  syncWhenOnline: boolean;
}

interface SettingsState {
  // Configurações
  settings: AppSettings;
  
  // Estado
  loading: boolean;
  error: string | null;
  
  // Ações
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  toggleOfflineMode: () => void;
}

const defaultSettings: AppSettings = {
  // Cache
  cacheEnabled: true,
  cacheExpiry: 5, // 5 minutos
  autoRefresh: true,
  refreshInterval: 30, // 30 segundos
  
  // UI
  sidebarCollapsed: false,
  theme: 'auto',
  animations: true,
  
  // Notificações
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: true
  },
  
  // Desenvolvimento
  debugMode: false,
  logLevel: 'info',
  
  // Offline
  offlineMode: false,
  syncWhenOnline: true
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      settings: defaultSettings,
      loading: false,
      error: null,
      
      // Ações
      updateSettings: (newSettings) => {
        const { settings } = get();
        const updatedSettings = { ...settings, ...newSettings };
        
        set({ 
          settings: updatedSettings,
          error: null 
        });
        
        console.log('⚙️ Store: Configurações atualizadas', newSettings);
      },
      
      resetSettings: () => {
        set({ 
          settings: defaultSettings,
          error: null 
        });
        console.log('🔄 Store: Configurações resetadas');
      },
      
      setLoading: (loading) => {
        set({ loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      toggleSidebar: () => {
        const { settings } = get();
        set({
          settings: {
            ...settings,
            sidebarCollapsed: !settings.sidebarCollapsed
          }
        });
        console.log('📱 Store: Sidebar toggled');
      },
      
      toggleTheme: () => {
        const { settings } = get();
        const themes = ['light', 'dark', 'auto'] as const;
        const currentIndex = themes.indexOf(settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        set({
          settings: {
            ...settings,
            theme: themes[nextIndex]
          }
        });
        console.log('🎨 Store: Tema alterado para', themes[nextIndex]);
      },
      
      toggleOfflineMode: () => {
        const { settings } = get();
        set({
          settings: {
            ...settings,
            offlineMode: !settings.offlineMode
          }
        });
        console.log('📡 Store: Modo offline toggled', !settings.offlineMode);
      }
    }),
    {
      name: 'settings-storage', // Nome da chave no localStorage
      partialize: (state) => ({
        settings: state.settings
      })
    }
  )
);
