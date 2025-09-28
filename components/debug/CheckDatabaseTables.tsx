import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const CheckDatabaseTables: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const checkTables = async () => {
        if (!user?.id) return;

        setLoading(true);
        setResults(null);

        try {
            console.log('🔍 Verificando estrutura do banco de dados...');

            // 1. Verificar se a tabela policy_campaign_links existe
            let policyCampaignLinksExists = false;
            let policyCampaignLinksError = null;
            try {
                const { data, error } = await supabase
                    .from('policy_campaign_links')
                    .select('id')
                    .limit(1);
                
                if (error) {
                    policyCampaignLinksError = error.message;
                } else {
                    policyCampaignLinksExists = true;
                }
            } catch (err) {
                policyCampaignLinksError = err.message;
            }

            // 2. Verificar se a tabela policy_campaign_links existe (já verificada acima)
            let policyGoalsLinksExists = false;
            let policyGoalsLinksError = null;

            // 3. Verificar se a tabela goals existe
            let goalsExists = false;
            let goalsError = null;
            try {
                const { data, error } = await supabase
                    .from('goals')
                    .select('id')
                    .limit(1);
                
                if (error) {
                    goalsError = error.message;
                } else {
                    goalsExists = true;
                }
            } catch (err) {
                goalsError = err.message;
            }

            // 4. Verificar se a tabela policies existe
            let policiesExists = false;
            let policiesError = null;
            try {
                const { data, error } = await supabase
                    .from('policies')
                    .select('id')
                    .limit(1);
                
                if (error) {
                    policiesError = error.message;
                } else {
                    policiesExists = true;
                }
            } catch (err) {
                policiesError = err.message;
            }

            // 5. Verificar campanhas do usuário
            let userCampaigns = [];
            let userCampaignsError = null;
            try {
                const { data, error } = await supabase
                    .from('goals')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('record_type', 'campaign');
                
                if (error) {
                    userCampaignsError = error.message;
                } else {
                    userCampaigns = data || [];
                }
            } catch (err) {
                userCampaignsError = err.message;
            }

            setResults({
                tables: {
                    policy_campaign_links: {
                        exists: policyCampaignLinksExists,
                        error: policyCampaignLinksError
                    },
                    policy_goals_links: {
                        exists: policyGoalsLinksExists,
                        error: policyGoalsLinksError
                    },
                    goals: {
                        exists: goalsExists,
                        error: goalsError
                    },
                    policies: {
                        exists: policiesExists,
                        error: policiesError
                    }
                },
                userCampaigns: {
                    count: userCampaigns.length,
                    campaigns: userCampaigns,
                    error: userCampaignsError
                }
            });

            console.log('✅ Verificação concluída:', {
                policy_campaign_links: policyCampaignLinksExists,
                policy_goals_links: policyGoalsLinksExists,
                goals: goalsExists,
                policies: policiesExists,
                userCampaigns: userCampaigns.length
            });

        } catch (error) {
            console.error('❌ Erro na verificação:', error);
            setResults({
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Usuário não autenticado</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">Verificação de Tabelas do Banco</h2>
                </div>
                <button
                    onClick={checkTables}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Verificar Tabelas
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Verificando banco de dados...</span>
                </div>
            )}

            {results && (
                <div className="space-y-6">
                    {/* Status das Tabelas */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Status das Tabelas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(results.tables || {}).map(([tableName, status]: [string, any]) => (
                                <div key={tableName} className={`p-4 border rounded-lg ${
                                    status.exists 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-red-50 border-red-200'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        {status.exists ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <span className="font-medium text-gray-800">{tableName}</span>
                                    </div>
                                    {status.exists ? (
                                        <p className="text-sm text-green-700 mt-1">✅ Tabela existe</p>
                                    ) : (
                                        <div className="mt-1">
                                            <p className="text-sm text-red-700">❌ Tabela não existe</p>
                                            {status.error && (
                                                <p className="text-xs text-red-600 mt-1">Erro: {status.error}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Campanhas do Usuário */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Campanhas do Usuário</h3>
                        {results.userCampaigns?.error ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-800">
                                    <XCircle className="w-5 h-5" />
                                    <span className="font-medium">Erro ao buscar campanhas</span>
                                </div>
                                <p className="text-sm text-red-600 mt-1">{results.userCampaigns.error}</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">{results.userCampaigns?.count || 0} campanhas encontradas</span>
                                </div>
                                {results.userCampaigns?.campaigns && results.userCampaigns.campaigns.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {results.userCampaigns.campaigns.slice(0, 3).map((campaign: any) => (
                                            <div key={campaign.id} className="p-2 bg-white border border-blue-200 rounded">
                                                <p className="font-medium text-gray-800">{campaign.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    Status: {campaign.status} | 
                                                    Aceita: {campaign.acceptance_status} | 
                                                    Ativa: {campaign.is_active ? 'Sim' : 'Não'}
                                                </p>
                                            </div>
                                        ))}
                                        {results.userCampaigns.campaigns.length > 3 && (
                                            <p className="text-sm text-gray-500 italic">
                                                ... e mais {results.userCampaigns.campaigns.length - 3} campanhas
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Diagnóstico */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-800">Diagnóstico:</p>
                                <div className="text-sm text-yellow-700 mt-1 space-y-1">
                                    {!results.tables?.policy_campaign_links?.exists && !results.tables?.policy_goals_links?.exists && (
                                        <p>• ❌ Nenhuma tabela de vinculação existe - precisa criar uma</p>
                                    )}
                                    {results.tables?.policy_campaign_links?.exists && results.tables?.policy_goals_links?.exists && (
                                        <p>• ⚠️ Duas tabelas de vinculação existem - pode causar confusão</p>
                                    )}
                                    {results.userCampaigns?.count === 0 && (
                                        <p>• ❌ Nenhuma campanha encontrada para o usuário</p>
                                    )}
                                    {results.userCampaigns?.count > 0 && (
                                        <p>• ✅ {results.userCampaigns.count} campanhas encontradas</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {results?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Erro Geral</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{results.error}</p>
                </div>
            )}
        </div>
    );
};

export default CheckDatabaseTables;
