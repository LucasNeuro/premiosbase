import React, { useState } from 'react';
import { usePolicyCampaignLinks } from '../../hooks/usePolicyCampaignLinks';
import { PolicyCampaignLinkWithAI } from '../../services/policyCampaignLinksService';
import { 
    Target, 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle, 
    XCircle,
    Info,
    BarChart3
} from 'lucide-react';

interface PolicyCampaignLinksPanelProps {
    policyId?: string;
    showStatistics?: boolean;
}

export const PolicyCampaignLinksPanel: React.FC<PolicyCampaignLinksPanelProps> = ({
    policyId,
    showStatistics = true
}) => {
    const { 
        links, 
        loading, 
        error, 
        statistics, 
        getPolicyLinks, 
        removeLink 
    } = usePolicyCampaignLinks();
    
    const [policyLinks, setPolicyLinks] = useState<PolicyCampaignLinkWithAI[]>([]);
    const [loadingPolicyLinks, setLoadingPolicyLinks] = useState(false);

    // Carregar vinculações específicas da apólice
    React.useEffect(() => {
        if (policyId) {
            setLoadingPolicyLinks(true);
            getPolicyLinks(policyId)
                .then(setPolicyLinks)
                .catch(console.error)
                .finally(() => setLoadingPolicyLinks(false));
        }
    }, [policyId, getPolicyLinks]);

    const getConfidenceColor = (confidence: number | null) => {
        if (!confidence) return 'text-gray-500';
        if (confidence >= 90) return 'text-green-600';
        if (confidence >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getConfidenceIcon = (confidence: number | null) => {
        if (!confidence) return <Info className="w-4 h-4" />;
        if (confidence >= 90) return <CheckCircle className="w-4 h-4" />;
        if (confidence >= 70) return <AlertTriangle className="w-4 h-4" />;
        return <XCircle className="w-4 h-4" />;
    };

    const getConfidenceLabel = (confidence: number | null) => {
        if (!confidence) return 'Sem análise';
        if (confidence >= 90) return 'Alta confiança';
        if (confidence >= 70) return 'Média confiança';
        return 'Baixa confiança';
    };

    const displayLinks = policyId ? policyLinks : links;

    if (loading || loadingPolicyLinks) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando vinculações...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Erro ao carregar vinculações</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estatísticas da IA */}
            {showStatistics && statistics && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Estatísticas da IA</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{statistics.total_links}</div>
                            <div className="text-sm text-blue-800">Total de Vinculações</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{statistics.high_confidence_links}</div>
                            <div className="text-sm text-green-800">Alta Confiança</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{statistics.medium_confidence_links}</div>
                            <div className="text-sm text-yellow-800">Média Confiança</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{statistics.average_confidence}%</div>
                            <div className="text-sm text-purple-800">Confiança Média</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Vinculações */}
            <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {policyId ? 'Vinculações desta Apólice' : 'Todas as Vinculações'}
                </h3>

                {displayLinks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Nenhuma vinculação encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayLinks.map((link) => (
                            <div key={link.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Cabeçalho */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                {getConfidenceIcon(link.ai_confidence)}
                                                <span className="font-medium text-gray-900">
                                                    {link.campaign?.title || 'Campanha'}
                                                </span>
                                            </div>
                                            
                                            {link.ai_confidence && (
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(link.ai_confidence)} bg-opacity-10`}>
                                                    {link.ai_confidence}% - {getConfidenceLabel(link.ai_confidence)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Informações da Apólice */}
                                        {link.policy && (
                                            <div className="text-sm text-gray-600 mb-2">
                                                <span className="font-medium">Apólice:</span> {link.policy.policy_number} 
                                                <span className="mx-2">•</span>
                                                <span className="font-medium">Tipo:</span> {link.policy.type}
                                                <span className="mx-2">•</span>
                                                <span className="font-medium">Valor:</span> R$ {link.policy.premium_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        )}

                                        {/* Raciocínio da IA */}
                                        {link.ai_reasoning && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Brain className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-800">Raciocínio da IA</span>
                                                </div>
                                                <p className="text-sm text-blue-700">{link.ai_reasoning}</p>
                                            </div>
                                        )}

                                        {/* Metadados */}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                {link.linked_automatically ? (
                                                    <>
                                                        <TrendingUp className="w-3 h-3" />
                                                        Automática
                                                    </>
                                                ) : (
                                                    <>
                                                        <Target className="w-3 h-3" />
                                                        Manual
                                                    </>
                                                )}
                                            </span>
                                            <span>{new Date(link.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => removeLink(link.id)}
                                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
