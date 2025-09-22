import { supabase } from '../lib/supabase';

export class SimpleDownloadService {
    /**
     * Faz download da tabela master_campaigns_data completa
     */
    static async downloadMasterData(): Promise<void> {
        try {
            // Mostrar notificação de início
            this.showNotification('📊 Iniciando download...', 'info');

            // Atualizar notificação
            this.showNotification('🔍 Buscando dados no banco...', 'info');
            
            // 1. Buscar todos os dados da tabela master_campaigns_data
            const { data, error } = await supabase
                .from('master_campaigns_data')
                .select('*')
                .order('unified_created_at', { ascending: false });

            if (error) {
                this.showNotification('❌ Erro ao buscar dados no banco', 'error');
                throw error;
            }

            // 2. Se não há dados na tabela master, mostrar erro
            if (!data || data.length === 0) {

                this.showNotification('⚠️ Tabela master_campaigns_data vazia. Execute os scripts para configurar os triggers.', 'error');
                return;
            }

            // Atualizar notificação
            this.showNotification('📝 Processando dados...', 'info');

            // 3. Processar dados para CSV
            const csvContent = this.generateCSV(data);

            // Atualizar notificação
            this.showNotification('💾 Gerando arquivo CSV...', 'info');

            // 4. Fazer download
            const fileName = `dados_completos_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadCSV(csvContent, fileName);

            // Notificação de sucesso
            this.showNotification('✅ Download concluído com sucesso!', 'success');

        } catch (error) {
            this.showNotification('❌ Erro ao fazer download. Tente novamente.', 'error');
        }
    }

    /**
     * Faz download dos dados das tabelas originais se master_campaigns_data estiver vazia
     */
    private static async downloadFromOriginalTables(): Promise<void> {
        try {

            // 1. Buscar campanhas
            this.showNotification('📋 Buscando campanhas...', 'info');
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select(`
                    *,
                    created_by_user:users!goals_created_by_fkey(name, email, cpd),
                    accepted_by_user:users!goals_accepted_by_fkey(name, email, cpd)
                `)
                .eq('record_type', 'campaign');

            if (campaignsError) throw campaignsError;

            // 2. Buscar apólices
            this.showNotification('📄 Buscando apólices...', 'info');
            const { data: policies, error: policiesError } = await supabase
                .from('policies')
                .select('*');

            if (policiesError) throw policiesError;

            // 3. Buscar usuários
            this.showNotification('👥 Buscando usuários...', 'info');
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*');

            if (usersError) throw usersError;

            // 4. Buscar vinculações
            this.showNotification('🔗 Buscando vinculações...', 'info');
            const { data: links, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies(*),
                    campaign:goals(*)
                `)
                .eq('is_active', true);

            if (linksError) throw linksError;

            // 5. Processar dados consolidados
            this.showNotification('📝 Processando dados consolidados...', 'info');
            const consolidatedData = this.processConsolidatedData(
                campaigns || [],
                policies || [],
                users || [],
                links || []
            );

            // 6. Gerar CSV
            this.showNotification('💾 Gerando arquivo CSV...', 'info');
            const csvContent = this.generateCSV(consolidatedData);

            // 7. Fazer download
            const fileName = `dados_completos_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadCSV(csvContent, fileName);

            // Notificação de sucesso
            this.showNotification('✅ Download concluído com sucesso!', 'success');

        } catch (error) {
            this.showNotification('❌ Erro ao fazer download. Tente novamente.', 'error');
            throw error;
        }
    }

    /**
     * Processa dados consolidados das tabelas originais
     */
    private static processConsolidatedData(campaigns: any[], policies: any[], users: any[], links: any[]): any[] {
        const result: any[] = [];

        // Adicionar campanhas
        campaigns.forEach(campaign => {
            result.push({
                'Tipo de Registro': 'Campanha',
                'ID': campaign.id,
                'Título': campaign.title,
                'Tipo': campaign.campaign_type,
                'Status': campaign.status,
                'Data Início': campaign.start_date,
                'Data Fim': campaign.end_date,
                'Meta (R$)': campaign.target,
                'Valor Atual (R$)': campaign.current_value,
                'Progresso (%)': campaign.progress_percentage,
                'Criado por': campaign.created_by_user?.name || 'N/A',
                'Email Criador': campaign.created_by_user?.email || 'N/A',
                'CPD Criador': campaign.created_by_user?.cpd || 'N/A',
                'Aceito por': campaign.accepted_by_user?.name || 'N/A',
                'Email Aceitador': campaign.accepted_by_user?.email || 'N/A',
                'CPD Aceitador': campaign.accepted_by_user?.cpd || 'N/A',
                'Data de Aceitação': campaign.accepted_at,
                'Data de Criação': campaign.created_at,
                'Última Atualização': campaign.updated_at
            });
        });

        // Adicionar apólices
        policies.forEach(policy => {
            result.push({
                'Tipo de Registro': 'Apólice',
                'ID': policy.id,
                'Número da Apólice': policy.policy_number,
                'Tipo': policy.type,
                'Valor (R$)': policy.premium_value,
                'Data de Registro': policy.registration_date,
                'CPD': policy.cpd_number,
                'Status': policy.status,
                'Cidade': policy.city,
                'Código do Ticket': policy.ticket_code,
                'Data de Criação': policy.created_at,
                'Última Atualização': policy.updated_at
            });
        });

        // Adicionar usuários
        users.forEach(user => {
            result.push({
                'Tipo de Registro': 'Usuário',
                'ID': user.id,
                'Nome': user.name,
                'Email': user.email,
                'CPD': user.cpd,
                'É Admin': user.is_admin ? 'Sim' : 'Não',
                'Data de Criação': user.created_at,
                'Última Atualização': user.updated_at
            });
        });

        // Adicionar vinculações
        links.forEach(link => {
            result.push({
                'Tipo de Registro': 'Vinculação',
                'ID': link.id,
                'ID da Apólice': link.policy_id,
                'ID da Campanha': link.campaign_id,
                'ID do Usuário': link.user_id,
                'Data de Vinculação': link.linked_at,
                'Vinculado Automaticamente': link.linked_automatically ? 'Sim' : 'Não',
                'Ativo': link.is_active ? 'Sim' : 'Não',
                'Confiança IA': link.ai_confidence,
                'Raciocínio IA': link.ai_reasoning,
                'Data de Criação': link.created_at,
                'Última Atualização': link.updated_at
            });
        });

        return result;
    }

    /**
     * Gera CSV a partir dos dados
     */
    private static generateCSV(data: any[]): string {
        if (data.length === 0) {
            return 'Nenhum dado encontrado';
        }

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) {
                    return '';
                }
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    /**
     * Faz download do CSV
     */
    private static downloadCSV(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    }

    /**
     * Mostra notificação para o usuário
     */
    private static showNotification(message: string, type: 'info' | 'success' | 'error'): void {
        // Remover notificação anterior se existir
        const existingNotification = document.getElementById('download-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.id = 'download-notification';
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div class="flex-1">
                    <p class="font-medium">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-white hover:text-gray-200">
                    ✕
                </button>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Auto-remover após 5 segundos (exceto para erros)
        if (type !== 'error') {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }

        // Adicionar animação de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
    }
}
