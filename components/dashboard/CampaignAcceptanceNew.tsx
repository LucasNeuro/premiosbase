import React, { useState } from 'react';
import { useGoalsNew } from '../../hooks/useGoalsNew';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import { Target, Clock, CheckCircle, XCircle, Gift, Calendar, Users } from 'lucide-react';

const CampaignAcceptanceNew: React.FC = () => {
    const { 
        pendingCampaigns, 
        acceptCampaign, 
        rejectCampaign, 
        loading 
    } = useGoalsNew();
    
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleAcceptCampaign = async (campaignId: string) => {
        setProcessingId(campaignId);
        setMessage(null);

        try {
            const result = await acceptCampaign(campaignId);
            setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        } catch (error: any) {
            setMessage({ text: 'Erro interno do sistema', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectCampaign = async (campaignId: string) => {
        setProcessingId(campaignId);
        setMessage(null);

        try {
            const result = await rejectCampaign(campaignId);
            setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        } catch (error: any) {
            setMessage({ text: 'Erro interno do sistema', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getDaysRemaining = (endDate: string) => {
        const today = new Date();
        const end = new Date(endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <Card>
                <div className="p-6 flex items-center justify-center">
                    <Spinner size="md" />
                    <span className="ml-2 text-gray-600">Carregando campanhas...</span>
                </div>
            </Card>
        );
    }

    if (pendingCampaigns.length === 0) {
        return (
            <Card>
                <div className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Nenhuma campanha pendente
                    </h3>
                    <p className="text-gray-600">
                        Todas as campanhas disponíveis já foram respondidas.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Campanhas Pendentes</h3>
                    <p className="text-sm text-gray-600">
                        {pendingCampaigns.length} campanha(s) aguardando sua resposta
                    </p>
                </div>
            </div>

            {message && (
                <Alert
                    type={message.type}
                    message={message.text}
                    onClose={() => setMessage(null)}
                    className="mb-4"
                />
            )}

            {pendingCampaigns.map((campaign) => {
                const daysRemaining = getDaysRemaining(campaign.end_date);
                const isUrgent = daysRemaining <= 7;
                const isGroupCampaign = campaign.parent_campaign_id !== null;
                
                return (
                    <Card key={campaign.id} className={`${isUrgent ? 'border-red-200 bg-red-50' : ''}`}>
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            {campaign.title}
                                        </h4>
                                        {isUrgent && (
                                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                Urgente
                                            </span>
                                        )}
                                        {isGroupCampaign && (
                                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                Campanha de Grupo
                                            </span>
                                        )}
                                    </div>
                                    
                                    {campaign.description && (
                                        <p className="text-gray-600 mb-3">{campaign.description}</p>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Meta</p>
                                                <p className="font-medium">
                                                    {campaign.type === 'valor' 
                                                        ? formatCurrency(campaign.target)
                                                        : `${campaign.target} apólices`
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Período</p>
                                                <p className="font-medium">
                                                    {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Tempo restante</p>
                                                <p className={`font-medium ${isUrgent ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {daysRemaining > 0 ? `${daysRemaining} dias` : 'Último dia'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exibir tipo de campanha */}
                                    <div className="mb-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            campaign.campaign_type === 'composite' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {campaign.campaign_type === 'composite' ? 'Campanha Composta' : 'Campanha Simples'}
                                        </span>
                                    </div>

                                    {/* Prêmios */}
                                    {campaign.campanhas_premios && campaign.campanhas_premios.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Gift className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm font-medium text-gray-700">Prêmios disponíveis:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.campanhas_premios.map((cp: any) => (
                                                    <div key={cp.id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                                        {cp.quantidade}x {cp.premio.nome}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleAcceptCampaign(campaign.id)}
                                    disabled={processingId === campaign.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {processingId === campaign.id ? (
                                        <>
                                            <Spinner size="sm" />
                                            Aceitando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Aceitar Campanha
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => handleRejectCampaign(campaign.id)}
                                    disabled={processingId === campaign.id}
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rejeitar
                                </Button>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default CampaignAcceptanceNew;

