import React, { useState, useEffect } from 'react';
import { usePoliciesAuxiliar } from '../../hooks/usePoliciesAuxiliar';
import { useGoalsNew } from '../../hooks/useGoalsNew';
import { useCpds } from '../../hooks/useCpds';
import { useAuth } from '../../hooks/useAuth';
import { PolicyType, ContractType, Policy, Goal } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { currencyMaskFree, unmaskCurrency } from '../../utils/masks';
import Spinner from '../ui/Spinner';
import { FileText, Shield, DollarSign, Calendar, Building2, Plus, Building, Target, CheckCircle, X } from 'lucide-react';

const DynamicPolicyForm: React.FC = () => {
    const [policyNumber, setPolicyNumber] = useState('');
    const [type, setType] = useState<PolicyType>(PolicyType.AUTO);
    const [contractType, setContractType] = useState<ContractType>(ContractType.NOVO);
    const [premiumValue, setPremiumValue] = useState('');
    const [selectedCpd, setSelectedCpd] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [compatibleCampaigns, setCompatibleCampaigns] = useState<Goal[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
    const { addPolicy, policies } = usePoliciesAuxiliar();
    const { campaigns } = useGoalsNew();
    const { user } = useAuth();
    const { cpds, loading: cpdsLoading } = useCpds(user?.id || null);


    // Definir CPD padrão quando CPDs carregarem
    useEffect(() => {
        if (cpds.length > 0 && !selectedCpd) {
            setSelectedCpd(cpds[0].number);
        }
    }, [cpds, selectedCpd]);

    // Lógica para encontrar campanhas compatíveis
    const findCompatibleCampaigns = (policyType: PolicyType, contractType: ContractType, premiumValue: number): Goal[] => {
        // Filtrar campanhas aceitas e ativas
        const activeCampaigns = campaigns.filter(c => 
            c.acceptance_status === 'accepted' && 
            c.status === 'active' &&
            c.is_active
        );

        if (activeCampaigns.length === 0) return [];

        // Analisar compatibilidade com critérios
        const compatibleCampaigns = activeCampaigns.filter(campaign => {
            if (!campaign.criteria || !Array.isArray(campaign.criteria) || campaign.criteria.length === 0) {
                console.log(`⚠️ Campanha ${campaign.title} sem critérios específicos - ignorada no dropdown`);
                return false; // Campanhas sem critérios não aparecem no dropdown
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
        return scoredCampaigns.map(item => item.campaign);
    };

    // Encontrar campanhas compatíveis quando dados do formulário mudarem
    useEffect(() => {
        if (type && contractType && premiumValue) {
            const numericPremium = unmaskCurrency(premiumValue);
            if (numericPremium > 0) {
                const compatible = findCompatibleCampaigns(type, contractType, numericPremium);
                setCompatibleCampaigns(compatible);
                setShowCampaignDropdown(compatible.length > 0);
                
                // Auto-selecionar a primeira (melhor) campanha se houver
                if (compatible.length > 0 && !selectedCampaignId) {
                    setSelectedCampaignId(compatible[0].id);
                }
            } else {
                setCompatibleCampaigns([]);
                setShowCampaignDropdown(false);
                setSelectedCampaignId('');
            }
        } else {
            setCompatibleCampaigns([]);
            setShowCampaignDropdown(false);
            setSelectedCampaignId('');
        }
    }, [type, contractType, premiumValue, campaigns, selectedCampaignId]);

    // Resetar dropdown quando formulário é limpo
    useEffect(() => {
        if (!policyNumber && !premiumValue) {
            setCompatibleCampaigns([]);
            setShowCampaignDropdown(false);
            setSelectedCampaignId('');
        }
    }, [policyNumber, premiumValue]);

    // Função para limpar formulário
    const clearForm = () => {
        setPolicyNumber('');
        setPremiumValue('');
        setType(PolicyType.AUTO);
        setContractType(ContractType.NOVO);
        setCompatibleCampaigns([]);
        setShowCampaignDropdown(false);
        setSelectedCampaignId('');
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
                setMessage({ text: result.message, type: 'success' });
                clearForm(); // Sempre limpar quando sucesso
            } else {
                setMessage({ text: result.message, type: 'error' });
                // Também limpar em caso de erro (política "sempre limpar")
                clearForm();
            }
        } catch (error) {
            setMessage({ text: 'Erro ao salvar apólice', type: 'error' });
            // Também limpar em caso de exceção
            clearForm();
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg animate-fade-in" data-policy-form>
            <div className="p-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#1E293B] rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Registrar Nova Apólice</h3>
                    </div>
                    <p className="text-gray-600">Preencha os dados da nova apólice de seguro</p>
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

                        {/* CPD - só aparece se usuário tem múltiplos CPDs */}
                        {cpds.length > 1 && (
                            <div className="form-group">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                    <Building2 className="w-4 h-4 text-[#49de80]" />
                                    CPD
                                    <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-500">({cpds.length} disponíveis)</span>
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

                    {/* Dropdown Discreto de Campanhas Compatíveis */}
                    {showCampaignDropdown && compatibleCampaigns.length > 0 && (
                        <div className="mt-6">
                            <div className="form-group">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                    <Target className="w-4 h-4 text-[#49de80]" />
                                    Campanha Compatível
                                    <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCampaignId}
                                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#49de80] focus:border-[#49de80] transition-all duration-200"
                                    >
                                        <option value="">Não vincular a nenhuma campanha</option>
                                        {compatibleCampaigns.map((campaign) => {
                                            const prizeName = campaign.campanhas_premios?.[0]?.premio?.nome || 'Prêmio';
                                            const progress = (campaign.progress_percentage || 0).toFixed(1);
                                            const endDate = new Date(campaign.end_date).toLocaleDateString('pt-BR');
                                            return (
                                                <option key={campaign.id} value={campaign.id}>
                                                    🎯 {campaign.title} - 🎁 {prizeName} ({progress}% - até {endDate})
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {selectedCampaignId && (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center text-sm text-green-700">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Esta apólice será vinculada automaticamente à campanha selecionada
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botão de Submit */}
                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-3 px-8 py-4 bg-[#1E293B] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[200px] justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner size="sm" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    <span>Salvar Apólice</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DynamicPolicyForm;
