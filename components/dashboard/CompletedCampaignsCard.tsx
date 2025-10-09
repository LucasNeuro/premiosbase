import React, { useState, useEffect } from 'react';
import { Goal } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { 
    Award, 
    Calendar, 
    Clock, 
    Gift, 
    Target,
    X,
    CheckCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';
import { UnifiedCampaignProgressServiceV2 } from '../../services/UnifiedCampaignProgressServiceV2';

interface CompletedCampaignsCardProps {
    campaign: Goal;
    onViewDetails: (campaign: Goal) => void;
}

const CompletedCampaignsCard: React.FC<CompletedCampaignsCardProps> = ({ 
    campaign, 
    onViewDetails 
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // 🎯 ESTADO PARA CARROSSEL DE PRÊMIOS (IGUAL AO UnifiedCampaignCard)
    const [currentPremioIndex, setCurrentPremioIndex] = useState(0);

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

    const daysRemaining = calculateDaysRemaining(campaign.end_date);
    const progressPercentage = Math.min((campaign.progress_percentage || 0), 100);
    
    // Para campanhas concluídas, sempre 100% - não precisa buscar progresso

    // 🎯 FUNÇÕES DO CARROSSEL (IGUAL AO UnifiedCampaignCard)
    const goToNextPremio = () => {
        if (campaign.campanhas_premios && campaign.campanhas_premios.length > 0) {
            setCurrentPremioIndex((prevIndex) => 
                prevIndex === campaign.campanhas_premios.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const goToPreviousPremio = () => {
        if (campaign.campanhas_premios && campaign.campanhas_premios.length > 0) {
            setCurrentPremioIndex((prevIndex) => 
                prevIndex === 0 ? campaign.campanhas_premios.length - 1 : prevIndex - 1
            );
        }
    };

    const goToPremio = (index: number) => {
        setCurrentPremioIndex(index);
    };

    // Funções para controlar detalhes (IGUAL AO UnifiedCampaignCard)
    const openDetails = () => {
        setShowDetails(true);
        setLoadingDetails(true);
        
        // Simular carregamento
        setTimeout(() => {
            setLoadingDetails(false);
        }, 500);
    };

    const closeDetails = () => {
        setShowDetails(false);
        setLoadingDetails(false);
    };

    // Cor base para campanhas concluídas (verde)
    const baseColor = '#22C55E';
    const lighterTone = '#16A34A';

    return (
        <div className="relative bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:shadow-xl transition-all duration-300">
            {/* Decorative quarter circle */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-600 opacity-20 rounded-bl-full"></div>
            
            <div className="p-3 relative z-10 flex-1 flex flex-col">
                {/* 🎯 SEÇÃO DO PRÊMIO COM CARROSSEL (IGUAL AO UnifiedCampaignCard) */}
                {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                    <div className="relative mb-4 p-2">
                        {/* Imagem do prêmio com gradiente verde */}
                        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-lg overflow-hidden">
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
                                    /* Ícone estilizado de prêmio (fallback) */
                                    <div className="text-white text-center">
                                        <div className="mb-2">
                                            <Gift className="w-16 h-16 mx-auto" />
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {campaign.campanhas_premios?.[currentPremioIndex]?.premio?.nome || 'Prêmio Conquistado'}
                    </div>
                </div>
                                )}
            </div>

                            {/* Setas de navegação (apenas se houver múltiplos prêmios) */}
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
                                        {campaign.campanhas_premios?.[currentPremioIndex]?.premio?.nome || 'Prêmio Conquistado'}
                                    </h4>
                                    <p className="text-sm text-gray-200">
                                        Qtd: {campaign.campanhas_premios?.[currentPremioIndex]?.quantidade || 1} • 
                                        R$ {campaign.campanhas_premios?.[currentPremioIndex]?.premio?.valor_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                    </p>
                            </div>
                        </div>
                        
                            {/* Indicadores do carrossel (apenas se houver múltiplos) */}
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
                            
                            {/* Contador de posição (apenas se houver múltiplos) */}
                            {campaign.campanhas_premios && campaign.campanhas_premios.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {currentPremioIndex + 1}/{campaign.campanhas_premios.length}
                        </div>
                            )}
                    </div>
                </div>
                )}

                {/* Header da Campanha */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white truncate">{campaign.title}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                            {progressPercentage.toFixed(0)}%
                        </span>
                    </div>
                </div>

                {/* Barra de Progresso Principal */}
                <div className="mb-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Informações de Data e Prêmios */}
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

                            {/* Critérios da Campanha */}
                            <div className="mb-3">
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

                                                    // Para campanhas concluídas, sempre 100%
                                                    let criterionProgress = 100;

                                                    return (
                                                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                                        <span className="text-white font-medium text-sm">Critério {index + 1}</span>
                                                                    </div>
                                                                    <div className="text-gray-300 text-sm">
                                                                        {parts.join(' | ')}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* 🎯 DONUT PROGRESS (SEMPRE 100% PARA CONCLUÍDAS) */}
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
                                                                            {/* Círculo de progresso - SEMPRE VERDE PARA CONCLUÍDAS */}
                                                                            <path
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                                fill="none"
                                                                                stroke="#10B981"
                                                                                strokeWidth="2"
                                                                                strokeDasharray="100, 100"
                                                                                strokeLinecap="round"
                                                                            />
                                                                        </svg>
                                                                        {/* Porcentagem no centro */}
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <span className="text-white font-bold text-xs">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* 📊 INFORMAÇÕES DETALHADAS DO CRITÉRIO */}
                                                            <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                                                                <div className="flex justify-between items-center text-gray-300">
                                                                    <span>
                                                                        {criterion.target_type === 'quantity'
                                                                            ? `✅ Meta atingida: ${criterion.target_value} apólices`
                                                                            : `✅ Meta atingida: ${formatCurrency(criterion.target_value)}`
                                                                        }
                                                                    </span>
                                                                    <span className="font-semibold text-green-400">
                                                                        Concluído
                                                                    </span>
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

                            {/* Botões de Ação */}
                            <div className="mt-auto pt-4 flex gap-2">
                                <button
                                    onClick={closeDetails}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botão de Detalhes */}
                <button
                    onClick={openDetails}
                    className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <Target className="w-4 h-4" />
                    Ver Detalhes
                </button>
            </div>
        </div>
    );
};

export default CompletedCampaignsCard;