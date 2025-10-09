import React, { useState } from 'react';
import { Plus, Gift, Star, Award } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface PrizeCardProps {
    prize: {
        id: string;
        premio_nome: string;
        premio_tipo: string;
        premio_categoria: string;
        premio_valor_estimado: number;
        premio_imagem_url?: string;
        campaign_title: string;
        campaign_id: string;
        quantidade_conquistada: number;
    };
    onAddToCart: (prize: any) => void;
    isDisabled?: boolean;
    isAdded?: boolean;
    className?: string;
}

const PrizeCard: React.FC<PrizeCardProps> = ({
    prize,
    onAddToCart,
    isDisabled = false,
    isAdded = false,
    className = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Cores baseadas na categoria (mantendo paleta existente)
    const getCategoryColors = (categoria: string) => {
        switch (categoria.toLowerCase()) {
            case 'gift card':
                return {
                    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
                    border: 'border-blue-200',
                    badge: 'bg-blue-100 text-blue-800'
                };
            case 'viagem':
                return {
                    bg: 'bg-gradient-to-br from-green-50 to-green-100',
                    border: 'border-green-200',
                    badge: 'bg-green-100 text-green-800'
                };
            case 'eletrônicos':
                return {
                    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
                    border: 'border-purple-200',
                    badge: 'bg-purple-100 text-purple-800'
                };
            default:
                return {
                    bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
                    border: 'border-gray-200',
                    badge: 'bg-gray-100 text-gray-800'
                };
        }
    };

    const colors = getCategoryColors(prize.premio_categoria);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl shadow-lg border transition-all duration-300 cursor-pointer
                bg-[#1E293B] border-slate-700
                ${isHovered ? 'shadow-xl scale-[1.02] border-blue-500' : 'shadow-lg'}
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:border-blue-500'}
                ${className}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Badge de categoria - Padrão dos game cards */}
            <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-blue-600 text-white text-xs font-medium">
                    {prize.premio_categoria}
                </Badge>
            </div>

            {/* Imagem do prêmio - Padrão dos game cards */}
            <div className="relative h-48 overflow-hidden bg-slate-800 flex items-center justify-center">
                <SafeImage
                    src={prize.premio_imagem_url}
                    alt={prize.premio_nome}
                    className={`
                        w-full h-full object-contain transition-transform duration-300
                        ${isHovered ? 'scale-105' : 'scale-100'}
                    `}
                    fallback={
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Gift className="w-16 h-16 text-slate-500" />
                        </div>
                    }
                    onLoad={() => setImageLoaded(true)}
                />
                
                {/* Ícone de valor no canto inferior esquerdo - Padrão dos game cards */}
                <div className="absolute bottom-3 left-3 bg-green-600 text-white rounded-lg px-2 py-1 shadow-lg">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-white" />
                        <span className="text-sm font-bold text-white">
                            {formatCurrency(prize.premio_valor_estimado)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Conteúdo do card - Padrão dos game cards */}
            <div className="p-4 bg-[#1E293B]">
                {/* Título do prêmio - Padrão dos game cards */}
                <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">
                    {prize.premio_nome}
                </h3>

                {/* Informações adicionais - Padrão dos game cards */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Award className="w-4 h-4 text-blue-400" />
                        <span className="truncate">{prize.campaign_title}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Quantidade:</span>
                        <span className="font-semibold text-white">{prize.quantidade_conquistada}</span>
                    </div>
                </div>

                {/* Linha verde inferior - Padrão dos game cards */}
                <div className="h-1 bg-green-500 rounded-full mb-4"></div>

                {/* Botão de ação - Padrão dos game cards */}
                <Button
                    onClick={() => !isDisabled && onAddToCart(prize)}
                    disabled={isDisabled}
                    className={`
                        w-full transition-all duration-200 flex items-center justify-center gap-2
                        bg-slate-700 hover:bg-slate-600 text-white border border-slate-600
                        ${isDisabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:shadow-lg hover:border-blue-500'
                        }
                    `}
                >
                    <Plus className="w-4 h-4" />
                    <span>
                        {isDisabled 
                            ? 'Já Escolhido' 
                            : isAdded 
                                ? 'Adicionado!' 
                                : 'Adicionar'
                        }
                    </span>
                </Button>
            </div>

            {/* Efeito de hover no border - Azul funcional */}
            {isHovered && !isDisabled && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse" />
            )}
        </div>
    );
};

export default PrizeCard;
