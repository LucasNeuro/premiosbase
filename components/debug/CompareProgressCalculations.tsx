import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Calculator, Database } from 'lucide-react';

const CompareProgressCalculations: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');

    const compareCalculations = async () => {
        if (!user?.id || !selectedCampaign) return;

        setLoading(true);
        setResults(null);

        try {
            console.log('🔍 Comparando cálculos de progresso para campanha:', selectedCampaign);

            // 1. Buscar dados da campanha
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .select('*')
                .eq('id', selectedCampaign)
                .eq('record_type', 'campaign')
                .single();

            if (campaignError || !campaign) {
                setResults({ error: 'Campanha não encontrada' });
                return;
            }

            // 2. Buscar apólices vinculadas
            const { data: linkedPolicies, error: policiesError } = await supabase
                .from('policy_campaign_links')
                .select(`
                    *,
                    policy:policies!policy_campaign_links_policy_id_fkey (
                        id,
                        policy_number,
                        premium_value,
                        type,
                        contract_type,
                        created_at,
                        status
                    )
                `)
                .eq('campaign_id', selectedCampaign)
                .eq('is_active', true);

            if (policiesError) {
                setResults({ error: `Erro ao buscar apólices: ${policiesError.message}` });
                return;
            }

            const policies = (linkedPolicies || [])
                .map(link => link.policy)
                .filter(policy => policy !== null);

            // 3. Calcular usando diferentes métodos
            const calculations = {
                // Método 1: Cálculo simples (admin)
                simple: {
                    name: 'Cálculo Simples (Admin)',
                    currentValue: policies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0),
                    progressPercentage: campaign.target > 0 ? (policies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0) / campaign.target) * 100 : 0,
                    policiesCount: policies.length,
                    policies: policies
                },

                // Método 2: Cálculo com filtro de data (corretor)
                withDateFilter: {
                    name: 'Cálculo com Filtro de Data (Corretor)',
                    currentValue: 0,
                    progressPercentage: 0,
                    policiesCount: 0,
                    policies: []
                },

                // Método 3: Cálculo por critérios (se for campanha composta)
                byCriteria: {
                    name: 'Cálculo por Critérios',
                    currentValue: 0,
                    progressPercentage: 0,
                    policiesCount: 0,
                    policies: [],
                    criteriaDetails: []
                }
            };

            // Aplicar filtro de data (apólices criadas APÓS aceite da campanha)
            const acceptedAt = campaign.accepted_at ? new Date(campaign.accepted_at) : new Date();
            const filteredPolicies = policies.filter(policy => {
                const policyCreatedAt = new Date(policy.created_at);
                return policyCreatedAt >= acceptedAt;
            });

            calculations.withDateFilter = {
                name: 'Cálculo com Filtro de Data (Corretor)',
                currentValue: filteredPolicies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0),
                progressPercentage: campaign.target > 0 ? (filteredPolicies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0) / campaign.target) * 100 : 0,
                policiesCount: filteredPolicies.length,
                policies: filteredPolicies
            };

            // Calcular por critérios se for campanha composta
            if (campaign.campaign_type === 'composite' && campaign.criteria) {
                try {
                    const criteria = Array.isArray(campaign.criteria) ? campaign.criteria : JSON.parse(campaign.criteria);
                    
                    let totalProgress = 0;
                    let completedCriteria = 0;
                    const criteriaDetails = [];

                    for (const criterion of criteria) {
                        // Filtrar apólices que atendem este critério
                        const matchingPolicies = filteredPolicies.filter(policy => {
                            // Verificar tipo de apólice
                            if (criterion.policy_type) {
                                const policyTypeMap = {
                                    'auto': 'Seguro Auto',
                                    'residencial': 'Seguro Residencial'
                                };
                                
                                if (policyTypeMap[criterion.policy_type] !== policy.type) {
                                    return false;
                                }
                            }

                            // Verificar tipo de contrato
                            if (criterion.contract_type && criterion.contract_type !== 'ambos') {
                                if (criterion.contract_type === 'novo' && policy.contract_type !== 'Novo') return false;
                                if (criterion.contract_type === 'renovacao_bradesco' && policy.contract_type !== 'Renovação Bradesco') return false;
                            }

                            // Verificar valor mínimo
                            if (criterion.min_value_per_policy && (policy.premium_value || 0) < criterion.min_value_per_policy) {
                                return false;
                            }

                            return true;
                        });

                        // Calcular progresso deste critério
                        let criterionProgress = 0;
                        let criterionValue = 0;
                        
                        if (criterion.target_type === 'valor') {
                            criterionValue = matchingPolicies.reduce((sum, p) => sum + (p.premium_value || 0), 0);
                            criterionProgress = criterion.target_value > 0 ? (criterionValue / criterion.target_value) * 100 : 0;
                        } else {
                            criterionValue = matchingPolicies.length;
                            criterionProgress = criterion.target_value > 0 ? (criterionValue / criterion.target_value) * 100 : 0;
                        }

                        criteriaDetails.push({
                            criterion,
                            matchingPolicies: matchingPolicies.length,
                            currentValue: criterionValue,
                            progress: criterionProgress,
                            isCompleted: criterionProgress >= 100
                        });

                        totalProgress += Math.min(criterionProgress, 100);
                        if (criterionProgress >= 100) {
                            completedCriteria++;
                        }
                    }

                    // Progresso geral = 100% APENAS se TODOS os critérios = 100%
                    const overallProgress = completedCriteria === criteria.length && criteria.length > 0 ? 100 : (totalProgress / criteria.length);

                    calculations.byCriteria = {
                        name: 'Cálculo por Critérios',
                        currentValue: filteredPolicies.reduce((sum, policy) => sum + (policy.premium_value || 0), 0),
                        progressPercentage: overallProgress,
                        policiesCount: filteredPolicies.length,
                        policies: filteredPolicies,
                        criteriaDetails
                    };
                } catch (error) {
                    console.error('Erro ao processar critérios:', error);
                }
            }

            setResults({
                campaign,
                calculations,
                acceptedAt: acceptedAt.toISOString(),
                totalPolicies: policies.length,
                filteredPolicies: filteredPolicies.length
            });

            console.log('✅ Comparação concluída:', {
                simple: calculations.simple.progressPercentage,
                withDateFilter: calculations.withDateFilter.progressPercentage,
                byCriteria: calculations.byCriteria.progressPercentage
            });

        } catch (error) {
            console.error('❌ Erro na comparação:', error);
            setResults({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        if (!user?.id) return [];

        try {
            const { data: campaigns, error } = await supabase
                .from('goals')
                .select('id, title, campaign_type, criteria')
                .eq('user_id', user.id)
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return campaigns || [];
        } catch (error) {
            console.error('Erro ao buscar campanhas:', error);
            return [];
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
                <Calculator className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Comparar Cálculos de Progresso</h2>
            </div>

            {/* Seleção de Campanha */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Campanha para Comparar
                </label>
                <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="">Selecione uma campanha...</option>
                    <option value="test">Carregar campanhas...</option>
                </select>
            </div>

            {/* Botão de Comparação */}
            <div className="mb-6">
                <button
                    onClick={compareCalculations}
                    disabled={loading || !selectedCampaign}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Comparando...' : 'Comparar Cálculos'}
                </button>
            </div>

            {/* Resultados */}
            {results && (
                <div className="space-y-6">
                    {results.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Erro</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">{results.error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Informações da Campanha */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="font-medium text-blue-800 mb-2">Informações da Campanha</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p><strong>Título:</strong> {results.campaign.title}</p>
                                        <p><strong>Tipo:</strong> {results.campaign.campaign_type}</p>
                                        <p><strong>Meta:</strong> R$ {results.campaign.target?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p><strong>Aceita em:</strong> {results.acceptedAt}</p>
                                        <p><strong>Total de Apólices:</strong> {results.totalPolicies}</p>
                                        <p><strong>Apólices Filtradas:</strong> {results.filteredPolicies}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Comparação dos Cálculos */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(results.calculations).map(([key, calc]: [string, any]) => (
                                    <div key={key} className="p-4 border border-gray-200 rounded-lg">
                                        <h4 className="font-medium text-gray-800 mb-3">{calc.name}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Valor Atual:</span>
                                                <span className="font-medium">R$ {calc.currentValue?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Progresso:</span>
                                                <span className={`font-medium ${
                                                    calc.progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'
                                                }`}>
                                                    {calc.progressPercentage?.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Apólices:</span>
                                                <span className="font-medium">{calc.policiesCount}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Barra de Progresso */}
                                        <div className="mt-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        calc.progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(calc.progressPercentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Detalhes dos Critérios */}
                                        {calc.criteriaDetails && calc.criteriaDetails.length > 0 && (
                                            <div className="mt-3">
                                                <h5 className="text-xs font-medium text-gray-600 mb-2">Critérios:</h5>
                                                <div className="space-y-1">
                                                    {calc.criteriaDetails.map((criterion: any, index: number) => (
                                                        <div key={index} className="text-xs">
                                                            <div className="flex justify-between">
                                                                <span>{criterion.criterion.policy_type || 'Todos'}</span>
                                                                <span className={criterion.isCompleted ? 'text-green-600' : 'text-gray-600'}>
                                                                    {criterion.progress.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Diagnóstico */}
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-yellow-800">Diagnóstico:</p>
                                        <div className="text-sm text-yellow-700 mt-1 space-y-1">
                                            {results.calculations.simple.progressPercentage !== results.calculations.withDateFilter.progressPercentage && (
                                                <p>• ⚠️ Diferença entre cálculo simples e com filtro de data</p>
                                            )}
                                            {results.calculations.withDateFilter.progressPercentage !== results.calculations.byCriteria.progressPercentage && (
                                                <p>• ⚠️ Diferença entre cálculo com filtro e por critérios</p>
                                            )}
                                            {results.totalPolicies !== results.filteredPolicies && (
                                                <p>• 📅 {results.totalPolicies - results.filteredPolicies} apólices foram filtradas por data</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CompareProgressCalculations;
