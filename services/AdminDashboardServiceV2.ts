import { supabase } from '../lib/supabase';

/**
 * 🎯 INTERFACES SIMPLIFICADAS PARA DASHBOARD ADMINISTRATIVO
 */
export interface EstatisticasGerais {
  total_corretores: number;
  total_apolices: number;
  receita_total: number;
  crescimento_mensal_percentual: number;
  campanhas_ativas: number;
  campanhas_concluidas: number;
  total_premios_conquistados: number;
  valor_total_premios_conquistados: number;
  total_premios_cadastrados: number;
  ticket_medio_apolice: number;
}

export interface RankingCorretor {
  corretor_id: string;
  nome_corretor: string;
  email_corretor: string;
  total_apolices: number;
  receita_total: number;
  ticket_medio: number;
  ranking_position: number;
}

export interface DistribuicaoApolices {
  categoria_tipo: string;
  categoria_valor: string;
  quantidade: number;
  valor_total: number;
  percentual_quantidade: number;
  percentual_valor: number;
}

export interface DashboardData {
  estatisticas: EstatisticasGerais | null;
  ranking: RankingCorretor[];
  distribuicoes: {
    tipos: DistribuicaoApolices[];
    contratos: DistribuicaoApolices[];
    valores: DistribuicaoApolices[];
  };
  vendasCategoria: any[];
  performanceMensal: any[];
  topCorretores: any[];
  resumoExecutivo: any;
  carregadoEm: string;
}

/**
 * 🚀 SERVIÇO SIMPLIFICADO DO DASHBOARD ADMINISTRATIVO
 */
export class AdminDashboardServiceV2 {
  /**
   * 📊 BUSCAR ESTATÍSTICAS GERAIS
   */
  static async getEstatisticasGerais(): Promise<EstatisticasGerais | null> {
    try {
      console.log('📊 AdminDashboardServiceV2: Buscando estatísticas gerais...');
      
      const { data, error } = await supabase
        .from('view_estatisticas_gerais')
        .select('*')
        .single();

      if (error) {
        console.error('❌ AdminDashboardServiceV2: Erro ao buscar estatísticas:', error);
        
        // Fallback: buscar dados diretamente das tabelas
        console.log('🔄 AdminDashboardServiceV2: Executando fallback...');
        return await this.getEstatisticasFallback();
      }
      
      console.log('✅ AdminDashboardServiceV2: Estatísticas carregadas:', data);
      return data as EstatisticasGerais;
    } catch (err) {
      console.error('❌ AdminDashboardServiceV2: Erro geral:', err);
      return await this.getEstatisticasFallback();
    }
  }

  /**
   * 🏆 BUSCAR RANKING DE CORRETORES
   */
  static async getRankingCorretores(limit: number = 10): Promise<RankingCorretor[]> {
    try {
      console.log(`🏆 AdminDashboardServiceV2: Buscando ranking (${limit})...`);
      
      const { data, error } = await supabase
        .from('view_ranking_corretores')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('❌ AdminDashboardServiceV2: Erro ao buscar ranking:', error);
        
        // Fallback: buscar dados diretamente das tabelas
        console.log('🔄 AdminDashboardServiceV2: Executando fallback do ranking...');
        return await this.getRankingFallback(limit);
      }
      
      console.log(`✅ AdminDashboardServiceV2: Ranking carregado (${data?.length || 0} registros)`);
      return data as RankingCorretor[];
    } catch (err) {
      console.error('❌ AdminDashboardServiceV2: Erro geral no ranking:', err);
      return await this.getRankingFallback(limit);
    }
  }

  /**
   * 🍩 BUSCAR DISTRIBUIÇÃO DE APÓLICES
   */
  static async getDistribuicaoApolices(categoria: 'Tipo de Apólice' | 'Tipo de Contrato' | 'Faixa de Valor'): Promise<DistribuicaoApolices[]> {
    try {
      console.log(`🍩 AdminDashboardServiceV2: Buscando distribuição (${categoria})...`);
      
      const { data, error } = await supabase
        .from('view_distribuicao_apolices')
        .select('*')
        .eq('categoria_tipo', categoria);

      if (error) {
        console.error(`❌ AdminDashboardServiceV2: Erro ao buscar distribuição (${categoria}):`, error);
        return [];
      }
      
      console.log(`✅ AdminDashboardServiceV2: Distribuição carregada (${categoria}): ${data?.length || 0} registros`);
      return data as DistribuicaoApolices[];
    } catch (err) {
      console.error('❌ AdminDashboardServiceV2: Erro geral na distribuição:', err);
      return [];
    }
  }

  /**
   * 🔄 FALLBACK PARA ESTATÍSTICAS
   */
  private static async getEstatisticasFallback(): Promise<EstatisticasGerais | null> {
    try {
      console.log('🔄 AdminDashboardServiceV2: Executando fallback...');
      
      // Buscar dados diretamente das tabelas
      const [usersResult, policiesResult, goalsResult] = await Promise.all([
        supabase.from('users').select('id').eq('is_admin', false),
        supabase.from('policies').select('premium_value, created_at').eq('status', 'active'),
        supabase.from('goals').select('status').eq('record_type', 'campaign')
      ]);

      if (usersResult.error || policiesResult.error || goalsResult.error) {
        console.error('❌ AdminDashboardServiceV2: Erro no fallback:', {
          users: usersResult.error,
          policies: policiesResult.error,
          goals: goalsResult.error
        });
        return null;
      }

      const totalRevenue = policiesResult.data?.reduce((sum, policy) => sum + Number(policy.premium_value || 0), 0) || 0;
      const activeGoals = goalsResult.data?.filter(goal => goal.status === 'active').length || 0;
      const completedGoals = goalsResult.data?.filter(goal => goal.status === 'completed').length || 0;

      const stats: EstatisticasGerais = {
        total_corretores: usersResult.data?.length || 0,
        total_apolices: policiesResult.data?.length || 0,
        receita_total: totalRevenue,
        crescimento_mensal_percentual: 0, // Simplificado para fallback
        campanhas_ativas: activeGoals,
        campanhas_concluidas: completedGoals,
        total_premios_conquistados: 0,
        valor_total_premios_conquistados: 0,
        total_premios_cadastrados: 0,
        ticket_medio_apolice: policiesResult.data?.length ? totalRevenue / policiesResult.data.length : 0,
      };

      console.log('✅ AdminDashboardServiceV2: Fallback executado com sucesso');
      return stats;
    } catch (err) {
      console.error('❌ AdminDashboardServiceV2: Erro no fallback:', err);
      return null;
    }
  }

  /**
   * 🔄 FALLBACK PARA RANKING
   */
  private static async getRankingFallback(limit: number = 10): Promise<RankingCorretor[]> {
    try {
      console.log(`🔄 AdminDashboardServiceV2: Executando fallback do ranking (${limit})...`);
      
      // Buscar dados diretamente das tabelas
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          policies!policies_user_id_fkey(
            id,
            premium_value,
            created_at
          )
        `)
        .eq('is_admin', false)
        .limit(limit);

      if (usersError) {
        console.error('❌ AdminDashboardServiceV2: Erro no fallback do ranking:', usersError);
        return [];
      }

      const ranking = usersData?.map((user, index) => {
        const policies = user.policies || [];
        const totalPolicies = policies.length;
        const totalRevenue = policies.reduce((sum: number, p: any) => sum + (p.premium_value || 0), 0);
        const ticketMedio = totalPolicies > 0 ? totalRevenue / totalPolicies : 0;

        return {
          corretor_id: user.id,
          nome_corretor: user.name,
          email_corretor: user.email,
          total_apolices: totalPolicies,
          receita_total: totalRevenue,
          ticket_medio: ticketMedio,
          ranking_position: index + 1
        };
      }).filter(broker => broker.total_apolices > 0) || [];

      // Ordenar por receita total
      ranking.sort((a, b) => b.receita_total - a.receita_total);
      
      // Atualizar posições
      ranking.forEach((broker, index) => {
        broker.ranking_position = index + 1;
      });

      console.log(`✅ AdminDashboardServiceV2: Fallback do ranking executado (${ranking.length} registros)`);
      return ranking;
    } catch (err) {
      console.error('❌ AdminDashboardServiceV2: Erro no fallback do ranking:', err);
      return [];
    }
  }

  /**
   * 🚀 CARREGAR TODOS OS DADOS DO DASHBOARD
   */
  static async getAllDashboardData(): Promise<DashboardData | null> {
    try {
      console.log('🚀 AdminDashboardServiceV2: Carregando todos os dados...');
      
      const [
        estatisticas,
        ranking,
        distribuicaoTipo,
        distribuicaoContrato,
        distribuicaoValor
      ] = await Promise.all([
        this.getEstatisticasGerais(),
        this.getRankingCorretores(),
        this.getDistribuicaoApolices('Tipo de Apólice'),
        this.getDistribuicaoApolices('Tipo de Contrato'),
        this.getDistribuicaoApolices('Faixa de Valor')
      ]);

      const dashboardData: DashboardData = {
        estatisticas,
        ranking,
        distribuicoes: {
          tipos: distribuicaoTipo,
          contratos: distribuicaoContrato,
          valores: distribuicaoValor
        },
        vendasCategoria: [],
        performanceMensal: [],
        topCorretores: [],
        resumoExecutivo: null,
        carregadoEm: new Date().toISOString()
      };

      console.log('✅ AdminDashboardServiceV2: Todos os dados carregados');
      return dashboardData;
    } catch (err) {
      console.error('❌ AdminDashboardServiceV2: Erro ao carregar todos os dados:', err);
      return null;
    }
  }

  /**
   * 🔄 FORÇAR REFRESH
   */
  static async forceRefresh(): Promise<void> {
    console.log('🔄 AdminDashboardServiceV2: Forçando refresh...');
    // Aqui você pode implementar lógica para limpar cache se necessário
  }
}

