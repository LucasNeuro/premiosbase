import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EscolhaPremio {
  id: string;
  goal_id: string;
  user_id: string;
  premio_escolhido_id: string;
  escolhido_em: string;
  observacoes?: string;
  status: 'escolhido' | 'entregue' | 'cancelado';
  entregue: boolean;
  entregue_em?: string;
  entregue_por?: string;
  created_at: string;
  updated_at: string;
  premio_escolhido: {
    id: string;
    nome: string;
    descricao?: string;
    valor_estimado: number;
    imagem_miniatura_url?: string;
    categoria: {
      id: string;
      nome: string;
      cor: string;
      icone: string;
    };
    tipo: {
      id: string;
      nome: string;
      cor: string;
      icone: string;
    };
  };
  corretor: {
    id: string;
    name: string;
    email: string;
  };
  campanha: {
    id: string;
    title: string;
    target: number;
    current_value: number;
    progress_percentage: number;
  };
}

export const useEscolhaPremios = () => {
  const [escolhas, setEscolhas] = useState<EscolhaPremio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar todas as escolhas de prêmios
   */
  const fetchEscolhas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .select(`
          *,
          premio_escolhido:premios(
            *,
            categoria:categorias_premios(id, nome, cor, icone),
            tipo:tipos_premios(id, nome, cor, icone)
          ),
          corretor:users(id, name, email),
          campanha:goals(id, title, target, current_value, progress_percentage)
        `)
        .order('escolhido_em', { ascending: false });

      if (error) throw error;
      
      setEscolhas(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar escolhas de prêmios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar escolhas de prêmios por corretor
   */
  const fetchEscolhasPorCorretor = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .select(`
          *,
          premio_escolhido:premios(
            *,
            categoria:categorias_premios(id, nome, cor, icone),
            tipo:tipos_premios(id, nome, cor, icone)
          ),
          campanha:goals(id, title, target, current_value, progress_percentage)
        `)
        .eq('user_id', userId)
        .order('escolhido_em', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar escolhas de prêmios do corretor:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar escolhas de prêmios por campanha
   */
  const fetchEscolhasPorCampanha = async (goalId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .select(`
          *,
          premio_escolhido:premios(
            *,
            categoria:categorias_premios(id, nome, cor, icone),
            tipo:tipos_premios(id, nome, cor, icone)
          ),
          corretor:users(id, name, email)
        `)
        .eq('goal_id', goalId)
        .order('escolhido_em', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar escolhas de prêmios da campanha:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificar se o corretor já escolheu um prêmio para uma campanha
   */
  const verificarEscolhaExistente = async (goalId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (err: any) {
      console.error('Erro ao verificar escolha existente:', err);
      throw err;
    }
  };

  /**
   * Registrar escolha de prêmio pelo corretor
   */
  const escolherPremio = async (
    goalId: string, 
    userId: string, 
    premioId: string, 
    observacoes?: string
  ) => {
    try {
      // Verificar se já existe uma escolha para esta campanha
      const escolhaExistente = await verificarEscolhaExistente(goalId, userId);
      
      if (escolhaExistente) {
        throw new Error('Você já escolheu um prêmio para esta campanha');
      }

      // Registrar a escolha
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .insert({
          goal_id: goalId,
          user_id: userId,
          premio_escolhido_id: premioId,
          observacoes: observacoes,
          status: 'escolhido'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar a lista
      await fetchEscolhas();
      
      return data;
    } catch (err: any) {
      console.error('Erro ao escolher prêmio:', err);
      throw err;
    }
  };

  /**
   * Alterar escolha de prêmio (se ainda não foi entregue)
   */
  const alterarEscolhaPremio = async (
    escolhaId: string, 
    novoPremioId: string, 
    observacoes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .update({
          premio_escolhido_id: novoPremioId,
          observacoes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', escolhaId)
        .eq('entregue', false) // Só permite alterar se não foi entregue
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar a lista
      await fetchEscolhas();
      
      return data;
    } catch (err: any) {
      console.error('Erro ao alterar escolha de prêmio:', err);
      throw err;
    }
  };

  /**
   * Marcar prêmio como entregue
   */
  const marcarPremioEntregue = async (
    escolhaId: string, 
    entreguePor: string, 
    observacoes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .update({
          entregue: true,
          entregue_em: new Date().toISOString(),
          entregue_por: entreguePor,
          status: 'entregue',
          observacoes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', escolhaId)
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar a lista
      await fetchEscolhas();
      
      return data;
    } catch (err: any) {
      console.error('Erro ao marcar prêmio como entregue:', err);
      throw err;
    }
  };

  /**
   * Cancelar escolha de prêmio
   */
  const cancelarEscolhaPremio = async (escolhaId: string, motivo?: string) => {
    try {
      const { data, error } = await supabase
        .from('escolha_premios_corretor')
        .update({
          status: 'cancelado',
          observacoes: motivo,
          updated_at: new Date().toISOString()
        })
        .eq('id', escolhaId)
        .eq('entregue', false) // Só permite cancelar se não foi entregue
        .select()
        .single();

      if (error) throw error;
      
      // Recarregar a lista
      await fetchEscolhas();
      
      return data;
    } catch (err: any) {
      console.error('Erro ao cancelar escolha de prêmio:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchEscolhas();
  }, []);

  return {
    escolhas,
    loading,
    error,
    fetchEscolhas,
    fetchEscolhasPorCorretor,
    fetchEscolhasPorCampanha,
    verificarEscolhaExistente,
    escolherPremio,
    alterarEscolhaPremio,
    marcarPremioEntregue,
    cancelarEscolhaPremio
  };
};
