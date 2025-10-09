import React, { useState, useEffect } from 'react';
import { Gift, Trophy, Star, Sparkles, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

interface PrizeHeroProps {
    totalPrizes: number;
    totalValue: number;
    onProcessPrizes: () => void;
    processingPrizes: boolean;
    className?: string;
}

const PrizeHero: React.FC<PrizeHeroProps> = ({
    totalPrizes,
    totalValue,
    onProcessPrizes,
    processingPrizes,
    className = ''
}) => {
    const [countAnimation, setCountAnimation] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Animação do contador
    useEffect(() => {
        setIsVisible(true);
        const duration = 2000;
        const steps = 60;
        const increment = totalPrizes / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= totalPrizes) {
                setCountAnimation(totalPrizes);
                clearInterval(timer);
            } else {
                setCountAnimation(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [totalPrizes]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className={`
            relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E293B] via-slate-800 to-[#1E293B] 
            border-2 border-slate-700 shadow-lg transition-all duration-500
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${className}
        `}>
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-600/20 rounded-full translate-y-12 -translate-x-12" />
            
            {/* Sparkles animation */}
            <div className="absolute top-4 right-4">
                <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>

            <div className="relative p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Conteúdo principal */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">
                                    Prêmios Conquistados
                                </h2>
                                <p className="text-slate-300 font-medium">
                                    Escolha um prêmio por campanha
                                </p>
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
                                <div className="flex items-center gap-3">
                                    <Gift className="w-6 h-6 text-green-400" />
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {countAnimation}
                                        </div>
                                        <div className="text-sm text-slate-300 font-medium">
                                            prêmios disponíveis
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
                                <div className="flex items-center gap-3">
                                    <Star className="w-6 h-6 text-yellow-400" />
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {formatCurrency(totalValue)}
                                        </div>
                                        <div className="text-sm text-slate-300 font-medium">
                                            valor total
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Call to action */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={onProcessPrizes}
                                disabled={processingPrizes}
                                className="
                                    bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg
                                    transition-all duration-200 hover:shadow-lg hover:scale-105
                                    flex items-center gap-2 text-sm
                                "
                            >
                                <Gift className={`w-5 h-5 ${processingPrizes ? 'animate-pulse' : ''}`} />
                                <span>
                                    {processingPrizes ? 'Processando...' : 'Verificar Prêmios'}
                                </span>
                                {!processingPrizes && <ArrowRight className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Ilustração/ícone grande */}
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                                <Gift className="w-16 h-16 text-white" />
                            </div>
                            {/* Ring animado */}
                            <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping opacity-20" />
                            <div className="absolute inset-2 rounded-full border-2 border-green-400 animate-pulse opacity-30" />
                        </div>
                    </div>
                </div>

                {/* Progress bar (se houver prêmios) */}
                {totalPrizes > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                            <span>Progresso de resgate</span>
                            <span>0% resgatado</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: '0%' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrizeHero;
