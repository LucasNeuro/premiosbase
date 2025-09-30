import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  cpd: any;
  cnpj_data?: any;
  is_admin: boolean;
  has_multiple_cpds: boolean;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    defaultPeriod: '30' | '60' | 'geral';
    showCharts: boolean;
    compactView: boolean;
  };
}

interface UserState {
  // Dados do usuário
  user: User | null;
  isAuthenticated: boolean;
  
  // Preferências
  preferences: UserPreferences;
  
  // Estado de loading
  loading: boolean;
  error: string | null;
  
  // Timestamps para cache
  lastFetched: number | null;
  cacheExpiry: number; // 30 minutos em ms (dados do usuário mudam menos)
  
  // Ações
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  language: 'pt',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  dashboard: {
    defaultPeriod: 'geral',
    showCharts: true,
    compactView: false
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      preferences: defaultPreferences,
      loading: false,
      error: null,
      lastFetched: null,
      cacheExpiry: 30 * 60 * 1000, // 30 minutos
      
      // Ações
      setUser: (user) => {
        console.log('🔄 Store: Usuário atualizado', user?.name);
        set({ 
          user,
          isAuthenticated: !!user,
          lastFetched: Date.now(),
          error: null 
        });
      },
      
      updateUser: (updates) => {
        const { user } = get();
        if (!user) return;
        
        const updatedUser = { ...user, ...updates };
        set({ 
          user: updatedUser,
          lastFetched: Date.now()
        });
        
        console.log('🔄 Store: Dados do usuário atualizados', updates);
      },
      
      setPreferences: (preferences) => {
        const { preferences: currentPrefs } = get();
        const newPreferences = { ...currentPrefs, ...preferences };
        
        set({ 
          preferences: newPreferences,
          lastFetched: Date.now()
        });
        
        console.log('⚙️ Store: Preferências atualizadas', preferences);
      },
      
      setLoading: (loading) => {
        set({ loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          lastFetched: null,
          error: null
        });
        console.log('👋 Store: Usuário deslogado');
      },
      
      clearCache: () => {
        set({
          user: null,
          isAuthenticated: false,
          lastFetched: null,
          error: null
        });
        console.log('🗑️ Store: Cache do usuário limpo');
      },
      
      isCacheValid: () => {
        const { lastFetched, cacheExpiry } = get();
        if (!lastFetched) return false;
        return Date.now() - lastFetched < cacheExpiry;
      }
    }),
    {
      name: 'user-storage', // Nome da chave no localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        preferences: state.preferences,
        lastFetched: state.lastFetched
      })
    }
  )
);
