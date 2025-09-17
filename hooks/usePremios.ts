import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Premio {
  id: string;
  nome: string;
  descricao?: string;
  imagem_url?: string;
  imagem_miniatura_url?: string;
  valor_estimado: number;
  pontos_necessarios: number;
  is_ativo: boolean;
  categoria_id?: string;
  tipo_id?: string;
  created_at: string;
  updated_at: string;
  // Dados das tabelas auxiliares
  categoria?: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
  };
  tipo?: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
  };
}

export interface CampanhaPremio {
  id: string;
  goal_id: string;
  premio_id: string;
  quantidade: number;
  entregue: boolean;
  entregue_em?: string;
  entregue_por?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  premio: Premio;
}

export const usePremios = () => {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPremios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('premios')
        .select(`
          *,
          categoria:categorias_premios!premios_categoria_id_fkey(id, nome, cor, icone),
          tipo:tipos_premios!premios_tipo_id_fkey(id, nome, cor, icone)
        `)
        .eq('is_ativo', true)
        .order('nome');

      if (error) throw error;
      
      setPremios(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar prêmios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPremiosByCategoria = async (categoriaId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('premios')
        .select(`
          *,
          categoria:categorias_premios!premios_categoria_id_fkey(id, nome, cor, icone),
          tipo:tipos_premios!premios_tipo_id_fkey(id, nome, cor, icone)
        `)
        .eq('is_ativo', true)
        .eq('categoria_id', categoriaId)
        .order('nome');

      if (error) throw error;
      
      setPremios(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar prêmios por categoria:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPremiosByTipo = async (tipoId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('premios')
        .select(`
          *,
          categoria:categorias_premios!premios_categoria_id_fkey(id, nome, cor, icone),
          tipo:tipos_premios!premios_tipo_id_fkey(id, nome, cor, icone)
        `)
        .eq('is_ativo', true)
        .eq('tipo_id', tipoId)
        .order('nome');

      if (error) throw error;
      
      setPremios(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar prêmios por tipo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const vincularPremioCampanha = async (goalId: string, premioId: string, quantidade: number = 1) => {
    try {
      // Verificar se já existe essa vinculação
      const { data: existingLink, error: checkError } = await supabase
        .from('campanhas_premios')
        .select('id')
        .eq('goal_id', goalId)
        .eq('premio_id', premioId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 significa "not found", que é ok
        throw checkError;
      }

      if (existingLink) {
        console.log(`✅ Prêmio ${premioId} já vinculado à campanha ${goalId}`);
        return existingLink;
      }

      // Se não existe, criar nova vinculação
      const { data, error } = await supabase
        .from('campanhas_premios')
        .insert({
          goal_id: goalId,
          premio_id: premioId,
          quantidade: quantidade
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ Prêmio ${premioId} vinculado à campanha ${goalId} com sucesso`);
      return data;
    } catch (err: any) {
      console.error('Erro ao vincular prêmio à campanha:', err);
      throw err;
    }
  };

  const buscarPremiosCampanha = async (goalId: string): Promise<CampanhaPremio[]> => {
    try {
      const { data, error } = await supabase
        .from('campanhas_premios')
        .select(`
          *,
          premio:premios(
            *,
            categoria:categorias_premios!premios_categoria_id_fkey(id, nome, cor, icone),
            tipo:tipos_premios!premios_tipo_id_fkey(id, nome, cor, icone)
          )
        `)
        .eq('goal_id', goalId);

      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar prêmios da campanha:', err);
      throw err;
    }
  };

  const removerPremioCampanha = async (campanhaPremioId: string) => {
    try {
      const { error } = await supabase
        .from('campanhas_premios')
        .delete()
        .eq('id', campanhaPremioId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao remover prêmio da campanha:', err);
      throw err;
    }
  };

  const marcarPremioEntregue = async (campanhaPremioId: string, observacoes?: string) => {
    try {
      const { data, error } = await supabase
        .from('campanhas_premios')
        .update({
          entregue: true,
          entregue_em: new Date().toISOString(),
          observacoes: observacoes
        })
        .eq('id', campanhaPremioId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (err: any) {
      console.error('Erro ao marcar prêmio como entregue:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPremios();
  }, []);

  return {
    premios,
    loading,
    error,
    fetchPremios,
    fetchPremiosByCategoria,
    fetchPremiosByTipo,
    vincularPremioCampanha,
    buscarPremiosCampanha,
    removerPremioCampanha,
    marcarPremioEntregue
  };
};
