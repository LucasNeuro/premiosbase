import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConqueredPrizes, ConqueredPrize, PrizeBalance } from '../../hooks/useConqueredPrizes';
import { usePrizeOrders, PrizeOrder } from '../../hooks/usePrizeOrders';
import { supabase } from '../../lib/supabase';
import { AutoPrizeService } from '../../services/AutoPrizeService';
import { PrizeRedemptionService } from '../../services/PrizeRedemptionService';
import SafeImage from '../ui/SafeImage';
import ImagePreloader from '../ui/ImagePreloader';
import { usePoliciesStore } from '../../stores/usePoliciesStore';
import { useCacheManager } from '../../hooks/useCacheManager';
import PrizeGrid from './PrizeGrid';
import PrizeHero from './PrizeHero';
import SmartCart from './SmartCart';
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
    AlertCircle,
    Search,
    Filter
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
    const { user } = useAuth();
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
    const [processingPrizes, setProcessingPrizes] = useState(false);
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderCurrentPage, setOrderCurrentPage] = useState(1);
    const [orderItemsPerPage, setOrderItemsPerPage] = useState(10);

    // ✅ NOVA FUNÇÃO: Processar prêmios de campanhas completadas
    const processCompletedCampaignsPrizes = async () => {
        try {
            setProcessingPrizes(true);
            console.log('🔍 PrizeRedemptionTab - Verificando campanhas completadas e disponibilizando prêmios');
            
            const result = await AutoPrizeService.processAllCompletedCampaigns();
            
            if (result.success) {
                console.log(`✅ PrizeRedemptionTab - ${result.processedCampaigns} campanhas processadas`);
                
                // Recarregar prêmios após processamento
                await refreshPrizes();
                await refreshBalance();
                
                if (result.processedCampaigns > 0) {
                    alert(`Prêmios disponibilizados para ${result.processedCampaigns} campanhas completadas!`);
                } else {
                    alert('Nenhuma campanha completada encontrada ou prêmios já disponibilizados.');
                }
            } else {
                console.error('❌ PrizeRedemptionTab - Erro ao processar campanhas:', result.errors);
                alert('Erro ao processar campanhas completadas');
            }
        } catch (error) {
            console.error('❌ PrizeRedemptionTab - Erro ao processar prêmios:', error);
            alert('Erro ao processar prêmios');
        } finally {
            setProcessingPrizes(false);
        }
    };

    // Verificar se campanha tem múltiplos prêmios
    const isMultiPrizeCampaign = (campaignId: string) => {
        const prizesFromSameCampaign = availablePrizes.filter(p => p.campaign_id === campaignId);
        return prizesFromSameCampaign.length > 1;
    };

    // ✅ NOVA LÓGICA: Verificar se já tem prêmio desta campanha no carrinho
    const hasPrizeFromCampaign = (campaignId: string) => {
        return cart.some(item => item.campaign_id === campaignId);
    };

    // ✅ NOVA LÓGICA: Verificar se prêmio já foi escolhido (removido da tabela)
    const isPrizeAlreadyChosen = (prize: ConqueredPrize) => {
        // Se o prêmio não está mais na lista de disponíveis, foi escolhido
        return !availablePrizes.some(ap => ap.id === prize.id);
    };

    // ✅ NOVA LÓGICA: Adicionar item ao carrinho (apenas 1 por campanha)
    const addToCart = (prize: ConqueredPrize) => {
        // Verificar se já tem prêmio desta campanha no carrinho
        if (hasPrizeFromCampaign(prize.campaign_id)) {
            alert('Você já escolheu um prêmio desta campanha. Remova o prêmio atual para escolher outro.');
            return;
        }

        // Adicionar novo item (apenas 1 por campanha)
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

    // ✅ NOVA LÓGICA: Finalizar pedido e remover prêmios
    const submitOrder = async () => {
        if (cart.length === 0) {
            alert('Carrinho vazio!');
            return;
        }

        try {
            setSubmitting(true);
            console.log('🛒 PrizeRedemptionTab - Finalizando pedido com nova lógica');

            // Usar o novo serviço para criar pedido e remover prêmios
            if (!user?.id) {
                throw new Error('Usuário não autenticado');
            }
            const result = await PrizeRedemptionService.createRedemptionOrder(cart, user.id);

            if (result.success) {
                console.log(`✅ PrizeRedemptionTab - Pedido criado: ${result.orderId}, ${result.removedPrizes} prêmios removidos`);
                
                // Limpar carrinho
                setCart([]);
                
                // Recarregar prêmios disponíveis
                await refreshPrizes();
                
                alert(`Pedido realizado com sucesso! ${result.removedPrizes} prêmios removidos da sua conta.`);
            } else {
                throw new Error(result.error || 'Erro ao criar pedido');
            }

        } catch (err: any) {
            console.error('❌ PrizeRedemptionTab - Erro ao finalizar pedido:', err);
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

    // Coletar URLs das imagens para preload
    const imageUrls = availablePrizes
        .map(prize => prize.premio_imagem_url)
        .filter(Boolean) as string[];

    // Calcular valor total dos prêmios
    const totalPrizesValue = availablePrizes.reduce((sum, prize) => sum + prize.premio_valor_estimado, 0);

    return (
        <div className="space-y-8">
            {/* Preloader invisível para melhorar performance */}
            <ImagePreloader 
                images={imageUrls}
                onComplete={() => console.log('🖼️ PrizeRedemptionTab: Imagens pré-carregadas')}
                onProgress={(loaded, total) => console.log(`🖼️ PrizeRedemptionTab: ${loaded}/${total} imagens carregadas`)}
            />
            

            {/* Hero Section Aprimorada */}
            <PrizeHero
                totalPrizes={availablePrizes.length}
                totalValue={totalPrizesValue}
                onProcessPrizes={processCompletedCampaignsPrizes}
                processingPrizes={processingPrizes}
            />

            {error && (
                <Alert type="error" message={error} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Prêmios Disponíveis - Nova UI */}
                <div className="lg:col-span-2">
                    <PrizeGrid
                        prizes={availablePrizes}
                        onAddToCart={addToCart}
                        isMultiPrizeCampaign={isMultiPrizeCampaign}
                        hasPrizeFromCampaign={hasPrizeFromCampaign}
                        loading={loading}
                    />
                </div>

                {/* Carrinho Inteligente */}
                <div>
                    <SmartCart
                        cart={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromCart}
                        onSubmitOrder={submitOrder}
                        submitting={submitting}
                    />
                </div>
            </div>

            {/* Pedidos Realizados - Versão Melhorada */}
            {orders.length > 0 && (
                <>
                    {/* Busca Simples - Igual ao Histórico de Apólices */}
                    <div className="mb-6">
                        <div className="flex justify-end">
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por prêmio ou campanha..."
                                    value={orderSearchTerm}
                                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Meus Pedidos</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {(() => {
                                    const filteredOrders = orders.filter(order => {
                                        const matchesSearch = 
                                            order.premio_nome.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                                            order.campaign_title.toLowerCase().includes(orderSearchTerm.toLowerCase());
                                        return matchesSearch;
                                    });
                                    return `${filteredOrders.length} de ${orders.length} pedido${orders.length !== 1 ? 's' : ''}`;
                                })()}
                            </span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Prêmio
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Campanha
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Qtd
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    const filteredOrders = orders.filter(order => {
                                        const matchesSearch = 
                                            order.premio_nome.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                                            order.campaign_title.toLowerCase().includes(orderSearchTerm.toLowerCase());
                                        return matchesSearch;
                                    });
                                    
                                    // Paginação
                                    const totalPages = Math.ceil(filteredOrders.length / orderItemsPerPage);
                                    const startIndex = (orderCurrentPage - 1) * orderItemsPerPage;
                                    const endIndex = startIndex + orderItemsPerPage;
                                    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
                                    
                                    return paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Gift className="h-5 w-5 text-yellow-500 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.premio_nome}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.campaign_title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.quantidade}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(order.valor_total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                            {getStatusIcon(order.status)}
                                                <Badge className={`ml-2 ${getStatusColor(order.status)}`}>
                                                    {order.status === 'pending' ? 'Pendente' :
                                                     order.status === 'approved' ? 'Aprovado' :
                                                     order.status === 'rejected' ? 'Rejeitado' :
                                                     order.status === 'delivered' ? 'Entregue' :
                                                     order.status === 'cancelled' ? 'Cancelado' : order.status}
                                            </Badge>
                                        </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.data_solicitacao).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {order.status === 'pending' && (
                                        <Button
                                            onClick={() => cancelOrder(order.id)}
                                            className="text-red-600 border border-red-200 hover:bg-red-50 text-sm px-3 py-1"
                                        >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                            Cancelar
                                        </Button>
                                    )}
                                            {order.status !== 'pending' && (
                                                <span className="text-gray-400 text-xs">
                                                    {order.status === 'approved' ? 'Aguardando entrega' :
                                                     order.status === 'delivered' ? 'Entregue' :
                                                     order.status === 'rejected' ? 'Rejeitado' :
                                                     order.status === 'cancelled' ? 'Cancelado' : ''}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Paginação - Igual ao Histórico de Apólices */}
                    {(() => {
                        const filteredOrders = orders.filter(order => {
                            const matchesSearch = 
                                order.premio_nome.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                                order.campaign_title.toLowerCase().includes(orderSearchTerm.toLowerCase());
                            return matchesSearch;
                        });
                        
                        const totalPages = Math.ceil(filteredOrders.length / orderItemsPerPage);
                        const startIndex = (orderCurrentPage - 1) * orderItemsPerPage;
                        const endIndex = startIndex + orderItemsPerPage;
                        
                        return (
                            <div className="flex items-center justify-between mt-6">
                                <div className="flex items-center text-sm text-gray-700">
                                    <span>Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} registros</span>
                                    <select
                                        value={orderItemsPerPage}
                                        onChange={(e) => {
                                            setOrderItemsPerPage(Number(e.target.value));
                                            setOrderCurrentPage(1);
                                        }}
                                        className="ml-4 px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="ml-2">Por página:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => setOrderCurrentPage(1)}
                                        disabled={orderCurrentPage === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        &lt;&lt;
                                    </Button>
                                    <Button
                                        onClick={() => setOrderCurrentPage(orderCurrentPage - 1)}
                                        disabled={orderCurrentPage === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        &lt;
                                    </Button>
                                    <span className="px-3 py-1 text-sm text-gray-700">
                                        Página {orderCurrentPage} de {totalPages}
                                    </span>
                                    <Button
                                        onClick={() => setOrderCurrentPage(orderCurrentPage + 1)}
                                        disabled={orderCurrentPage === totalPages}
                                        className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        &gt;
                                    </Button>
                                    <Button
                                        onClick={() => setOrderCurrentPage(totalPages)}
                                        disabled={orderCurrentPage === totalPages}
                                        className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        &gt;&gt;
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </Card>
                </>
            )}
        </div>
    );
};

export default PrizeRedemptionTab;
