import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';

interface PremioSidepanelHeroProps {
    premios: Array<{
        premio: {
            id: string;
            nome: string;
            imagem_url?: string;
            imagem_miniatura_url?: string;
            valor_estimado: number;
        };
        quantidade: number;
    }>;
    className?: string;
    showIndicators?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
}

const PremioSidepanelHero: React.FC<PremioSidepanelHeroProps> = ({
    premios,
    className = '',
    showIndicators = true,
    autoPlay = true,
    autoPlayInterval = 5000
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || premios.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                prevIndex === premios.length - 1 ? 0 : prevIndex + 1
            );
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, premios.length]);

    if (!premios || premios.length === 0) {
        return (
            <div className={`h-64 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ${className}`}>
                <div className="text-center text-white">
                    <Gift className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">Nenhum prêmio configurado</p>
                </div>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? premios.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        setCurrentIndex(currentIndex === premios.length - 1 ? 0 : currentIndex + 1);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className={`relative h-64 overflow-hidden ${className}`}>
            {/* Hero Background - BRANCO */}
            <div className="absolute inset-0 bg-white">
                {/* Premio Image - Full Width Hero */}
                <div className="relative h-full w-full">
                    {(premios[currentIndex].premio.imagem_url || premios[currentIndex].premio.imagem_miniatura_url) ? (
                        <div className="relative w-full h-full">
                            {/* Imagem principal centralizada e completa - MUITO MAIOR */}
                            <div className="relative w-full h-full flex items-center justify-center p-1">
                                <img
                                    src={premios[currentIndex].premio.imagem_url || premios[currentIndex].premio.imagem_miniatura_url}
                                    alt={premios[currentIndex].premio.nome}
                                    className="w-full h-full object-contain rounded-xl shadow-2xl border-4 border-gray-200 hover:border-green-400 transition-all duration-300"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
                            <Gift className="w-20 h-20 text-gray-400" />
                        </div>
                    )}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Premio Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg mb-0.5 line-clamp-1">
                                    {premios[currentIndex].premio.nome}
                                </h3>
                                <div className="flex items-center gap-3 text-sm">
                                    <span>Qtd: {premios[currentIndex].quantidade}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-lg">
                                        R$ {premios[currentIndex].premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Premio Counter */}
                            {premios.length > 1 && (
                                <div className="ml-4 bg-white/20 rounded-full px-3 py-1">
                                    <span className="text-sm font-bold">
                                        {currentIndex + 1}/{premios.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows - Only show if more than 1 premio */}
                {premios.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 z-10"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 z-10"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </>
                )}

                {/* Indicators */}
                {showIndicators && premios.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                        {premios.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                    index === currentIndex 
                                        ? 'bg-white' 
                                        : 'bg-white/50 hover:bg-white/75'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremioSidepanelHero;
