import React, { useEffect, useState } from 'react';
import { X, Target, Calendar, Gift, Users, TrendingUp, Award, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import PremioSidepanelHero from '../ui/PremioSidepanelHero';
import { Goal } from '../../types';
import { currencyMaskFree } from '../../utils/masks';
import { getContractTypeLabel } from '../../utils/contractTypeUtils';
// Removido imports de debug
import { useGoalsNew } from '../../hooks/useGoalsNew';
import { UnifiedCampaignProgressServiceV2 } from '../../services/UnifiedCampaignProgressServiceV2';

interface CampaignDetailsSidepanelProps {
    campaign: Goal | null;
    isOpen: boolean;
    onClose: () => void;
    onAccept?: (campaignId: string) => void;
    onReject?: (campaignId: string) => void;
    isLoading?: boolean;
}

const CampaignDetailsSidepanel: React.FC<CampaignDetailsSidepanelProps> = ({
    campaign,
    isOpen,
    onClose,
    onAccept,
    onReject,
    isLoading = false
}) => {
    const { fetchCampaigns } = useGoalsNew();
    const [criteriaDetails, setCriteriaDetails] = useState<any[]>([]);
    const [loadingCriteria, setLoadingCriteria] = useState(false);

    // Carregar detalhes dos critérios quando o sidepanel abre
    useEffect(() => {
        if (campaign?.id && isOpen) {
            setLoadingCriteria(true);
            setCriteriaDetails([]); // Limpar critérios anteriores
            
            UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaign.id)
                .then(progressData => {
                    if (progressData && progressData.criteriaProgress) {
                        setCriteriaDetails(progressData.criteriaProgress);
                        console.log('🎯 Critérios carregados no sidepanel:', progressData.criteriaProgress);
                    } else {
                        setCriteriaDetails([]);
                    }
                })
                .catch(err => {
                    console.error('❌ Erro ao carregar critérios no sidepanel:', err);
                    setCriteriaDetails([]);
                })
                .finally(() => setLoadingCriteria(false));
        } else {
            setCriteriaDetails([]);
        }
    }, [campaign?.id, isOpen]);

    if (!isOpen || !campaign) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatTarget = (campaign: Goal) => {
        if (campaign.type === 'valor') {
            return currencyMaskFree(campaign.target?.toString() || '0');
        }
        return `${campaign.target?.toLocaleString()} ${campaign.unit}`;
    };

    const formatCurrentValue = (campaign: Goal) => {
        if (!campaign.current_value) return '0';
        if (campaign.type === 'valor') {
            return currencyMaskFree(campaign.current_value.toString());
        }
        return campaign.current_value.toLocaleString();
    };

    const progressPercentage = campaign.progress_percentage || 0;
    const isCompleted = campaign.status === 'completed';
    const isPending = campaign.acceptance_status === 'pending';
    const isRejected = campaign.acceptance_status === 'rejected';
    
    // Verificar se todos os critérios estão 100% (se houver critérios)
    const allCriteriaCompleted = criteriaDetails.length === 0 || criteriaDetails.every(criterion => criterion.progress >= 100);
    const shouldShowMetaSuperada = progressPercentage > 100 && allCriteriaCompleted;

    const getStatusBadge = () => {
        if (isCompleted) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Award className="w-3 h-3 mr-1" />Concluída
                </span>
            );
        }
        if (isPending) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />Pendente
                </span>
            );
        }
        if (isRejected) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <X className="w-3 h-3 mr-1" />Rejeitada
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <TrendingUp className="w-3 h-3 mr-1" />Ativa
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
            
            {/* Sidepanel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex-1 mr-4">Detalhes da Campanha</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Hero de Prêmios */}
                        <div className="relative h-64 w-full">
                            {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 ? (
                                <PremioSidepanelHero
                                    premios={campaign.campanhas_premios}
                                    showIndicators={campaign.campanhas_premios.length > 1}
                                    autoPlay={campaign.campanhas_premios.length > 1}
                                    autoPlayInterval={5000}
                                />
                            ) : (
                                <div className="h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <Gift className="w-16 h-16 mx-auto mb-2" />
                                        <p className="text-sm">Nenhum prêmio configurado</p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Badge de Status sobreposto */}
                            <div className="absolute top-3 right-3 z-20">
                                {getStatusBadge()}
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Informações dos Prêmios */}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 mb-1">
                                    {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 
                                        ? campaign.campanhas_premios.length > 1 
                                            ? 'Possíveis Prêmios da Campanha'
                                            : 'Prêmio da Campanha'
                                        : 'Prêmio da Campanha'
                                    }
                                </h1>
                                
                                {(!campaign.campanhas_premios || campaign.campanhas_premios.length === 0) && (
                                    <div className="text-sm text-gray-600 mb-2">
                                        Informações do prêmio serão exibidas quando configurado
                                    </div>
                                )}
                            </div>

                            {/* Nome da Campanha */}
                            <div className="border-t pt-4">
                                <h2 className="text-lg font-bold text-gray-900 mb-2">{campaign.title}</h2>
                            </div>

                            {/* Badges de Status */}
                            {isCompleted && (
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <Award className="w-4 h-4 mr-1" />
                                    Meta Atingida
                                </div>
                            )}

                            {shouldShowMetaSuperada && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                                        <span className="text-green-800 font-medium">Meta Superada!</span>
                                    </div>
                                    <p className="text-sm text-green-700 mt-1">
                                        Você atingiu {progressPercentage.toFixed(1)}% da meta - {(progressPercentage - 100).toFixed(1)}% acima do esperado!
                                    </p>
                                </div>
                            )}

                            {/* Progresso Visual - OCULTADO para campanhas com critérios */}
                            {!isPending && !isRejected && criteriaDetails.length === 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {formatCurrentValue(campaign)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            de {formatTarget(campaign)}
                                        </span>
                                    </div>
                                    
                                    {/* Barra de Progresso Verde Completa */}
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        />
                                    </div>
                                    
                                    <div className="text-sm text-green-600 font-medium">
                                        Progresso geral da campanha
                                    </div>
                                </div>
                            )}


                            {/* Data */}
                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-2" />
                                {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                            </div>

                            {/* Critérios da Campanha - SEMPRE MOSTRAR para ajudar na decisão */}
                            {campaign.criteria && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-gray-900">Critérios da Campanha</h3>
                                        {loadingCriteria && <Spinner size="sm" />}
                                    </div>
                                    
                                    {/* SEMPRE mostrar critérios básicos primeiro (para decisão de aceitar) */}
                                    <div className="space-y-3">
                                        {Array.isArray(campaign.criteria) && campaign.criteria.map((criterion: any, index: number) => (
                                            <div key={index} className={`${isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target className={`w-4 h-4 ${isPending ? 'text-yellow-600' : 'text-blue-600'}`} />
                                                    <span className={`text-sm font-medium ${isPending ? 'text-yellow-800' : 'text-gray-800'}`}>
                                                        Critério {index + 1}:
                                                    </span>
                                                </div>
                                                <div className={`text-sm ${isPending ? 'text-yellow-700' : 'text-gray-700'}`}>
                                                    • <strong>Tipo de Apólice:</strong> {criterion.policy_type === 'auto' ? 'Seguro Auto' : 'Seguro Residencial'}
                                                    {criterion.contract_type && (
                                                        <><br />• <strong>Tipo de Contrato:</strong> {getContractTypeLabel(criterion.contract_type)}</>
                                                    )}
                                                    {criterion.min_value_per_policy && (
                                                        <><br />• <strong>Valor Mínimo por Apólice:</strong> {currencyMaskFree(criterion.min_value_per_policy.toString())}</>
                                                    )}
                                                    {criterion.min_policies_quantity && (
                                                        <><br />• <strong>Quantidade Mínima:</strong> {criterion.min_policies_quantity} apólices</>
                                                    )}
                                                    {criterion.target_value && (
                                                        <><br />• <strong>Meta Total:</strong> {
                                                            criterion.target_type === 'quantity' 
                                                                ? `${criterion.target_value} apólices`
                                                                : currencyMaskFree(criterion.target_value.toString())
                                                        }</>
                                                    )}
                                                </div>
                                                {isPending && (
                                                    <div className="mt-2 text-xs text-yellow-600 italic">
                                                        💡 Aceite a campanha para acompanhar seu progresso
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Progresso detalhado APÓS aceitar */}
                                    {!isPending && criteriaDetails.length > 0 && (
                                        <div className="space-y-4">
                                            {criteriaDetails.map((detail, index) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 capitalize">
                                                                {detail.criterion?.policy_type || 'N/A'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {detail.criterion?.target_type === 'quantity' 
                                                                    ? `Meta: ${detail.criterion?.target_value || 0} apólices`
                                                                    : `Meta: ${currencyMaskFree((detail.criterion?.target_value || 0).toString())}`
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Valor mín: {currencyMaskFree((detail.criterion?.min_value_per_policy || 0).toString())}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-sm font-medium ${
                                                                detail.isCompleted ? 'text-green-600' : 'text-gray-600'
                                                            }`}>
                                                                {detail.progress.toFixed(1)}%
                                                            </span>
                                                            {detail.isCompleted && (
                                                                <div className="text-xs text-green-600">✅ Atingido</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* 🎯 NOVA BARRA DE PROGRESSO DETALHADA */}
                                                    <div className="space-y-2">
                                                        {/* Informações detalhadas */}
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-medium text-gray-700">
                                                                {detail.criterion.target_type === 'quantity'
                                                                    ? `${detail.matchingPolicies.length} de ${detail.criterion.target_value} apólices`
                                                                    : `${currencyMaskFree(detail.totalValue.toString())} de ${currencyMaskFree(detail.criterion.target_value.toString())}`
                                                                }
                                                            </span>
                                                            <span className={`font-semibold ${
                                                                detail.isCompleted ? 'text-green-600' : 'text-blue-600'
                                                            }`}>
                                                                {detail.progress.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Barra de progresso aprimorada */}
                                                        <div className="relative">
                                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                                <div 
                                                                    className={`h-3 rounded-full transition-all duration-700 ${
                                                                        detail.isCompleted 
                                                                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                                                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                                    }`}
                                                                    style={{ width: `${Math.min(detail.progress, 100)}%` }}
                                                                />
                                                            </div>
                                                            
                                                            {/* Indicador de progresso na barra */}
                                                            {detail.progress > 10 && (
                                                                <div 
                                                                    className="absolute top-0 h-3 flex items-center justify-center"
                                                                    style={{ left: `${Math.min(detail.progress, 100)}%`, transform: 'translateX(-50%)' }}
                                                                >
                                                                    <div className="w-1 h-1 bg-white rounded-full shadow-sm"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Status detalhado */}
                                                        <div className="flex justify-between text-xs text-gray-600">
                                                            <span>
                                                                {detail.criterion.target_type === 'quantity'
                                                                    ? detail.isCompleted 
                                                                        ? `✅ Meta atingida! (${detail.matchingPolicies.length} apólices)`
                                                                        : `📋 Faltam ${detail.criterion.target_value - detail.matchingPolicies.length} apólice(s)`
                                                                    : detail.isCompleted
                                                                        ? `✅ Meta atingida! (${currencyMaskFree(detail.totalValue.toString())})`
                                                                        : `💰 Faltam ${currencyMaskFree((detail.criterion.target_value - detail.totalValue).toString())}`
                                                                }
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {detail.matchingPolicies.length} apólice(s) vendida(s)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Fallback para campanhas aceitas sem critérios carregados */}
                                    {!isPending && criteriaDetails.length === 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm text-blue-800">
                                                📋 Campanha aceita - aguardando cálculo de progresso dos critérios...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CampaignDetailsSidepanel;
