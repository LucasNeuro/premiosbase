import React, { useState, useEffect } from 'react';
import { Clock, Target, CheckCircle, XCircle, Award, AlertCircle, TrendingUp, Calendar, User, Gift, Link, Brain, Zap, Info } from 'lucide-react';
import { CampaignTimelineService, CampaignTimelineEvent, PolicyLaunchAudit } from '../../services/CampaignTimelineService';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { currencyMaskFree } from '../../utils/masks';
import LocalStorageAuditDisplay from './LocalStorageAuditDisplay';

interface CampaignTimelineProps {
    isOpen: boolean;
    onClose: () => void;
}

const CampaignTimeline: React.FC<CampaignTimelineProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [timelineEvents, setTimelineEvents] = useState<CampaignTimelineEvent[]>([]);
    const [policyAnalyses, setPolicyAnalyses] = useState<PolicyLaunchAudit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'analysis'>('timeline');
    const [analyzing, setAnalyzing] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadTimelineData();
        }
    }, [isOpen, user?.id]);

    const loadTimelineData = async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            // Carregar timeline de campanhas
            const timelineResult = await CampaignTimelineService.getUserTimeline(user.id, 30);
            if (timelineResult.success && timelineResult.data) {
                setTimelineEvents(timelineResult.data);
            }

            // Carregar análises de apólices
            const analysisResult = await CampaignTimelineService.getUserPolicyAnalyses(user.id, 30);
            if (analysisResult.success && analysisResult.data) {
                setPolicyAnalyses(analysisResult.data);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const runAIAnalysis = async (policyId: string, campaignId: string) => {
        if (!user?.id) return;

        setAnalyzing(policyId);
        try {
            const result = await CampaignTimelineService.analyzePolicyCampaignWithAI(
                policyId,
                campaignId,
                user.id
            );

            if (result.success) {
                setError(null);
                await loadTimelineData(); // Recarregar dados
            } else {
                setError(result.error || 'Erro na análise IA');
            }
        } catch (err: any) {
            setError(err.message || 'Erro na análise IA');
        } finally {
            setAnalyzing(null);
        }
    };

    const getActionIcon = (event: CampaignTimelineEvent) => {
        if (event.linked_automatically) {
            return <Brain className="w-4 h-4 text-purple-600" />;
        }
        return <Link className="w-4 h-4 text-blue-600" />;
    };

    const getActionColor = (event: CampaignTimelineEvent) => {
        if (event.linked_automatically) {
            return 'bg-purple-100 text-purple-800 border-purple-200';
        }
        return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getAnalysisIcon = (audit: PolicyLaunchAudit) => {
        if (audit.linked_campaigns_count > 0) {
            return <CheckCircle className="w-4 h-4 text-green-600" />;
        }
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    };

    const getAnalysisColor = (audit: PolicyLaunchAudit) => {
        if (audit.linked_campaigns_count > 0) {
            return 'bg-green-100 text-green-800 border-green-200';
        }
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Sidepanel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-[#1e293b]" />
                            <h2 className="text-xl font-bold text-[#1e293b]">Timeline de Campanhas</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5 text-[#1e293b]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'timeline'
                                    ? 'text-[#1e293b] border-b-2 border-[#1e293b] bg-gray-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Timeline de Campanhas
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'analysis'
                                    ? 'text-[#1e293b] border-b-2 border-[#1e293b] bg-gray-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Target className="w-4 h-4" />
                                Análise de Apólices
                            </div>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Spinner />
                            </div>
                        ) : error ? (
                            <Alert type="error" message={error} />
                        ) : (
                            <>
                                {activeTab === 'timeline' && (
                                    <div className="space-y-4">
                                    {timelineEvents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Nenhuma atividade ainda
                                            </h3>
                                            <p className="text-gray-500">
                                                As ações das suas campanhas aparecerão aqui em tempo real
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {timelineEvents.map((event) => (
                                                <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        {getActionIcon(event)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge className={getActionColor(event)}>
                                                                {event.linked_automatically ? 'Vinculação Automática' : 'Vinculação Manual'}
                                                            </Badge>
                                                            <span className="text-sm text-gray-500">
                                                                {formatDate(event.linked_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-900 font-medium mb-1">
                                                            {event.policy?.policy_number} → {event.campaign?.title}
                                                        </p>
                                                        {event.policy && (
                                                            <p className="text-sm text-gray-600">
                                                                {event.policy.type} • {currencyMaskFree(event.policy.premium_value.toString())}
                                                            </p>
                                                        )}
                                                        {event.ai_confidence && (
                                                            <div className="mt-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500">Confiança IA:</span>
                                                                    <span className="text-xs font-medium">{event.ai_confidence}%</span>
                                                                </div>
                                                                {event.ai_reasoning && (
                                                                    <p className="text-xs text-gray-500 mt-1">{event.ai_reasoning}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'analysis' && (
                                <div className="space-y-4">
                                    {user?.id ? (
                                        <LocalStorageAuditDisplay userId={user.id} />
                                    ) : (
                                        <div className="text-center py-12">
                                            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Usuário não identificado
                                            </h3>
                                            <p className="text-gray-500">
                                                Faça login para ver as análises
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'analysis_old' && (
                                <div className="space-y-4">
                                    {policyAnalyses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Nenhuma análise ainda
                                            </h3>
                                            <p className="text-gray-500">
                                                As análises das suas apólices aparecerão aqui
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {policyAnalyses.map((audit) => (
                                                <div key={audit.id} className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0">
                                                            {getAnalysisIcon(audit)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className={getAnalysisColor(audit)}>
                                                                    {audit.linked_campaigns_count > 0 ? 'Com Campanhas' : 'Sem Campanhas'}
                                                                </Badge>
                                                                <span className="text-sm text-gray-500">
                                                                    {formatDate(audit.created_at)}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="mb-3">
                                                                <p className="text-gray-900 font-medium">
                                                                    Apólice: {audit.policy_number}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {audit.policy_type} • {currencyMaskFree(audit.premium_value.toString())}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    CPD: {audit.cpd_number} • {audit.contract_type}
                                                                </p>
                                                            </div>

                                                            {/* Análise IA Detalhada */}
                                                            {audit.ai_analysis && typeof audit.ai_analysis === 'object' && (
                                                                <div className="mb-4 p-3 bg-white rounded-lg border">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Brain className="w-4 h-4 text-purple-600" />
                                                                        <span className="font-medium text-gray-900">Análise IA Detalhada</span>
                                                                        <Badge className={`${
                                                                            audit.ai_analysis.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                                                            audit.ai_analysis.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                            {audit.ai_analysis.confidence}% Confiança
                                                                        </Badge>
                                                                    </div>

                                                                    {/* Status da Análise */}
                                                                    <div className="mb-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="text-sm font-medium text-gray-700">Status:</span>
                                                                            <Badge className={`${
                                                                                audit.ai_analysis.criteriaMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {audit.ai_analysis.criteriaMatch ? '✅ Atende Critérios' : '❌ Não Atende Critérios'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>

                                                                    {/* Critérios Atendidos */}
                                                                    {audit.ai_analysis.matchedCriteria && audit.ai_analysis.matchedCriteria.length > 0 && (
                                                                        <div className="mb-3">
                                                                            <p className="text-sm font-medium text-green-700 mb-1">✅ Critérios Atendidos:</p>
                                                                            <ul className="text-xs text-green-600 space-y-1">
                                                                                {audit.ai_analysis.matchedCriteria.map((criteria: string, index: number) => (
                                                                                    <li key={index} className="flex items-start gap-1">
                                                                                        <span>•</span>
                                                                                        <span>{criteria}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                    {/* Critérios Não Atendidos */}
                                                                    {audit.ai_analysis.unmatchedCriteria && audit.ai_analysis.unmatchedCriteria.length > 0 && (
                                                                        <div className="mb-3">
                                                                            <p className="text-sm font-medium text-red-700 mb-1">❌ Critérios Não Atendidos:</p>
                                                                            <ul className="text-xs text-red-600 space-y-1">
                                                                                {audit.ai_analysis.unmatchedCriteria.map((criteria: string, index: number) => (
                                                                                    <li key={index} className="flex items-start gap-1">
                                                                                        <span>•</span>
                                                                                        <span>{criteria}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                    {/* Sugestões */}
                                                                    {audit.ai_analysis.suggestions && audit.ai_analysis.suggestions.length > 0 && (
                                                                        <div className="mb-3">
                                                                            <p className="text-sm font-medium text-blue-700 mb-1">💡 Sugestões:</p>
                                                                            <ul className="text-xs text-blue-600 space-y-1">
                                                                                {audit.ai_analysis.suggestions.map((suggestion: string, index: number) => (
                                                                                    <li key={index} className="flex items-start gap-1">
                                                                                        <span>•</span>
                                                                                        <span>{suggestion}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                    {/* Raciocínio */}
                                                                    {audit.ai_analysis.reasoning && (
                                                                        <div className="mb-3">
                                                                            <p className="text-sm font-medium text-gray-700 mb-1">🧠 Raciocínio:</p>
                                                                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                                                {audit.ai_analysis.reasoning}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Recomendação */}
                                                                    {audit.ai_analysis.recommendation && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium text-gray-700">Recomendação:</span>
                                                                            <Badge className={`${
                                                                                audit.ai_analysis.recommendation === 'aceitar' ? 'bg-green-100 text-green-800' :
                                                                                audit.ai_analysis.recommendation === 'rejeitar' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                                            }`}>
                                                                                {audit.ai_analysis.recommendation === 'aceitar' ? '✅ Aceitar' :
                                                                                 audit.ai_analysis.recommendation === 'rejeitar' ? '❌ Rejeitar' : '⚠️ Analisar Mais'}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Botão para Nova Análise IA */}
                                                            {audit.policy && (
                                                                <div className="mt-3">
                                                                    <Button
                                                                        onClick={() => runAIAnalysis(audit.policy_id, audit.linked_campaigns_details?.campaign_id || '')}
                                                                        disabled={analyzing === audit.policy_id}
                                                                        variant="secondary"
                                                                        className="flex items-center gap-2 text-xs"
                                                                    >
                                                                        {analyzing === audit.policy_id ? (
                                                                            <>
                                                                                <Spinner />
                                                                                Analisando...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Zap className="w-3 h-3" />
                                                                                Nova Análise IA
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignTimeline;
