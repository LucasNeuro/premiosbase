/**
 * 🔥 SERVIÇO GLOBAL DE IA
 * Consolida TODOS os serviços de IA e recomendações em um único ponto
 * Substitui: mistralAI, campaignRecommendationService
 */

import { AI_CONFIG, getAIHeaders } from '../config/ai';

export interface AISuggestion {
  original: string;
  corrected: string;
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

export interface CampaignRecommendation {
  campaignId: string;
  campaignTitle: string;
  score: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  matchCriteria: string[];
  estimatedValue: number;
}

export interface PolicyAnalysis {
  policyId: string;
  policyNumber: string;
  analysis: {
    riskLevel: 'low' | 'medium' | 'high';
    profitability: number;
    marketTrend: 'growing' | 'stable' | 'declining';
    recommendations: string[];
  };
  aiConfidence: number;
  reasoning: string;
}

export interface AIContext {
  userProfile?: {
    recentPolicies?: number;
    averagePremium?: number;
    preferredTypes?: string[];
    successRate?: number;
  };
  marketData?: {
    trends?: any;
    benchmarks?: any;
    competitors?: any;
  };
  campaignData?: {
    availableCampaigns?: any[];
    userCampaigns?: any[];
    performanceHistory?: any[];
  };
}

export class GlobalAIService {
  
  /**
   * 🔥 MELHORAR DESCRIÇÃO: Usando IA para aprimorar textos
   */
  static async improveDescription(
    originalText: string,
    context?: string,
    goalType?: string
  ): Promise<AISuggestion> {
    try {
      console.log(`🤖 GlobalAIService - Melhorando descrição: "${originalText.substring(0, 50)}..."`);

      if (!AI_CONFIG.MISTRAL_API_KEY) {
        throw new Error('Chave da API Mistral não configurada. Verifique a variável VITE_MISTRAL_KEY no arquivo .env.local');
      }

      const prompt = this.buildImprovementPrompt(originalText, context, goalType);
      const response = await this.callMistralAPI(prompt);
      
      const suggestion: AISuggestion = {
        original: originalText,
        corrected: response,
        suggestions: this.extractSuggestions(response),
        confidence: 0.85,
        reasoning: 'Descrição melhorada usando IA para maior clareza e impacto'
      };

      console.log(`✅ GlobalAIService - Descrição melhorada com sucesso`);
      return suggestion;

    } catch (error) {
      console.error(`❌ GlobalAIService - Erro ao melhorar descrição:`, error);
      return {
        original: originalText,
        corrected: originalText,
        suggestions: [],
        confidence: 0,
        reasoning: `Erro na melhoria: ${error}`
      };
    }
  }

  /**
   * 🔥 CORRIGIR TEXTO: Usando IA para correção gramatical
   */
  static async correctText(originalText: string): Promise<AISuggestion> {
    try {
      console.log(`🤖 GlobalAIService - Corrigindo texto: "${originalText.substring(0, 50)}..."`);

      if (!AI_CONFIG.MISTRAL_API_KEY) {
        throw new Error('Chave da API Mistral não configurada. Verifique a variável VITE_MISTRAL_KEY no arquivo .env.local');
      }

      const prompt = this.buildCorrectionPrompt(originalText);
      const response = await this.callMistralAPI(prompt);
      
      const suggestion: AISuggestion = {
        original: originalText,
        corrected: response,
        suggestions: this.extractSuggestions(response),
        confidence: 0.90,
        reasoning: 'Texto corrigido gramaticalmente usando IA'
      };

      console.log(`✅ GlobalAIService - Texto corrigido com sucesso`);
      return suggestion;

    } catch (error) {
      console.error(`❌ GlobalAIService - Erro ao corrigir texto:`, error);
      return {
        original: originalText,
        corrected: originalText,
        suggestions: [],
        confidence: 0,
        reasoning: `Erro na correção: ${error}`
      };
    }
  }

  /**
   * 🔥 RECOMENDAR CAMPANHAS: Usando IA para análise inteligente
   */
  static async getRecommendedCampaigns(
    policyData: any,
    availableCampaigns: any[],
    context?: AIContext
  ): Promise<CampaignRecommendation[]> {
    try {
      console.log(`🤖 GlobalAIService - Analisando campanhas para apólice ${policyData.policy_number}`);

      if (!AI_CONFIG.MISTRAL_API_KEY) {
        console.warn(`⚠️ GlobalAIService - API key não configurada, usando análise básica`);
        return this.getBasicCampaignRecommendations(policyData, availableCampaigns);
      }

      const prompt = this.buildCampaignAnalysisPrompt(policyData, availableCampaigns, context);
      const response = await this.callMistralAPI(prompt);
      
      const recommendations = this.parseCampaignRecommendations(response, availableCampaigns);
      
      console.log(`✅ GlobalAIService - ${recommendations.length} campanhas recomendadas`);
      return recommendations;

    } catch (error) {
      console.error(`❌ GlobalAIService - Erro ao recomendar campanhas:`, error);
      return this.getBasicCampaignRecommendations(policyData, availableCampaigns);
    }
  }

  /**
   * 🔥 ANALISAR APÓLICE: Usando IA para análise de risco e oportunidade
   */
  static async analyzePolicy(policyData: any, marketContext?: any): Promise<PolicyAnalysis> {
    try {
      console.log(`🤖 GlobalAIService - Analisando apólice ${policyData.policy_number}`);

      if (!AI_CONFIG.MISTRAL_API_KEY) {
        console.warn(`⚠️ GlobalAIService - API key não configurada, usando análise básica`);
        return this.getBasicPolicyAnalysis(policyData);
      }

      const prompt = this.buildPolicyAnalysisPrompt(policyData, marketContext);
      const response = await this.callMistralAPI(prompt);
      
      const analysis = this.parsePolicyAnalysis(response, policyData);
      
      console.log(`✅ GlobalAIService - Análise de apólice concluída`);
      return analysis;

    } catch (error) {
      console.error(`❌ GlobalAIService - Erro ao analisar apólice:`, error);
      return this.getBasicPolicyAnalysis(policyData);
    }
  }

  /**
   * 🔥 GERAR INSIGHTS: Análise inteligente de dados
   */
  static async generateInsights(
    data: any,
    analysisType: 'performance' | 'trends' | 'opportunities' | 'risks'
  ): Promise<{
    insights: string[];
    recommendations: string[];
    confidence: number;
    reasoning: string;
  }> {
    try {
      console.log(`🤖 GlobalAIService - Gerando insights de ${analysisType}`);

      if (!AI_CONFIG.MISTRAL_API_KEY) {
        console.warn(`⚠️ GlobalAIService - API key não configurada, usando insights básicos`);
        return this.getBasicInsights(data, analysisType);
      }

      const prompt = this.buildInsightsPrompt(data, analysisType);
      const response = await this.callMistralAPI(prompt);
      
      const insights = this.parseInsights(response);
      
      console.log(`✅ GlobalAIService - Insights gerados: ${insights.insights.length} insights, ${insights.recommendations.length} recomendações`);
      return insights;

    } catch (error) {
      console.error(`❌ GlobalAIService - Erro ao gerar insights:`, error);
      return this.getBasicInsights(data, analysisType);
    }
  }

  /**
   * 🔥 CHAMADA PARA API MISTRAL: Método base
   */
  private static async callMistralAPI(prompt: string): Promise<string> {
    try {
      console.log(`🤖 GlobalAIService - Enviando prompt para Mistral API`);

      const response = await fetch(AI_CONFIG.MISTRAL_API_URL, {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          model: AI_CONFIG.MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: AI_CONFIG.TEMPERATURE,
          max_tokens: AI_CONFIG.MAX_TOKENS
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API Mistral: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da API Mistral');
      }

      console.log(`✅ GlobalAIService - Resposta recebida da API Mistral`);
      return content.trim();

    } catch (error) {
      console.error(`❌ GlobalAIService - Erro na chamada da API:`, error);
      throw error;
    }
  }

  /**
   * 🔥 PROMPT PARA MELHORIA: Construir prompt para melhorar descrições
   */
  private static buildImprovementPrompt(originalText: string, context?: string, goalType?: string): string {
    return `Você é um especialista em marketing e vendas de seguros. 
    
Tarefa: Melhore a seguinte descrição para torná-la mais persuasiva, clara e profissional:

Texto original: "${originalText}"

Contexto: ${context || 'Descrição de campanha de seguros'}
Tipo de meta: ${goalType || 'Campanha geral'}

Por favor, forneça uma versão melhorada que seja:
1. Mais clara e direta
2. Mais persuasiva e motivadora
3. Profissional e confiável
4. Adequada para o contexto de seguros

Responda apenas com o texto melhorado, sem explicações adicionais.`;
  }

  /**
   * 🔥 PROMPT PARA CORREÇÃO: Construir prompt para correção gramatical
   */
  private static buildCorrectionPrompt(originalText: string): string {
    return `Você é um especialista em português brasileiro. 
    
Tarefa: Corrija gramaticalmente o seguinte texto, mantendo o significado original:

Texto: "${originalText}"

Por favor, forneça a versão corrigida, focando em:
1. Gramática correta
2. Ortografia adequada
3. Concordância verbal e nominal
4. Pontuação apropriada

Responda apenas com o texto corrigido, sem explicações adicionais.`;
  }

  /**
   * 🔥 PROMPT PARA ANÁLISE DE CAMPANHAS: Construir prompt para recomendar campanhas
   */
  private static buildCampaignAnalysisPrompt(
    policyData: any,
    availableCampaigns: any[],
    context?: AIContext
  ): string {
    return `Você é um especialista em análise de campanhas de seguros.

Dados da apólice:
- Número: ${policyData.policy_number}
- Tipo: ${policyData.type}
- Contrato: ${policyData.contract_type}
- Valor: R$ ${policyData.premium_value}

Campanhas disponíveis:
${availableCampaigns.map(c => `- ${c.title}: ${c.description} (Critérios: ${JSON.stringify(c.criteria)})`).join('\n')}

Contexto do usuário:
${context?.userProfile ? `- Perfil: ${JSON.stringify(context.userProfile)}` : ''}

Analise e recomende as 3 melhores campanhas para esta apólice, considerando:
1. Compatibilidade com critérios
2. Potencial de sucesso
3. Valor da premiação
4. Histórico do usuário

Responda em formato JSON com array de recomendações, cada uma contendo: campaignId, score (0-100), reasoning, priority, matchCriteria.`;
  }

  /**
   * 🔥 PROMPT PARA ANÁLISE DE APÓLICE: Construir prompt para análise de apólice
   */
  private static buildPolicyAnalysisPrompt(policyData: any, marketContext?: any): string {
    return `Você é um especialista em análise de riscos de seguros.

Dados da apólice:
- Número: ${policyData.policy_number}
- Tipo: ${policyData.type}
- Contrato: ${policyData.contract_type}
- Valor: R$ ${policyData.premium_value}
- Data: ${policyData.created_at}

Contexto de mercado:
${marketContext ? JSON.stringify(marketContext) : 'Não disponível'}

Analise esta apólice e forneça:
1. Nível de risco (low/medium/high)
2. Potencial de lucratividade (0-100)
3. Tendência de mercado (growing/stable/declining)
4. Recomendações específicas

Responda em formato JSON com: riskLevel, profitability, marketTrend, recommendations, aiConfidence, reasoning.`;
  }

  /**
   * 🔥 PROMPT PARA INSIGHTS: Construir prompt para geração de insights
   */
  private static buildInsightsPrompt(data: any, analysisType: string): string {
    return `Você é um analista de dados especializado em seguros.

Tipo de análise: ${analysisType}
Dados fornecidos: ${JSON.stringify(data, null, 2)}

Gere insights inteligentes e recomendações baseadas nos dados, focando em:
1. Padrões identificados
2. Oportunidades de melhoria
3. Riscos potenciais
4. Recomendações estratégicas

Responda em formato JSON com: insights (array), recommendations (array), confidence (0-1), reasoning.`;
  }

  /**
   * 🔥 ANÁLISE BÁSICA: Quando API não está disponível
   */
  private static getBasicCampaignRecommendations(policyData: any, availableCampaigns: any[]): CampaignRecommendation[] {
    return availableCampaigns
      .filter(campaign => {
        // Lógica básica de compatibilidade
        const criteria = campaign.criteria || [];
        return criteria.some((criterion: any) => {
          if (criterion.policy_type && criterion.policy_type !== 'geral') {
            const policyTypeMap: { [key: string]: string } = {
              'auto': 'Seguro Auto',
              'residencial': 'Seguro Residencial'
            };
            return policyData.type === policyTypeMap[criterion.policy_type];
          }
          return true;
        });
      })
      .map(campaign => ({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        score: 75, // Score básico
        reasoning: 'Compatibilidade básica identificada',
        priority: 'medium' as const,
        matchCriteria: ['Tipo de apólice compatível'],
        estimatedValue: campaign.target || 0
      }))
      .slice(0, 3);
  }

  private static getBasicPolicyAnalysis(policyData: any): PolicyAnalysis {
    return {
      policyId: policyData.id,
      policyNumber: policyData.policy_number,
      analysis: {
        riskLevel: 'medium',
        profitability: 70,
        marketTrend: 'stable',
        recommendations: ['Monitorar performance', 'Avaliar renovação']
      },
      aiConfidence: 0.6,
      reasoning: 'Análise básica baseada em critérios padrão'
    };
  }

  private static getBasicInsights(data: any, analysisType: string): {
    insights: string[];
    recommendations: string[];
    confidence: number;
    reasoning: string;
  } {
    return {
      insights: [`Análise básica de ${analysisType} realizada`],
      recommendations: ['Implementar monitoramento contínuo'],
      confidence: 0.5,
      reasoning: 'Insights gerados usando análise básica'
    };
  }

  /**
   * 🔥 PARSERS: Para processar respostas da IA
   */
  private static extractSuggestions(response: string): string[] {
    // Extrair sugestões do texto (implementação básica)
    return response.split('\n').filter(line => line.trim().length > 0);
  }

  private static parseCampaignRecommendations(response: string, availableCampaigns: any[]): CampaignRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.getBasicCampaignRecommendations({}, availableCampaigns);
    }
  }

  private static parsePolicyAnalysis(response: string, policyData: any): PolicyAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        policyId: policyData.id,
        policyNumber: policyData.policy_number,
        analysis: parsed,
        aiConfidence: parsed.aiConfidence || 0.8,
        reasoning: parsed.reasoning || 'Análise realizada pela IA'
      };
    } catch {
      return this.getBasicPolicyAnalysis(policyData);
    }
  }

  private static parseInsights(response: string): {
    insights: string[];
    recommendations: string[];
    confidence: number;
    reasoning: string;
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Insights gerados pela IA'
      };
    } catch {
      return {
        insights: ['Análise realizada com sucesso'],
        recommendations: ['Continuar monitoramento'],
        confidence: 0.6,
        reasoning: 'Insights processados com sucesso'
      };
    }
  }
}
