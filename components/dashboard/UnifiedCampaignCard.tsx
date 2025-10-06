import React, { useState, useEffect } from 'react';
import { Goal } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { 
    Calendar, 
    Clock, 
    Gift, 
    Eye,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Shield,
    DollarSign,
    FileText,
    Target,
    Users,
    Check,
    X
} from 'lucide-react';

interface UnifiedCampaignCardProps {
    campaign: Goal;
    onViewDetails: (campaign: Goal) => void;
    onAccept?: (campaignId: string) => void;
    onReject?: (campaignId: string) => void;
    showActions?: boolean;
    cardType?: 'new' | 'active' | 'rejected' | 'completed' | 'não atingidas' | 'nao_atingidas';
}

const UnifiedCampaignCard: React.FC<UnifiedCampaignCardProps> = ({ 
    campaign, 
    onViewDetails,
    onAccept,
    onReject,
    showActions = false,
    cardType = 'active'
}) => {
    const [currentPremioIndex, setCurrentPremioIndex] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const calculateDaysRemaining = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const goToPreviousPremio = () => {
        if (campaign.campanhas_premios && campaign.campanhas_premios.length > 1) {
            setCurrentPremioIndex(prev => 
                prev === 0 ? campaign.campanhas_premios.length - 1 : prev - 1
            );
        }
    };

    const goToNextPremio = () => {
        if (campaign.campanhas_premios && campaign.campanhas_premios.length > 1) {
            setCurrentPremioIndex(prev => 
                prev === campaign.campanhas_premios.length - 1 ? 0 : prev + 1
            );
        }
    };

    const goToPremio = (index: number) => {
        setCurrentPremioIndex(index);
    };

    const handleViewDetails = () => {
        setLoadingDetails(true);
        setShowDetails(true);
        
        // Simular carregamento dos detalhes
        setTimeout(() => {
            setLoadingDetails(false);
        }, 1000);
    };

    const closeDetails = () => {
        setShowDetails(false);
    };


    // Autoplay para trocar imagens automaticamente
    useEffect(() => {
        if (campaign.campanhas_premios && campaign.campanhas_premios.length > 1) {
            const interval = setInterval(() => {
                setCurrentPremioIndex(prev => 
                    prev === campaign.campanhas_premios.length - 1 ? 0 : prev + 1
                );
            }, 4000);

            return () => clearInterval(interval);
        }
    }, [campaign.campanhas_premios]);

    const daysRemaining = calculateDaysRemaining(campaign.end_date);
    const progressPercentage = Math.min((campaign.progress_percentage || campaign.current_value || 0), 100);
    
    // Debug do progresso
    console.log('Campaign Progress Debug:', {
        id: campaign.id,
        title: campaign.title,
        progress_percentage: campaign.progress_percentage,
        current_value: campaign.current_value,
        target: campaign.target,
        calculated: progressPercentage
    });

    // Definir cor de fundo baseada no tipo de card
    const getCardBackgroundColor = () => {
        switch (cardType) {
            case 'new':
                return '#062E41'; // Azul escuro para campanhas novas
            case 'active':
                return '#1E293B'; // Azul escuro para campanhas ativas
            case 'rejected':
                return '#7F1D1D'; // Vermelho escuro para campanhas rejeitadas
            case 'completed':
                return '#2B374A'; // Azul acinzentado para campanhas concluídas
            case 'não atingidas':
            case 'nao_atingidas':
                return '#062E41'; // Mesma cor das campanhas novas para não atingidas
            default:
                return '#1E293B';
        }
    };

    return (
        <div 
            className="rounded-xl shadow-lg overflow-hidden relative flex flex-col"
            style={{ 
                backgroundColor: getCardBackgroundColor(),
                height: '480px' // Altura reduzida para mobile
            }}
        >
            {/* Decorative quarter circle */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-600 opacity-20 rounded-bl-full"></div>
            
            <div className="p-3 relative z-10 flex-1 flex flex-col">
                {/* Seção do Prêmio com Carrossel */}
                {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                    <div className="relative mb-4 p-2">
                        {/* Imagem do prêmio com gradiente verde (cor da aplicação) */}
                        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-lg overflow-hidden">
                        {/* Alternativa com fundo branco: bg-white border-2 border-gray-200 */}
                            {/* Imagem de fundo */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Verificar se existe imagem real do prêmio */}
                                {campaign.campanhas_premios?.[currentPremioIndex]?.premio?.imagem_url || campaign.campanhas_premios?.[currentPremioIndex]?.premio?.imagem_miniatura_url ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={campaign.campanhas_premios[currentPremioIndex].premio.imagem_url || campaign.campanhas_premios[currentPremioIndex].premio.imagem_miniatura_url}
                                            alt={campaign.campanhas_premios[currentPremioIndex].premio.nome}
                                            className="w-full h-full object-contain rounded-lg"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    /* Ícone estilizado da praia com guarda-sol (fallback) */
                                    <div className="text-white text-center">
                                        <div className="mb-2">
                                            {/* Guarda-sol vermelho e branco */}
                                            <div className="w-16 h-16 mx-auto relative">
                                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full"></div>
                                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded-full"></div>
                                                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
                                                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                                                {/* Haste do guarda-sol */}
                                                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-yellow-600"></div>
                                            </div>
                                            {/* Areia amarela */}
                                            <div className="w-20 h-4 bg-yellow-400 rounded-full mx-auto mt-2"></div>
                                            {/* Água azul */}
                                            <div className="w-24 h-3 bg-blue-300 rounded-full mx-auto mt-1"></div>
                                        </div>
                                        <div className="text-lg font-semibold">Viagem Cancun</div>
                                    </div>
                                )}
                            </div>

                            {/* Setas de navegação */}
                            {campaign.campanhas_premios && campaign.campanhas_premios.length > 1 && (
                                <>
                                    <button
                                        onClick={goToPreviousPremio}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 z-10"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-white" />
                                    </button>
                                    <button
                                        onClick={goToNextPremio}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 z-10"
                                    >
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            )}
                            
                            {/* Overlay com informações do prêmio */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <div className="text-white">
                                    <h4 className="text-lg font-bold">
                                        {campaign.campanhas_premios?.[currentPremioIndex]?.premio?.nome || 'Viagem Cancun 5 dias'}
                                    </h4>
                                    <p className="text-sm text-gray-200">
                                        Qtd: {campaign.campanhas_premios?.[currentPremioIndex]?.quantidade || 1} • 
                                        R$ {campaign.campanhas_premios?.[currentPremioIndex]?.premio?.valor_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '22.000,00'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Indicadores do carrossel */}
                            {campaign.campanhas_premios && campaign.campanhas_premios.length > 1 && (
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                                    {campaign.campanhas_premios.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToPremio(index)}
                                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                                index === currentPremioIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                                            }`}
                                        ></button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Contador de posição */}
                            {campaign.campanhas_premios && campaign.campanhas_premios.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {currentPremioIndex + 1}/{campaign.campanhas_premios.length}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Título da Campanha com Progresso Integrado */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                            {campaign.title}
                        </h3>
                        <span className="text-base sm:text-lg font-bold text-green-400">
                            {progressPercentage > 0 ? `${progressPercentage.toFixed(0)}%` : '0%'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Informações Consolidadas em uma linha */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm mb-2 gap-1 sm:gap-0">
                    <div className="flex items-center gap-1 text-gray-300">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs">{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-green-400 font-medium text-xs">{daysRemaining} dias</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Gift className="w-3 h-3 text-gray-400" />
                        <span className="text-green-400 font-medium text-xs">
                            {campaign.campanhas_premios?.length || 0} prêmio(s)
                        </span>
                    </div>
                </div>

                {/* Descrição da Campanha */}
                {campaign.description && (
                    <div className="mb-2">
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-2">
                            {campaign.description}
                        </p>
                    </div>
                )}


                {/* Overlay de Detalhes - Cobre todo o card */}
                {showDetails && (
                    <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col animate-slide-in-left z-10">
                        <div className="p-4 flex-1 flex flex-col">
                            {/* Header do Overlay */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-bold text-lg">Detalhes da Campanha</span>
                                </div>
                                <button
                                    onClick={closeDetails}
                                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Informações Básicas - Uma única linha */}
                            <div className="mb-3">
                                {(() => {
                                    // Informações básicas da campanha
                                    const basicInfo = [
                                        {
                                            label: 'Tipo',
                                            value: campaign.type === 'valor' ? 'Valor' : 
                                                   campaign.type === 'apolices' ? 'Apólices' : 
                                                   campaign.type === 'crescimento' ? 'Crescimento' : campaign.type,
                                            icon: <TrendingUp className="w-4 h-4 text-green-400" />
                                        },
                                        {
                                            label: 'Meta',
                                            value: formatCurrency(campaign.target),
                                            icon: <DollarSign className="w-4 h-4 text-green-400" />
                                        },
                                        {
                                            label: 'Alvo',
                                            value: (campaign as any).target_type === 'individual' ? 'Individual' : 
                                                   (campaign as any).target_type === 'group' ? 'Grupo' : (campaign as any).target_type || 'Individual',
                                            icon: <Users className="w-4 h-4 text-green-400" />
                                        }
                                    ];

                                    return (
                                        <div className="flex items-center gap-4 text-sm">
                                            {basicInfo.map((info, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    {info.icon}
                                                    <span className="text-white font-medium">{info.label}: </span>
                                                    <span className="text-gray-300">{info.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Critérios da Campanha */}
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-bold text-lg">Critérios da Campanha</span>
                                </div>
                                
                                <div className="max-h-48 overflow-y-auto">
                                    {loadingDetails ? (
                                        /* Skeleton Loading para critérios */
                                        <div className="space-y-2">
                                            {[...Array(3)].map((_, index) => (
                                                <div key={index} className="p-3 bg-gray-700 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                                                                <div className="h-4 bg-gray-600 rounded w-24 animate-pulse"></div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="h-3 bg-gray-600 rounded w-full animate-pulse"></div>
                                                                <div className="h-3 bg-gray-600 rounded w-3/4 animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Skeleton do Donut Progress */}
                                                        <div className="flex-shrink-0 ml-4">
                                                            <div className="w-16 h-16 bg-gray-600 rounded-full animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Cards de Critérios */
                                        <div className="space-y-2">
                                            {(() => {
                                                // Parse do JSONB criteria
                                                let criteriaList = [];
                                                
                                                if (campaign.criteria) {
                                                    try {
                                                        if (Array.isArray(campaign.criteria)) {
                                                            criteriaList = campaign.criteria;
                                                        } else if (typeof campaign.criteria === 'object') {
                                                            criteriaList = Object.values(campaign.criteria);
                                                        }
                                                    } catch (error) {
                                                        console.error('Erro ao parsear criteria:', error);
                                                    }
                                                }

                                                if (criteriaList.length === 0) {
                                                    return (
                                                        <div className="p-3 bg-gray-700 rounded-lg text-center">
                                                            <span className="text-gray-400 text-sm">Nenhum critério específico</span>
                                                        </div>
                                                    );
                                                }

                                                return criteriaList.map((criterion, index) => {
                                                    const parts = [];
                                                    
                                                    if (criterion.policy_type) {
                                                        parts.push(`Tipo: ${criterion.policy_type === 'auto' ? 'Auto' : 
                                                                        criterion.policy_type === 'residencial' ? 'Residencial' : 
                                                                        String(criterion.policy_type)}`);
                                                    }
                                                    
                                                    if (criterion.contract_type) {
                                                        parts.push(`Contrato: ${criterion.contract_type === 'ambos' ? 'Ambos' : 
                                                                         criterion.contract_type === 'novo' ? 'Novo' : 
                                                                         criterion.contract_type === 'renovacao' ? 'Renovação' : 
                                                                         String(criterion.contract_type)}`);
                                                    }
                                                    
                                                    if (criterion.min_value_per_policy) {
                                                        parts.push(`Valor Mín: ${typeof criterion.min_value_per_policy === 'number' ? 
                                                                          formatCurrency(criterion.min_value_per_policy) : 
                                                                          String(criterion.min_value_per_policy)}`);
                                                    }
                                                    
                                                    if (criterion.target_value) {
                                                        parts.push(`Meta: ${criterion.target_type === 'quantity' ? 
                                                                      `${criterion.target_value} apólices` :
                                                                      typeof criterion.target_value === 'number' ? 
                                                                      formatCurrency(criterion.target_value) : 
                                                                      String(criterion.target_value)}`);
                                                    }

                                                    // Calcular progresso do critério (sincronizado com o progresso geral)
                                                    const criterionProgress = Math.min(progressPercentage, 100);

                                                    return (
                                                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Target className="w-4 h-4 text-green-400" />
                                                                        <span className="text-white font-medium text-sm">Critério {index + 1}</span>
                                                                    </div>
                                                                    <div className="text-gray-300 text-sm">
                                                                        {parts.join(' | ')}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Donut Progress do Critério */}
                                                                <div className="flex-shrink-0 ml-4">
                                                                    <div className="relative w-16 h-16">
                                                                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                                                            {/* Círculo de fundo */}
                                                                            <path
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                                fill="none"
                                                                                stroke="#374151"
                                                                                strokeWidth="2"
                                                                            />
                                                                            {/* Círculo de progresso */}
                                                                            <path
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                                fill="none"
                                                                                stroke="#10B981"
                                                                                strokeWidth="2"
                                                                                strokeDasharray={`${criterionProgress}, 100`}
                                                                                strokeLinecap="round"
                                                                            />
                                                                        </svg>
                                                                        {/* Porcentagem no centro */}
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <span className="text-white font-bold text-xs">
                                                                                {criterionProgress.toFixed(0)}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botões de Ação - Sempre no final */}
                <div className="flex gap-1 mt-auto">
                    <button
                        onClick={handleViewDetails}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-3 sm:py-3 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                    >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        Detalhes
                    </button>
                    
                    {showActions && (
                        <>
                            {onAccept && (
                                <button
                                    onClick={() => onAccept(campaign.id)}
                                    className="bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-2 sm:py-3 sm:px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                >
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            )}
                            
                            {onReject && (
                                <button
                                    onClick={() => onReject(campaign.id)}
                                    className="bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-2 sm:py-3 sm:px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

export default UnifiedCampaignCard;
