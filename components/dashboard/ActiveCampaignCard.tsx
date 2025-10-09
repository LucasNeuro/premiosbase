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
    Users
} from 'lucide-react';

interface ActiveCampaignCardProps {
    campaign: Goal;
    onViewDetails: (campaign: Goal) => void;
}

const ActiveCampaignCard: React.FC<ActiveCampaignCardProps> = ({ 
    campaign, 
    onViewDetails 
}) => {
    const [currentPremioIndex, setCurrentPremioIndex] = useState(0);
    const [showCriteria, setShowCriteria] = useState(false);
    const [loadingCriteria, setLoadingCriteria] = useState(false);

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

    const toggleCriteria = () => {
        if (!showCriteria) {
            setLoadingCriteria(true);
            // Simular carregamento dos critérios
            setTimeout(() => {
                setLoadingCriteria(false);
            }, 1000);
        }
        setShowCriteria(!showCriteria);
    };

    // Autoplay para trocar imagens automaticamente
    useEffect(() => {
        if (campaign.campanhas_premios && campaign.campanhas_premios.length > 1) {
            const interval = setInterval(() => {
                setCurrentPremioIndex(prev => 
                    prev === campaign.campanhas_premios.length - 1 ? 0 : prev + 1
                );
            }, 4000); // Troca a cada 4 segundos

            return () => clearInterval(interval);
        }
    }, [campaign.campanhas_premios]);

    const daysRemaining = calculateDaysRemaining(campaign.end_date);
    
    // 🔧 USAR NOVO SERVIÇO UNIFICADO PARA CALCULAR PROGRESSO
    const [unifiedProgress, setUnifiedProgress] = useState<any>(null);
    const [progressLoading, setProgressLoading] = useState(false);
    
    useEffect(() => {
        const calculateProgress = async () => {
            setProgressLoading(true);
            try {
                const { UnifiedCampaignProgressServiceV2 } = await import('../../services/UnifiedCampaignProgressServiceV2');
                const result = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaign.id);
                if (result) {
                    setUnifiedProgress(result);
                    console.log('🎯 Progresso unificado calculado:', {
                        campaignId: campaign.id,
                        progressPercentage: result.progressPercentage,
                        isCompleted: result.isCompleted,
                        criteriaProgress: result.criteriaProgress
                    });
                }
            } catch (error) {
                console.error('❌ Erro ao calcular progresso unificado:', error);
                // Fallback para o valor antigo
                setUnifiedProgress({
                    progressPercentage: Math.min((campaign.progress_percentage || 0), 100),
                    isCompleted: false
                });
            } finally {
                setProgressLoading(false);
            }
        };
        
        calculateProgress();
    }, [campaign.id]);
    
    const progressPercentage = unifiedProgress?.progressPercentage || Math.min((campaign.progress_percentage || 0), 100);

    return (
        <div className="bg-[#1E293B] rounded-xl shadow-lg overflow-hidden relative">
            {/* Decorative quarter circle */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-600 opacity-20 rounded-bl-full"></div>
            
            <div className="p-6 relative z-10">
                {/* Seção do Prêmio com Carrossel */}
                {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                    <div className="relative mb-6">
                        {/* Imagem do prêmio com gradiente azul */}
                        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden">
                            {/* Imagem de fundo (simulando viagem Cancun) */}
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

                {/* Título da Campanha */}
                <h3 className="text-lg font-bold text-white mb-4">
                    {campaign.title}
                </h3>

                {/* Barra de Progresso */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">Progresso da Campanha</span>
                        <span className="text-sm font-bold text-white">
                            {progressPercentage.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                        <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Informações de Data e Prêmios em uma linha */}
                <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-green-400 font-medium">{daysRemaining} dias restantes</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-gray-400" />
                        <span className="text-green-400 font-medium">
                            {campaign.campanhas_premios?.length || 0} prêmio(s)
                        </span>
                    </div>
                </div>

                {/* Seção Colapsável dos Critérios */}
                <div className="mb-4">
                    <button
                        onClick={toggleCriteria}
                        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                    >
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-400" />
                            <span className="text-white font-medium">Critérios da Campanha</span>
                        </div>
                        {showCriteria ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {showCriteria && (
                        <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: '#4B0082' }}>
                            {loadingCriteria ? (
                                /* Skeleton Loading */
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-600 rounded w-3/4 animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Critérios Reais em Grid 2x2 */
                                <div className="grid grid-cols-2 gap-3">
                                    {(() => {
                                        // Parse do JSONB criteria
                                        let criteriaList = [];
                                        
                                        if (campaign.criteria) {
                                            try {
                                                // Se é um array, usar diretamente
                                                if (Array.isArray(campaign.criteria)) {
                                                    criteriaList = campaign.criteria;
                                                }
                                                // Se é um objeto com propriedades numéricas (como {0: {...}, 1: {...}})
                                                else if (typeof campaign.criteria === 'object') {
                                                    criteriaList = Object.values(campaign.criteria);
                                                }
                                            } catch (error) {
                                                console.error('Erro ao parsear criteria:', error);
                                            }
                                        }

                                        if (criteriaList.length === 0) {
                                            return (
                                                <div className="col-span-2 text-gray-400 text-sm">
                                                    Nenhum critério específico definido
                                                </div>
                                            );
                                        }

                                        // Informações básicas da campanha - removendo informações redundantes
                                        const goalsInfo = [];

                                        // Adicionar informações adicionais se disponíveis
                                        const additionalInfo = [];
                                        
                                        if ((campaign as any).campaign_source) {
                                            additionalInfo.push({
                                                label: 'Fonte',
                                                value: (campaign as any).campaign_source === 'traditional' ? 'Tradicional' : 'Outro',
                                                icon: <Target className="w-4 h-4 text-green-400" />
                                            });
                                        }

                                        if ((campaign as any).campaign_type) {
                                            additionalInfo.push({
                                                label: 'Tipo de Campanha',
                                                value: (campaign as any).campaign_type === 'simple' ? 'Simples' : 
                                                       (campaign as any).campaign_type === 'composite' ? 'Composta' : (campaign as any).campaign_type,
                                                icon: <TrendingUp className="w-4 h-4 text-green-400" />
                                            });
                                        }

                                        // Combinar informações da tabela goals com critérios JSONB
                                        const allCriteria = [...goalsInfo, ...additionalInfo, ...criteriaList.map((criterion, index) => {
                                            // Mapear campos do JSONB para labels e ícones
                                            let displayValue = '';
                                            let icon = <Target className="w-4 h-4 text-green-400" />;
                                            let label = '';

                                            // Mapear campos específicos do JSONB baseado na estrutura real
                                            if (criterion.policy_type) {
                                                label = 'Tipo';
                                                icon = <Shield className="w-4 h-4 text-green-400" />;
                                                displayValue = criterion.policy_type === 'auto' ? 'Auto' : 
                                                             criterion.policy_type === 'residencial' ? 'Residencial' : 
                                                             String(criterion.policy_type);
                                            } else if (criterion.target_value) {
                                                label = 'Meta';
                                                icon = <DollarSign className="w-4 h-4 text-green-400" />;
                                                displayValue = String(criterion.target_value);
                                            } else if (criterion.contract_type) {
                                                label = 'Contrato';
                                                icon = <FileText className="w-4 h-4 text-green-400" />;
                                                displayValue = criterion.contract_type === 'ambos' ? 'Ambos' : 
                                                             criterion.contract_type === 'novo' ? 'Novo' : 
                                                             criterion.contract_type === 'renovacao' ? 'Renovação' : 
                                                             String(criterion.contract_type);
                                            } else if (criterion.min_value_per_policy) {
                                                label = 'Valor Mín';
                                                icon = <Target className="w-4 h-4 text-green-400" />;
                                                displayValue = typeof criterion.min_value_per_policy === 'number' ? 
                                                             formatCurrency(criterion.min_value_per_policy) : 
                                                             String(criterion.min_value_per_policy);
                                            } else {
                                                // Fallback para outros campos
                                                const firstKey = Object.keys(criterion)[0];
                                                label = firstKey || 'Critério';
                                                displayValue = String(criterion[firstKey] || '');
                                            }

                                            return {
                                                label,
                                                value: displayValue,
                                                icon
                                            };
                                        })];

                                        // Limitar a 4 critérios principais para melhor distribuição
                                        const limitedCriteria = allCriteria.slice(0, 4);
                                        
                                        return limitedCriteria.map((criterion, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                {criterion.icon}
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-white font-medium">{criterion.label}: </span>
                                                    <span className="text-gray-300">{criterion.value}</span>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Botão de Detalhes */}
                <button
                    onClick={() => onViewDetails(campaign)}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <Eye className="w-4 h-4" />
                    Detalhes
                </button>
            </div>
        </div>
    );
};

export default ActiveCampaignCard;
