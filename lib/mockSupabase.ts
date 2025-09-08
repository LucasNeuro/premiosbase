// Mock do Supabase para desenvolvimento local
export const mockSupabase = {
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),
    
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se o usuário existe no localStorage
      const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        return {
          data: { user: null },
          error: { message: 'Usuário não encontrado' }
        };
      }
      
      // Simular usuário autenticado
      const mockUser = {
        id: user.id,
        email: user.email,
        user_metadata: {}
      };
      
      return {
        data: { user: mockUser },
        error: null
      };
    },
    
    signUp: async ({ email, password }: { email: string; password: string }) => {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se o usuário já existe
      const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        return {
          data: { user: null },
          error: { message: 'Usuário já existe' }
        };
      }
      
      // Criar novo usuário
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // Em produção, isso seria hasheado
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('mockUsers', JSON.stringify(users));
      
      return {
        data: { user: newUser },
        error: null
      };
    },
    
    signOut: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { error: null };
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Simular listener de mudança de auth
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  },
  
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          const data = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          const item = data.find((item: any) => item[column] === value);
          return { data: item, error: item ? null : { message: 'Not found' } };
        }
      }),
      order: (column: string, options: any) => ({
        then: async (callback: any) => {
          const data = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          const sorted = data.sort((a: any, b: any) => {
            if (options.ascending) {
              return a[column] > b[column] ? 1 : -1;
            } else {
              return a[column] < b[column] ? 1 : -1;
            }
          });
          return callback({ data: sorted, error: null });
        }
      })
    }),
    
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          const existing = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          const newItem = {
            id: Date.now().toString(),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          existing.push(newItem);
          localStorage.setItem(`mock_${table}`, JSON.stringify(existing));
          return { data: newItem, error: null };
        }
      })
    }),
    
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async (callback: any) => {
          const existing = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          const index = existing.findIndex((item: any) => item[column] === value);
          if (index !== -1) {
            existing[index] = { ...existing[index], ...data, updated_at: new Date().toISOString() };
            localStorage.setItem(`mock_${table}`, JSON.stringify(existing));
            return callback({ data: existing[index], error: null });
          }
          return callback({ data: null, error: { message: 'Not found' } });
        }
      })
    }),
    
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (callback: any) => {
          const existing = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
          const filtered = existing.filter((item: any) => item[column] !== value);
          localStorage.setItem(`mock_${table}`, JSON.stringify(filtered));
          return callback({ data: null, error: null });
        }
      })
    })
  })
};
