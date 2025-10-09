import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Package, ArrowRight } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import Button from '../ui/Button';

interface CartItem {
    premio_conquistado_id: string;
    campaign_id: string;
    campaign_title: string;
    premio_id: string;
    premio_nome: string;
    premio_valor_estimado: number;
    premio_imagem?: string;
    premio_tipo?: string;
    quantidade: number;
    valor_total: number;
}

interface SmartCartProps {
    cart: CartItem[];
    onUpdateQuantity: (id: string, quantity: number) => void;
    onRemoveItem: (id: string) => void;
    onSubmitOrder: () => void;
    submitting: boolean;
    className?: string;
}

const SmartCart: React.FC<SmartCartProps> = ({
    cart,
    onUpdateQuantity,
    onRemoveItem,
    onSubmitOrder,
    submitting,
    className = ''
}) => {
    const [cartAnimation, setCartAnimation] = useState<'idle' | 'adding' | 'removing'>('idle');
    const [itemsAdded, setItemsAdded] = useState(0);

    // Animação quando item é adicionado
    useEffect(() => {
        if (cart.length > itemsAdded) {
            setCartAnimation('adding');
            setItemsAdded(cart.length);
            setTimeout(() => setCartAnimation('idle'), 300);
        } else if (cart.length < itemsAdded) {
            setCartAnimation('removing');
            setItemsAdded(cart.length);
            setTimeout(() => setCartAnimation('idle'), 300);
        }
    }, [cart.length, itemsAdded]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.valor_total, 0);

    return (
        <div className={`bg-[#1E293B] rounded-xl shadow-lg border border-slate-700 overflow-hidden ${className}`}>
            {/* Header do carrinho */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-b border-slate-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`
                            relative p-2 bg-green-600 rounded-lg transition-all duration-300
                            ${cartAnimation === 'adding' ? 'scale-110' : cartAnimation === 'removing' ? 'scale-90' : 'scale-100'}
                        `}>
                            <ShoppingCart className="w-6 h-6 text-white" />
                            {/* Badge de contagem animado */}
                            {cart.length > 0 && (
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                                    {cart.length}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">Carrinho</h3>
                            <p className="text-sm text-slate-400">
                                {cart.length === 0 ? 'Vazio' : `${cart.length} item${cart.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>

                    {/* Ícone de status */}
                    {cart.length > 0 && (
                        <div className="text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    )}
                </div>
            </div>

            {/* Conteúdo do carrinho */}
            <div className="p-6 bg-[#1E293B]">
                {cart.length === 0 ? (
                    /* Estado vazio */
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-12 h-12 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                            Carrinho vazio
                        </h4>
                        <p className="text-slate-400 mb-4">
                            Adicione prêmios para começar seu resgate
                        </p>
                        <div className="text-sm text-slate-500">
                            💡 Dica: Clique em "Adicionar" nos prêmios disponíveis
                        </div>
                    </div>
                ) : (
                    /* Itens do carrinho */
                    <div className="space-y-4">
                        {cart.map((item, index) => (
                            <div
                                key={item.premio_conquistado_id}
                                className={`
                                    border border-slate-600 rounded-lg p-4 transition-all duration-300
                                    hover:shadow-md hover:border-blue-500
                                    ${cartAnimation === 'adding' && index === cart.length - 1 ? 'animate-pulse bg-slate-700' : 'bg-slate-800'}
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Imagem do prêmio */}
                                    <div className="flex-shrink-0">
                                        <SafeImage
                                            src={item.premio_imagem}
                                            alt={item.premio_nome}
                                            className="w-16 h-16 object-cover rounded-lg bg-slate-700"
                                            fallback={
                                                <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-slate-400" />
                                                </div>
                                            }
                                        />
                                    </div>

                                    {/* Informações do item */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                                            {item.premio_nome}
                                        </h4>
                                        <p className="text-xs text-slate-400 mb-2 truncate">
                                            {item.campaign_title}
                                        </p>
                                        
                                        {/* Controles de quantidade */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.premio_conquistado_id, item.quantidade - 1)}
                                                    className="p-1 rounded-full hover:bg-slate-600 transition-colors"
                                                    disabled={item.quantidade <= 1}
                                                >
                                                    <Minus className="w-4 h-4 text-slate-400" />
                                                </button>
                                                <span className="text-sm font-medium w-8 text-center text-white">
                                                    {item.quantidade}
                                                </span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.premio_conquistado_id, item.quantidade + 1)}
                                                    className="p-1 rounded-full hover:bg-slate-600 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-green-400">
                                                    {formatCurrency(item.valor_total)}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {formatCurrency(item.premio_valor_estimado)} cada
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botão remover - Azul funcional */}
                                    <button
                                        onClick={() => onRemoveItem(item.premio_conquistado_id)}
                                        className="flex-shrink-0 p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                        title="Remover item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Resumo do pedido */}
                        <div className="border-t border-slate-600 pt-4 space-y-4">
                            <div className="bg-slate-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-semibold text-white">
                                        Prêmios Escolhidos:
                                    </span>
                                    <span className="text-xl font-bold text-green-400">
                                        {cart.length} prêmio{cart.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-slate-400">
                                    <span>Valor total estimado:</span>
                                    <span className="font-semibold text-white">{formatCurrency(cartTotal)}</span>
                                </div>
                            </div>

                            {/* Botão de finalização */}
                            <Button
                                onClick={onSubmitOrder}
                                disabled={cart.length === 0 || submitting}
                                className="
                                    w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl
                                    transition-all duration-200 hover:shadow-lg hover:scale-105
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                    flex items-center justify-center gap-2
                                "
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Solicitar Pedido</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>

                            {/* Informação adicional */}
                            <div className="text-xs text-slate-500 text-center">
                                ✨ Seus prêmios serão processados e enviados em breve
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartCart;
