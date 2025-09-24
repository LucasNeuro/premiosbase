import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';

interface PremioCarouselProps {
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

const PremioCarousel: React.FC<PremioCarouselProps> = ({
    premios,
    className = '',
    showIndicators = true,
    autoPlay = true,
    autoPlayInterval = 3000
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
            <div className={`flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
                <div className="text-center">
                    <Gift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhum prêmio configurado</p>
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
        <div className={`relative ${className}`}>
            {/* Carousel Container - BRANCO */}
            <div className="relative overflow-hidden rounded-lg bg-white p-4 border-2 border-gray-200">
                {/* Premio Display */}
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        {/* Premio Image */}
                        <div className="mb-3 flex justify-center">
                            {(premios[currentIndex].premio.imagem_url || premios[currentIndex].premio.imagem_miniatura_url) ? (
                                <div className="relative w-36 h-36 rounded-xl border-4 border-gray-200 shadow-2xl overflow-hidden hover:border-green-400 transition-all duration-300">
                                    {/* Imagem principal centralizada e completa - MUITO MAIOR */}
                                    <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
                                        <img
                                            src={premios[currentIndex].premio.imagem_url || premios[currentIndex].premio.imagem_miniatura_url}
                                            alt={premios[currentIndex].premio.nome}
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-36 h-36 mx-auto rounded-xl bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                                    <Gift className="w-14 h-14 text-gray-400" />
                                </div>
                            )}
                        </div>
                        
                        {/* Premio Info */}
                        <div className="text-gray-800">
                            <h4 className="font-bold text-sm mb-1 line-clamp-1">
                                {premios[currentIndex].premio.nome}
                            </h4>
                            <p className="text-xs text-gray-600">
                                Qtd: {premios[currentIndex].quantidade}
                            </p>
                            <p className="text-xs font-semibold text-green-600">
                                R$ {premios[currentIndex].premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows - Only show if more than 1 premio */}
                {premios.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-all duration-200"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-all duration-200"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>
                    </>
                )}

                {/* Indicators */}
                {showIndicators && premios.length > 1 && (
                    <div className="flex justify-center mt-3 space-x-1">
                        {premios.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    index === currentIndex 
                                        ? 'bg-green-500' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Premio Counter */}
                {premios.length > 1 && (
                    <div className="absolute top-2 right-2 bg-gray-200 rounded-full px-2 py-1">
                        <span className="text-xs text-gray-700 font-bold">
                            {currentIndex + 1}/{premios.length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremioCarousel;
