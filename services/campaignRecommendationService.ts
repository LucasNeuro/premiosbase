import { PolicyType, ContractType, Goal } from '../types';
import { mistralAI } from './mistralAI';

interface CampaignContext {
  policyType: PolicyType;
  contractType: ContractType;
  premiumValue: number;
  availableCampaigns: Goal[];
  userProfile?: {
    recentPolicies?: number;
    averagePremium?: number;
    preferredTypes?: PolicyType[];
  };
}

interface CampaignRecommendation {
  campaignId: string;
  score: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export class CampaignRecommendationService {
  
  /**
   * Analisa e recomenda campanhas usando Mistral AI
   */
  static async getRecommendedCampaigns(context: CampaignContext): Promise<Goal[]> {
    try {
      // Se não há campanhas disponíveis, retorna array vazio
      if (!context.availableCampaigns || context.availableCampaigns.length === 0) {
        return [];
      }

      // Se há apenas 1 ou 2 campanhas, não precisa da IA
      if (context.availableCampaigns.length <= 2) {
        return this.fallbackRecommendation(context);
      }

      // Preparar dados para o Mistral AI
      const campaignData = context.availableCampaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        target: campaign.target,
        current_progress: campaign.progress_percentage || 0,
        end_date: campaign.end_date,
        criteria: campaign.criteria,
        prize_name: campaign.campanhas_premios?.[0]?.premio?.nome,
        prize_value: campaign.campanhas_premios?.[0]?.premio?.valor_estimado
      }));

      const prompt = this.buildRecommendationPrompt(context, campaignData);
      
      // Chamar Mistral AI
      const aiResponse = await mistralAI.chat({
        model: 'mistral-small',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em seguros e campanhas de incentivo. Analise as campanhas disponíveis e recomende as mais relevantes para o corretor baseado no contexto da apólice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = aiResponse.choices[0]?.message?.content;
      
      if (!response) {
        return this.fallbackRecommendation(context);
      }

      // Processar resposta da IA
      const recommendations = this.parseAIResponse(response, context.availableCampaigns);
      
      // Retornar campanhas ordenadas por relevância
      return recommendations;

    } catch (error) {
      return this.fallbackRecommendation(context);
    }
  }

  /**
   * Constrói o prompt para o Mistral AI
   */
  private static buildRecommendationPrompt(context: CampaignContext, campaigns: any[]): string {
    const policyTypeMap = {
      [PolicyType.AUTO]: 'Seguro de Automóvel',
      [PolicyType.RESIDENCIAL]: 'Seguro Residencial'
    };

    const contractTypeMap = {
      [ContractType.NOVO]: 'Contrato Novo',
      [ContractType.RENOVACAO]: 'Renovação'
    };

    return `
CONTEXTO DA APÓLICE:
- Tipo de Seguro: ${policyTypeMap[context.policyType]}
- Tipo de Contrato: ${contractTypeMap[context.contractType]}
- Valor do Prêmio: R$ ${context.premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

CAMPANHAS DISPONÍVEIS:
${campaigns.map((campaign, index) => `
${index + 1}. ${campaign.title}
   - ID: ${campaign.id}
   - Meta: R$ ${campaign.target?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 'N/A'}
   - Progresso atual: ${campaign.current_progress.toFixed(1)}%
   - Prazo final: ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}
   - Prêmio: ${campaign.prize_name} (${campaign.prize_value ? `R$ ${campaign.prize_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'})
   - Critérios: ${JSON.stringify(campaign.criteria || {})}
`).join('')}

TAREFA:
Analise as campanhas e recomende NO MÁXIMO 2 campanhas mais relevantes para esta apólice.

Considere:
1. Compatibilidade com tipo de seguro e contrato
2. Proximidade do prazo final (mais urgente = mais prioritário)
3. Progresso atual (campanhas com mais chance de completar)
4. Valor do prêmio oferecido
5. Adequação aos critérios específicos

RESPOSTA OBRIGATÓRIA em formato JSON:
{
  "recommended_campaigns": [
    {
      "campaign_id": "ID_DA_CAMPANHA",
      "priority": "high|medium|low",
      "reasoning": "Breve explicação do motivo da recomendação"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
    `.trim();
  }

  /**
   * Processa a resposta do Mistral AI
   */
  private static parseAIResponse(response: string, availableCampaigns: Goal[]): Goal[] {
    try {
      // Extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Formato de resposta inválido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendations = parsed.recommended_campaigns || [];

      // Mapear IDs para campanhas reais
      const recommendedCampaigns: Goal[] = [];
      
      for (const rec of recommendations) {
        const campaign = availableCampaigns.find(c => c.id === rec.campaign_id);
        if (campaign) {
          // Adicionar dados de recomendação à campanha
          (campaign as any)._aiRecommendation = {
            priority: rec.priority,
            reasoning: rec.reasoning
          };
          recommendedCampaigns.push(campaign);
        }
      }

      return recommendedCampaigns;

    } catch (error) {
      return this.fallbackRecommendation({ availableCampaigns } as CampaignContext);
    }
  }

  /**
   * Recomendação de fallback (lógica simples)
   */
  private static fallbackRecommendation(context: CampaignContext): Goal[] {
    const { availableCampaigns } = context;
    
    if (!availableCampaigns || availableCampaigns.length === 0) {
      return [];
    }

    // Ordenar por proximidade do fim e progresso
    const scored = availableCampaigns.map(campaign => {
      const now = new Date();
      const endDate = new Date(campaign.end_date);
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const progressPercentage = campaign.progress_percentage || 0;
      
      // Score: quanto menor, mais prioritário
      let score = 0;
      score += daysUntilEnd * 0.1; // Urgência
      score += (100 - progressPercentage) * 0.5; // Progresso
      
      return { campaign, score };
    });

    // Ordenar por score e retornar no máximo 2
    return scored
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map(item => item.campaign);
  }

  /**
   * Obtém insights sobre por que uma campanha foi recomendada
   */
  static getCampaignInsight(campaign: Goal): string {
    const aiRec = (campaign as any)._aiRecommendation;
    
    if (aiRec?.reasoning) {
      return aiRec.reasoning;
    }

    // Fallback insight
    const progress = campaign.progress_percentage || 0;
    const daysLeft = Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    let insight = '';
    
    if (progress > 80) {
      insight = 'Campanha quase concluída - boa chance de atingir a meta!';
    } else if (daysLeft < 7) {
      insight = 'Prazo urgente - últimos dias para participar!';
    } else if (progress < 30) {
      insight = 'Ótima oportunidade para começar forte nesta campanha!';
    } else {
      insight = 'Campanha em andamento com boas perspectivas.';
    }

    return insight;
  }
}
