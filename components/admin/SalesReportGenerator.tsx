import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SalesReportGeneratorProps {
    onClose: () => void;
}

const SalesReportGenerator: React.FC<SalesReportGeneratorProps> = ({ onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const fetchAllSalesData = async () => {
        try {
            // Buscar todas as políticas com dados dos usuários
            const { data: policiesData, error: policiesError } = await supabase
                .from('policies')
                .select(`
                    *,
                    user:users!policies_user_id_fkey(
                        id,
                        name,
                        email,
                        cnpj,
                        phone
                    )
                `)
                .order('created_at', { ascending: false });

            if (policiesError) throw policiesError;

            return policiesData || [];
        } catch (error) {
            console.error('Erro ao buscar dados de vendas:', error);
            throw error;
        }
    };

    const handleDownloadCSV = async () => {
        try {
            setIsGenerating(true);
            
            console.log('🚀 Gerando CSV de vendas...');
            
            const data = await fetchAllSalesData();
            
            // Cabeçalhos CSV
            const headers = [
                'ID da Apólice',
                'Número da Apólice',
                'Tipo',
                'Valor do Prêmio',
                'Data de Registro',
                'Tipo de Contrato',
                'CPD',
                'Cidade',
                'Código do Ticket',
                'Status',
                'Data de Criação',
                'Data de Atualização',
                'Nome do Corretor',
                'Email do Corretor',
                'CNPJ do Corretor',
                'Telefone do Corretor'
            ];

            // Dados CSV
            const csvData = data.map(policy => [
                policy.id,
                policy.policy_number,
                policy.type,
                policy.premium_value,
                formatDate(policy.registration_date),
                policy.contract_type,
                policy.cpd_number || '',
                policy.city || '',
                policy.ticket_code || '',
                policy.status,
                formatDate(policy.created_at),
                formatDate(policy.updated_at),
                policy.user?.name || 'N/A',
                policy.user?.email || 'N/A',
                policy.user?.cnpj || 'N/A',
                policy.user?.phone || 'N/A'
            ]);

            // Criar conteúdo CSV
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('❌ Erro ao gerar CSV de vendas:', error);
            alert(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadXLS = async () => {
        try {
            setIsGenerating(true);
            
            console.log('🚀 Gerando XLS de vendas...');
            
            const data = await fetchAllSalesData();
            
            // Para XLS, vamos criar um CSV com extensão .xls
            // (Em uma implementação real, você usaria uma biblioteca como xlsx)
            const headers = [
                'ID da Apólice',
                'Número da Apólice',
                'Tipo',
                'Valor do Prêmio',
                'Data de Registro',
                'Tipo de Contrato',
                'CPD',
                'Cidade',
                'Código do Ticket',
                'Status',
                'Data de Criação',
                'Data de Atualização',
                'Nome do Corretor',
                'Email do Corretor',
                'CNPJ do Corretor',
                'Telefone do Corretor'
            ];

            const csvData = data.map(policy => [
                policy.id,
                policy.policy_number,
                policy.type,
                policy.premium_value,
                formatDate(policy.registration_date),
                policy.contract_type,
                policy.cpd_number || '',
                policy.city || '',
                policy.ticket_code || '',
                policy.status,
                formatDate(policy.created_at),
                formatDate(policy.updated_at),
                policy.user?.name || 'N/A',
                policy.user?.email || 'N/A',
                policy.user?.cnpj || 'N/A',
                policy.user?.phone || 'N/A'
            ]);

            const csvContent = [
                headers.join('\t'),
                ...csvData.map(row => row.join('\t'))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xls`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('❌ Erro ao gerar XLS de vendas:', error);
            alert(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadMarkdown = async () => {
        try {
            setIsGenerating(true);
            
            console.log('🚀 Gerando Markdown de vendas...');
            
            const data = await fetchAllSalesData();
            
            const totalPolicies = data.length;
            const totalRevenue = data.reduce((sum, policy) => sum + policy.premium_value, 0);
            const uniqueBrokers = new Set(data.map(policy => policy.user?.name)).size;
            const averageTicket = totalPolicies > 0 ? totalRevenue / totalPolicies : 0;

            let markdown = `# Relatório de Vendas - ${new Date().toLocaleDateString('pt-BR')}\n\n`;
            
            markdown += `## Resumo Executivo\n\n`;
            markdown += `- **Total de Apólices:** ${totalPolicies}\n`;
            markdown += `- **Receita Total:** ${formatCurrency(totalRevenue)}\n`;
            markdown += `- **Corretores Ativos:** ${uniqueBrokers}\n`;
            markdown += `- **Ticket Médio:** ${formatCurrency(averageTicket)}\n\n`;

            markdown += `## Detalhes das Apólices\n\n`;
            markdown += `| Número | Corretor | Tipo | Valor | Contrato | Data | Status |\n`;
            markdown += `|--------|----------|------|-------|----------|------|--------|\n`;

            data.forEach(policy => {
                markdown += `| ${policy.policy_number} | ${policy.user?.name || 'N/A'} | ${policy.type} | ${formatCurrency(policy.premium_value)} | ${policy.contract_type} | ${formatDate(policy.registration_date)} | ${policy.status} |\n`;
            });

            markdown += `\n## Estatísticas por Tipo\n\n`;
            
            const autoPolicies = data.filter(p => p.type === 'Seguro Auto');
            const residentialPolicies = data.filter(p => p.type === 'Seguro Residencial');
            
            markdown += `### Seguro Auto\n`;
            markdown += `- **Quantidade:** ${autoPolicies.length}\n`;
            markdown += `- **Receita:** ${formatCurrency(autoPolicies.reduce((sum, p) => sum + p.premium_value, 0))}\n\n`;
            
            markdown += `### Seguro Residencial\n`;
            markdown += `- **Quantidade:** ${residentialPolicies.length}\n`;
            markdown += `- **Receita:** ${formatCurrency(residentialPolicies.reduce((sum, p) => sum + p.premium_value, 0))}\n\n`;

            markdown += `## Estatísticas por Corretor\n\n`;
            
            const brokerStats = data.reduce((acc, policy) => {
                const brokerName = policy.user?.name || 'N/A';
                if (!acc[brokerName]) {
                    acc[brokerName] = { count: 0, revenue: 0 };
                }
                acc[brokerName].count++;
                acc[brokerName].revenue += policy.premium_value;
                return acc;
            }, {} as Record<string, { count: number; revenue: number }>);

            markdown += `| Corretor | Apólices | Receita |\n`;
            markdown += `|----------|----------|----------|\n`;
            
            Object.entries(brokerStats).forEach(([broker, stats]) => {
                markdown += `| ${broker} | ${stats.count} | ${formatCurrency(stats.revenue)} |\n`;
            });

            markdown += `\n---\n`;
            markdown += `*Relatório gerado em ${new Date().toLocaleString('pt-BR')}*\n`;

            // Download
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.md`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('❌ Erro ao gerar Markdown de vendas:', error);
            alert(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Gerar Relatório Completo</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Baixe todas as informações das campanhas, apólices e prêmios
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">O que está incluído no relatório:</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• <strong>Dados das Apólices:</strong> ID, número, tipo, valor, CPD, cidade, ticket, status, datas</li>
                            <li>• <strong>Informações dos Corretores:</strong> Nome, email, CNPJ, telefone</li>
                            <li>• <strong>Detalhes dos Contratos:</strong> Tipo de contrato, data de registro</li>
                            <li>• <strong>Estatísticas:</strong> Resumo executivo, dados por tipo e corretor</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* CSV */}
                        <button
                            onClick={handleDownloadCSV}
                            disabled={isGenerating}
                            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-6 h-6" />
                            )}
                            <div className="text-center">
                                <div className="font-medium text-sm">Baixar CSV</div>
                                <div className="text-xs opacity-90">Planilha CSV</div>
                            </div>
                        </button>

                        {/* XLS */}
                        <button
                            onClick={handleDownloadXLS}
                            disabled={isGenerating}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <File className="w-6 h-6" />
                            )}
                            <div className="text-center">
                                <div className="font-medium text-sm">Baixar XLS</div>
                                <div className="text-xs opacity-90">Excel XLS</div>
                            </div>
                        </button>

                        {/* Markdown */}
                        <button
                            onClick={handleDownloadMarkdown}
                            disabled={isGenerating}
                            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <FileText className="w-6 h-6" />
                            )}
                            <div className="text-center">
                                <div className="font-medium text-sm">Baixar MD</div>
                                <div className="text-xs opacity-90">Markdown</div>
                            </div>
                        </button>
                    </div>

                    {isGenerating && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                <span className="text-blue-700">
                                    Gerando relatório...
                                </span>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                                Isso pode levar alguns segundos dependendo da quantidade de dados.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-end">
                        <div className="flex space-x-2">
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Fechar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReportGenerator;
