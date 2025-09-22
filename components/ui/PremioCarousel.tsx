import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';

interface PremioCarouselProps {
    premios: Array<{
        premio: {
            id: string;
            nome: string;
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
            {/* Carousel Container */}
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#49de80] to-green-600 p-4">
                {/* Premio Display */}
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        {/* Premio Image */}
                        <div className="mb-3">
                            {premios[currentIndex].premio.imagem_miniatura_url ? (
                                <img
                                    src={premios[currentIndex].premio.imagem_miniatura_url}
                                    alt={premios[currentIndex].premio.nome}
                                    className="w-16 h-16 mx-auto rounded-lg object-cover border-2 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-16 h-16 mx-auto rounded-lg bg-white bg-opacity-20 flex items-center justify-center border-2 border-white">
                                    <Gift className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </div>
                        
                        {/* Premio Info */}
                        <div className="text-white">
                            <h4 className="font-bold text-sm mb-1 line-clamp-1">
                                {premios[currentIndex].premio.nome}
                            </h4>
                            <p className="text-xs opacity-90">
                                Qtd: {premios[currentIndex].quantidade}
                            </p>
                            <p className="text-xs font-semibold">
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
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-all duration-200"
                        >
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-all duration-200"
                        >
                            <ChevronRight className="w-4 h-4 text-white" />
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
                                        ? 'bg-white' 
                                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Premio Counter */}
                {premios.length > 1 && (
                    <div className="absolute top-2 right-2 bg-white bg-opacity-20 rounded-full px-2 py-1">
                        <span className="text-xs text-white font-bold">
                            {currentIndex + 1}/{premios.length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremioCarousel;
