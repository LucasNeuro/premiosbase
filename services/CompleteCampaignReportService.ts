import { supabase } from '../lib/supabase';

export interface CompleteCampaignData {
  // Dados da Campanha
  campaign_id: string;
  campaign_title: string;
  campaign_type: 'simple' | 'composite';
  campaign_status: string;
  campaign_acceptance_status: string;
  campaign_target: number;
  campaign_current_value: number;
  campaign_progress_percentage: number;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_created_at: string;
  campaign_created_by: string;
  campaign_accepted_at: string;
  campaign_accepted_by: string;
  campaign_description: string;
  campaign_criteria: any;
  
  // Dados do Corretor Criador
  creator_name: string;
  creator_email: string;
  creator_cpd: string;
  
  // Dados do Corretor que Aceitou
  acceptor_name: string;
  acceptor_email: string;
  acceptor_cpd: string;
  
  // Dados das Apólices (se houver)
  policies: Array<{
    policy_id: string;
    policy_number: string;
    policy_type: string;
    policy_premium_value: number;
    policy_registration_date: string;
    policy_contract_type: string;
    policy_cpd_number: string;
    policy_city: string;
    policy_status: string;
    policy_created_at: string;
    
    // Dados do Corretor da Apólice
    policy_broker_name: string;
    policy_broker_email: string;
    policy_broker_cpd: string;
    
    // Dados da Vinculação
    link_linked_at: string;
    link_linked_by: string;
    link_linked_automatically: boolean;
    link_ai_confidence: number;
    link_ai_reasoning: string;
  }>;
  
  // Resumo das Apólices
  total_policies: number;
  total_premium_value: number;
  average_premium_value: number;
  
  // Dados dos Prêmios (se houver)
  prizes: Array<{
    prize_id: string;
    prize_name: string;
    prize_value: number;
    prize_category: string;
    prize_type: string;
    prize_image_url: string;
    prize_quantity: number;
    prize_delivered: boolean;
    prize_delivered_at: string;
    prize_delivered_by: string;
  }>;
  
  // Resumo dos Prêmios
  total_prizes: number;
  total_prize_value: number;
}

export class CompleteCampaignReportService {
  /**
   * Gera relatório completo de todas as campanhas
   */
  static async generateCompleteReport(): Promise<CompleteCampaignData[]> {
    try {
      // 1. Buscar todas as campanhas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select(`
          *,
          creator:users!goals_created_by_fkey(name, email, cpd),
          acceptor:users!goals_nova_accepted_by_fkey(name, email, cpd)
        `)
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }
      // 2. Para cada campanha, buscar dados completos
      const completeData: CompleteCampaignData[] = [];

      for (const campaign of campaigns || []) {
        // Buscar apólices vinculadas
        const { data: policies, error: policiesError } = await supabase
          .from('policy_campaign_links')
          .select(`
            *,
            policy:policies(
              *,
              user:users(name, email, cpd)
            )
          `)
          .eq('campaign_id', campaign.id)
          .eq('is_active', true);

        if (policiesError) {
          continue;
        }

        // Buscar prêmios
        const { data: prizes, error: prizesError } = await supabase
          .from('campanhas_premios')
          .select(`
            *,
            premio:premios(
              *,
              categoria:categorias_premios(nome),
              tipo:tipos_premios(nome)
            )
          `)
          .eq('goal_id', campaign.id);

        if (prizesError) {
        }

        // Calcular resumos
        const totalPolicies = policies?.length || 0;
        const totalPremiumValue = policies?.reduce((sum, p) => sum + (p.policy?.premium_value || 0), 0) || 0;
        const averagePremiumValue = totalPolicies > 0 ? totalPremiumValue / totalPolicies : 0;
        
        const totalPrizes = prizes?.length || 0;
        const totalPrizeValue = prizes?.reduce((sum, p) => sum + (p.premio?.valor_estimado || 0) * p.quantidade, 0) || 0;

        // Montar dados completos
        const campaignData: CompleteCampaignData = {
          // Dados da Campanha
          campaign_id: campaign.id,
          campaign_title: campaign.title,
          campaign_type: campaign.campaign_type || 'simple',
          campaign_status: campaign.status || 'active',
          campaign_acceptance_status: campaign.acceptance_status || 'pending',
          campaign_target: campaign.target || 0,
          campaign_current_value: campaign.current_value || 0,
          campaign_progress_percentage: campaign.progress_percentage || 0,
          campaign_start_date: campaign.start_date || '',
          campaign_end_date: campaign.end_date || '',
          campaign_created_at: campaign.created_at || '',
          campaign_created_by: campaign.created_by || '',
          campaign_accepted_at: campaign.accepted_at || '',
          campaign_accepted_by: campaign.accepted_by || '',
          campaign_description: campaign.description || '',
          campaign_criteria: campaign.criteria || null,
          
          // Dados do Corretor Criador
          creator_name: campaign.creator?.name || '',
          creator_email: campaign.creator?.email || '',
          creator_cpd: campaign.creator?.cpd || '',
          
          // Dados do Corretor que Aceitou
          acceptor_name: campaign.acceptor?.name || '',
          acceptor_email: campaign.acceptor?.email || '',
          acceptor_cpd: campaign.acceptor?.cpd || '',
          
          // Dados das Apólices
          policies: policies?.map(p => ({
            policy_id: p.policy?.id || '',
            policy_number: p.policy?.policy_number || '',
            policy_type: p.policy?.type || '',
            policy_premium_value: p.policy?.premium_value || 0,
            policy_registration_date: p.policy?.registration_date || '',
            policy_contract_type: p.policy?.contract_type || '',
            policy_cpd_number: p.policy?.cpd_number || '',
            policy_city: p.policy?.city || '',
            policy_status: p.policy?.status || '',
            policy_created_at: p.policy?.created_at || '',
            
            // Dados do Corretor da Apólice
            policy_broker_name: p.policy?.user?.name || '',
            policy_broker_email: p.policy?.user?.email || '',
            policy_broker_cpd: p.policy?.user?.cpd || '',
            
            // Dados da Vinculação
            link_linked_at: p.linked_at || '',
            link_linked_by: p.linked_by || '',
            link_linked_automatically: p.linked_automatically || false,
            link_ai_confidence: p.ai_confidence || 0,
            link_ai_reasoning: p.ai_reasoning || '',
          })) || [],
          
          // Resumo das Apólices
          total_policies: totalPolicies,
          total_premium_value: totalPremiumValue,
          average_premium_value: averagePremiumValue,
          
          // Dados dos Prêmios
          prizes: prizes?.map(p => ({
            prize_id: p.premio?.id || '',
            prize_name: p.premio?.nome || '',
            prize_value: p.premio?.valor_estimado || 0,
            prize_category: p.premio?.categoria?.nome || '',
            prize_type: p.premio?.tipo?.nome || '',
            prize_image_url: p.premio?.imagem_miniatura_url || '',
            prize_quantity: p.quantidade || 0,
            prize_delivered: p.entregue || false,
            prize_delivered_at: p.entregue_em || '',
            prize_delivered_by: p.entregue_por || '',
          })) || [],
          
          // Resumo dos Prêmios
          total_prizes: totalPrizes,
          total_prize_value: totalPrizeValue,
        };

        completeData.push(campaignData);
      }
      return completeData;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório em formato CSV
   */
  static async generateCSVReport(): Promise<string> {
    try {
      const data = await this.generateCompleteReport();
      
      // Cabeçalhos do CSV
      const headers = [
        'ID Campanha',
        'Título da Campanha',
        'Tipo da Campanha',
        'Status da Campanha',
        'Status de Aceitação',
        'Meta (R$)',
        'Valor Atual (R$)',
        'Progresso (%)',
        'Data Início',
        'Data Fim',
        'Data Criação',
        'Criado Por',
        'Data Aceitação',
        'Aceito Por',
        'Descrição',
        'Nome do Criador',
        'Email do Criador',
        'CPD do Criador',
        'Nome do Aceitador',
        'Email do Aceitador',
        'CPD do Aceitador',
        'Total de Apólices',
        'Valor Total das Apólices (R$)',
        'Valor Médio das Apólices (R$)',
        'Total de Prêmios',
        'Valor Total dos Prêmios (R$)',
        'Detalhes das Apólices',
        'Detalhes dos Prêmios'
      ];

      // Gerar linhas do CSV
      const rows = data.map(campaign => [
        campaign.campaign_id,
        campaign.campaign_title,
        campaign.campaign_type,
        campaign.campaign_status,
        campaign.campaign_acceptance_status,
        campaign.campaign_target.toFixed(2),
        campaign.campaign_current_value.toFixed(2),
        campaign.campaign_progress_percentage.toFixed(2),
        campaign.campaign_start_date,
        campaign.campaign_end_date,
        campaign.campaign_created_at,
        campaign.campaign_created_by,
        campaign.campaign_accepted_at,
        campaign.campaign_accepted_by,
        campaign.campaign_description,
        campaign.creator_name,
        campaign.creator_email,
        campaign.creator_cpd,
        campaign.acceptor_name,
        campaign.acceptor_email,
        campaign.acceptor_cpd,
        campaign.total_policies.toString(),
        campaign.total_premium_value.toFixed(2),
        campaign.average_premium_value.toFixed(2),
        campaign.total_prizes.toString(),
        campaign.total_prize_value.toFixed(2),
        campaign.policies.map(p => `${p.policy_number} (${p.policy_type}) - R$ ${p.policy_premium_value.toFixed(2)}`).join('; '),
        campaign.prizes.map(p => `${p.prize_name} (${p.prize_quantity}x) - R$ ${p.prize_value.toFixed(2)}`).join('; ')
      ]);

      // Combinar cabeçalhos e linhas
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório em formato JSON
   */
  static async generateJSONReport(): Promise<string> {
    try {
      const data = await this.generateCompleteReport();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório em formato Markdown
   */
  static async generateMarkdownReport(): Promise<string> {
    try {
      const data = await this.generateCompleteReport();
      
      let markdown = '# Relatório Completo de Campanhas\n\n';
      markdown += `**Data de Geração:** ${new Date().toLocaleString('pt-BR')}\n\n`;
      markdown += `**Total de Campanhas:** ${data.length}\n\n`;
      
      data.forEach((campaign, index) => {
        markdown += `## ${index + 1}. ${campaign.campaign_title}\n\n`;
        
        // Informações básicas
        markdown += `### Informações da Campanha\n`;
        markdown += `- **ID:** ${campaign.campaign_id}\n`;
        markdown += `- **Tipo:** ${campaign.campaign_type}\n`;
        markdown += `- **Status:** ${campaign.campaign_status}\n`;
        markdown += `- **Status de Aceitação:** ${campaign.campaign_acceptance_status}\n`;
        markdown += `- **Meta:** R$ ${campaign.campaign_target.toFixed(2)}\n`;
        markdown += `- **Valor Atual:** R$ ${campaign.campaign_current_value.toFixed(2)}\n`;
        markdown += `- **Progresso:** ${campaign.campaign_progress_percentage.toFixed(2)}%\n`;
        markdown += `- **Período:** ${campaign.campaign_start_date} até ${campaign.campaign_end_date}\n`;
        markdown += `- **Criado em:** ${campaign.campaign_created_at}\n`;
        markdown += `- **Criado por:** ${campaign.creator_name} (${campaign.creator_email})\n`;
        markdown += `- **CPD do Criador:** ${campaign.creator_cpd}\n`;
        
        if (campaign.acceptor_name) {
          markdown += `- **Aceito por:** ${campaign.acceptor_name} (${campaign.acceptor_email})\n`;
          markdown += `- **CPD do Aceitador:** ${campaign.acceptor_cpd}\n`;
        }
        
        markdown += `\n`;
        
        // Apólices
        if (campaign.policies.length > 0) {
          markdown += `### Apólices (${campaign.total_policies})\n`;
          markdown += `- **Valor Total:** R$ ${campaign.total_premium_value.toFixed(2)}\n`;
          markdown += `- **Valor Médio:** R$ ${campaign.average_premium_value.toFixed(2)}\n\n`;
          
          campaign.policies.forEach(policy => {
            markdown += `#### ${policy.policy_number}\n`;
            markdown += `- **Tipo:** ${policy.policy_type}\n`;
            markdown += `- **Valor:** R$ ${policy.policy_premium_value.toFixed(2)}\n`;
            markdown += `- **CPD:** ${policy.policy_cpd_number}\n`;
            markdown += `- **Corretor:** ${policy.policy_broker_name} (${policy.policy_broker_email})\n`;
            markdown += `- **Data de Registro:** ${policy.policy_registration_date}\n`;
            markdown += `- **Vinculado em:** ${policy.link_linked_at}\n`;
            markdown += `- **Confiança IA:** ${policy.link_ai_confidence}%\n\n`;
          });
        }
        
        // Prêmios
        if (campaign.prizes.length > 0) {
          markdown += `### Prêmios (${campaign.total_prizes})\n`;
          markdown += `- **Valor Total:** R$ ${campaign.total_prize_value.toFixed(2)}\n\n`;
          
          campaign.prizes.forEach(prize => {
            markdown += `#### ${prize.prize_name}\n`;
            markdown += `- **Quantidade:** ${prize.prize_quantity}\n`;
            markdown += `- **Valor Unitário:** R$ ${prize.prize_value.toFixed(2)}\n`;
            markdown += `- **Categoria:** ${prize.prize_category}\n`;
            markdown += `- **Tipo:** ${prize.prize_type}\n`;
            markdown += `- **Entregue:** ${prize.prize_delivered ? 'Sim' : 'Não'}\n\n`;
          });
        }
        
        markdown += `---\n\n`;
      });
      
      return markdown;
      
    } catch (error) {
      throw error;
    }
  }
}

