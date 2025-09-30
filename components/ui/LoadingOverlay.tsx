import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    isCompleted: boolean;
    message: string;
    progress?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
    isVisible, 
    isCompleted, 
    message, 
    progress = 0 
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center">
                    {/* Donut Spinner ou Check */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        {isCompleted ? (
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                        ) : (
                            <div className="relative w-24 h-24">
                                {/* Donut Progress Ring */}
                                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                    {/* Background Circle */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="#e5e7eb"
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="#3b82f6"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                                        className="transition-all duration-300 ease-in-out"
                                    />
                                </svg>
                                
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {isCompleted ? 'Concluído!' : 'Processando...'}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">
                        {message}
                    </p>

                    {/* Progress Bar (only when not completed) */}
                    {!isCompleted && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {/* Progress Steps */}
                    <div className="text-sm text-gray-500 space-y-1">
                        {!isCompleted ? (
                            <>
                                <div className={`flex items-center gap-2 ${progress >= 25 ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${progress >= 25 ? 'bg-green-600' : 'bg-gray-300'}`} />
                                    Salvando apólice...
                                </div>
                                <div className={`flex items-center gap-2 ${progress >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${progress >= 50 ? 'bg-green-600' : 'bg-gray-300'}`} />
                                    Analisando campanhas...
                                </div>
                                <div className={`flex items-center gap-2 ${progress >= 75 ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${progress >= 75 ? 'bg-green-600' : 'bg-gray-300'}`} />
                                    Auditando...
                                </div>
                                <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-gray-300'}`} />
                                    Finalizando...
                                </div>
                            </>
                        ) : (
                            <div className="text-green-600 font-medium">
                                ✅ Apólice processada com sucesso!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
