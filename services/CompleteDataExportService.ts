import { supabase } from '../lib/supabase';

export class CompleteDataExportService {
  /**
   * Exporta todos os dados do banco para uma tabela temporária
   */
  static async exportAllDataToTable(): Promise<string> {
    try {
      // 1. Buscar todas as campanhas (sem relacionamentos)
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }
      // 2. Buscar todas as apólices (sem relacionamentos)
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (policiesError) {
        throw new Error(`Erro ao buscar apólices: ${policiesError.message}`);
      }
      // 3. Buscar todas as vinculações (apenas IDs)
      const { data: links, error: linksError } = await supabase
        .from('policy_campaign_links')
        .select('campaign_id, policy_id, is_active')
        .eq('is_active', true);

      if (linksError) {
        throw new Error(`Erro ao buscar vinculações: ${linksError.message}`);
      }
      // 4. Buscar todos os prêmios
      const { data: prizes, error: prizesError } = await supabase
        .from('campanhas_premios')
        .select(`
          *,
          premio:premios(
            *,
            categoria:categorias_premios(nome),
            tipo:tipos_premios(nome)
          )
        `);

      if (prizesError) {
        throw new Error(`Erro ao buscar prêmios: ${prizesError.message}`);
      }
      // 5. Criar tabela temporária com todos os dados
      const tableName = `export_completo_${Date.now()}`;
      
      // Preparar dados para inserção
      const exportData = {
        campaigns: campaigns || [],
        policies: policies || [],
        links: links || [],
        prizes: prizes || [],
        export_date: new Date().toISOString(),
        total_campaigns: campaigns?.length || 0,
        total_policies: policies?.length || 0,
        total_links: links?.length || 0,
        total_prizes: prizes?.length || 0
      };

      // Inserir na tabela de exportações
      const { data: insertData, error: insertError } = await supabase
        .from('data_exports')
        .insert({
          export_name: tableName,
          export_data: exportData,
          export_type: 'complete',
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        // Se não conseguir inserir na tabela, retornar dados diretamente
        return JSON.stringify(exportData, null, 2);
      }
      return insertData.id;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera CSV com todos os dados exportados
   */
  static async generateCompleteCSV(): Promise<string> {
    try {
      // 1. Buscar todas as campanhas (sem relacionamentos)
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }

      // 2. Buscar todas as apólices (sem relacionamentos)
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (policiesError) {
        throw new Error(`Erro ao buscar apólices: ${policiesError.message}`);
      }

      // 3. Buscar dados dos usuários (criadores e aceitadores das campanhas)
      const userIds = [
        ...(campaigns?.map(c => c.created_by).filter(Boolean) || []),
        ...(campaigns?.map(c => c.accepted_by).filter(Boolean) || []),
        ...(policies?.map(p => p.user_id).filter(Boolean) || [])
      ];
      
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, cpd')
          .in('id', [...new Set(userIds)]); // Remove duplicatas
        
        if (usersError) {
        } else {
          usersData = users || [];
        }
      }

      // 4. Buscar todas as vinculações
      const { data: links, error: linksError } = await supabase
        .from('policy_campaign_links')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (linksError) {
        throw new Error(`Erro ao buscar vinculações: ${linksError.message}`);
      }

      // 5. Gerar CSV
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
        'Criado Por',
        'Email do Criador',
        'CPD do Criador',
        'Aceito Por',
        'Email do Aceitador',
        'Número da Apólice',
        'Tipo da Apólice',
        'Valor da Apólice (R$)',
        'CPD da Apólice',
        'Nome do Corretor da Apólice',
        'Email do Corretor da Apólice',
        'CPD do Corretor da Apólice',
        'Data de Registro da Apólice',
        'Data de Criação da Apólice',
        'Vinculada à Campanha'
      ];

      const rows: string[][] = [];

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

      // Para cada campanha
      campaigns?.forEach(campaign => {
        // Buscar dados do criador e aceitador
        const creator = usersData.find(u => u.id === campaign.created_by);
        const acceptor = campaign.accepted_by ? usersData.find(u => u.id === campaign.accepted_by) : null;

        // Buscar apólices vinculadas a esta campanha
        const campaignLinks = links?.filter(link => link.campaign_id === campaign.id) || [];
        const campaignPolicies = campaignLinks.map(link => 
          policies?.find(policy => policy.id === link.policy_id)
        ).filter(Boolean);

        if (campaignPolicies.length === 0) {
          // Campanha sem apólices
          rows.push([
            campaign.id,
            campaign.title,
            campaign.campaign_type || 'simple',
            campaign.status || 'active',
            (campaign.target || 0).toFixed(2),
            (campaign.current_value || 0).toFixed(2),
            (campaign.progress_percentage || 0).toFixed(2),
            campaign.start_date || '',
            campaign.end_date || '',
            campaign.created_at || '',
            creator?.name || '',
            creator?.email || '',
            extractCPD(creator?.cpd) || '',
            acceptor?.name || '',
            acceptor?.email || '',
            '', // Número da Apólice
            '', // Tipo da Apólice
            '0.00', // Valor da Apólice
            '', // CPD da Apólice
            '', // Nome do Corretor da Apólice
            '', // Email do Corretor da Apólice
            '', // CPD do Corretor da Apólice
            '', // Data de Registro da Apólice
            '', // Data de Criação da Apólice
            'Não' // Vinculada à Campanha
          ]);
        } else {
          // Para cada apólice vinculada
          campaignPolicies.forEach(policy => {
            const policyUser = usersData.find(u => u.id === policy?.user_id);
            
            rows.push([
              campaign.id,
              campaign.title,
              campaign.campaign_type || 'simple',
              campaign.status || 'active',
              (campaign.target || 0).toFixed(2),
              (campaign.current_value || 0).toFixed(2),
              (campaign.progress_percentage || 0).toFixed(2),
              campaign.start_date || '',
              campaign.end_date || '',
              campaign.created_at || '',
              creator?.name || '',
              creator?.email || '',
              extractCPD(creator?.cpd) || '',
              acceptor?.name || '',
              acceptor?.email || '',
              policy?.policy_number || '',
              policy?.type || '',
              (policy?.premium_value || 0).toFixed(2),
              policy?.cpd_number || '',
              policyUser?.name || '',
              policyUser?.email || '',
              extractCPD(policyUser?.cpd) || '',
              policy?.registration_date || '',
              policy?.created_at || '',
              'Sim' // Vinculada à Campanha
            ]);
          });
        }
      });

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
   * Gera relatório em formato Markdown
   */
  static async generateMarkdownReport(): Promise<string> {
    try {
      // 1. Buscar todas as campanhas (sem relacionamentos)
      const { data: campaigns, error: campaignsError } = await supabase
        .from('goals')
        .select('*')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
      }

      // 2. Buscar todas as apólices (sem relacionamentos)
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (policiesError) {
        throw new Error(`Erro ao buscar apólices: ${policiesError.message}`);
      }

      // 3. Buscar dados dos usuários
      const userIds = [
        ...(campaigns?.map(c => c.created_by).filter(Boolean) || []),
        ...(campaigns?.map(c => c.accepted_by).filter(Boolean) || []),
        ...(policies?.map(p => p.user_id).filter(Boolean) || [])
      ];
      
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, cpd')
          .in('id', [...new Set(userIds)]);
        
        if (usersError) {
        } else {
          usersData = users || [];
        }
      }

      // 4. Buscar todas as vinculações
      const { data: links, error: linksError } = await supabase
        .from('policy_campaign_links')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (linksError) {
        throw new Error(`Erro ao buscar vinculações: ${linksError.message}`);
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

      // 5. Gerar Markdown
      let markdown = `# Relatório Completo de Campanhas\n\n`;
      markdown += `**Data de Geração:** ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      markdown += `## Resumo\n\n`;
      markdown += `- **Total de Campanhas:** ${campaigns?.length || 0}\n`;
      markdown += `- **Total de Apólices:** ${policies?.length || 0}\n`;
      markdown += `- **Total de Vinculações:** ${links?.length || 0}\n\n`;

      // 6. Detalhes das Campanhas
      markdown += `## Detalhes das Campanhas\n\n`;
      
      campaigns?.forEach((campaign, index) => {
        const creator = usersData.find(u => u.id === campaign.created_by);
        const acceptor = campaign.accepted_by ? usersData.find(u => u.id === campaign.accepted_by) : null;
        
        const campaignLinks = links?.filter(link => link.campaign_id === campaign.id) || [];
        const campaignPolicies = campaignLinks.map(link => 
          policies?.find(policy => policy.id === link.policy_id)
        ).filter(Boolean);

        markdown += `### ${index + 1}. ${campaign.title}\n\n`;
        markdown += `- **ID:** ${campaign.id}\n`;
        markdown += `- **Tipo:** ${campaign.campaign_type || 'simple'}\n`;
        markdown += `- **Status:** ${campaign.status || 'active'}\n`;
        markdown += `- **Meta:** R$ ${(campaign.target || 0).toFixed(2)}\n`;
        markdown += `- **Valor Atual:** R$ ${(campaign.current_value || 0).toFixed(2)}\n`;
        markdown += `- **Progresso:** ${(campaign.progress_percentage || 0).toFixed(2)}%\n`;
        markdown += `- **Período:** ${campaign.start_date} até ${campaign.end_date}\n`;
        markdown += `- **Criado em:** ${campaign.created_at}\n`;
        markdown += `- **Criado por:** ${creator?.name || 'N/A'} (${creator?.email || 'N/A'})\n`;
        markdown += `- **CPD do Criador:** ${extractCPD(creator?.cpd) || 'N/A'}\n`;
        markdown += `- **Aceito por:** ${acceptor?.name || 'N/A'} (${acceptor?.email || 'N/A'})\n`;
        markdown += `- **Apólices Vinculadas:** ${campaignPolicies.length}\n\n`;

        if (campaignPolicies.length > 0) {
          markdown += `#### Apólices Vinculadas:\n\n`;
          markdown += `| Número | Tipo | Valor | CPD | Corretor | Email | CPD Corretor |\n`;
          markdown += `|--------|------|-------|-----|----------|-------|-------------|\n`;
          
          campaignPolicies.forEach(policy => {
            const policyUser = usersData.find(u => u.id === policy?.user_id);
            markdown += `| ${policy?.policy_number || ''} | ${policy?.type || ''} | R$ ${(policy?.premium_value || 0).toFixed(2)} | ${policy?.cpd_number || ''} | ${policyUser?.name || ''} | ${policyUser?.email || ''} | ${extractCPD(policyUser?.cpd) || ''} |\n`;
          });
          markdown += `\n`;
        }
      });
      return markdown;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera relatório em formato XLS (Excel)
   */
  static async generateXLSReport(): Promise<string> {
    try {
      // Usar a mesma lógica do CSV, mas com formatação XLS
      const csvContent = await this.generateCompleteCSV();
      
      // Converter CSV para XLS (formato simples)
      const xlsContent = this.convertCSVToXLS(csvContent);
      return xlsContent;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Converte CSV para formato XLS simples
   */
  private static convertCSVToXLS(csvContent: string): string {
    // Para um XLS simples, vamos usar formato TSV (Tab Separated Values)
    // que é compatível com Excel
    return csvContent.replace(/,/g, '\t');
  }

  /**
   * Baixa o CSV completo
   */
  static async downloadCompleteCSV(): Promise<void> {
    try {
      const csvContent = await this.generateCompleteCSV();
      
      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_completo_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Baixa o relatório em Markdown
   */
  static async downloadMarkdownReport(): Promise<void> {
    try {
      const markdownContent = await this.generateMarkdownReport();
      
      // Criar e baixar arquivo
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_completo_${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Baixa o relatório em XLS
   */
  static async downloadXLSReport(): Promise<void> {
    try {
      const xlsContent = await this.generateXLSReport();
      
      // Criar e baixar arquivo
      const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_completo_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }
}
