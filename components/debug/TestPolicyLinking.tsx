import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { updateAllUserCampaignProgressAuxiliar } from '../../services/campaignProgressAuxiliar';
import { CheckCircle, XCircle, AlertTriangle, TestTube, Database, Link } from 'lucide-react';

const TestPolicyLinking: React.FC = () => {
    const { user } = useAuth();
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [testPolicy, setTestPolicy] = useState({
        policy_number: 'TEST-' + Date.now(),
        type: 'Seguro Auto',
        premium_value: 1500,
        contract_type: 'Novo'
    });

    const runTest = async () => {
        if (!user?.id) return;

        setTesting(true);
        setResults([]);
        
        try {
            console.log('🧪 Iniciando teste de vinculação de apólice...');

            // 1. Criar apólice de teste
            console.log('📝 Criando apólice de teste...');
            const { data: newPolicy, error: policyError } = await supabase
                .from('policies')
                .insert({
                    user_id: user.id,
                    policy_number: testPolicy.policy_number,
                    type: testPolicy.type,
                    premium_value: testPolicy.premium_value,
                    registration_date: new Date().toISOString(),
                    ticket_code: 'TEST-' + Math.random().toString(36).substr(2, 9),
                    contract_type: testPolicy.contract_type,
                    status: 'active'
                })
                .select()
                .single();

            if (policyError) {
                setResults(prev => [...prev, {
                    step: 'Criar Apólice',
                    status: 'error',
                    message: `Erro: ${policyError.message}`
                }]);
                return;
            }

            setResults(prev => [...prev, {
                step: 'Criar Apólice',
                status: 'success',
                message: `Apólice ${newPolicy.policy_number} criada com sucesso`
            }]);

            // 2. Buscar campanhas ativas
            console.log('🔍 Buscando campanhas ativas...');
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted')
                .eq('status', 'active')
                .eq('is_active', true);

            if (campaignsError) {
                setResults(prev => [...prev, {
                    step: 'Buscar Campanhas',
                    status: 'error',
                    message: `Erro: ${campaignsError.message}`
                }]);
                return;
            }

            setResults(prev => [...prev, {
                step: 'Buscar Campanhas',
                status: 'success',
                message: `${campaigns?.length || 0} campanhas encontradas`
            }]);

            // 3. Tentar vincular a cada campanha
            let linkedCount = 0;
            for (const campaign of campaigns || []) {
                console.log(`🔗 Tentando vincular à campanha: ${campaign.title}`);
                
                const { error: linkError } = await supabase
                    .from('policy_campaign_links')
                    .insert({
                        policy_id: newPolicy.id,
                        campaign_id: campaign.id,
                        user_id: user.id,
                        linked_automatically: true,
                        is_active: true,
                        ai_confidence: 100,
                        ai_reasoning: 'Teste manual de vinculação'
                    });

                if (linkError) {
                    setResults(prev => [...prev, {
                        step: `Vincular à ${campaign.title}`,
                        status: 'error',
                        message: `Erro: ${linkError.message}`
                    }]);
                } else {
                    linkedCount++;
                    setResults(prev => [...prev, {
                        step: `Vincular à ${campaign.title}`,
                        status: 'success',
                        message: 'Vinculação criada com sucesso'
                    }]);
                }
            }

            // 4. Atualizar progresso
            console.log('🔄 Atualizando progresso das campanhas...');
            try {
                await updateAllUserCampaignProgressAuxiliar(user.id);
                setResults(prev => [...prev, {
                    step: 'Atualizar Progresso',
                    status: 'success',
                    message: 'Progresso atualizado com sucesso'
                }]);
            } catch (progressError) {
                setResults(prev => [...prev, {
                    step: 'Atualizar Progresso',
                    status: 'error',
                    message: `Erro: ${progressError}`
                }]);
            }

            // 5. Verificar vinculações criadas
            console.log('🔍 Verificando vinculações criadas...');
            const { data: links, error: linksError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies(*),
                    campaign:goals(*)
                `)
                .eq('policy_id', newPolicy.id)
                .eq('is_active', true);

            if (linksError) {
                setResults(prev => [...prev, {
                    step: 'Verificar Vinculações',
                    status: 'error',
                    message: `Erro: ${linksError.message}`
                }]);
            } else {
                setResults(prev => [...prev, {
                    step: 'Verificar Vinculações',
                    status: 'success',
                    message: `${links?.length || 0} vinculações ativas encontradas`
                }]);
            }

            console.log('✅ Teste concluído!');

        } catch (error) {
            console.error('❌ Erro no teste:', error);
            setResults(prev => [...prev, {
                step: 'Teste Geral',
                status: 'error',
                message: `Erro: ${error}`
            }]);
        } finally {
            setTesting(false);
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
            <div className="flex items-center gap-2 mb-6">
                <TestTube className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Teste de Vinculação de Apólice</h2>
            </div>

            {/* Configuração do teste */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Configuração da Apólice de Teste</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número da Apólice
                        </label>
                        <input
                            type="text"
                            value={testPolicy.policy_number}
                            onChange={(e) => setTestPolicy(prev => ({ ...prev, policy_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={testPolicy.type}
                            onChange={(e) => setTestPolicy(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Seguro Auto">Seguro Auto</option>
                            <option value="Seguro Residencial">Seguro Residencial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor do Prêmio
                        </label>
                        <input
                            type="number"
                            value={testPolicy.premium_value}
                            onChange={(e) => setTestPolicy(prev => ({ ...prev, premium_value: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Contrato
                        </label>
                        <select
                            value={testPolicy.contract_type}
                            onChange={(e) => setTestPolicy(prev => ({ ...prev, contract_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Novo">Novo</option>
                            <option value="Renovação Bradesco">Renovação Bradesco</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Botão de teste */}
            <div className="mb-6">
                <button
                    onClick={runTest}
                    disabled={testing}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <TestTube className={`w-5 h-5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Executando Teste...' : 'Executar Teste de Vinculação'}
                </button>
            </div>

            {/* Resultados */}
            {results.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-800">Resultados do Teste</h3>
                    {results.map((result, index) => (
                        <div key={index} className={`p-3 border rounded-lg ${
                            result.status === 'success' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center gap-2">
                                {result.status === 'success' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className="font-medium text-gray-800">{result.step}</span>
                            </div>
                            <p className={`text-sm mt-1 ${
                                result.status === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {result.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Instruções */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Como usar este teste:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>1. Configure os dados da apólice de teste</li>
                    <li>2. Clique em "Executar Teste de Vinculação"</li>
                    <li>3. Observe os resultados de cada etapa</li>
                    <li>4. Verifique o console do navegador para logs detalhados</li>
                    <li>5. Use o componente de Debug para verificar o estado atual</li>
                </ul>
            </div>
        </div>
    );
};

export default TestPolicyLinking;
