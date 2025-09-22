import React, { useState, useEffect } from 'react';
import { usePoliciesAuxiliar } from '../../hooks/usePoliciesAuxiliar';
import { useGoalsNew } from '../../hooks/useGoalsNew';
import { useCpds } from '../../hooks/useCpds';
import { useAuth } from '../../hooks/useAuth';
import { usePolicyTimeline } from '../../hooks/usePolicyTimeline';
import { PolicyType, ContractType, Policy, Goal } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { currencyMaskFree, unmaskCurrency } from '../../utils/masks';
import Spinner from '../ui/Spinner';
import { CampaignRecommendationService } from '../../services/campaignRecommendationService';
import { FileText, Shield, DollarSign, Calendar, Building2, Plus, Building, Target, CheckCircle, X, Sparkles, Info, Clock, TrendingUp } from 'lucide-react';

interface DynamicPolicyFormProps {
    selectedPeriod?: '30' | '60' | 'geral';
    onPeriodChange?: (period: '30' | '60' | 'geral') => void;
}

const DynamicPolicyForm: React.FC<DynamicPolicyFormProps> = ({ selectedPeriod = 'geral', onPeriodChange }) => {
    const [policyNumber, setPolicyNumber] = useState('');
    const [type, setType] = useState<PolicyType>(PolicyType.AUTO);
    const [contractType, setContractType] = useState<ContractType>(ContractType.NOVO);
    const [premiumValue, setPremiumValue] = useState('');
    const [selectedCpd, setSelectedCpd] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [compatibleCampaigns, setCompatibleCampaigns] = useState<Goal[]>([]);
    const [aiRecommendedCampaigns, setAiRecommendedCampaigns] = useState<Goal[]>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
    const [useAiRecommendations, setUseAiRecommendations] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [linkedCampaigns, setLinkedCampaigns] = useState<Goal[]>([]);
    const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [showTimelineSidepanel, setShowTimelineSidepanel] = useState(false);
    const { addPolicy, policies } = usePoliciesAuxiliar();
    const { campaigns } = useGoalsNew();
    const { user } = useAuth();
    const { cpds, loading: cpdsLoading } = useCpds(user?.id || null);
    const { timelineItems, loading: timelineLoading } = usePolicyTimeline();

    // Função para filtrar políticas por período
    const getFilteredPolicies = () => {
        if (!policies || policies.length === 0) return [];
        
        const now = new Date();
        let startDate: Date;
        
        switch (selectedPeriod) {
            case '30':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '60':
                startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                break;
            case 'geral':
            default:
                return policies; // Retorna todas as políticas
        }
        
        return policies.filter(policy => {
            const policyDate = new Date(policy.registration_date);
            return policyDate >= startDate && policyDate <= now;
        });
    };

    // Calcular métricas filtradas
    const filteredPolicies = getFilteredPolicies();
    const autoPolicies = filteredPolicies.filter(p => p.type === 'Seguro Auto');
    const residentialPolicies = filteredPolicies.filter(p => p.type === 'Seguro Residencial');
    
    const totalAutoValue = autoPolicies.reduce((sum, p) => sum + p.premium_value, 0);
    const totalResidentialValue = residentialPolicies.reduce((sum, p) => sum + p.premium_value, 0);
    const totalValue = totalAutoValue + totalResidentialValue;
    
    const avgAutoPremium = autoPolicies.length > 0 ? totalAutoValue / autoPolicies.length : 0;
    const avgResidentialPremium = residentialPolicies.length > 0 ? totalResidentialValue / residentialPolicies.length : 0;

    // Iniciar auditoria em background automaticamente (DESABILITADO - pode interferir)
    // useEffect(() => {
    //     BackgroundAuditService.startBackgroundAudit();
    //     
    //     // Cleanup ao desmontar componente
    //     return () => {
    //         // Não parar o serviço aqui, pois pode ser usado por outros componentes
    //     };
    // }, []);

    // Definir CPD padrão quando CPDs carregarem
    useEffect(() => {
        if (cpds.length > 0 && !selectedCpd) {
            setSelectedCpd(cpds[0].number);
        }
    }, [cpds, selectedCpd]);

    // Sistema inteligente para análise de campanhas compatíveis
    const analyzeCompatibleCampaigns = async (policyType: PolicyType, contractType: ContractType, premiumValue: number): Promise<{ campaigns: Goal[], analysis: string }> => {
        // Filtrar campanhas aceitas e ativas
        const activeCampaigns = campaigns.filter(c => 
            c.acceptance_status === 'accepted' && 
            c.status === 'active' &&
            c.is_active
        );

        if (activeCampaigns.length === 0) {
            return { campaigns: [], analysis: 'Nenhuma campanha ativa encontrada.' };
        }

        // Analisar compatibilidade com critérios
        const compatibleCampaigns = activeCampaigns.filter(campaign => {
            if (!campaign.criteria || !Array.isArray(campaign.criteria) || campaign.criteria.length === 0) {
                return false;
            }

            return campaign.criteria.some((criterion: any) => {
                // Verificar tipo de apólice
                const policyTypeMap: { [key: string]: string } = {
                    [PolicyType.AUTO]: 'auto',
                    [PolicyType.RESIDENCIAL]: 'residencial'
                };
                
                if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policyType]) {
                    return false;
                }

                // Verificar tipo de contrato se especificado
                if (criterion.contract_type) {
                    const contractTypeMap: { [key: string]: string } = {
                        [ContractType.NOVO]: 'Novo',
                        [ContractType.RENOVACAO]: 'Renovação Bradesco'
                    };
                    
                    if (criterion.contract_type !== contractTypeMap[contractType]) {
                        return false;
                    }
                }

                // Verificar valor mínimo se especificado
                if (criterion.min_value_per_policy && premiumValue < criterion.min_value_per_policy) {
                    return false;
                }

                return true;
            });
        });

        // Ordenar por prioridade: proximidade do fim, progresso atual, valor do prêmio
        const scoredCampaigns = compatibleCampaigns.map(campaign => {
            const now = new Date();
            const endDate = new Date(campaign.end_date);
            const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            const progressPercentage = campaign.progress_percentage || 0;
            const prizeValue = campaign.campanhas_premios?.[0]?.premio?.valor_estimado || 0;

            // Score: quanto menor, melhor
            let score = 0;
            score += daysUntilEnd * 0.1; // Urgência (menos dias = melhor)
            score += (100 - progressPercentage) * 0.5; // Progresso (mais próximo de 100% = melhor)
            score -= prizeValue * 0.001; // Valor do prêmio (maior valor = melhor)

            return { campaign, score };
        });

        scoredCampaigns.sort((a, b) => a.score - b.score);
        const finalCampaigns = scoredCampaigns.map(item => item.campaign);

        // Gerar análise inteligente com Mistral AI
        let analysis = '';
        if (useAiRecommendations && finalCampaigns.length > 0) {
            try {
                // TODO: Implementar getRecommendations no CampaignRecommendationService
                // const campaignRecommendationService = new CampaignRecommendationService();
                // const recommendations = await campaignRecommendationService.getRecommendations(
                //     finalCampaigns,
                //     {
                //         policyType: policyType,
                //         contractType: contractType,
                //         premiumValue: premiumValue
                //     }
                // );

                // if (recommendations.length > 0) {
                //     analysis = `🤖 Análise Inteligente: Esta apólice será vinculada automaticamente a ${finalCampaigns.length} campanha(s) compatível(is). `;
                //     analysis += `Impacto estimado: ${recommendations.map(r => `${r.campaign.title} (+${r.impact}%)`).join(', ')}.`;
                // }
            } catch (error) {
                if (finalCampaigns.length > 0) {
                    analysis = `✅ Esta apólice será vinculada automaticamente a ${finalCampaigns.length} campanha(s) compatível(is).`;
                } else {
                    analysis = `ℹ️ Nenhuma campanha compatível encontrada para esta apólice.`;
                }
            }
        } else {
            if (finalCampaigns.length > 0) {
                analysis = `✅ Esta apólice será vinculada automaticamente a ${finalCampaigns.length} campanha(s) compatível(is).`;
            } else {
                analysis = `ℹ️ Nenhuma campanha compatível encontrada para esta apólice.`;
            }
        }

        return { campaigns: finalCampaigns, analysis };
    };

    // Nova função que usa Mistral AI para recomendações inteligentes
    const findCompatibleCampaignsWithAI = async (policyType: PolicyType, contractType: ContractType, premiumValue: number): Promise<Goal[]> => {
        if (!useAiRecommendations) {
            const { campaigns } = await analyzeCompatibleCampaigns(policyType, contractType, premiumValue);
            return campaigns;
        }

        setIsLoadingRecommendations(true);
        
        try {
            // Filtrar campanhas aceitas e ativas primeiro
            const activeCampaigns = campaigns.filter(c => 
                c.acceptance_status === 'accepted' && 
                c.status === 'active' &&
                c.is_active &&
                c.criteria && 
                Array.isArray(c.criteria) && 
                c.criteria.length > 0
            );

            if (activeCampaigns.length === 0) {
                return [];
            }

            // Aplicar filtros básicos de compatibilidade primeiro
            const basicCompatible = activeCampaigns.filter(campaign => {
                return campaign.criteria.some((criterion: any) => {
                    const policyTypeMap: { [key: string]: string } = {
                        [PolicyType.AUTO]: 'auto',
                        [PolicyType.RESIDENCIAL]: 'residencial'
                    };
                    
                    if (criterion.policy_type && criterion.policy_type !== policyTypeMap[policyType]) {
                        return false;
                    }

                    if (criterion.contract_type) {
                        const contractTypeMap: { [key: string]: string } = {
                            [ContractType.NOVO]: 'Novo',
                            [ContractType.RENOVACAO]: 'Renovação Bradesco'
                        };
                        
                        if (criterion.contract_type !== contractTypeMap[contractType]) {
                            return false;
                        }
                    }

                    if (criterion.min_value_per_policy && premiumValue < criterion.min_value_per_policy) {
                        return false;
                    }

                    return true;
                });
            });

            // Usar Mistral AI para recomendações inteligentes
            const aiRecommendations = await CampaignRecommendationService.getRecommendedCampaigns({
                policyType,
                contractType,
                premiumValue,
                availableCampaigns: basicCompatible
            });

            setAiRecommendedCampaigns(aiRecommendations);
            return aiRecommendations;

        } catch (error) {
            // Fallback para lógica tradicional
            const { campaigns } = await analyzeCompatibleCampaigns(policyType, contractType, premiumValue);
            return campaigns;
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    // Encontrar campanhas compatíveis quando dados do formulário mudarem
    useEffect(() => {
        const findCampaigns = async () => {
            if (type && contractType && premiumValue) {
                const numericPremium = unmaskCurrency(premiumValue);
                if (numericPremium > 0) {
                    const { campaigns: compatible } = await analyzeCompatibleCampaigns(type, contractType, numericPremium);
                    setCompatibleCampaigns(compatible);
                    setShowCampaignDropdown(compatible.length > 0);
                    
                    // Auto-selecionar a primeira (melhor) campanha se houver e não foi selecionada outra
                    if (compatible.length > 0 && !selectedCampaignId) {
                        setSelectedCampaignId(compatible[0].id);
                    }
                } else {
                    setCompatibleCampaigns([]);
                    setAiRecommendedCampaigns([]);
                    setShowCampaignDropdown(false);
                    setSelectedCampaignId('');
                }
            } else {
                setCompatibleCampaigns([]);
                setAiRecommendedCampaigns([]);
                setShowCampaignDropdown(false);
                setSelectedCampaignId('');
            }
        };

        findCampaigns();
    }, [type, contractType, premiumValue, campaigns, useAiRecommendations]);

    // Resetar dropdown quando formulário é limpo
    useEffect(() => {
        if (!policyNumber && !premiumValue) {
            setCompatibleCampaigns([]);
            setShowCampaignDropdown(false);
            setSelectedCampaignId('');
        }
    }, [policyNumber, premiumValue]);

    // Função para limpar formulário
    const clearForm = (showMessage = false) => {
        setPolicyNumber('');
        setPremiumValue('');
        setType(PolicyType.AUTO);
        setContractType(ContractType.NOVO);
        setCompatibleCampaigns([]);
        setShowCampaignDropdown(false);
        setSelectedCampaignId('');
        setLinkedCampaigns([]);
        setMessage(null);
        
        // Mostrar mensagem de confirmação se limpeza manual
        if (showMessage) {
            setMessage({ 
                text: '✅ Formulário limpo com sucesso!', 
                type: 'success' 
            });
            // Limpar mensagem após 2 segundos
            setTimeout(() => setMessage(null), 2000);
        }
        
        // Manter o CPD selecionado para facilitar o uso
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);
        
        if (!policyNumber || !premiumValue) {
            setMessage({ text: 'Todos os campos obrigatórios devem ser preenchidos.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            const numericPremium = unmaskCurrency(premiumValue);
            
            // Análise inteligente das campanhas compatíveis
            const { campaigns: compatibleCampaigns, analysis } = await analyzeCompatibleCampaigns(type, contractType, numericPremium);
            
            // Salvar apólice
            const result = await addPolicy({
                user_id: user?.id || '',
                policy_number: policyNumber,
                type,
                contract_type: contractType,
                premium_value: numericPremium,
                cpd_number: selectedCpd,
                status: 'active'
            });

            if (result.success) {
                // Mostrar análise inteligente
                setMessage({ 
                    text: `${result.message} ${analysis}`, 
                    type: 'success' 
                });
                setLinkedCampaigns(compatibleCampaigns);
                
                // Limpar formulário após mostrar a mensagem de sucesso
                setTimeout(() => {
                    clearForm();
                }, 3000); // Aguarda 3 segundos para mostrar a mensagem
            } else {
                // Mostrar erro e limpar formulário para nova tentativa
                setMessage({ text: result.message, type: 'error' });
                // Limpar formulário após erro para facilitar nova tentativa
                setTimeout(() => clearForm(), 2000); // Limpa após 2 segundos
            }
        } catch (error) {
            setMessage({ text: 'Erro ao salvar apólice', type: 'error' });
            // Limpar formulário após erro para facilitar nova tentativa
            setTimeout(() => clearForm(), 2000); // Limpa após 2 segundos
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg animate-fade-in" data-policy-form>
            <div className="p-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1E293B] rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Registrar Nova Apólice</h3>
                    </div>
                        {/* Badge IA Ativa */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">IA Ativa</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`alert ${
                            message.type === 'success' 
                                ? 'alert-success' 
                                : 'alert-error'
                        }`}>
                            <span>{message.text}</span>
                        </div>
                    )}
                    
                    {/* Campos Básicos - Grid 5 colunas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {/* Número da Apólice */}
                        <div className="form-group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <FileText className="w-4 h-4 text-[#49de80]" />
                                Número da Apólice
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={policyNumber}
                                onChange={(e) => setPolicyNumber(e.target.value)}
                                placeholder="Digite o número"
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                                required
                            />
                        </div>

                        {/* Tipo de Seguro */}
                        <div className="form-group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <Shield className="w-4 h-4 text-[#49de80]" />
                                Tipo de Seguro
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as PolicyType)}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                            >
                                <option value={PolicyType.AUTO}>Seguro Auto</option>
                                <option value={PolicyType.RESIDENCIAL}>Seguro Residencial</option>
                            </select>
                        </div>

                        {/* Tipo de Contrato */}
                        <div className="form-group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <Calendar className="w-4 h-4 text-[#49de80]" />
                                Tipo de Contrato
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value as ContractType)}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                            >
                                <option value={ContractType.NOVO}>🆕 Novo</option>
                                <option value={ContractType.RENOVACAO}>🏢 Renovação Bradesco</option>
                            </select>
                        </div>

                        {/* CPD - sempre aparece, mesmo com apenas 1 CPD */}
                        {cpds.length > 0 && (
                            <div className="form-group">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                    <Building2 className="w-4 h-4 text-[#49de80]" />
                                    CPD
                                    <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-500">({cpds.length} disponível{cpds.length > 1 ? 'is' : ''})</span>
                                </label>
                                <select
                                    value={selectedCpd}
                                    onChange={(e) => setSelectedCpd(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                                    required
                                >
                                    {cpds.map((cpd) => (
                                        <option key={cpd.id} value={cpd.number}>
                                            {cpd.name} ({cpd.number})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Valor do Prêmio */}
                        <div className="form-group">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <DollarSign className="w-4 h-4 text-[#49de80]" />
                                Valor do Prêmio
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={premiumValue}
                                onChange={(e) => setPremiumValue(currencyMaskFree(e.target.value))}
                                placeholder="R$ 0,00"
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                                required
                            />
                        </div>
                    </div>

                    {/* Seção de campanhas removida - sistema automático */}
                    {false && (
                        <div className="mt-6">
                            <div className="form-group">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        {useAiRecommendations ? (
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                        ) : (
                                            <Target className="w-4 h-4 text-[#49de80]" />
                                        )}
                                        {useAiRecommendations ? 'Campanhas Recomendadas por IA' : 'Campanha Compatível'}
                                        <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                                    </label>
                                    
                                    {/* Toggle AI/Manual */}
                                    <button
                                        type="button"
                                        onClick={() => setUseAiRecommendations(!useAiRecommendations)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {useAiRecommendations ? (
                                            <>
                                                <Sparkles className="w-3 h-3 text-purple-500" />
                                                IA Ativa
                                            </>
                                        ) : (
                                            <>
                                                <Target className="w-3 h-3 text-gray-500" />
                                                Manual
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Loading State */}
                                {isLoadingRecommendations && (
                                    <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl mb-3">
                                        <Spinner size="sm" />
                                        <span className="text-sm text-purple-700">
                                            🤖 IA analisando as melhores campanhas para você...
                                        </span>
                                    </div>
                                )}

                                {/* Dropdown */}
                                {compatibleCampaigns.length > 0 && (
                                    <div className="relative">
                                        <select
                                            value={selectedCampaignId}
                                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                                        >
                                            <option value="">Não vincular a nenhuma campanha</option>
                                            {compatibleCampaigns.map((campaign, index) => {
                                                const prizeName = campaign.campanhas_premios?.[0]?.premio?.nome || 'Prêmio';
                                                const progress = (campaign.progress_percentage || 0).toFixed(1);
                                                const endDate = new Date(campaign.end_date).toLocaleDateString('pt-BR');
                                                const isAiRecommended = useAiRecommendations && aiRecommendedCampaigns.some(rec => rec.id === campaign.id);
                                                
                                                return (
                                                    <option key={campaign.id} value={campaign.id}>
                                                        {isAiRecommended ? '🤖✨' : '🎯'} {campaign.title} - 🎁 {prizeName} ({progress}% - até {endDate})
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        {/* Insight da campanha selecionada */}
                                        {selectedCampaignId && useAiRecommendations && (
                                            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-purple-700">
                                                        <div className="font-medium mb-1">💡 Insight da IA:</div>
                                                        <div>
                                                            {(() => {
                                                                const selectedCampaign = compatibleCampaigns.find(c => c.id === selectedCampaignId);
                                                                return selectedCampaign ? CampaignRecommendationService.getCampaignInsight(selectedCampaign) : 'Campanha selecionada.';
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Confirmação padrão */}
                                        {selectedCampaignId && !useAiRecommendations && (
                                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center text-sm text-green-700">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Esta apólice será vinculada automaticamente à campanha selecionada
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Nenhuma campanha compatível */}
                                {!isLoadingRecommendations && compatibleCampaigns.length === 0 && (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Info className="w-4 h-4" />
                                            {useAiRecommendations 
                                                ? '🤖 IA não encontrou campanhas relevantes para esta apólice.'
                                                : 'Nenhuma campanha compatível encontrada para esta apólice.'
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Grupo de Botões - Canto Inferior Esquerdo */}
                    <div className="flex justify-start gap-4 pt-6">
                        {/* Primeiro Grupo de Botões */}
                        <div className="flex">
                            {/* Botão Timeline */}
                            <button
                                type="button"
                                onClick={() => setShowTimelineSidepanel(true)}
                                className="group flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white font-medium text-sm rounded-l-lg rounded-r-none shadow-md hover:shadow-lg hover:bg-[#49de80] transition-all duration-300"
                            >
                                <Calendar className="w-4 h-4 group-hover:animate-pulse" />
                                <span>Timeline</span>
                            </button>

                            {/* Botão Limpar */}
                            <button
                                type="button"
                                onClick={() => clearForm(true)}
                                className="group flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white font-medium text-sm shadow-md hover:shadow-lg hover:bg-[#49de80] transition-all duration-300"
                            >
                                <X className="w-4 h-4 group-hover:animate-pulse" />
                                <span>Limpar</span>
                            </button>

                            {/* Botão Salvar com IA */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                                className="group relative flex items-center gap-2 px-6 py-2 bg-[#1e293b] text-white font-medium text-sm rounded-r-lg rounded-l-none shadow-md hover:shadow-lg hover:bg-[#49de80] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner size="sm" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                        <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                                        <span>Salvar</span>
                                </>
                            )}
                        </button>
                        </div>

                        {/* Segundo Grupo de Botões */}
                        <div className="flex">
                            {/* Botão 30 dias */}
                            <button
                                type="button"
                                onClick={() => onPeriodChange?.('30')}
                                className={`group flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-l-lg rounded-r-none shadow-md transition-all duration-300 ${
                                    selectedPeriod === '30' 
                                        ? 'bg-[#49de80] text-white' 
                                        : 'bg-[#1e293b] text-white hover:bg-[#49de80] hover:shadow-lg'
                                }`}
                            >
                                <span>30 dias</span>
                            </button>

                            {/* Botão 60 dias */}
                            <button
                                type="button"
                                onClick={() => onPeriodChange?.('60')}
                                className={`group flex items-center gap-2 px-4 py-2 font-medium text-sm shadow-md transition-all duration-300 ${
                                    selectedPeriod === '60' 
                                        ? 'bg-[#49de80] text-white' 
                                        : 'bg-[#1e293b] text-white hover:bg-[#49de80] hover:shadow-lg'
                                }`}
                            >
                                <span>60 dias</span>
                            </button>

                            {/* Botão Geral */}
                            <button
                                type="button"
                                onClick={() => onPeriodChange?.('geral')}
                                className={`group flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-r-lg rounded-l-none shadow-md transition-all duration-300 ${
                                    selectedPeriod === 'geral' 
                                        ? 'bg-[#49de80] text-white' 
                                        : 'bg-[#1e293b] text-white hover:bg-[#49de80] hover:shadow-lg'
                                }`}
                            >
                                <span>Geral</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Sidepanel Timeline */}
            {showTimelineSidepanel && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Overlay */}
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => setShowTimelineSidepanel(false)}
                    />
                    
                    {/* Sidepanel */}
                    <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-2xl transform transition-transform">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-[#1e293b]" />
                                    <h2 className="text-xl font-bold text-[#1e293b]">Timeline de Apólices</h2>
                                </div>

                                <button
                                    onClick={() => setShowTimelineSidepanel(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-[#1e293b]" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {timelineLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Spinner size="lg" />
                                        <span className="ml-2 text-gray-600">Carregando timeline...</span>
                                    </div>
                                ) : timelineItems.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">Nenhuma apólice lançada ainda</p>
                                        <p className="text-sm text-gray-500">As apólices aparecerão aqui em tempo real</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {timelineItems.map((item, index) => {
                                            // Usar apenas azul e verde alternadamente
                                            const isEven = index % 2 === 0;
                                            const dotColor = isEven ? 'bg-[#49de80]' : 'bg-[#1e293b]';
                                            const cardBg = isEven ? 'bg-green-50' : 'bg-slate-50';
                                            const cardBorder = isEven ? 'border-green-200' : 'border-slate-200';
                                            const textColor = isEven ? 'text-[#49de80]' : 'text-[#1e293b]';
                                            const iconColor = isEven ? 'text-[#49de80]' : 'text-[#1e293b]';
                                            
                                            return (
                                                <div key={item.id} className="relative">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`flex-shrink-0 w-3 h-3 ${dotColor} rounded-full mt-2`}></div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`${cardBg} border ${cardBorder} rounded-lg p-4`}>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText className={`w-4 h-4 ${iconColor}`} />
                                                                        <span className={`text-sm font-semibold ${textColor}`}>
                                                                            Apólice #{item.policyNumber}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`text-xs ${textColor}`}>
                                                                        {item.timeAgo}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-600">
                                                                            CPD: {item.cpdName} ({item.cpdNumber})
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Shield className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-600">
                                                                            {item.policyType} - {item.contractType}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <DollarSign className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-600">
                                                                            R$ {item.premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Target className="w-3 h-3 text-[#1e293b]" />
                                                                        <span className="text-xs text-[#1e293b]">
                                                                            {item.linkedCampaignsCount} campanha{item.linkedCampaignsCount > 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm text-[#1e293b]">
                                    <span>Total: {timelineItems.length} apólices</span>
                                    <TrendingUp className="w-4 h-4 text-[#49de80]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DynamicPolicyForm;
