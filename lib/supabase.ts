import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://wdqobcvasxfiettueifs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcW9iY3Zhc3hmaWV0dHVlaWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDExMzUsImV4cCI6MjA3MjcxNzEzNX0.rC6xS8Za4jWjQTOEhaP9bkWVSuYQgL83o7KsyHaK0WA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          cnpj: string;
          cpd: string;
          password_hash?: string;
          cnpj_data?: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email: string;
          cnpj: string;
          cpd: string;
          password_hash?: string;
          cnpj_data?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          cnpj?: string;
          cpd?: string;
          password_hash?: string;
          cnpj_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      policies: {
        Row: {
          id: string;
          user_id: string;
          policy_number: string;
          type: 'Seguro Auto' | 'Seguro Residencial';
          premium_value: number;
          registration_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          policy_number: string;
          type: 'Seguro Auto' | 'Seguro Residencial';
          premium_value: number;
          registration_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          policy_number?: string;
          type?: 'Seguro Auto' | 'Seguro Residencial';
          premium_value?: number;
          registration_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
