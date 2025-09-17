import React, { useState, useCallback } from 'react';
import { useGoalsNew } from '../../hooks/useGoalsNew';
import { useRealtimeListener } from '../../hooks/useRealtimeEvents';
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
    Award
} from 'lucide-react';
import { currencyMaskFree } from '../../utils/masks';
import { Goal } from '../../types';

const CampaignsKanban: React.FC = () => {
    const { campaigns, pendingCampaigns, acceptCampaign, rejectCampaign, loading, error, refreshCampaigns, fetchCampaigns } = useGoalsNew();
    const [selectedCampaign, setSelectedCampaign] = useState<Goal | null>(null);
    const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);

    // Listener para atualizações em tempo real das campanhas
    useRealtimeListener('campaigns', useCallback(() => {
        console.log('🎯 Kanban: Atualizando campanhas via evento em tempo real');
        // Atualização imediata para evitar dados desatualizados
        fetchCampaigns().then(() => {
            console.log('✅ Campanhas atualizadas em tempo real');
        }).catch(err => {
            console.error('❌ Erro ao atualizar campanhas:', err);
        });
        
        // Também chamar o refresh global se disponível
        if (refreshCampaigns) {
            refreshCampaigns();
        }
    }, [refreshCampaigns, fetchCampaigns]), [refreshCampaigns, fetchCampaigns]);
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
    console.log(`📊 Campanhas únicas para display: ${allCampaignsForDisplay.length} (aceitas: ${campaigns.length}, pendentes: ${pendingCampaigns.length})`);
    
    const newCampaigns = allCampaignsForDisplay.filter(c => c.acceptance_status === 'pending');
    const activeCampaigns = allCampaignsForDisplay.filter(c => c.status === 'active' && c.acceptance_status === 'accepted');
    const rejectedCampaigns = allCampaignsForDisplay.filter(c => 
        c.acceptance_status === 'rejected' || 
        (c.status === 'cancelled' && c.acceptance_status === 'accepted') // Campanhas expiradas/não atingidas
    );
    const completedCampaigns = allCampaignsForDisplay.filter(c => c.status === 'completed');

    const handleAccept = async (campaignId: string) => {
        setActionLoading(campaignId);
        await acceptCampaign(campaignId);
        setActionLoading(null);
    };

    const handleReject = async (campaignId: string) => {
        setActionLoading(campaignId);
        await rejectCampaign(campaignId);
        setActionLoading(null);
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
    };

    const handleRejectFromSidepanel = async (campaignId: string) => {
        setActionLoading(campaignId);
        await rejectCampaign(campaignId);
        setActionLoading(null);
        closeSidepanel();
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
        showProgress?: boolean;
        columnType: 'new' | 'active' | 'rejected' | 'completed';
    }> = ({ campaign, showActions = false, showProgress = false, columnType }) => {
        const progressPercentage = campaign.progress_percentage || 0;
        const isLoading = actionLoading === campaign.id;

        return (
            <Card className="p-4 mb-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 flex-1 mr-2">{campaign.title}</h3>
                    {campaign.parent_campaign_id && (
                        <Badge color="purple" size="sm">
                            <Users className="w-3 h-3 mr-1" />
                            Grupo
                        </Badge>
                    )}
                </div>

                {campaign.description && (
                    <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                )}

                <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                        <Target className="w-4 h-4 mr-2 text-[#1E293B]" />
                        <span>Meta: <strong>{formatTarget(campaign)}</strong></span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                        <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                    </div>

                    {/* Dias restantes */}
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className={`text-sm font-medium ${
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

                    {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                        <div className="flex items-center text-gray-700">
                            <Gift className="w-4 h-4 mr-2 text-[#49de80]" />
                            <span>{campaign.campanhas_premios.length} prêmio(s)</span>
                        </div>
                    )}

                    {showProgress && (
                        <div className="mt-3">
                            {/* Verificar se tem critérios específicos */}
                            {campaign.criteria && (Array.isArray(campaign.criteria) || (typeof campaign.criteria === 'string' && campaign.criteria.trim() !== '')) ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Target className="w-3 h-3 text-blue-600" />
                                        <span className="text-xs font-medium text-blue-800">Critérios Específicos</span>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                        Ver detalhes para acompanhar o progresso individual de cada critério
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Progresso</span>
                                        <span className="text-lg font-bold text-[#1E293B]">{progressPercentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                progressPercentage >= 100 ? 'bg-[#49de80]' : 'bg-[#1E293B]'
                                            }`}
                                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        />
                                    </div>
                                    {campaign.current_value && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            {campaign.type === 'valor' ? currencyMaskFree(campaign.current_value.toString()) : campaign.current_value.toLocaleString()} de {formatTarget(campaign)}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
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
                                size="sm"
                                className="bg-[#49de80] hover:bg-[#22c55e] text-white"
                            >
                                {isLoading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button
                                onClick={() => handleReject(campaign.id)}
                                disabled={isLoading}
                                size="sm"
                                className="bg-[#1E293B] hover:bg-[#334155] text-white"
                            >
                                {isLoading ? <Spinner size="sm" /> : <XCircle className="w-4 h-4" />}
                            </Button>
                        </>
                    )}
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
    }> = ({ title, icon, campaigns, emptyMessage, columnType, color }) => (
        <div className="flex-1 min-w-80">
            <div className={`bg-${color}-50 border-${color}-200 border rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {icon}
                        <h2 className="text-lg font-semibold ml-2">{title}</h2>
                    </div>
                    <Badge color={color as any} size="sm">
                        {campaigns.length}
                    </Badge>
                </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
                {campaigns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        {emptyMessage}
                    </div>
                ) : (
                    campaigns.map(campaign => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            showActions={columnType === 'new'}
                            showProgress={columnType === 'active' || columnType === 'completed'}
                            columnType={columnType}
                        />
                    ))
                )}
            </div>
        </div>
    );

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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Campanhas</h1>
                <p className="text-gray-600">
                    Gerencie suas campanhas através do quadro visual. Aceite, acompanhe o progresso e veja os resultados.
                </p>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-4">
                <KanbanColumn
                    title="Novas"
                    icon={<Clock className="w-5 h-5 text-yellow-600" />}
                    campaigns={newCampaigns}
                    emptyMessage="Nenhuma campanha nova no momento"
                    columnType="new"
                    color="yellow"
                />

                <KanbanColumn
                    title="Ativas"
                    icon={<TrendingUp className="w-5 h-5 text-[#1E293B]" />}
                    campaigns={activeCampaigns}
                    emptyMessage="Nenhuma campanha ativa"
                    columnType="active"
                    color="blue"
                />

                <KanbanColumn
                    title="Não Atingidas"
                    icon={<XCircle className="w-5 h-5 text-red-600" />}
                    campaigns={rejectedCampaigns}
                    emptyMessage="Nenhuma campanha não atingida"
                    columnType="rejected"
                    color="red"
                />

                <KanbanColumn
                    title="Concluídas"
                    icon={<Award className="w-5 h-5 text-[#49de80]" />}
                    campaigns={completedCampaigns}
                    emptyMessage="Nenhuma campanha concluída"
                    columnType="completed"
                    color="green"
                />
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
