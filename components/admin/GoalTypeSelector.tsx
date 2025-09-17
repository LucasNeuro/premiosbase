import React from 'react';
import { DollarSign, FileText, TrendingUp } from 'lucide-react';

interface GoalType {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    example: string;
}

interface GoalTypeSelectorProps {
    selectedType: string;
    onTypeSelect: (type: string) => void;
}

const GoalTypeSelector: React.FC<GoalTypeSelectorProps> = ({ selectedType, onTypeSelect }) => {
    const goalTypes: GoalType[] = [
        {
            id: 'valor',
            name: 'Valor',
            description: 'Meta de faturamento em reais',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            example: 'R$ 50.000'
        },
        {
            id: 'apolices',
            name: 'Quantidade',
            description: 'Meta de número de apólices',
            icon: <FileText className="w-6 h-6" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            example: '10 apólices'
        },
        {
            id: 'crescimento',
            name: 'Crescimento',
            description: 'Meta de crescimento percentual',
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            example: '15%'
        }
    ];

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Escolha o tipo de meta</h3>
                <p className="text-sm text-gray-600">Selecione o tipo de meta que deseja criar para o corretor</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goalTypes.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => onTypeSelect(type.id)}
                        className={`
                            relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                            ${selectedType === type.id 
                                ? `${type.bgColor} ${type.borderColor} border-2 ring-2 ring-offset-2 ${type.color.replace('text-', 'ring-')}` 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        {/* Checkmark para tipo selecionado */}
                        {selectedType === type.id && (
                            <div className="absolute top-2 right-2">
                                <div className={`w-6 h-6 rounded-full ${type.bgColor} ${type.borderColor} border-2 flex items-center justify-center`}>
                                    <div className={`w-3 h-3 rounded-full ${type.color.replace('text-', 'bg-')}`}></div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center text-center space-y-3">
                            {/* Ícone */}
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center
                                ${selectedType === type.id ? type.bgColor : 'bg-gray-100'}
                            `}>
                                <div className={selectedType === type.id ? type.color : 'text-gray-600'}>
                                    {type.icon}
                                </div>
                            </div>
                            
                            {/* Nome */}
                            <div>
                                <h4 className={`font-semibold ${selectedType === type.id ? type.color : 'text-gray-900'}`}>
                                    {type.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {type.description}
                                </p>
                            </div>
                            
                            {/* Exemplo */}
                            <div className={`
                                px-3 py-1 rounded-full text-xs font-medium
                                ${selectedType === type.id 
                                    ? `${type.bgColor} ${type.color}` 
                                    : 'bg-gray-100 text-gray-600'
                                }
                            `}>
                                Ex: {type.example}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {selectedType && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700 font-medium">
                            Tipo selecionado: {goalTypes.find(t => t.id === selectedType)?.name}
                        </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                        {goalTypes.find(t => t.id === selectedType)?.description}
                    </p>
                </div>
            )}
        </div>
    );
};

export default GoalTypeSelector;
