import { supabase } from '../lib/supabase';

/**
 * 🎯 INTERFACES PARA DASHBOARD ADMINISTRATIVO
 */
export interface RankingCorretor {
  corretor_id: string;
  nome_corretor: string;
  email_corretor: string;
  cnpj_corretor: string;
  total_apolices: number;
  apolices_auto: number;
  apolices_residencial: number;
  receita_total: number;
  receita_auto: number;
  receita_residencial: number;
  contratos_novos: number;
  contratos_renovacao: number;
  total_campanhas: number;
  campanhas_concluidas: number;
  campanhas_ativas: number;
  premios_conquistados: number;
  valor_premios_conquistados: number;
  primeira_venda: string | null;
  ultima_venda: string | null;
  data_cadastro: string;
  ranking_receita: number;
  ranking_apolices: number;
  ticket_medio: number;
  ativo_ultimos_30_dias: boolean;
}

export interface DistribuicaoApolice {
  categoria_tipo: string;
  categoria_valor: string;
  quantidade: number;
  valor_total: number;
  percentual_quantidade: number;
  percentual_valor: number;
}

export interface VendasPorCategoria {
  categoria_id: string;
  nome_categoria: string;
  descricao_categoria: string;
  cor_categoria: string;
  icone_categoria: string;
  total_corretores: number;
  corretores_ativos: number;
  total_apolices: number;
  apolices_auto: number;
  apolices_residencial: number;
  receita_total: number;
  receita_auto: number;
  receita_residencial: number;
  total_campanhas: number;
  campanhas_concluidas: number;
  campanhas_ativas: number;
  receita_por_corretor: number;
  ticket_medio: number;
  primeira_venda: string | null;
  ultima_venda: string | null;
}

export interface EstatisticasGerais {
  total_corretores: number;
  corretores_novos_mes: number;
  total_apolices: number;
  apolices_novas_mes: number;
  receita_total: number;
  receita_mes_atual: number;
  crescimento_mensal: number;
  total_campanhas: number;
  campanhas_ativas: number;
  campanhas_concluidas: number;
  total_premios_conquistados: number;
  valor_total_premios_conquistados: number;
  total_premios_cadastrados: number;
  ticket_medio_geral: number;
  apolices_por_corretor: number;
  primeira_venda_sistema: string | null;
  ultima_venda_sistema: string | null;
  ultima_atualizacao: string;
}

export interface PerformanceMensal {
  mes_ano: string;
  mes_formatado: string;
  total_apolices: number;
  corretores_ativos: number;
  receita_mes: number;
  apolices_auto: number;
  apolices_residencial: number;
  contratos_novos: number;
  contratos_renovacao: number;
  receita_por_corretor: number;
  ticket_medio: number;
}

export interface TopCorretorMes {
  corretor_id: string;
  nome_corretor: string;
  email_corretor: string;
  apolices_mes: number;
  receita_mes: number;
  ticket_medio: number;
  ranking_mes: number;
}

export interface ResumoExecutivo {
  total_corretores: number;
  total_apolices: number;
  receita_total: number;
  crescimento_mensal: number;
  campanhas_ativas: number;
  campanhas_concluidas: number;
  top_corretor_mes: string | null;
  receita_top_corretor: number;
  ticket_medio_geral: number;
  apolices_por_corretor: number;
  ultima_atualizacao: string;
}

/**
 * 🚀 SERVIÇO PARA DASHBOARD ADMINISTRATIVO
 */
export class AdminDashboardService {
  
  /**
   * 📊 BUSCAR ESTATÍSTICAS GERAIS
   */
  static async getEstatisticasGerais(): Promise<EstatisticasGerais | null> {
    try {
      console.log('📊 AdminDashboardService: Buscando estatísticas gerais...');
      
      const { data, error } = await supabase
        .from('view_estatisticas_gerais')
        .select('*')
        .single();

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar estatísticas:', error);
        return null;
      }

      console.log('✅ AdminDashboardService: Estatísticas carregadas:', data);
      return data as EstatisticasGerais;
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return null;
    }
  }

  /**
   * 🏆 BUSCAR RANKING DE CORRETORES
   */
  static async getRankingCorretores(limit: number = 10): Promise<RankingCorretor[]> {
    try {
      console.log(`🏆 AdminDashboardService: Buscando top ${limit} corretores...`);
      
      const { data, error } = await supabase
        .from('view_ranking_corretores')
        .select('*')
        .order('ranking_receita', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar ranking:', error);
        return [];
      }

      console.log(`✅ AdminDashboardService: ${data?.length || 0} corretores carregados`);
      return data as RankingCorretor[] || [];
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return [];
    }
  }

  /**
   * 🍩 BUSCAR DISTRIBUIÇÃO DE APÓLICES (DONUTS)
   */
  static async getDistribuicaoApolices(tipo: 'Tipo de Apólice' | 'Tipo de Contrato' | 'Faixa de Valor'): Promise<DistribuicaoApolice[]> {
    try {
      console.log(`🍩 AdminDashboardService: Buscando distribuição por ${tipo}...`);
      
      const { data, error } = await supabase
        .from('view_distribuicao_apolices')
        .select('*')
        .eq('categoria_tipo', tipo)
        .order('valor_total', { ascending: false });

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar distribuição:', error);
        return [];
      }

      console.log(`✅ AdminDashboardService: ${data?.length || 0} categorias carregadas para ${tipo}`);
      return data as DistribuicaoApolice[] || [];
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return [];
    }
  }

  /**
   * 📈 BUSCAR VENDAS POR CATEGORIA
   */
  static async getVendasPorCategoria(): Promise<VendasPorCategoria[]> {
    try {
      console.log('📈 AdminDashboardService: Buscando vendas por categoria...');
      
      const { data, error } = await supabase
        .from('view_vendas_por_categoria')
        .select('*')
        .order('receita_total', { ascending: false });

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar vendas por categoria:', error);
        return [];
      }

      console.log(`✅ AdminDashboardService: ${data?.length || 0} categorias carregadas`);
      return data as VendasPorCategoria[] || [];
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return [];
    }
  }

  /**
   * 📅 BUSCAR PERFORMANCE MENSAL
   */
  static async getPerformanceMensal(meses: number = 12): Promise<PerformanceMensal[]> {
    try {
      console.log(`📅 AdminDashboardService: Buscando performance dos últimos ${meses} meses...`);
      
      const { data, error } = await supabase
        .from('view_performance_mensal')
        .select('*')
        .order('mes_ano', { ascending: false })
        .limit(meses);

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar performance mensal:', error);
        return [];
      }

      console.log(`✅ AdminDashboardService: ${data?.length || 0} meses carregados`);
      return data as PerformanceMensal[] || [];
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return [];
    }
  }

  /**
   * 🥇 BUSCAR TOP CORRETORES DO MÊS
   */
  static async getTopCorretoresMes(limit: number = 10): Promise<TopCorretorMes[]> {
    try {
      console.log(`🥇 AdminDashboardService: Buscando top ${limit} corretores do mês...`);
      
      const { data, error } = await supabase
        .from('view_top_corretores_mes')
        .select('*')
        .order('ranking_mes', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar top corretores:', error);
        return [];
      }

      console.log(`✅ AdminDashboardService: ${data?.length || 0} corretores carregados`);
      return data as TopCorretorMes[] || [];
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return [];
    }
  }

  /**
   * 📋 BUSCAR RESUMO EXECUTIVO
   */
  static async getResumoExecutivo(): Promise<ResumoExecutivo | null> {
    try {
      console.log('📋 AdminDashboardService: Buscando resumo executivo...');
      
      const { data, error } = await supabase
        .from('view_resumo_executivo')
        .select('*')
        .single();

      if (error) {
        console.error('❌ AdminDashboardService: Erro ao buscar resumo executivo:', error);
        return null;
      }

      console.log('✅ AdminDashboardService: Resumo executivo carregado');
      return data as ResumoExecutivo;
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro inesperado:', error);
      return null;
    }
  }

  /**
   * 🚀 BUSCAR TODOS OS DADOS DO DASHBOARD
   */
  static async getAllDashboardData() {
    try {
      console.log('🚀 AdminDashboardService: Carregando todos os dados do dashboard...');
      
      const [
        estatisticas,
        ranking,
        distribuicaoTipos,
        distribuicaoContratos,
        distribuicaoValores,
        vendasCategoria,
        performanceMensal,
        topCorretores,
        resumoExecutivo
      ] = await Promise.all([
        this.getEstatisticasGerais(),
        this.getRankingCorretores(10),
        this.getDistribuicaoApolices('Tipo de Apólice'),
        this.getDistribuicaoApolices('Tipo de Contrato'),
        this.getDistribuicaoApolices('Faixa de Valor'),
        this.getVendasPorCategoria(),
        this.getPerformanceMensal(12),
        this.getTopCorretoresMes(10),
        this.getResumoExecutivo()
      ]);

      const dashboardData = {
        estatisticas,
        ranking,
        distribuicoes: {
          tipos: distribuicaoTipos,
          contratos: distribuicaoContratos,
          valores: distribuicaoValores
        },
        vendasCategoria,
        performanceMensal,
        topCorretores,
        resumoExecutivo,
        carregadoEm: new Date().toISOString()
      };

      console.log('✅ AdminDashboardService: Todos os dados carregados com sucesso');
      return dashboardData;
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro ao carregar dados do dashboard:', error);
      return null;
    }
  }

  /**
   * 🔄 FORÇAR ATUALIZAÇÃO DOS DADOS
   */
  static async forceRefresh(): Promise<boolean> {
    try {
      console.log('🔄 AdminDashboardService: Forçando atualização dos dados...');
      
      // Limpar qualquer cache se houver
      // As views são sempre atualizadas automaticamente pelo PostgreSQL
      
      console.log('✅ AdminDashboardService: Dados atualizados');
      return true;
    } catch (error) {
      console.error('❌ AdminDashboardService: Erro ao atualizar dados:', error);
      return false;
    }
  }
}
