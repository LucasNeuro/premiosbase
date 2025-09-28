import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { updateAllUserCampaignProgressAuxiliar } from '../../services/campaignProgressAuxiliar';
import { UnifiedCampaignProgressService } from '../../services/unifiedCampaignProgressService';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Link, Target } from 'lucide-react';

interface DebugInfo {
    userId: string;
    campaigns: any[];
    policies: any[];
    policyLinks: any[];
    errors: string[];
    lastUpdate: string;
}

const DebugCampaignProgress: React.FC = () => {
    const { user } = useAuth();
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    const fetchDebugInfo = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            console.log('🔍 DebugCampaignProgress - Iniciando debug...');

            // 1. Buscar campanhas do usuário
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('record_type', 'campaign')
                .order('created_at', { ascending: false });

            if (campaignsError) {
                console.error('❌ Erro ao buscar campanhas:', campaignsError);
            }

            // 2. Buscar apólices do usuário
            const { data: policies, error: policiesError } = await supabase
                .from('policies')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (policiesError) {
                console.error('❌ Erro ao buscar apólices:', policiesError);
            }

            // 3. Buscar vinculações de apólices
            const { data: policyLinks, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies(*),
                    campaign:goals(*)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (linksError) {
                console.error('❌ Erro ao buscar vinculações:', linksError);
            }

            // 4. Verificar erros
            const errors: string[] = [];
            if (campaignsError) errors.push(`Campanhas: ${campaignsError.message}`);
            if (policiesError) errors.push(`Apólices: ${policiesError.message}`);
            if (linksError) errors.push(`Vinculações: ${linksError.message}`);

            setDebugInfo({
                userId: user.id,
                campaigns: campaigns || [],
                policies: policies || [],
                policyLinks: policyLinks || [],
                errors,
                lastUpdate: new Date().toLocaleString()
            });

            console.log('✅ DebugCampaignProgress - Debug concluído:', {
                campaigns: campaigns?.length || 0,
                policies: policies?.length || 0,
                policyLinks: policyLinks?.length || 0,
                errors: errors.length
            });

        } catch (error) {
            console.error('❌ Erro geral no debug:', error);
        } finally {
            setLoading(false);
        }
    };

    const testProgressCalculation = async () => {
        if (!user?.id) return;

        setTesting(true);
        try {
            console.log('🧪 Testando cálculo de progresso...');

            // Testar atualização de progresso
            await updateAllUserCampaignProgressAuxiliar(user.id);
            console.log('✅ updateAllUserCampaignProgressAuxiliar executado');

            // Testar serviço unificado
            await UnifiedCampaignProgressService.recalculateUserCampaigns(user.id);
            console.log('✅ UnifiedCampaignProgressService executado');

            // Recarregar dados
            await fetchDebugInfo();

        } catch (error) {
            console.error('❌ Erro no teste:', error);
        } finally {
            setTesting(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDebugInfo();
        }
    }, [user?.id]);

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
                    <h2 className="text-xl font-bold text-gray-800">Debug - Progresso das Campanhas</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchDebugInfo}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                    <button
                        onClick={testProgressCalculation}
                        disabled={testing}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        <Target className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                        Testar Cálculo
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Carregando debug...</span>
                </div>
            )}

            {debugInfo && (
                <div className="space-y-6">
                    {/* Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800">
                                <Target className="w-5 h-5" />
                                <span className="font-medium">Campanhas</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                {debugInfo.campaigns.length}
                            </p>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                                <Database className="w-5 h-5" />
                                <span className="font-medium">Apólices</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                                {debugInfo.policies.length}
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-800">
                                <Link className="w-5 h-5" />
                                <span className="font-medium">Vinculações</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900 mt-1">
                                {debugInfo.policyLinks.length}
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Erros</span>
                            </div>
                            <p className="text-2xl font-bold text-red-900 mt-1">
                                {debugInfo.errors.length}
                            </p>
                        </div>
                    </div>

                    {/* Erros */}
                    {debugInfo.errors.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800 mb-2">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Erros Encontrados</span>
                            </div>
                            <ul className="space-y-1">
                                {debugInfo.errors.map((error, index) => (
                                    <li key={index} className="text-sm text-red-600">• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Campanhas */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Campanhas do Usuário</h3>
                        {debugInfo.campaigns.length === 0 ? (
                            <p className="text-gray-500 italic">Nenhuma campanha encontrada</p>
                        ) : (
                            <div className="space-y-3">
                                {debugInfo.campaigns.map((campaign) => (
                                    <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-800">{campaign.title}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Status: {campaign.status} | 
                                                    Aceita: {campaign.acceptance_status} | 
                                                    Progresso: {campaign.progress_percentage?.toFixed(1) || 0}%
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">
                                                    {campaign.current_value || 0} / {campaign.target} {campaign.unit}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {campaign.type === 'valor' ? 'Valor' : 'Quantidade'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Apólices */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Apólices do Usuário</h3>
                        {debugInfo.policies.length === 0 ? (
                            <p className="text-gray-500 italic">Nenhuma apólice encontrada</p>
                        ) : (
                            <div className="space-y-2">
                                {debugInfo.policies.slice(0, 5).map((policy) => (
                                    <div key={policy.id} className="p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">{policy.policy_number}</p>
                                                <p className="text-sm text-gray-600">
                                                    {policy.type} - {new Date(policy.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">
                                                    R$ {policy.premium_value?.toLocaleString() || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {debugInfo.policies.length > 5 && (
                                    <p className="text-sm text-gray-500 italic">
                                        ... e mais {debugInfo.policies.length - 5} apólices
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Vinculações */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Vinculações Ativas</h3>
                        {debugInfo.policyLinks.length === 0 ? (
                            <p className="text-gray-500 italic">Nenhuma vinculação encontrada</p>
                        ) : (
                            <div className="space-y-2">
                                {debugInfo.policyLinks.slice(0, 5).map((link) => (
                                    <div key={link.id} className="p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {link.policy?.policy_number || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    → {link.campaign?.title || 'Campanha não encontrada'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">
                                                    {link.linked_automatically ? 'Automática' : 'Manual'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(link.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {debugInfo.policyLinks.length > 5 && (
                                    <p className="text-sm text-gray-500 italic">
                                        ... e mais {debugInfo.policyLinks.length - 5} vinculações
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Última atualização */}
                    <div className="text-sm text-gray-500 text-center">
                        Última atualização: {debugInfo.lastUpdate}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugCampaignProgress;
