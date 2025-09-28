/**
 * 🔥 SERVIÇO GLOBAL UTILITÁRIO
 * Consolida TODOS os serviços utilitários e auxiliares em um único ponto
 * Substitui: cnpjService, adminChartsService, brokerEfficiencyService
 */

import { supabase } from '../lib/supabase';

export interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
  data_situacao: string;
  porte: string;
  natureza_juridica: string;
  capital_social: string;
}

export interface BrokerEfficiencyData {
  broker_id: string;
  broker_name: string;
  broker_email: string;
  broker_cpd: string;
  total_policies: number;
  total_revenue: number;
  active_campaigns: number;
  completed_campaigns: number;
  efficiency_score: number;
  performance_rank: number;
  monthly_performance: {
    month: string;
    policies: number;
    revenue: number;
    campaigns_completed: number;
  }[];
}

export interface AdminChartsData {
  monthly_sales: {
    month: string;
    auto: number;
    residencial: number;
    total: number;
  }[];
  broker_performance: {
    name: string;
    policies: number;
    revenue: number;
    campaigns: number;
    efficiency: number;
  }[];
  policy_distribution: {
    type: string;
    count: number;
    percentage: number;
    revenue: number;
  }[];
  campaign_status: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

export interface SystemStats {
  total_users: number;
  total_campaigns: number;
  total_policies: number;
  total_revenue: number;
  active_campaigns: number;
  completed_campaigns: number;
  average_premium: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
}

export class GlobalUtilityService {
  
  /**
   * 🔥 VALIDAÇÃO DE CNPJ: Validar e buscar dados de CNPJ
   */
  static async validateCNPJ(cnpj: string): Promise<CNPJData | null> {
    try {
      console.log(`🔍 GlobalUtilityService - Validando CNPJ: ${cnpj}`);

      const cleanedCnpj = cnpj.replace(/[^\d]/g, '');
      if (cleanedCnpj.length !== 14) {
        throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
      }

      // Validar dígitos verificadores
      if (!this.validateCNPJDigits(cleanedCnpj)) {
        throw new Error('CNPJ inválido. Dígitos verificadores incorretos.');
      }

      // Buscar dados na API
      const response = await fetch(`https://open.cnpja.com/office/${cleanedCnpj}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CNPJ não encontrado na base de dados');
        }
        throw new Error('Erro ao consultar CNPJ. Tente novamente.');
      }

      const data = await response.json();
      
      const cnpjData: CNPJData = {
        cnpj: data.taxId || cleanedCnpj,
        razao_social: data.company?.name || '',
        nome_fantasia: data.alias || '',
        logradouro: data.address?.street || '',
        numero: data.address?.number || '',
        bairro: data.address?.district || '',
        municipio: data.address?.city || '',
        uf: data.address?.state || '',
        cep: data.address?.zipCode || '',
        telefone: data.phone || '',
        email: data.email || '',
        situacao: data.status || '',
        data_situacao: data.statusDate || '',
        porte: data.size || '',
        natureza_juridica: data.legalNature || '',
        capital_social: data.capital || ''
      };

      console.log(`✅ GlobalUtilityService - CNPJ validado: ${cnpjData.razao_social}`);
      return cnpjData;

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao validar CNPJ:`, error);
      return null;
    }
  }

  /**
   * 🔥 VALIDAR DÍGITOS DO CNPJ: Algoritmo de validação
   */
  private static validateCNPJDigits(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Calcular primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    // Calcular segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(cnpj[12]) === firstDigit && parseInt(cnpj[13]) === secondDigit;
  }

  /**
   * 🔥 EFICIÊNCIA DE CORRETORES: Calcular performance dos corretores
   */
  static async calculateBrokerEfficiency(): Promise<BrokerEfficiencyData[]> {
    try {
      console.log(`📊 GlobalUtilityService - Calculando eficiência dos corretores`);

      // Buscar dados dos corretores
      const { data: brokers, error: brokersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          cpd_number
        `)
        .eq('role', 'broker')
        .eq('is_active', true);

      if (brokersError) {
        throw new Error(`Erro ao buscar corretores: ${brokersError.message}`);
      }

      // Buscar políticas separadamente
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          id,
          premium_value,
          type,
          created_at,
          user_id
        `);

      if (policiesError) {
        throw new Error(`Erro ao buscar políticas: ${policiesError.message}`);
      }

      // Buscar campanhas separadamente
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select(`
          id,
          title,
          status,
          current_value,
          target,
          user_id
        `)
        .eq('record_type', 'campaign');

      if (goalsError) {
        throw new Error(`Erro ao buscar campanhas: ${goalsError.message}`);
      }

      // Combinar dados
      const brokersWithData = (brokers || []).map(broker => ({
        ...broker,
        policies: (policies || []).filter(p => p.user_id === broker.id),
        goals: (goals || []).filter(g => g.user_id === broker.id)
      }));

      const efficiencyData: BrokerEfficiencyData[] = [];

      // Calcular eficiência para cada corretor
      for (const broker of brokersWithData || []) {
        const policies = broker.policies || [];
        const campaigns = broker.goals || [];
        
        const totalRevenue = policies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
        const totalPolicies = policies.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
        
        // Calcular score de eficiência
        const efficiencyScore = this.calculateEfficiencyScore(
          totalRevenue,
          totalPolicies,
          activeCampaigns,
          completedCampaigns
        );

        // Calcular performance mensal
        const monthlyPerformance = this.calculateMonthlyPerformance(policies, campaigns);

        efficiencyData.push({
          broker_id: broker.id,
          broker_name: broker.name,
          broker_email: broker.email,
          broker_cpd: broker.cpd_number,
          total_policies: totalPolicies,
          total_revenue: totalRevenue,
          active_campaigns: activeCampaigns,
          completed_campaigns: completedCampaigns,
          efficiency_score: efficiencyScore,
          performance_rank: 0, // Será calculado depois
          monthly_performance: monthlyPerformance
        });
      }

      // Ordenar por eficiência e calcular ranking
      efficiencyData.sort((a, b) => b.efficiency_score - a.efficiency_score);
      efficiencyData.forEach((broker, index) => {
        broker.performance_rank = index + 1;
      });

      console.log(`✅ GlobalUtilityService - Eficiência calculada para ${efficiencyData.length} corretores`);
      return efficiencyData;

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao calcular eficiência:`, error);
      return [];
    }
  }

  /**
   * 🔥 DADOS DE GRÁFICOS ADMIN: Para dashboards administrativos
   */
  static async getAdminChartsData(): Promise<AdminChartsData> {
    try {
      console.log(`📊 GlobalUtilityService - Gerando dados para gráficos administrativos`);

      // Buscar dados de vendas mensais
      const monthlySales = await this.getMonthlySalesData();
      
      // Buscar dados de performance dos corretores
      const brokerPerformance = await this.getBrokerPerformanceData();
      
      // Buscar distribuição de apólices
      const policyDistribution = await this.getPolicyDistributionData();
      
      // Buscar status das campanhas
      const campaignStatus = await this.getCampaignStatusData();

      const chartsData: AdminChartsData = {
        monthly_sales: monthlySales,
        broker_performance: brokerPerformance,
        policy_distribution: policyDistribution,
        campaign_status: campaignStatus
      };

      console.log(`✅ GlobalUtilityService - Dados de gráficos gerados com sucesso`);
      return chartsData;

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao gerar dados de gráficos:`, error);
      return {
        monthly_sales: [],
        broker_performance: [],
        policy_distribution: [],
        campaign_status: []
      };
    }
  }

  /**
   * 🔥 ESTATÍSTICAS DO SISTEMA: Visão geral do sistema
   */
  static async getSystemStats(): Promise<SystemStats> {
    try {
      console.log(`📊 GlobalUtilityService - Calculando estatísticas do sistema`);

      // Buscar contagens básicas
      const [usersResult, campaignsResult, policiesResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('goals').select('id', { count: 'exact' }).eq('record_type', 'campaign'),
        supabase.from('policies').select('id, premium_value', { count: 'exact' })
      ]);

      if (usersResult.error) throw usersResult.error;
      if (campaignsResult.error) throw campaignsResult.error;
      if (policiesResult.error) throw policiesResult.error;

      const totalUsers = usersResult.count || 0;
      const totalCampaigns = campaignsResult.count || 0;
      const totalPolicies = policiesResult.count || 0;
      
      // Calcular receita total
      const totalRevenue = (policiesResult.data || [])
        .reduce((sum, policy) => sum + (policy.premium_value || 0), 0);
      
      // Buscar campanhas ativas e concluídas
      const { data: activeCampaigns } = await supabase
        .from('goals')
        .select('id', { count: 'exact' })
        .eq('record_type', 'campaign')
        .eq('status', 'active');
      
      const { data: completedCampaigns } = await supabase
        .from('goals')
        .select('id', { count: 'exact' })
        .eq('record_type', 'campaign')
        .eq('status', 'completed');

      const activeCampaignsCount = activeCampaigns?.length || 0;
      const completedCampaignsCount = completedCampaigns?.length || 0;
      const averagePremium = totalPolicies > 0 ? totalRevenue / totalPolicies : 0;

      // Calcular saúde do sistema
      const systemHealth = this.calculateSystemHealth(
        totalUsers,
        totalCampaigns,
        totalPolicies,
        totalRevenue
      );

      const stats: SystemStats = {
        total_users: totalUsers,
        total_campaigns: totalCampaigns,
        total_policies: totalPolicies,
        total_revenue: totalRevenue,
        active_campaigns: activeCampaignsCount,
        completed_campaigns: completedCampaignsCount,
        average_premium: averagePremium,
        system_health: systemHealth
      };

      console.log(`✅ GlobalUtilityService - Estatísticas calculadas: ${totalUsers} usuários, ${totalCampaigns} campanhas`);
      return stats;

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao calcular estatísticas:`, error);
      return {
        total_users: 0,
        total_campaigns: 0,
        total_policies: 0,
        total_revenue: 0,
        active_campaigns: 0,
        completed_campaigns: 0,
        average_premium: 0,
        system_health: 'critical'
      };
    }
  }

  /**
   * 🔥 DADOS DE VENDAS MENSАIS: Para gráficos
   */
  private static async getMonthlySalesData(): Promise<AdminChartsData['monthly_sales']> {
    try {
      const { data: policies, error } = await supabase
        .from('policies')
        .select('premium_value, type, created_at')
        .gte('created_at', new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Agrupar por mês e tipo
      const monthlyData: { [key: string]: { auto: number; residencial: number; total: number } } = {};

      (policies || []).forEach(policy => {
        const date = new Date(policy.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { auto: 0, residencial: 0, total: 0 };
        }

        const value = policy.premium_value || 0;
        monthlyData[monthKey].total += value;
        
        if (policy.type === 'Seguro Auto') {
          monthlyData[monthKey].auto += value;
        } else if (policy.type === 'Seguro Residencial') {
          monthlyData[monthKey].residencial += value;
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        auto: data.auto,
        residencial: data.residencial,
        total: data.total
      }));

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao buscar vendas mensais:`, error);
      return [];
    }
  }

  /**
   * 🔥 DADOS DE PERFORMANCE DOS CORRETORES: Para gráficos
   */
  private static async getBrokerPerformanceData(): Promise<AdminChartsData['broker_performance']> {
    try {
      const efficiencyData = await this.calculateBrokerEfficiency();
      
      return efficiencyData.slice(0, 10).map(broker => ({
        name: broker.broker_name,
        policies: broker.total_policies,
        revenue: broker.total_revenue,
        campaigns: broker.active_campaigns + broker.completed_campaigns,
        efficiency: broker.efficiency_score
      }));

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao buscar performance dos corretores:`, error);
      return [];
    }
  }

  /**
   * 🔥 DISTRIBUIÇÃO DE APÓLICES: Para gráficos
   */
  private static async getPolicyDistributionData(): Promise<AdminChartsData['policy_distribution']> {
    try {
      const { data: policies, error } = await supabase
        .from('policies')
        .select('type, premium_value');

      if (error) throw error;

      const distribution: { [key: string]: { count: number; revenue: number } } = {};
      let totalCount = 0;

      (policies || []).forEach(policy => {
        const type = policy.type;
        const value = policy.premium_value || 0;
        
        if (!distribution[type]) {
          distribution[type] = { count: 0, revenue: 0 };
        }
        
        distribution[type].count++;
        distribution[type].revenue += value;
        totalCount++;
      });

      return Object.entries(distribution).map(([type, data]) => ({
        type,
        count: data.count,
        percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
        revenue: data.revenue
      }));

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao buscar distribuição de apólices:`, error);
      return [];
    }
  }

  /**
   * 🔥 STATUS DAS CAMPANHAS: Para gráficos
   */
  private static async getCampaignStatusData(): Promise<AdminChartsData['campaign_status']> {
    try {
      const { data: campaigns, error } = await supabase
        .from('goals')
        .select('status')
        .eq('record_type', 'campaign');

      if (error) throw error;

      const statusCount: { [key: string]: number } = {};
      let totalCount = 0;

      (campaigns || []).forEach(campaign => {
        const status = campaign.status;
        statusCount[status] = (statusCount[status] || 0) + 1;
        totalCount++;
      });

      return Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
      }));

    } catch (error) {
      console.error(`❌ GlobalUtilityService - Erro ao buscar status das campanhas:`, error);
      return [];
    }
  }

  /**
   * 🔥 CALCULAR SCORE DE EFICIÊNCIA: Algoritmo de eficiência
   */
  private static calculateEfficiencyScore(
    revenue: number,
    policies: number,
    activeCampaigns: number,
    completedCampaigns: number
  ): number {
    // Fórmula de eficiência baseada em múltiplos fatores
    const revenueScore = Math.min(revenue / 10000, 50); // Máximo 50 pontos por receita
    const policyScore = Math.min(policies * 2, 30); // Máximo 30 pontos por apólices
    const campaignScore = Math.min(completedCampaigns * 10, 20); // Máximo 20 pontos por campanhas
    
    return Math.min(revenueScore + policyScore + campaignScore, 100);
  }

  /**
   * 🔥 PERFORMANCE MENSAL: Calcular performance mensal
   */
  private static calculateMonthlyPerformance(policies: any[], campaigns: any[]): any[] {
    const monthlyData: { [key: string]: { policies: number; revenue: number; campaigns_completed: number } } = {};

    // Processar apólices
    policies.forEach(policy => {
      const date = new Date(policy.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { policies: 0, revenue: 0, campaigns_completed: 0 };
      }
      
      monthlyData[monthKey].policies++;
      monthlyData[monthKey].revenue += policy.premium_value || 0;
    });

    // Processar campanhas
    campaigns.forEach(campaign => {
      if (campaign.status === 'completed') {
        const date = new Date(campaign.achieved_at || campaign.updated_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { policies: 0, revenue: 0, campaigns_completed: 0 };
        }
        
        monthlyData[monthKey].campaigns_completed++;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      policies: data.policies,
      revenue: data.revenue,
      campaigns_completed: data.campaigns_completed
    }));
  }

  /**
   * 🔥 SAÚDE DO SISTEMA: Calcular saúde geral
   */
  private static calculateSystemHealth(
    users: number,
    campaigns: number,
    policies: number,
    revenue: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    // Critérios de saúde do sistema
    if (users >= 10 && campaigns >= 5 && policies >= 20 && revenue >= 50000) {
      return 'excellent';
    } else if (users >= 5 && campaigns >= 3 && policies >= 10 && revenue >= 25000) {
      return 'good';
    } else if (users >= 2 && campaigns >= 1 && policies >= 5 && revenue >= 10000) {
      return 'warning';
    } else {
      return 'critical';
    }
  }
}
