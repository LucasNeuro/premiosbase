import React from 'react';
import { Target, CheckCircle, Circle, TrendingUp, DollarSign, FileText } from 'lucide-react';

interface ModernCriteriaCardProps {
    criteria: any;
    className?: string;
    compact?: boolean;
}

/**
 * Card moderno e compacto para exibir critérios de campanhas
 * Versão otimizada para cards pequenos
 */
const ModernCriteriaCard: React.FC<ModernCriteriaCardProps> = ({ 
    criteria, 
    className = '',
    compact = true
}) => {
    if (!criteria) return null;

    const getPolicyIcon = (type: string) => {
        switch (type) {
            case 'auto': return <TrendingUp className="w-3 h-3" />;
            case 'residencial': return <FileText className="w-3 h-3" />;
            default: return <Target className="w-3 h-3" />;
        }
    };

    const getPolicyTypeLabel = (type: string) => {
        switch (type) {
            case 'auto': return 'Auto';
            case 'residencial': return 'Residencial';
            default: return type;
        }
    };

    const formatTarget = (target: number, type: string) => {
        if (type === 'value') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
            }).format(target);
        }
        return target.toString();
    };

    if (compact) {
        return (
            <div className={`space-y-1 ${className}`}>
                <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">Critérios</span>
                </div>
                
                <div className="space-y-1">
                    {Array.isArray(criteria) && criteria.length > 0 ? (
                        <>
                            {criteria.slice(0, 2).map((criterion: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-md px-2 py-1">
                                    {getPolicyIcon(criterion.policy_type || 'geral')}
                                    <span className="flex-1">
                                        {getPolicyTypeLabel(criterion.policy_type || 'geral')}: {formatTarget(criterion.target || 0, criterion.type || 'quantity')}
                                    </span>
                                </div>
                            ))}
                            {criteria.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                    +{criteria.length - 2} mais
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-md px-2 py-1">
                            <Target className="w-3 h-3" />
                            <span className="flex-1">{typeof criteria === 'string' ? criteria : 'Critérios definidos'}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Versão completa (não compacta)
    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">Critérios da Campanha</span>
            </div>
            
            <div className="space-y-2">
                {Array.isArray(criteria) ? (
                    criteria.map((criterion: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="flex-shrink-0">
                                {getPolicyIcon(criterion.policy_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800">
                                    {getPolicyTypeLabel(criterion.policy_type || 'geral')}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Meta: {formatTarget(criterion.target || 0, criterion.type || 'quantity')}
                                    {criterion.min_value && (
                                        <span> • Mín: {formatTarget(criterion.min_value, 'value')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{criteria}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModernCriteriaCard;
