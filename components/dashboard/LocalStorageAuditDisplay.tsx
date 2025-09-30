import React, { useState } from 'react';
import { CheckCircle, XCircle, Brain, Target, AlertCircle, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { RealTimeAuditService } from '../../services/RealTimeAuditService';
import { useAuth } from '../../hooks/useAuth';

// Error Boundary para capturar erros
class LocalStorageAuditErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('❌ LocalStorageAuditDisplay Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-600 mb-2">Erro ao carregar análises</p>
                    <p className="text-sm text-gray-500">
                        {this.state.error?.message || 'Erro desconhecido'}
                    </p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

interface LocalStorageAuditDisplayProps {
    userId: string;
}

const LocalStorageAuditDisplay: React.FC<LocalStorageAuditDisplayProps> = ({ userId }) => {
    const [expandedAudits, setExpandedAudits] = useState<Set<string>>(new Set());
    
    const toggleAudit = (policyId: string) => {
        const newExpanded = new Set(expandedAudits);
        if (newExpanded.has(policyId)) {
            newExpanded.delete(policyId);
        } else {
            newExpanded.add(policyId);
        }
        setExpandedAudits(newExpanded);
    };

    try {
        const audits = RealTimeAuditService.getAuditsFromLocalStorage(userId);

        if (!audits || !Array.isArray(audits) || audits.length === 0) {
            return (
                <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Nenhuma análise encontrada</p>
                    <p className="text-sm text-gray-500">As análises aparecerão aqui após lançar apólices</p>
                </div>
            );
        }

    return (
        <div className="space-y-6">
            {audits.map((audit, index) => (
                <div key={audit.policyId} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                     {/* Header Clicável */}
                     <div 
                         className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                         onClick={() => toggleAudit(audit.policyId)}
                     >
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-100 rounded-lg">
                                 <Target className="w-5 h-5 text-blue-600" />
                             </div>
                             <div>
                                 <h3 className="font-semibold text-gray-900 text-lg">
                                     Apólice #{audit.policyNumber}
                                 </h3>
                                 <p className="text-sm text-gray-500">
                                     {new Date(audit.auditTimestamp).toLocaleString('pt-BR')}
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="px-3 py-1 bg-gray-100 rounded-full">
                                 <span className="text-xs font-medium text-gray-600">
                                     {audit.totalCampaigns} campanhas analisadas
                                 </span>
                             </div>
                             {expandedAudits.has(audit.policyId) ? (
                                 <ChevronDown className="w-5 h-5 text-gray-400" />
                             ) : (
                                 <ChevronRight className="w-5 h-5 text-gray-400" />
                             )}
                         </div>
                     </div>

                     {/* Conteúdo Colapsável */}
                     {expandedAudits.has(audit.policyId) && (
                         <div className="space-y-4">
                             {/* Resumo com cards */}
                             <div className="grid grid-cols-3 gap-4 mb-6">
                                 <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                                     <div className="text-2xl font-bold text-blue-600">{audit.totalCampaigns}</div>
                                     <div className="text-sm text-blue-700 font-medium">Total Campanhas</div>
                                 </div>
                                 <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                                     <div className="text-2xl font-bold text-green-600">{audit.compatibleCampaigns}</div>
                                     <div className="text-sm text-green-700 font-medium">Compatíveis</div>
                                 </div>
                                 <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                                     <div className="text-2xl font-bold text-red-600">{audit.incompatibleCampaigns}</div>
                                     <div className="text-sm text-red-700 font-medium">Incompatíveis</div>
                                 </div>
                             </div>

                             {/* Análises Detalhadas */}
                             <div className="space-y-4">
                                 <div className="flex items-center gap-2 mb-4">
                                     <div className="p-2 bg-purple-100 rounded-lg">
                                         <Brain className="w-4 h-4 text-purple-600" />
                                     </div>
                                     <h4 className="font-semibold text-gray-900 text-lg">
                                         Análises Detalhadas
                                     </h4>
                                 </div>
                                 
                                 {audit.analyses && Array.isArray(audit.analyses) && audit.analyses.map((analysis, analysisIndex) => (
                                     <div key={analysisIndex} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                         <div className="flex items-center justify-between mb-4">
                                             <div className="flex items-center gap-3">
                                                 <div className={`p-2 rounded-lg ${
                                                     analysis.isCompatible ? 'bg-green-100' : 'bg-red-100'
                                                 }`}>
                                                     {analysis.isCompatible ? (
                                                         <CheckCircle className="w-5 h-5 text-green-600" />
                                                     ) : (
                                                         <XCircle className="w-5 h-5 text-red-600" />
                                                     )}
                                                 </div>
                                                 <div>
                                                     <h5 className="font-semibold text-gray-900">{analysis.campaignTitle}</h5>
                                                     <p className={`text-sm font-medium ${
                                                         analysis.isCompatible ? 'text-green-600' : 'text-red-600'
                                                     }`}>
                                                         {analysis.isCompatible ? '✅ Compatível' : '❌ Incompatível'}
                                                     </p>
                                                 </div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                     analysis.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                                     analysis.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                     'bg-red-100 text-red-800'
                                                 }`}>
                                                     {analysis.confidence}% confiança
                                                 </span>
                                             </div>
                                         </div>

                                         {/* Critérios */}
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                             {/* Critérios Atendidos */}
                                             {analysis.matchedCriteria && Array.isArray(analysis.matchedCriteria) && analysis.matchedCriteria.length > 0 && (
                                                 <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                     <div className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                                         <CheckCircle className="w-4 h-4" />
                                                         Critérios Atendidos
                                                     </div>
                                                     <ul className="text-sm text-green-600 space-y-1">
                                                         {analysis.matchedCriteria.map((criteria, idx) => (
                                                             <li key={idx} className="flex items-start gap-2">
                                                                 <span className="text-green-500 mt-0.5">•</span>
                                                                 <span>{criteria}</span>
                                                             </li>
                                                         ))}
                                                     </ul>
                                                 </div>
                                             )}

                                             {/* Critérios Não Atendidos */}
                                             {analysis.unmatchedCriteria && Array.isArray(analysis.unmatchedCriteria) && analysis.unmatchedCriteria.length > 0 && (
                                                 <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                                     <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                                                         <XCircle className="w-4 h-4" />
                                                         Critérios Não Atendidos
                                                     </div>
                                                     <ul className="text-sm text-red-600 space-y-1">
                                                         {analysis.unmatchedCriteria.map((criteria, idx) => (
                                                             <li key={idx} className="flex items-start gap-2">
                                                                 <span className="text-red-500 mt-0.5">•</span>
                                                                 <span>{criteria}</span>
                                                             </li>
                                                         ))}
                                                     </ul>
                                                 </div>
                                             )}
                                         </div>

                                         {/* Sugestões */}
                                         {analysis.suggestions && Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 && (
                                             <div className="mb-3">
                                                 <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                     <div className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                                                         <Brain className="w-4 h-4" />
                                                         Sugestões
                                                     </div>
                                                     <ul className="text-sm text-blue-600 space-y-1">
                                                         {analysis.suggestions.map((suggestion, idx) => (
                                                             <li key={idx} className="flex items-start gap-2">
                                                                 <span className="text-blue-500 mt-0.5">•</span>
                                                                 <span>{suggestion}</span>
                                                             </li>
                                                         ))}
                                                     </ul>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Raciocínio */}
                                         {analysis.reasoning && (
                                             <div className="mt-3">
                                                 <div className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
                                                     <Brain className="w-4 h-4" />
                                                     Raciocínio:
                                                 </div>
                                                 <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                     <p className="text-sm text-gray-700 leading-relaxed">
                                                         {analysis.reasoning
                                                             .replace(/✅/g, '')
                                                             .replace(/❌/g, '')
                                                             .replace(/•/g, '')
                                                             .replace(/\s+/g, ' ')
                                                             .trim()}
                                                     </p>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}
                </div>
            ))}
        </div>
    );
    } catch (error: any) {
        console.error('❌ LocalStorageAuditDisplay Error:', error);
        return (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 mb-2">Erro ao carregar análises</p>
                <p className="text-sm text-gray-500">{error.message}</p>
            </div>
        );
    }
};

// Exportar com Error Boundary
const LocalStorageAuditDisplayWithErrorBoundary: React.FC<LocalStorageAuditDisplayProps> = (props) => {
    return (
        <LocalStorageAuditErrorBoundary>
            <LocalStorageAuditDisplay {...props} />
        </LocalStorageAuditErrorBoundary>
    );
};

export default LocalStorageAuditDisplayWithErrorBoundary;
