import React, { useState, useEffect } from 'react';
import { useConqueredPrizes, ConqueredPrize, PrizeBalance } from '../../hooks/useConqueredPrizes';
import { usePrizeOrders, PrizeOrder } from '../../hooks/usePrizeOrders';
import { supabase } from '../../lib/supabase';
import { 
    ShoppingCart, 
    Gift, 
    Plus, 
    Minus, 
    Trash2, 
    CheckCircle, 
    Clock, 
    XCircle,
    Truck,
    DollarSign,
    Package,
    AlertCircle
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';

interface CartItem {
    premio_conquistado_id: string;
    campaign_id: string;
    campaign_title: string;
    premio_id: string;
    premio_nome: string;
    premio_valor_estimado: number;
    premio_imagem?: string;
    premio_categoria?: string;
    premio_tipo?: string;
    quantidade: number;
    valor_total: number;
}

const PrizeRedemptionTab: React.FC = () => {
    const { 
        availablePrizes, 
        balance, 
        loading, 
        error, 
        createRedemptionOrder, 
        refreshPrizes, 
        refreshBalance 
    } = useConqueredPrizes();

    const { 
        orders, 
        cancelOrder, 
        refreshOrders
    } = usePrizeOrders();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Verificar se campanha tem múltiplos prêmios
    const isMultiPrizeCampaign = (campaignId: string) => {
        const prizesFromSameCampaign = availablePrizes.filter(p => p.campaign_id === campaignId);
        return prizesFromSameCampaign.length > 1;
    };

    // Verificar se já tem prêmio desta campanha no carrinho
    const hasPrizeFromCampaign = (campaignId: string) => {
        return cart.some(item => item.campaign_id === campaignId);
    };

    // Adicionar item ao carrinho
    const addToCart = (prize: ConqueredPrize) => {
        // Verificar se é campanha múltipla e já tem prêmio desta campanha
        if (isMultiPrizeCampaign(prize.campaign_id) && hasPrizeFromCampaign(prize.campaign_id)) {
            alert('Esta campanha tem múltiplos prêmios. Você só pode escolher 1 prêmio por campanha.');
            return;
        }

        const existingItem = cart.find(item => item.premio_conquistado_id === prize.id);
        
        if (existingItem) {
            // Verificar se pode aumentar quantidade
            const newQuantity = existingItem.quantidade + 1;
            const maxQuantity = Math.min(prize.quantidade_conquistada, 2); // Máximo 2 ou quantidade conquistada
            
            if (newQuantity <= maxQuantity) {
                setCart(cart.map(item => 
                    item.premio_conquistado_id === prize.id 
                        ? { ...item, quantidade: newQuantity, valor_total: newQuantity * item.premio_valor_estimado }
                        : item
                ));
            } else {
                alert(`Você só pode resgatar no máximo ${maxQuantity} unidade(s) deste prêmio.`);
            }
        } else {
            // Adicionar novo item
            const newItem: CartItem = {
                premio_conquistado_id: prize.id,
                campaign_id: prize.campaign_id,
                campaign_title: prize.campaign_title,
                premio_id: prize.premio_id,
                premio_nome: prize.premio_nome,
                premio_valor_estimado: prize.premio_valor_estimado,
                premio_imagem: prize.premio_imagem_url,
                premio_categoria: prize.premio_categoria,
                premio_tipo: prize.premio_tipo,
                quantidade: 1,
                valor_total: prize.premio_valor_estimado
            };
            setCart([...cart, newItem]);
        }
    };

    // Remover item do carrinho
    const removeFromCart = (premioConquistadoId: string) => {
        setCart(cart.filter(item => item.premio_conquistado_id !== premioConquistadoId));
    };

    // Atualizar quantidade no carrinho
    const updateQuantity = (premioConquistadoId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(premioConquistadoId);
            return;
        }

        // Encontrar o prêmio original para verificar limite
        const cartItem = cart.find(item => item.premio_conquistado_id === premioConquistadoId);
        if (cartItem) {
            const originalPrize = availablePrizes.find(prize => prize.id === premioConquistadoId);
            if (originalPrize) {
                const maxQuantity = Math.min(originalPrize.quantidade_conquistada, 2);
                
                if (newQuantity > maxQuantity) {
                    alert(`Você só pode resgatar no máximo ${maxQuantity} unidade(s) deste prêmio.`);
                    return;
                }
            }
        }

        setCart(cart.map(item => 
            item.premio_conquistado_id === premioConquistadoId 
                ? { ...item, quantidade: newQuantity, valor_total: newQuantity * item.premio_valor_estimado }
                : item
        ));
    };

    // Calcular total do carrinho
    const cartTotal = cart.reduce((sum, item) => sum + item.valor_total, 0);

    // Finalizar pedido
    const submitOrder = async () => {
        if (cart.length === 0) {
            alert('Carrinho vazio!');
            return;
        }

        try {
            setSubmitting(true);

            // Criar pedidos para cada item do carrinho
            for (const item of cart) {
                await createRedemptionOrder({
                    premio_conquistado_id: item.premio_conquistado_id,
                    quantidade: item.quantidade
                });
            }

            // Limpar carrinho
            setCart([]);
            alert('Pedido realizado com sucesso!');

        } catch (err: any) {
            alert('Erro ao finalizar pedido: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Formatar moeda
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Obter ícone do status
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'delivered': return <Truck className="w-4 h-4 text-blue-500" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    // Obter cor do status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'delivered': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Resgatar Prêmios</h2>
                    <p className="text-gray-600">Use seus prêmios conquistados para fazer pedidos</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Gift className="w-6 h-6 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Prêmios</span>
                </div>
            </div>

            {/* Valor Total de Premiação */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-800">
                            Valor Total de Premiação
                        </h3>
                        <p className="text-blue-600">
                            Total de prêmios conquistados
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-800">
                            {formatCurrency(balance.total_conquistado)}
                        </div>
                        <div className="text-sm text-blue-600">
                            {availablePrizes.length} prêmio{availablePrizes.length !== 1 ? 's' : ''} disponível{availablePrizes.length !== 1 ? 'is' : ''}
                        </div>
                    </div>
                </div>
            </Card>

            {error && (
                <Alert type="error" message={error} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prêmios Disponíveis */}
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Prêmios Disponíveis</h3>
                            <Badge variant="secondary">
                                {availablePrizes.length} disponível{availablePrizes.length !== 1 ? 'is' : ''}
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <Spinner />
                            </div>
                        ) : availablePrizes.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Nenhum prêmio disponível para resgate</p>
                                <p className="text-sm text-gray-400">Complete campanhas para conquistar prêmios</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Prêmio</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Campanha</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Qtd</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-700">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availablePrizes.map((prize) => (
                                            <tr key={prize.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        {prize.premio_imagem_url ? (
                                                            <img 
                                                                src={prize.premio_imagem_url} 
                                                                alt={prize.premio_nome}
                                                                className="w-12 h-12 object-contain bg-gray-100 rounded-lg"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                <Gift className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{prize.premio_nome}</div>
                                                            <div className="text-sm text-gray-500">{prize.premio_tipo}</div>
                                                            {isMultiPrizeCampaign(prize.campaign_id) && (
                                                                <Badge variant="warning" className="text-xs mt-1">
                                                                    Múltiplos Prêmios
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm text-gray-600 max-w-xs truncate">
                                                        {prize.campaign_title}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {prize.premio_categoria}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-semibold text-green-600">
                                                        {formatCurrency(prize.premio_valor_estimado)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm text-gray-600">
                                                        {prize.quantidade_conquistada}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addToCart(prize)}
                                                        disabled={isMultiPrizeCampaign(prize.campaign_id) && hasPrizeFromCampaign(prize.campaign_id)}
                                                        className="flex items-center space-x-1"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        <span>
                                                            {isMultiPrizeCampaign(prize.campaign_id) && hasPrizeFromCampaign(prize.campaign_id) 
                                                                ? 'Já Escolhido' 
                                                                : 'Adicionar'
                                                            }
                                                        </span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Carrinho */}
                <div>
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Carrinho</h3>
                            <div className="flex items-center space-x-1">
                                <ShoppingCart className="w-5 h-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-600">
                                    {cart.length} item{cart.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-8">
                                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Carrinho vazio</p>
                                <p className="text-sm text-gray-400">Adicione prêmios para começar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item.premio_conquistado_id} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">{item.premio_nome}</h4>
                                                <p className="text-xs text-gray-600">{item.campaign_title}</p>
                                                <p className="text-sm font-semibold text-green-600">
                                                    {formatCurrency(item.valor_total)}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(item.premio_conquistado_id, item.quantidade - 1)}
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-sm font-medium w-8 text-center">{item.quantidade}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.premio_conquistado_id, item.quantidade + 1)}
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.premio_conquistado_id)}
                                                    className="p-1 rounded-full hover:bg-red-100 text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                                        <span className="text-xl font-bold text-green-600">
                                            {formatCurrency(cartTotal)}
                                        </span>
                                    </div>

                                    <Button
                                        onClick={submitOrder}
                                        disabled={cart.length === 0 || submitting}
                                        className="w-full"
                                    >
                                        {submitting ? (
                                            <div className="flex items-center space-x-2">
                                                <Spinner size="sm" />
                                                <span>Processando...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Solicitar Pedido</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Pedidos Realizados */}
            {orders.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Meus Pedidos</h3>
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            {getStatusIcon(order.status)}
                                            <h4 className="font-semibold text-gray-900">{order.premio_nome}</h4>
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{order.campaign_title}</p>
                                        <p className="text-sm text-gray-500">
                                            Quantidade: {order.quantidade} • 
                                            Valor: {formatCurrency(order.valor_total)} • 
                                            Data: {new Date(order.data_solicitacao).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    {order.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => cancelOrder(order.id)}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PrizeRedemptionTab;
