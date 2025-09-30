import React, { useState, useCallback, useEffect } from 'react';
import { useGoalsNew } from '../../hooks/useGoalsNew';
import { useRealtimeListener } from '../../hooks/useRealtimeEvents';
import { useCampaignsStore } from '../../stores/useCampaignsStore';
import { useCacheManager } from '../../hooks/useCacheManager';
import { calculateDaysRemaining } from '../../utils/dateUtils';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import CampaignDetailsSidepanel from './CampaignDetailsSidepanel';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    Target, 
    Gift, 
    Eye, 
    Calendar,
    TrendingUp,
    Users,
    Award,
} from 'lucide-react';
import PremioHeroHeader from '../ui/PremioHeroHeader';
import ModernCriteriaCard from '../ui/ModernCriteriaCard';
import { currencyMaskFree } from '../../utils/masks';
import { Goal } from '../../types';

const CampaignsKanban: React.FC = () => {
    const { campaigns, pendingCampaigns, acceptCampaign, rejectCampaign, loading, error, refreshCampaigns, fetchCampaigns } = useGoalsNew();
    const [selectedCampaign, setSelectedCampaign] = useState<Goal | null>(null);
    const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
    
    // Zustand stores para cache
    const campaignsStore = useCampaignsStore();
    const cacheManager = useCacheManager();

    // Listener para atualizações em tempo real das campanhas
    useRealtimeListener('campaigns', useCallback(() => {
        // Atualização imediata para evitar dados desatualizados
        fetchCampaigns().catch(err => {
        });
        
        // Também chamar o refresh global se disponível
        if (refreshCampaigns) {
            refreshCampaigns();
        }
    }, [refreshCampaigns, fetchCampaigns]), [refreshCampaigns, fetchCampaigns]);

    // Sincronizar dados com cache (apenas na inicialização)
    useEffect(() => {
        // Se cache é válido, usar dados do cache
        if (campaignsStore.isCacheValid() && campaignsStore.campaigns.length > 0) {
            console.log('📦 CampaignsKanban: Usando dados do cache');
            // Os dados já estão no store, não precisamos fazer nada
        } else {
            console.log('🔄 CampaignsKanban: Cache inválido, buscando dados...');
            fetchCampaigns().catch(err => {
                console.error('Erro ao buscar campanhas:', err);
            });
        }
    }, []); // Removendo dependências que causam loop

    // Sincronizar dados do hook com store (apenas quando dados mudam)
    useEffect(() => {
        if (campaigns.length > 0) {
            console.log('🔄 CampaignsKanban: Sincronizando dados com store');
            campaignsStore.setCampaigns(campaigns);
            campaignsStore.setPendingCampaigns(pendingCampaigns);
        }
    }, [campaigns.length, pendingCampaigns.length]); // Apenas quando quantidade muda

    // Refresh automático baseado nas configurações
    useEffect(() => {
        const { settings } = cacheManager;
        
        if (!settings.autoRefresh || !settings.cacheEnabled) return;
        
        const interval = setInterval(() => {
            console.log('🔄 CampaignsKanban: Auto-refresh baseado em configurações...');
            fetchCampaigns().catch(err => {
                console.error('Erro no auto-refresh:', err);
            });
        }, settings.refreshInterval * 1000);
        
        return () => clearInterval(interval);
    }, []); // Removendo dependências que causam loop
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filtrar campanhas por status - EVITAR DUPLICAÇÃO usando Map com IDs
    const allCampaignsMap = new Map<string, Goal>();
    
    // Adicionar campanhas aceitas primeiro
    campaigns.forEach(c => allCampaignsMap.set(c.id, c));
    
    // Adicionar campanhas pendentes (sem sobrescrever)
    pendingCampaigns.forEach(c => {
        if (!allCampaignsMap.has(c.id)) {
            allCampaignsMap.set(c.id, c);
        }
    });
    
    const allCampaignsForDisplay = Array.from(allCampaignsMap.values());
    
    const newCampaigns = allCampaignsForDisplay.filter(c => c.acceptance_status === 'pending');
    const activeCampaigns = allCampaignsForDisplay.filter(c => c.status === 'active' && c.acceptance_status === 'accepted');
    const rejectedCampaigns = allCampaignsForDisplay.filter(c => 
        c.acceptance_status === 'rejected' || 
        (c.status === 'cancelled' && c.acceptance_status === 'accepted') // Campanhas expiradas/não atingidas
    );
    const completedCampaigns = allCampaignsForDisplay.filter(c => c.status === 'completed');

    const handleAccept = async (campaignId: string) => {
        setActionLoading(campaignId);
        
        try {
            await acceptCampaign(campaignId);
            
            // Atualizar cache imediatamente
            campaignsStore.acceptCampaign(campaignId);
            
            // Refresh automático após aceitar
            console.log('🔄 Campanha aceita, atualizando dados...');
            setTimeout(() => {
                fetchCampaigns().catch(err => {
                    console.error('Erro ao atualizar após aceitar:', err);
                });
            }, 1000);
        } catch (error) {
            console.error('Erro ao aceitar campanha:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (campaignId: string) => {
        setActionLoading(campaignId);
        
        try {
            await rejectCampaign(campaignId);
            
            // Atualizar cache imediatamente
            campaignsStore.rejectCampaign(campaignId);
            
            // Refresh automático após rejeitar
            console.log('🔄 Campanha rejeitada, atualizando dados...');
            setTimeout(() => {
                fetchCampaigns().catch(err => {
                    console.error('Erro ao atualizar após rejeitar:', err);
                });
            }, 1000);
        } catch (error) {
            console.error('Erro ao rejeitar campanha:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const openDetails = (campaign: Goal) => {
        setSelectedCampaign(campaign);
        setIsSidepanelOpen(true);
    };

    const closeSidepanel = () => {
        setIsSidepanelOpen(false);
        setSelectedCampaign(null);
    };

    const handleAcceptFromSidepanel = async (campaignId: string) => {
        setActionLoading(campaignId);
        await acceptCampaign(campaignId);
        setActionLoading(null);
        closeSidepanel();
        
        // Refresh automático após aceitar do sidepanel
        console.log('🔄 Campanha aceita do sidepanel, atualizando dados...');
        setTimeout(() => {
            fetchCampaigns().catch(err => {
                console.error('Erro ao atualizar após aceitar do sidepanel:', err);
            });
        }, 1000);
    };

    const handleRejectFromSidepanel = async (campaignId: string) => {
        setActionLoading(campaignId);
        await rejectCampaign(campaignId);
        setActionLoading(null);
        closeSidepanel();
        
        // Refresh automático após rejeitar do sidepanel
        console.log('🔄 Campanha rejeitada do sidepanel, atualizando dados...');
        setTimeout(() => {
            fetchCampaigns().catch(err => {
                console.error('Erro ao atualizar após rejeitar do sidepanel:', err);
            });
        }, 1000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatTarget = (campaign: Goal) => {
        if (campaign.type === 'valor') {
            return currencyMaskFree(campaign.target?.toString() || '0');
        }
        return `${campaign.target?.toLocaleString()} ${campaign.unit}`;
    };

    const CampaignCard: React.FC<{ 
        campaign: Goal; 
        showActions?: boolean; 
        columnType: 'new' | 'active' | 'rejected' | 'completed';
    }> = ({ campaign, showActions = false, columnType }) => {
        const isLoading = actionLoading === campaign.id;
        
        // Destaque especial para campanhas ativas
        const isActive = columnType === 'active';
        const cardBgClass = isActive ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-white border-gray-200';
        const titleClass = isActive ? 'text-blue-900' : 'text-gray-900';

        return (
            <Card className={`mb-4 hover:shadow-lg transition-all duration-300 ${cardBgClass} border-2 overflow-hidden`}>
                {/* Hero Header com Prêmios */}
                {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                    <PremioHeroHeader
                        premios={campaign.campanhas_premios.map(cp => ({
                            premio: {
                                id: cp.premio.id,
                                nome: cp.premio.nome,
                                imagem_miniatura_url: cp.premio.imagem_miniatura_url,
                                valor_estimado: cp.premio.valor_estimado || 0
                            },
                            quantidade: cp.quantidade
                        }))}
                        showIndicators={campaign.campanhas_premios.length > 1}
                        autoPlay={campaign.campanhas_premios.length > 1}
                        autoPlayInterval={4000}
                    />
                )}

                {/* Content */}
                <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold flex-1 mr-2 ${titleClass}`}>{campaign.title}</h3>
                        {(campaign as any).parent_campaign_id && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                <Users className="w-3 h-3 mr-1" />
                                Grupo
                            </Badge>
                        )}
                    </div>

                    {campaign.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{campaign.description}</p>
                    )}

                    {/* Informações em uma linha */}
                    <div className="flex items-center justify-between text-sm mb-2 text-gray-600">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-orange-500" />
                                <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                            </div>
                            
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className={`font-medium ${
                                    calculateDaysRemaining(campaign.end_date).urgencyLevel === 'expired' 
                                        ? 'text-red-600' 
                                        : calculateDaysRemaining(campaign.end_date).urgencyLevel === 'critical'
                                        ? 'text-red-500'
                                        : calculateDaysRemaining(campaign.end_date).urgencyLevel === 'warning'
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                }`}>
                                    {calculateDaysRemaining(campaign.end_date).label}
                                </span>
                            </div>
                        </div>

                        {/* Prêmios */}
                        {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                            <div className="flex items-center text-green-600">
                                <Gift className="w-4 h-4 mr-1" />
                                <span className="font-medium">{campaign.campanhas_premios.length} prêmio(s)</span>
                            </div>
                        )}
                    </div>



                    <div className="flex gap-2 mt-3">
                        <Button
                            variant="secondary"
                            onClick={() => openDetails(campaign)}
                            className="flex-1 border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                        </Button>

                        {showActions && (
                            <>
                                <Button
                                    onClick={() => handleAccept(campaign.id)}
                                    disabled={isLoading}
                                    className="bg-[#49de80] hover:bg-[#22c55e] text-white px-3 py-2"
                                >
                                    {isLoading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                                </Button>
                                <Button
                                    onClick={() => handleReject(campaign.id)}
                                    disabled={isLoading}
                                    className="bg-[#1E293B] hover:bg-[#334155] text-white px-3 py-2"
                                >
                                    {isLoading ? <Spinner size="sm" /> : <XCircle className="w-4 h-4" />}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    const KanbanColumn: React.FC<{
        title: string;
        icon: React.ReactNode;
        campaigns: Goal[];
        emptyMessage: string;
        columnType: 'new' | 'active' | 'rejected' | 'completed';
        color: string;
    }> = ({ title, icon, campaigns, emptyMessage, columnType, color }) => {
        // Cores modernas para cada tipo
        const colorClasses = {
            yellow: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
            blue: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
            red: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
            green: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        };

        return (
            <div className="flex-1 min-w-96">
                {/* Header moderno */}
                <div className={`${colorClasses[color as keyof typeof colorClasses]} border-2 rounded-xl p-4 mb-6 shadow-sm`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                {icon}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                                <p className="text-sm text-gray-600">
                                    {campaigns.length === 0 ? 'Nenhuma campanha' : `${campaigns.length} campanha${campaigns.length > 1 ? 's' : ''}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={`px-3 py-1 rounded-full text-sm font-bold ${
                                color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                color === 'red' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                                {campaigns.length}
                            </Badge>
                        </div>
                    </div>
                </div>
                
                {/* Cards em scroll horizontal */}
                <div className="max-h-[600px] overflow-y-auto pr-2">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                {icon}
                            </div>
                            <p className="text-sm font-medium">{emptyMessage}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map(campaign => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    showActions={columnType === 'new'}
                                    columnType={columnType}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return <Alert type="error" message={`Erro ao carregar campanhas: ${error}`} />;
    }

    return (
        <div className="animate-fade-in">
            {/* Header moderno */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1e293b]">Dashboard do Corretor</h1>
                        <p className="text-gray-600 mt-1">Gerencie suas campanhas e resgate seus prêmios</p>
                    </div>
                </div>

                {/* Abas */}
            </div>

            {/* Conteúdo das Campanhas */}
            <div className="space-y-8">
                    {/* SEÇÃO PRINCIPAL: CAMPANHAS ATIVAS EM DESTAQUE */}
                    {activeCampaigns.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#1e293b] rounded-xl">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[#1e293b]">Campanhas Ativas</h2>
                                <p className="text-gray-600">Suas campanhas em andamento - acompanhe o progresso</p>
                            </div>
                            <div className="ml-auto">
                                <div className="px-4 py-2 bg-[#49de80] text-white rounded-full font-bold">
                                    {activeCampaigns.length} ativa{activeCampaigns.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    showActions={false}
                                    columnType="active"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* SEÇÃO: CAMPANHAS NOVAS */}
                {newCampaigns.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#49de80] rounded-xl">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#1e293b]">Campanhas Novas</h3>
                                <p className="text-gray-600">Aceite as campanhas para começar a trabalhar</p>
                            </div>
                            <div className="ml-auto">
                                <div className="px-3 py-1 bg-green-100 text-[#1e293b] rounded-full text-sm font-medium">
                                    {newCampaigns.length} nova{newCampaigns.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {newCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    showActions={true}
                                    columnType="new"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* SEÇÃO: CAMPANHAS NÃO ATINGIDAS */}
                {rejectedCampaigns.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#1e293b] rounded-xl">
                                <XCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#1e293b]">Campanhas Não Atingidas</h3>
                                <p className="text-gray-600">Campanhas que não foram concluídas no prazo</p>
                            </div>
                            <div className="ml-auto">
                                <div className="px-3 py-1 bg-slate-100 text-[#1e293b] rounded-full text-sm font-medium">
                                    {rejectedCampaigns.length} não atingida{rejectedCampaigns.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {rejectedCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    showActions={false}
                                    columnType="rejected"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* SEÇÃO: CAMPANHAS CONCLUÍDAS */}
                {completedCampaigns.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#49de80] rounded-xl">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#1e293b]">Campanhas Concluídas</h3>
                                <p className="text-gray-600">Parabéns! Campanhas finalizadas com sucesso</p>
                            </div>
                            <div className="ml-auto">
                                <div className="px-3 py-1 bg-green-100 text-[#1e293b] rounded-full text-sm font-medium">
                                    {completedCampaigns.length} concluída{completedCampaigns.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {completedCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    showActions={false}
                                    columnType="completed"
                                />
                            ))}
                        </div>
                    </div>
                )}

                    {/* MENSAGEM QUANDO NÃO HÁ CAMPANHAS */}
                    {allCampaignsForDisplay.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-12 h-12 text-[#1e293b]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#1e293b] mb-2">Nenhuma campanha encontrada</h3>
                            <p className="text-gray-600">Você ainda não possui campanhas atribuídas.</p>
                        </div>
                    )}
                </div>

            {/* Sidepanel de Detalhes */}
            <CampaignDetailsSidepanel
                campaign={selectedCampaign}
                isOpen={isSidepanelOpen}
                onClose={closeSidepanel}
                onAccept={selectedCampaign?.acceptance_status === 'pending' ? handleAcceptFromSidepanel : undefined}
                onReject={selectedCampaign?.acceptance_status === 'pending' ? handleRejectFromSidepanel : undefined}
                isLoading={actionLoading === selectedCampaign?.id}
            />
        </div>
    );
};

export default CampaignsKanban;
