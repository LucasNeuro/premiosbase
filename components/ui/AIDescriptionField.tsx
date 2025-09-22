import React, { useState } from 'react';
import { 
    Sparkles, 
    Wand2, 
    Lightbulb, 
    CheckCircle, 
    Loader2,
    Copy,
    RefreshCw
} from 'lucide-react';
import { mistralAI } from '../../services/mistralAI';

interface AIDescriptionFieldProps {
    value: string;
    onChange: (value: string) => void;
    goalType?: string;
    goalTitle?: string;
    target?: number;
    period?: string;
    placeholder?: string;
    rows?: number;
    className?: string;
}

const AIDescriptionField: React.FC<AIDescriptionFieldProps> = ({
    value,
    onChange,
    goalType = 'meta',
    goalTitle = '',
    target = 0,
    period = 'mês',
    placeholder = "Adicione detalhes sobre esta meta...",
    rows = 3,
    className = ""
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleAIAction = async (action: string) => {
        if (!value.trim() && action !== 'generate') {
            alert('Digite algo no campo de descrição primeiro');
            return;
        }

        if ((action === 'generate' || action === 'suggest') && !goalTitle.trim()) {
            alert('Digite o título do prêmio primeiro para usar esta função');
            return;
        }

        setIsLoading(true);
        setActiveAction(action);

        try {
            switch (action) {
                case 'correct':
                    const corrected = await mistralAI.correctText(value);
                    onChange(corrected);
                    break;

                case 'improve':
                    const improved = await mistralAI.improveDescription(value, goalType, goalTitle);
                    onChange(improved);
                    break;

                case 'suggest':
                    const newSuggestions = await mistralAI.suggestDescription(goalType, goalTitle, value);
                    setSuggestions(newSuggestions);
                    setShowSuggestions(true);
                    break;

                case 'generate':
                    const generated = await mistralAI.generateGoalDescription(goalType, goalTitle, target, period);
                    onChange(generated);
                    break;
            }
        } catch (error) {
            alert('Erro ao processar com IA. Tente novamente.');
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        // Feedback visual poderia ser adicionado aqui
    };

    const clearField = () => {
        onChange('');
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-3">
            {/* Campo de texto */}
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${className}`}
                />
                
                {/* Contador de caracteres */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {value.length}/150
                </div>
            </div>

            {/* Badges de IA */}
            <div className="flex flex-wrap gap-2">
                {/* Corrigir */}
                <button
                    onClick={() => handleAIAction('correct')}
                    disabled={isLoading || !value.trim()}
                    className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${isLoading && activeAction === 'correct'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }
                        ${!value.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {isLoading && activeAction === 'correct' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <CheckCircle className="w-3 h-3" />
                    )}
                    Corrigir
                </button>

                {/* Melhorar */}
                <button
                    onClick={() => handleAIAction('improve')}
                    disabled={isLoading || !value.trim()}
                    className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${isLoading && activeAction === 'improve'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }
                        ${!value.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {isLoading && activeAction === 'improve' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Wand2 className="w-3 h-3" />
                    )}
                    Melhorar
                </button>

                {/* Sugerir */}
                <button
                    onClick={() => handleAIAction('suggest')}
                    disabled={isLoading}
                    className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${isLoading && activeAction === 'suggest'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }
                    `}
                >
                    {isLoading && activeAction === 'suggest' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Lightbulb className="w-3 h-3" />
                    )}
                    Sugerir
                </button>

                {/* Gerar */}
                <button
                    onClick={() => handleAIAction('generate')}
                    disabled={isLoading}
                    className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${isLoading && activeAction === 'generate'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }
                    `}
                >
                    {isLoading && activeAction === 'generate' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Sparkles className="w-3 h-3" />
                    )}
                    Gerar
                </button>

                {/* Ações adicionais */}
                {value && (
                    <>
                        <button
                            onClick={copyToClipboard}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            <Copy className="w-3 h-3" />
                            Copiar
                        </button>

                        <button
                            onClick={clearField}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Limpar
                        </button>
                    </>
                )}
            </div>

            {/* Sugestões */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-yellow-800">Sugestões de IA</h4>
                        <button
                            onClick={() => setShowSuggestions(false)}
                            className="text-yellow-600 hover:text-yellow-800"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full text-left p-2 bg-white border border-yellow-200 rounded text-sm text-gray-700 hover:bg-yellow-100 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Indicador de IA */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles className="w-3 h-3" />
                <span>Powered by Mistral AI</span>
            </div>
        </div>
    );
};

export default AIDescriptionField;
