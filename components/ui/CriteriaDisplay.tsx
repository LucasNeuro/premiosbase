import React from 'react';
import { Target, CheckCircle, Circle } from 'lucide-react';

interface CriteriaDisplayProps {
    criteria: any;
    className?: string;
    showProgress?: boolean;
    progressData?: any[];
}

/**
 * Componente moderno para exibir critérios de campanhas
 * Mostra os critérios de forma visual e intuitiva
 */
const CriteriaDisplay: React.FC<CriteriaDisplayProps> = ({ 
    criteria, 
    className = '',
    showProgress = false,
    progressData = []
}) => {
    if (!criteria) return null;

    const getPolicyTypeLabel = (type: string) => {
        switch (type) {
            case 'auto': return 'Seguro Auto';
            case 'residencial': return 'Seguro Residencial';
            default: return type;
        }
    };

    const getCriteriaTypeLabel = (type: string) => {
        switch (type) {
            case 'quantity': return 'apólices';
            case 'value': return 'valor';
            default: return type;
        }
    };

    const formatTarget = (target: number, type: string) => {
        if (type === 'value') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(target);
        }
        return target.toLocaleString();
    };

    const getProgressForCriterion = (index: number) => {
        if (!showProgress || !progressData || !progressData[index]) return null;
        return progressData[index];
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">Critérios da Campanha</span>
            </div>
            
            <div className="space-y-2">
                {Array.isArray(criteria) ? (
                    criteria.map((criterion: any, index: number) => {
                        const progress = getProgressForCriterion(index);
                        const isCompleted = progress && progress.percentage >= 100;
                        
                        return (
                            <div 
                                key={index} 
                                className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-200 ${
                                    isCompleted 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                                }`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                
                                {/* Criterion Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-800">
                                            {getPolicyTypeLabel(criterion.policy_type || 'geral')}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ({getCriteriaTypeLabel(criterion.type || 'quantity')})
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span>Meta: {formatTarget(criterion.target || 0, criterion.type || 'quantity')}</span>
                                        {criterion.min_value && (
                                            <>
                                                <span>•</span>
                                                <span>Mín: {formatTarget(criterion.min_value, 'value')}</span>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    {showProgress && progress && (
                                        <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-gray-600">Progresso</span>
                                                <span className="text-xs font-medium text-gray-800">
                                                    {progress.percentage?.toFixed(1) || 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        progress.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(progress.percentage || 0, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <Circle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{criteria}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CriteriaDisplay;
