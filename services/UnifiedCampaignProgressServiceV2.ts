import { supabase } from '../lib/supabase';

/**
 * 🔥 SERVIÇO UNIFICADO DE PROGRESSO DE CAMPANHAS V2
 * 
 * Este serviço resolve todos os problemas identificados:
 * - Unifica cálculos de progresso
 * - Corrige lógica de campanhas compostas
 * - Padroniza estrutura de dados
 * - Implementa validações consistentes
 * - Adiciona cache e performance
 */

export interface CampaignProgressResult {
  campaignId: string;
  currentValue: number;
  progressPercentage: number;
  totalPolicies: number;
  linkedPolicies: number;
  isCompleted: boolean;
  criteriaProgress?: CriterionProgress[];
  lastCalculated: string;
  dataIntegrityScore: number; // 0-100, onde 100 = dados perfeitamente consistentes
}

export interface CriterionProgress {
  criterionId: string;
  criterionName: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  isCompleted: boolean;
  matchingPolicies: number;
}

export interface CampaignData {
  id: string;
  title: string;
  type: string;
  target: number;
  criteria: any[];
  campaign_type: string;
  target_type: string;
  acceptance_status: string;
  accepted_at: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface PolicyData {
  id: string;
  policy_number: string;
  premium_value: number;
  type: string;
  contract_type: string;
  registration_date: string;
  created_at: string;
}

export class UnifiedCampaignProgressServiceV2 {
  private static cache = new Map<string, { data: CampaignProgressResult; timestamp: number }>();
  private static readonly CACHE_DURATION = 30 * 1000; // 30 segundos
  private static isUpdatingDatabase = false; // Proteção contra loops infinitos

  /**
   * 🎯 MÉTODO PRINCIPAL: Calcula progresso de campanha de forma unificada
   */
  static async calculateCampaignProgress(campaignId: string, forceRefresh = true): Promise<CampaignProgressResult | null> {
    try {
      console.log(`🔄 UnifiedCampaignProgressServiceV2 - Calculando progresso: ${campaignId}`);

      // Verificar cache primeiro
      if (!forceRefresh && this.cache.has(campaignId)) {
        const cached = this.cache.get(campaignId)!;
        if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
          console.log(`📦 Cache hit para campanha: ${campaignId}`);
          return cached.data;
        }
      }

      // 1. Buscar dados da campanha
      console.log(`🔍 Buscando dados da campanha: ${campaignId}`);
      const campaign = await this.getCampaignData(campaignId);
      if (!campaign) {
        console.error(`❌ Campanha não encontrada: ${campaignId}`);
        return null;
      }
      console.log(`✅ Dados da campanha encontrados: ${campaign.title}`);

      // 2. Buscar apólices vinculadas (usando estrutura unificada)
      const linkedPolicies = await this.getLinkedPolicies(campaignId, campaign);
      console.log(`📊 Encontradas ${linkedPolicies.length} apólices vinculadas`);

      // 3. Validar integridade dos dados
      const dataIntegrityScore = await this.validateDataIntegrity(campaign, linkedPolicies);

      // 4. Calcular progresso baseado no tipo da campanha
      let result: CampaignProgressResult;

      if (campaign.campaign_type === 'composite' && campaign.criteria && campaign.criteria.length > 0) {
        result = await this.calculateCompositeProgress(campaign, linkedPolicies);
      } else {
        result = await this.calculateSimpleProgress(campaign, linkedPolicies);
      }

      // 5. Adicionar metadados
      result.dataIntegrityScore = dataIntegrityScore;
      result.lastCalculated = new Date().toISOString();

      // 6. Atualizar cache
      this.cache.set(campaignId, { data: result, timestamp: Date.now() });

      // 7. 🔄 ATUALIZAR BANCO DE DADOS automaticamente (COM PROTEÇÃO)
      if (result.progressPercentage !== undefined && !this.isUpdatingDatabase) {
        this.isUpdatingDatabase = true;
        try {
          await this.updateCampaignProgressInDatabase(campaignId);
        } catch (error) {
          console.error(`⚠️ Erro ao atualizar banco de dados para campanha ${campaignId}:`, error);
        } finally {
          this.isUpdatingDatabase = false;
        }
      }

      console.log(`✅ Progresso calculado: ${result.progressPercentage.toFixed(2)}% (Integridade: ${dataIntegrityScore}%)`);
      return result;

    } catch (error) {
      console.error(`❌ Erro ao calcular progresso da campanha ${campaignId}:`, error);
      return null;
    }
  }

  /**
   * 📊 Busca dados da campanha
   */
  private static async getCampaignData(campaignId: string): Promise<CampaignData | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', campaignId)
      .eq('record_type', 'campaign')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Parsear critérios se necessário
    let criteria = [];
    if (data.criteria) {
      if (typeof data.criteria === 'string') {
        try {
          criteria = JSON.parse(data.criteria);
        } catch (e) {
          criteria = [];
        }
      } else if (Array.isArray(data.criteria)) {
        criteria = data.criteria;
      }
    }

    return {
      ...data,
      criteria
    };
  }

  /**
   * 🔗 Busca apólices vinculadas usando estrutura unificada
   */
  private static async getLinkedPolicies(campaignId: string, campaign: CampaignData): Promise<PolicyData[]> {
    const { data: links, error } = await supabase
      .from('policy_campaign_links')
      .select(`
        *,
        policy:policies(
          id,
          policy_number,
          premium_value,
          type,
          contract_type,
          registration_date,
          created_at
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Erro ao buscar apólices vinculadas:', error);
      return [];
    }

    // Filtrar apenas apólices válidas
    const validPolicies = (links || [])
      .map(link => link.policy)
      .filter(policy => policy !== null)
      .filter(policy => this.isPolicyValidForCampaign(policy, campaign));

    return validPolicies;
  }

  /**
   * ✅ Valida se apólice é válida para a campanha (timing e critérios)
   */
  private static isPolicyValidForCampaign(policy: PolicyData, campaign: CampaignData): boolean {
    // 1. Verificar timing - apólice deve ser criada após aceitar a campanha
    if (campaign.acceptance_status === 'accepted' && campaign.accepted_at) {
      const acceptedAt = new Date(campaign.accepted_at);
      const policyCreatedAt = new Date(policy.created_at);
      
      if (policyCreatedAt < acceptedAt) {
        console.log(`⏰ Apólice ${policy.id} rejeitada por timing: criada antes da aceitação da campanha`);
        return false;
      }
    }

    // 2. Verificar se campanha ainda está ativa
    if (campaign.status !== 'active' && campaign.status !== 'completed') {
      return false;
    }

    return true;
  }

  /**
   * 📈 Calcula progresso para campanhas simples
   */
  private static calculateSimpleProgress(campaign: CampaignData, policies: PolicyData[]): CampaignProgressResult {
    let currentValue = 0;
    let progressPercentage = 0;

    if (campaign.type === 'valor') {
      currentValue = policies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0);
      progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
    } else if (campaign.type === 'apolices') {
      currentValue = policies.length;
      progressPercentage = campaign.target > 0 ? (currentValue / campaign.target) * 100 : 0;
    }

    const isCompleted = progressPercentage >= 100;

    return {
      campaignId: campaign.id,
      currentValue,
      progressPercentage: Math.min(progressPercentage, 100), // Máximo 100%
      totalPolicies: policies.length,
      linkedPolicies: policies.length,
      isCompleted,
      lastCalculated: new Date().toISOString(),
      dataIntegrityScore: 100 // Será calculado depois
    };
  }

  /**
   * 🎯 Calcula progresso para campanhas compostas (CORRIGIDO)
   */
  private static calculateCompositeProgress(campaign: CampaignData, policies: PolicyData[]): CampaignProgressResult {
    const criteriaProgress: CriterionProgress[] = [];
    let totalProgress = 0;
    let completedCriteria = 0;

    console.log(`🔍 Calculando progresso composto para ${campaign.criteria.length} critérios`);

    // Calcular progresso para cada critério
    for (let i = 0; i < campaign.criteria.length; i++) {
      const criterion = campaign.criteria[i];
      const criterionResult = this.calculateCriterionProgress(criterion, policies, i);
      criteriaProgress.push(criterionResult);

      totalProgress += criterionResult.progress;
      if (criterionResult.isCompleted) {
        completedCriteria++;
      }

      console.log(`📊 Critério ${i + 1}: ${criterionResult.progress.toFixed(2)}% (${criterionResult.matchingPolicies} apólices)`);
    }

    // 🔧 LÓGICA CORRIGIDA: Progresso geral baseado na estratégia da campanha
    let overallProgress = 0;
    let isCompleted = false;

    // Estratégia: AND (todos os critérios devem ser 100%) OU média ponderada
    if (campaign.criteria.length > 0) {
      // Verificar se TODOS os critérios estão 100%
      const allCriteriaCompleted = completedCriteria === campaign.criteria.length;
      
      if (allCriteriaCompleted) {
        overallProgress = 100;
        isCompleted = true;
      } else {
        // 🔧 CORREÇÃO: Calcular média ponderada dos critérios com pesos iguais
        // Para campanhas compostas, cada critério tem o mesmo peso
        let weightedSum = 0;
        
        for (let i = 0; i < campaign.criteria.length; i++) {
          const criterion = campaign.criteria[i];
          const criterionProgress = criteriaProgress[i];
          
          // Peso igual para cada critério (1/n)
          const weight = 1 / campaign.criteria.length;
          weightedSum += criterionProgress.progress * weight;
          
          console.log(`📊 Critério ${i + 1} (${criterion.policy_type}): ${criterionProgress.progress.toFixed(2)}% (peso: ${(weight * 100).toFixed(1)}%)`);
        }
        
        overallProgress = Math.min(weightedSum, 100);
        isCompleted = false;
        
        console.log(`🎯 Progresso geral calculado: ${overallProgress.toFixed(2)}% (média ponderada)`);
      }
    }

    const totalValue = policies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0);

    console.log(`🎯 Progresso geral composto: ${overallProgress.toFixed(2)}% (Completados: ${completedCriteria}/${campaign.criteria.length})`);

    return {
      campaignId: campaign.id,
      currentValue: totalValue,
      progressPercentage: overallProgress,
      totalPolicies: policies.length,
      linkedPolicies: policies.length,
      isCompleted,
      criteriaProgress,
      lastCalculated: new Date().toISOString(),
      dataIntegrityScore: 100 // Será calculado depois
    };
  }

  /**
   * 🎯 Calcula progresso de um critério específico
   */
  private static calculateCriterionProgress(criterion: any, policies: PolicyData[], index: number): CriterionProgress {
    console.log(`🔍 Calculando progresso do Critério ${index + 1}:`, {
      policy_type: criterion.policy_type,
      target_type: criterion.target_type,
      target_value: criterion.target_value,
      contract_type: criterion.contract_type,
      min_value_per_policy: criterion.min_value_per_policy
    });
    
    console.log(`📊 Total de apólices disponíveis: ${policies.length}`);
    policies.forEach((policy, i) => {
      console.log(`  Apólice ${i + 1}: ${policy.policy_number} - ${policy.type} - R$ ${policy.premium_value} - ${policy.contract_type}`);
    });

    // Filtrar apólices que atendem este critério
    const matchingPolicies = policies.filter(policy => {
      // Verificar tipo de apólice
      if (criterion.policy_type) {
        // 🔧 CORREÇÃO: Mapear tipos completos para tipos simples
        const typeMapping: { [key: string]: string } = {
          'Seguro Auto': 'auto',
          'Seguro Residencial': 'residencial',
          'auto': 'auto',
          'residencial': 'residencial'
        };
        
        const policyTypeSimple = typeMapping[policy.type] || policy.type;
        const criterionTypeSimple = typeMapping[criterion.policy_type] || criterion.policy_type;
        
        if (policyTypeSimple !== criterionTypeSimple) {
          console.log(`❌ Tipo não confere: policy.type="${policy.type}" (${policyTypeSimple}) vs criterion.policy_type="${criterion.policy_type}" (${criterionTypeSimple})`);
          return false;
        }
        console.log(`✅ Tipo confere: "${policy.type}" (${policyTypeSimple}) = "${criterion.policy_type}" (${criterionTypeSimple})`);
      }

      // Verificar tipo de contrato
      if (criterion.contract_type && criterion.contract_type !== 'ambos') {
        console.log(`🔍 Verificando contrato: policy.contract_type=${policy.contract_type}, criterion.contract_type=${criterion.contract_type}`);
        if (criterion.contract_type === 'novo' && policy.contract_type !== 'Novo') {
          console.log(`❌ Contrato não confere: esperado 'Novo', encontrado '${policy.contract_type}'`);
          return false;
        }
        if (criterion.contract_type === 'renovacao' && policy.contract_type !== 'Renovação Bradesco') {
          console.log(`❌ Contrato não confere: esperado 'Renovação Bradesco', encontrado '${policy.contract_type}'`);
          return false;
        }
        console.log(`✅ Contrato confere: ${policy.contract_type}`);
      }

      // Verificar valor mínimo
      if (criterion.min_value_per_policy && (policy.premium_value || 0) < criterion.min_value_per_policy) {
        console.log(`❌ Valor insuficiente: ${policy.premium_value} < ${criterion.min_value_per_policy}`);
        return false;
      }
      console.log(`✅ Valor suficiente: ${policy.premium_value} >= ${criterion.min_value_per_policy || 0}`);

      console.log(`✅ Apólice ${policy.policy_number} atende ao critério ${index + 1}`);
      return true;
    });

    // Calcular progresso do critério
    let currentValue = 0;
    let progress = 0;

    if (criterion.target_type === 'value') {
      // Critério baseado em VALOR: somar premium_value das apólices
      currentValue = matchingPolicies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0);
      progress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;
      console.log(`💰 Critério de VALOR: R$ ${currentValue} de R$ ${criterion.target_value} = ${progress.toFixed(2)}%`);
    } else {
      // Critério baseado em QUANTIDADE: contar número de apólices
      currentValue = matchingPolicies.length;
      progress = criterion.target_value > 0 ? (currentValue / criterion.target_value) * 100 : 0;
      console.log(`🔢 Critério de QUANTIDADE: ${currentValue} de ${criterion.target_value} = ${progress.toFixed(2)}%`);
    }

    console.log(`📊 Resultado do Critério ${index + 1}:`, {
      matchingPolicies: matchingPolicies.length,
      currentValue: currentValue,
      targetValue: criterion.target_value,
      progress: Math.min(progress, 100),
      isCompleted: progress >= 100
    });

    return {
      criterionId: `criterion_${index}`,
      criterionName: this.getCriterionName(criterion),
      targetValue: criterion.target_value || 0,
      currentValue,
      progress: Math.min(progress, 100),
      isCompleted: progress >= 100,
      matchingPolicies: matchingPolicies.length
    };
  }

  /**
   * 🏷️ Gera nome descritivo para critério
   */
  private static getCriterionName(criterion: any): string {
    const parts = [];
    
    if (criterion.policy_type) {
      parts.push(criterion.policy_type === 'auto' ? 'Auto' : 'Residencial');
    }
    
    if (criterion.contract_type && criterion.contract_type !== 'ambos') {
      parts.push(criterion.contract_type === 'novo' ? 'Novo' : 'Renovação');
    }
    
    if (criterion.min_value_per_policy) {
      parts.push(`Min R$ ${criterion.min_value_per_policy.toLocaleString()}`);
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Critério Geral';
  }

  /**
   * 🔍 Valida integridade dos dados
   */
  private static async validateDataIntegrity(campaign: CampaignData, policies: PolicyData[]): Promise<number> {
    let score = 100;
    const issues: string[] = [];

    // 1. Verificar se campanha tem dados essenciais
    if (!campaign.target || campaign.target <= 0) {
      score -= 20;
      issues.push('Meta da campanha inválida');
    }

    if (!campaign.start_date || !campaign.end_date) {
      score -= 15;
      issues.push('Datas da campanha incompletas');
    }

    // 2. Verificar consistência dos critérios (para campanhas compostas)
    if (campaign.campaign_type === 'composite') {
      if (!campaign.criteria || campaign.criteria.length === 0) {
        score -= 25;
        issues.push('Campanha composta sem critérios');
      } else {
        for (const criterion of campaign.criteria) {
          if (!criterion.target_value || criterion.target_value <= 0) {
            score -= 10;
            issues.push('Critério sem valor alvo válido');
          }
        }
      }
    }

    // 3. Verificar timing das apólices
    const invalidTimingPolicies = policies.filter(policy => {
      if (campaign.acceptance_status === 'accepted' && campaign.accepted_at) {
        const acceptedAt = new Date(campaign.accepted_at);
        const policyCreatedAt = new Date(policy.created_at);
        return policyCreatedAt < acceptedAt;
      }
      return false;
    });

    if (invalidTimingPolicies.length > 0) {
      score -= Math.min(20, invalidTimingPolicies.length * 2);
      issues.push(`${invalidTimingPolicies.length} apólices com timing inválido`);
    }

    // 4. Verificar se progresso atual faz sentido
    const currentProgress = await this.getCurrentProgressFromDB(campaign.id);
    if (currentProgress !== null) {
      const expectedProgress = campaign.type === 'valor' 
        ? policies.reduce((sum, p) => sum + p.premium_value, 0)
        : policies.length;
      
      const expectedPercentage = campaign.target > 0 ? (expectedProgress / campaign.target) * 100 : 0;
      const percentageDiff = Math.abs(currentProgress.progress_percentage - expectedPercentage);
      
      if (percentageDiff > 5) { // Mais de 5% de diferença
        score -= Math.min(15, percentageDiff);
        issues.push(`Progresso desatualizado (diferença: ${percentageDiff.toFixed(2)}%)`);
      }
    }

    if (issues.length > 0) {
      console.warn(`⚠️ Problemas de integridade detectados para campanha ${campaign.id}:`, issues);
    }

    return Math.max(0, score);
  }

  /**
   * 📊 Busca progresso atual do banco de dados
   */
  private static async getCurrentProgressFromDB(campaignId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('progress_percentage, current_value, status')
      .eq('id', campaignId)
      .single();

    return error ? null : data;
  }

  /**
   * 🔄 Atualiza progresso no banco de dados
   */
  static async updateCampaignProgressInDB(campaignId: string, progressResult: CampaignProgressResult): Promise<boolean> {
    try {
      const updateData = {
        current_value: progressResult.currentValue,
        progress_percentage: progressResult.progressPercentage,
        last_updated: new Date().toISOString(),
        status: progressResult.isCompleted ? 'completed' : 'active'
      };

      // Se completou, adicionar dados de conclusão
      if (progressResult.isCompleted) {
        updateData['achieved_at'] = new Date().toISOString();
        updateData['achieved_value'] = progressResult.currentValue;
      }

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', campaignId)
        .eq('record_type', 'campaign');

      if (error) {
        console.error('❌ Erro ao atualizar progresso no banco:', error);
        return false;
      }

      console.log(`✅ Progresso atualizado no banco: ${progressResult.progressPercentage.toFixed(2)}%`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao atualizar progresso:', error);
      return false;
    }
  }

  /**
   * 🧹 Limpa cache
   */
  static clearCache(campaignId?: string): void {
    if (campaignId) {
      this.cache.delete(campaignId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 📊 Recalcula progresso de todas as campanhas ativas
   */
  static async recalculateAllActiveCampaigns(): Promise<{ success: number; errors: number }> {
    try {
      console.log('🔄 Iniciando recálculo de todas as campanhas ativas...');

      const { data: campaigns, error } = await supabase
        .from('goals')
        .select('id')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .in('status', ['active', 'completed']);

      if (error) {
        throw error;
      }

      let success = 0;
      let errors = 0;

      for (const campaign of campaigns || []) {
        try {
          const progressResult = await this.calculateCampaignProgress(campaign.id, true); // Force refresh
          if (progressResult) {
            await this.updateCampaignProgressInDB(campaign.id, progressResult);
            success++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`❌ Erro ao recalcular campanha ${campaign.id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Re cálculo concluído: ${success} sucessos, ${errors} erros`);
      return { success, errors };

    } catch (error) {
      console.error('❌ Erro no recálculo geral:', error);
      return { success: 0, errors: 1 };
    }
  }

  /**
   * 🔄 ATUALIZA o progresso da campanha no banco de dados
   * Esta função é CRÍTICA para mover campanhas para "completed"
   */
  static async updateCampaignProgressInDatabase(campaignId: string): Promise<boolean> {
    try {
      console.log(`🔄 UnifiedCampaignProgressServiceV2 - Atualizando progresso no banco para campanha: ${campaignId}`);

      // 1. Buscar dados da campanha diretamente (SEM RECURSÃO)
      const { data: currentCampaign, error: fetchError } = await supabase
        .from('goals')
        .select('status, end_date, acceptance_status, accepted_at, progress_percentage, current_value')
        .eq('id', campaignId)
        .eq('record_type', 'campaign')
        .single();

      if (fetchError) {
        console.error('❌ UnifiedCampaignProgressServiceV2 - Erro ao buscar campanha:', fetchError);
        return false;
      }

      // 2. Usar dados já calculados (evitar recursão)
      const progressPercentage = currentCampaign.progress_percentage || 0;
      const currentValue = currentCampaign.current_value || 0;

      // 3. Preparar dados para atualização
      const updateData: any = {
        current_value: currentValue,
        progress_percentage: progressPercentage,
        last_updated: new Date().toISOString()
      };

      // 4. 🎯 LÓGICA DE MUDANÇA DE STATUS
      const wasCompleted = currentCampaign.status === 'completed';
      const isNowCompleted = progressPercentage >= 100; // Simplificado: se progresso >= 100%
      const isAccepted = currentCampaign.acceptance_status === 'accepted';

      // Só permitir completed se a campanha foi aceita
      if (!isAccepted) {
        console.log('⚠️ UnifiedCampaignProgressServiceV2 - Campanha não foi aceita, mantendo status atual');
      } else if (isNowCompleted && !wasCompleted) {
        // 🎉 Campanha acabou de ser completada!
        updateData.status = 'completed';
        updateData.achieved_at = new Date().toISOString();
        updateData.achieved_value = currentValue;
        console.log(`✅ UnifiedCampaignProgressServiceV2 - Campanha ${campaignId} marcada como COMPLETED (${progressPercentage.toFixed(2)}%)`);
      } else if (!isNowCompleted && wasCompleted) {
        // 🔄 Campanha perdeu o status de completada
        updateData.status = 'active';
        updateData.achieved_at = null;
        updateData.achieved_value = null;
        console.log(`🔄 UnifiedCampaignProgressServiceV2 - Campanha ${campaignId} voltou para ACTIVE (${progressPercentage.toFixed(2)}%)`);
      }

      // 5. Verificar expiração
      const now = new Date();
      const endDate = new Date(currentCampaign.end_date || '');
      const isExpired = endDate < now;
      
      if (isExpired && currentCampaign.status === 'active') {
        if (isNowCompleted) {
          // Expirou mas atingiu a meta = completed
          updateData.status = 'completed';
          updateData.achieved_at = new Date().toISOString();
          updateData.achieved_value = currentValue;
          console.log(`✅ UnifiedCampaignProgressServiceV2 - Campanha ${campaignId} expirou mas foi COMPLETED (${progressPercentage.toFixed(2)}%)`);
        } else {
          // Expirou e não atingiu a meta = cancelled
          updateData.status = 'cancelled';
          console.log(`❌ UnifiedCampaignProgressServiceV2 - Campanha ${campaignId} expirou sem atingir meta (${progressPercentage.toFixed(2)}%)`);
        }
      }

      // 6. Atualizar no banco
      const { error: updateError } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', campaignId)
        .eq('record_type', 'campaign');

      if (updateError) {
        console.error('❌ UnifiedCampaignProgressServiceV2 - Erro ao atualizar banco:', updateError);
        return false;
      }

      console.log(`✅ UnifiedCampaignProgressServiceV2 - Progresso atualizado no banco: ${progressPercentage.toFixed(2)}%`);
      return true;

    } catch (error) {
      console.error('❌ UnifiedCampaignProgressServiceV2 - Erro ao atualizar progresso:', error);
      return false;
    }
  }
}
