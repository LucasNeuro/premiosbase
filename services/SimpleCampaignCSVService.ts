import { supabase } from '../lib/supabase';

export interface SimpleCampaignData {
  // Dados da Campanha
  campaign_id: string;
  campaign_title: string;
  campaign_type: string;
  campaign_status: string;
  campaign_target: number;
  campaign_current_value: number;
  campaign_progress_percentage: number;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_created_at: string;
  
  // Dados das Apólices
  policy_number: string;
  policy_type: string;
  policy_premium_value: number;
  policy_cpd_number: string;
  policy_broker_name: string;
  policy_broker_email: string;
  policy_registration_date: string;
  policy_created_at: string;
}

export class SimpleCampaignCSVService {
  /**
   * Gera CSV simples com dados das campanhas e apólices
   */
  static async generateSimpleCSV(): Promise<string> {
    try {

      // 1. Buscar todas as campanhas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select(`
          id,
          title,
          campaign_type,
          status,
          target,
          current_value,
          progress_percentage,
          start_date,
          end_date,
          created_at
        `)
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }

      // 2. Para cada campanha, buscar apólices vinculadas
      const allData: SimpleCampaignData[] = [];

      for (const campaign of campaigns || []) {

        // Buscar apólices vinculadas
        const { data: policies, error: policiesError } = await supabase
          .from('policy_campaign_links')
          .select(`
            policy:policies(
              policy_number,
              type,
              premium_value,
              cpd_number,
              registration_date,
              created_at,
              user_id
            )
          `)
          .eq('campaign_id', campaign.id)
          .eq('is_active', true);

        if (policiesError) {
          continue;
        }

        // Buscar dados dos usuários das apólices
        const userIds = policies?.map(p => p.policy?.user_id).filter(Boolean) || [];
        let usersData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, cpd')
            .in('id', userIds);
          
          if (usersError) {
          } else {
            usersData = users || [];
          }
        }

        // Função para extrair CPD do JSON
        const extractCPD = (cpdData: any): string => {
          if (!cpdData) return '';
          if (typeof cpdData === 'string') return cpdData;
          if (typeof cpdData === 'object') {
            if (Array.isArray(cpdData) && cpdData.length > 0) {
              return cpdData[0].number || cpdData[0].name || '';
            }
            return cpdData.number || cpdData.name || '';
          }
          return String(cpdData);
        };

        // Se não tem apólices, adicionar só dados da campanha
        if (!policies || policies.length === 0) {
          allData.push({
            // Dados da Campanha
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            campaign_type: campaign.campaign_type || 'simple',
            campaign_status: campaign.status || 'active',
            campaign_target: campaign.target || 0,
            campaign_current_value: campaign.current_value || 0,
            campaign_progress_percentage: campaign.progress_percentage || 0,
            campaign_start_date: campaign.start_date || '',
            campaign_end_date: campaign.end_date || '',
            campaign_created_at: campaign.created_at || '',
            
            // Dados das Apólices (vazios)
            policy_number: '',
            policy_type: '',
            policy_premium_value: 0,
            policy_cpd_number: '',
            policy_broker_name: '',
            policy_broker_email: '',
            policy_registration_date: '',
            policy_created_at: '',
          });
        } else {
          // Para cada apólice, criar uma linha
          policies.forEach(policy => {
            // Encontrar dados do usuário
            const userData = usersData.find(u => u.id === policy.policy?.user_id);
            
            allData.push({
              // Dados da Campanha
              campaign_id: campaign.id,
              campaign_title: campaign.title,
              campaign_type: campaign.campaign_type || 'simple',
              campaign_status: campaign.status || 'active',
              campaign_target: campaign.target || 0,
              campaign_current_value: campaign.current_value || 0,
              campaign_progress_percentage: campaign.progress_percentage || 0,
              campaign_start_date: campaign.start_date || '',
              campaign_end_date: campaign.end_date || '',
              campaign_created_at: campaign.created_at || '',
              
              // Dados das Apólices
              policy_number: policy.policy?.policy_number || '',
              policy_type: policy.policy?.type || '',
              policy_premium_value: policy.policy?.premium_value || 0,
              policy_cpd_number: policy.policy?.cpd_number || '',
              policy_broker_name: userData?.name || '',
              policy_broker_email: userData?.email || '',
              policy_broker_cpd: extractCPD(userData?.cpd) || '',
              policy_registration_date: policy.policy?.registration_date || '',
              policy_created_at: policy.policy?.created_at || '',
            });
          });
        }
      }

      // 3. Gerar CSV
      const headers = [
        'ID Campanha',
        'Título da Campanha',
        'Tipo da Campanha',
        'Status da Campanha',
        'Meta (R$)',
        'Valor Atual (R$)',
        'Progresso (%)',
        'Data Início',
        'Data Fim',
        'Data Criação da Campanha',
        'Número da Apólice',
        'Tipo da Apólice',
        'Valor da Apólice (R$)',
        'CPD da Apólice',
        'Nome do Corretor',
        'Email do Corretor',
        'Data de Registro da Apólice',
        'Data de Criação da Apólice'
      ];

      const rows = allData.map(item => [
        item.campaign_id,
        item.campaign_title,
        item.campaign_type,
        item.campaign_status,
        item.campaign_target.toFixed(2),
        item.campaign_current_value.toFixed(2),
        item.campaign_progress_percentage.toFixed(2),
        item.campaign_start_date,
        item.campaign_end_date,
        item.campaign_created_at,
        item.policy_number,
        item.policy_type,
        item.policy_premium_value.toFixed(2),
        item.policy_cpd_number,
        item.policy_broker_name,
        item.policy_broker_email,
        item.policy_registration_date,
        item.policy_created_at
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
   * Baixa o CSV simples
   */
  static async downloadSimpleCSV(): Promise<void> {
    try {

      const csvContent = await this.generateSimpleCSV();
      
      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_campanhas_simples_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      throw error;
    }
  }
}
