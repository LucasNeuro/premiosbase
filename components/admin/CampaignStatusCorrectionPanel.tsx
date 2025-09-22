import React, { useState } from 'react';
import { CampaignStatusCorrectionService } from '../../services/campaignStatusCorrectionService';

export const CampaignStatusCorrectionPanel: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{ corrected: number; errors: string[] } | null>(null);

    const handleCorrection = async () => {
        setIsRunning(true);
        setResult(null);

        try {
            const correctionResult = await CampaignStatusCorrectionService.forceCorrectAllCampaignStatus();
            setResult(correctionResult);
        } catch (error) {
            setResult({
                corrected: 0,
                errors: [`Erro geral: ${error}`]
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Correção Forçada de Status
                    </h3>
                    <p className="text-sm text-gray-600">
                        Recalcula e corrige o status de todas as campanhas
                    </p>
                </div>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                        <h4 className="font-medium text-yellow-800">Atenção!</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                            Esta ação irá recalcular o status de todas as campanhas baseado nos critérios reais. 
                            Campanhas que não atendem todos os critérios serão marcadas como 'active'.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleCorrection}
                disabled={isRunning}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    isRunning
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
                {isRunning ? (
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Corrigindo...
                    </div>
                ) : (
                    'Corrigir Status das Campanhas'
                )}
            </button>

            {result && (
                <div className="mt-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-medium text-gray-900">Resultado da Correção</h4>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Campanhas corrigidas:</span> {result.corrected}
                        </p>
                        
                        {result.errors.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-red-700 mb-1">Erros encontrados:</p>
                                <ul className="text-sm text-red-600 space-y-1">
                                    {result.errors.map((error, index) => (
                                        <li key={index} className="flex items-start gap-1">
                                            <span className="text-red-500 mt-1">•</span>
                                            <span>{error}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
