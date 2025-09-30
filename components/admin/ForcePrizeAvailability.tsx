import React, { useState } from 'react';
import { ForcePrizeAvailabilityService } from '../../services/ForcePrizeAvailabilityService';
import { AlertTriangle, CheckCircle, X, RefreshCw, Gift } from 'lucide-react';

const ForcePrizeAvailability: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [results, setResults] = useState<{
        totalProcessed: number;
        totalPrizesInserted: number;
        errors: string[];
    } | null>(null);

    const handleForceAllCampaigns = async () => {
        if (!confirm('Tem certeza que deseja forçar a disponibilização de prêmios para TODAS as campanhas completadas?')) {
            return;
        }

        setLoading(true);
        setMessage(null);
        setResults(null);

        try {
            const result = await ForcePrizeAvailabilityService.forcePrizeAvailabilityForAllCompletedCampaigns();
            
            setResults({
                totalProcessed: result.totalProcessed,
                totalPrizesInserted: result.totalPrizesInserted,
                errors: result.errors
            });

            if (result.success) {
                setMessage({
                    text: result.message,
                    type: 'success'
                });
            } else {
                setMessage({
                    text: result.message,
                    type: 'error'
                });
            }
        } catch (error: any) {
            setMessage({
                text: `Erro: ${error.message}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Forçar Disponibilização de Prêmios</h3>
                    <p className="text-gray-600">Corrigir campanhas completadas que não tiveram prêmios disponibilizados</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                    message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                    'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                     message.type === 'error' ? <X className="w-5 h-5" /> :
                     <AlertTriangle className="w-5 h-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Ação Importante</h4>
                            <p className="text-yellow-700 text-sm">
                                Esta ação irá verificar todas as campanhas com status "completed" e forçar a disponibilização 
                                de prêmios que ainda não foram disponibilizados. Use apenas se houver problemas com prêmios 
                                não aparecendo para resgate.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleForceAllCampaigns}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Processando...
                        </>
                    ) : (
                        <>
                            <Gift className="w-4 h-4" />
                            Forçar Disponibilização de Prêmios
                        </>
                    )}
                </button>

                {results && (
                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800">Campanhas Processadas</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{results.totalProcessed}</p>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Gift className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-blue-800">Prêmios Disponibilizados</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{results.totalPrizesInserted}</p>
                            </div>
                        </div>

                        {results.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                    <X className="w-4 h-4" />
                                    Erros Encontrados ({results.errors.length})
                                </h4>
                                <div className="space-y-1">
                                    {results.errors.map((error, index) => (
                                        <p key={index} className="text-sm text-red-700">
                                            • {error}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForcePrizeAvailability;

