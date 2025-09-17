import React, { useEffect, useState } from 'react';
import { X, Target, Calendar, Gift, Users, TrendingUp, Award, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { Goal } from '../../types';
import { currencyMaskFree } from '../../utils/masks';
// Removido imports de debug
import { useGoalsNew } from '../../hooks/useGoalsNew';
import { getCampaignCriteriaDetails, CriterionProgress } from '../../services/campaignProgressAuxiliar';

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
    const [criteriaDetails, setCriteriaDetails] = useState<CriterionProgress[]>([]);
    const [loadingCriteria, setLoadingCriteria] = useState(false);

    // Carregar detalhes dos critérios quando o sidepanel abre
    useEffect(() => {
        if (campaign?.id && isOpen) {
            console.log('🔍 Carregando critérios para campanha:', campaign.id);
            console.log('🔍 Status de aceitação:', campaign.acceptance_status);
            console.log('🔍 Critérios brutos:', campaign.criteria);
            
            setLoadingCriteria(true);
            setCriteriaDetails([]); // Limpar critérios anteriores
            
            getCampaignCriteriaDetails(campaign.id)
                .then(details => {
                    console.log('📊 Critérios carregados:', details);
                    console.log('📊 Quantidade de critérios:', details.length);
                    setCriteriaDetails(details);
                })
                .catch(err => {
                    console.error('❌ Erro ao carregar critérios:', err);
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
                        {/* Foto do Prêmio (Hero Image Maior) */}
                        {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 ? (
                            <div className="relative h-64 w-full">
                                {campaign.campanhas_premios[0].premio?.imagem_url ? (
                                    <img 
                                        src={campaign.campanhas_premios[0].premio.imagem_url} 
                                        alt={campaign.campanhas_premios[0].premio.nome}
                                        className="w-full h-full object-cover rounded-none"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Gift className="w-20 h-20 text-white" />
                                    </div>
                                )}
                                {/* Badge de Status sobreposto */}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge()}
                                </div>
                            </div>
                        ) : (
                            <div className="relative h-48 w-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Gift className="w-16 h-16 mx-auto mb-2" />
                                    <p className="text-sm">Nenhum prêmio configurado</p>
                                </div>
                                {/* Badge de Status sobreposto */}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge()}
                                </div>
                            </div>
                        )}

                        <div className="p-4 space-y-4">
                            {/* Nome do Prêmio */}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 mb-1">
                                    {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && campaign.campanhas_premios[0].premio?.nome 
                                        ? campaign.campanhas_premios[0].premio.nome 
                                        : 'Prêmio da Campanha'
                                    }
                                </h1>
                                {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && campaign.campanhas_premios[0].premio?.valor_estimado && (
                                    <div className="text-lg font-semibold text-green-600 mb-1">
                                        {currencyMaskFree(campaign.campanhas_premios[0].premio.valor_estimado.toString())}
                                    </div>
                                )}
                                <div className="text-sm text-gray-600 mb-2">
                                    {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 ? (
                                        <>
                                            {campaign.campanhas_premios[0].premio?.descricao || 'Descrição do prêmio'} • Quantidade: {campaign.campanhas_premios[0].quantidade}
                                        </>
                                    ) : (
                                        'Informações do prêmio serão exibidas quando configurado'
                                    )}
                                </div>
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

                            {progressPercentage > 100 && (
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

                            {/* Mensagem para campanhas com critérios */}
                            {!isPending && !isRejected && criteriaDetails.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Campanha com Critérios Específicos</span>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                        O progresso é calculado individualmente para cada critério abaixo. 
                                        Todos os critérios devem ser 100% atingidos para conquistar o prêmio.
                                    </p>
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
                                    {isPending && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Target className="w-4 h-4 text-yellow-600" />
                                                <span className="text-sm font-medium text-yellow-800">O que você precisa fazer para ganhar:</span>
                                            </div>
                                            <div className="text-sm text-yellow-700">
                                                Critérios definidos pelo administrador - aceite para ver os detalhes
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Progresso detalhado APÓS aceitar */}
                                    {!isPending && criteriaDetails.length > 0 && (
                                        <div className="space-y-4">
                                            {criteriaDetails.map((detail, index) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 capitalize">
                                                                {detail.policyType}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {detail.targetType === 'quantity' 
                                                                    ? `Meta: ${detail.targetValue} apólices`
                                                                    : `Meta: ${currencyMaskFree(detail.targetValue.toString())}`
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-sm font-medium ${
                                                                detail.isThisCriterionMet ? 'text-green-600' : 'text-gray-600'
                                                            }`}>
                                                                {detail.percentage.toFixed(1)}%
                                                            </span>
                                                            {detail.isThisCriterionMet && (
                                                                <div className="text-xs text-green-600">✅ Atingido</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Progresso atual vs meta */}
                                                    <div className="flex justify-between text-sm text-gray-700 mb-2">
                                                        <span>
                                                            {detail.targetType === 'quantity'
                                                                ? `${detail.currentProgress} apólices`
                                                                : currencyMaskFree(detail.currentProgress.toString())
                                                            }
                                                        </span>
                                                        <span className="text-gray-500">
                                                            de {detail.targetType === 'quantity'
                                                                ? `${detail.targetValue} apólices`
                                                                : currencyMaskFree(detail.targetValue.toString())
                                                            }
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Barra de progresso individual */}
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                detail.isThisCriterionMet ? 'bg-green-500' : 'bg-blue-500'
                                                            }`}
                                                            style={{ width: `${Math.min(detail.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Apólices vinculadas */}
                                                    {detail.matchingPolicies.length > 0 && (
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            {detail.matchingPolicies.length} apólice(s) vinculada(s)
                                                        </div>
                                                    )}
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
