import React, { useState, useEffect } from 'react';
import { Trophy, ShoppingCart, MapPin, Truck, CreditCard, Gift, Star, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Premio {
    id: string;
    nome: string;
    descricao?: string;
    valor_estimado: number;
    imagem_url?: string;
    imagem_miniatura_url?: string;
    categoria?: {
        nome: string;
    };
    tipo?: {
        nome: string;
    };
}

interface PremioConquistado {
    id: string;
    premio: Premio;
    quantidade: number;
    valor_total: number;
    campanha_id: string;
    campanha_titulo: string;
    conquistado_em: string;
}

interface CarrinhoItem {
    premio: Premio;
    quantidade: number;
    valor_total: number;
}

const PremiosPage: React.FC = () => {
    const { user } = useAuth();
    const [premiosConquistados, setPremiosConquistados] = useState<PremioConquistado[]>([]);
    const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
    const [endereco, setEndereco] = useState({
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: ''
    });
    const [loading, setLoading] = useState(true);
    const [frete, setFrete] = useState(0);
    const [prazo, setPrazo] = useState(0);

    // Calcular saldo total
    const saldoTotal = premiosConquistados.reduce((total, item) => total + item.valor_total, 0);
    
    // Calcular total do carrinho
    const totalCarrinho = carrinho.reduce((total, item) => total + item.valor_total, 0);

    useEffect(() => {
        if (user?.id) {
            fetchPremiosConquistados();
        }
    }, [user?.id]);

    const fetchPremiosConquistados = async () => {
        try {
            setLoading(true);
            
            // Buscar campanhas completadas do usuário
            const { data: campanhas, error } = await supabase
                .from('goals')
                .select(`
                    id,
                    title,
                    campanhas_premios (
                        id,
                        quantidade,
                        premio (
                            id,
                            nome,
                            descricao,
                            valor_estimado,
                            imagem_url,
                            imagem_miniatura_url,
                            categoria (
                                nome
                            ),
                            tipo (
                                nome
                            )
                        )
                    )
                `)
                .eq('user_id', user?.id)
                .eq('status', 'completed')
                .eq('record_type', 'campaign');

            if (error) throw error;

            // Processar dados
            const premios: PremioConquistado[] = [];
            campanhas?.forEach(campanha => {
                campanha.campanhas_premios?.forEach((cp: any) => {
                    premios.push({
                        id: cp.id,
                        premio: cp.premio,
                        quantidade: cp.quantidade,
                        valor_total: cp.premio.valor_estimado * cp.quantidade,
                        campanha_id: campanha.id,
                        campanha_titulo: campanha.title,
                        conquistado_em: new Date().toISOString()
                    });
                });
            });

            setPremiosConquistados(premios);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const adicionarAoCarrinho = (premio: Premio, quantidade: number) => {
        const itemExistente = carrinho.find(item => item.premio.id === premio.id);
        
        if (itemExistente) {
            setCarrinho(carrinho.map(item => 
                item.premio.id === premio.id 
                    ? { ...item, quantidade: item.quantidade + quantidade, valor_total: (item.quantidade + quantidade) * premio.valor_estimado }
                    : item
            ));
        } else {
            setCarrinho([...carrinho, {
                premio,
                quantidade,
                valor_total: quantidade * premio.valor_estimado
            }]);
        }
    };

    const removerDoCarrinho = (premioId: string) => {
        setCarrinho(carrinho.filter(item => item.premio.id !== premioId));
    };

    const calcularFrete = async () => {
        // Simular cálculo de frete
        setFrete(15.90);
        setPrazo(5);
    };

    const finalizarPedido = async () => {
        try {
            // Aqui você implementaria a lógica de finalização do pedido

            alert('Pedido finalizado com sucesso!');
            setCarrinho([]);
        } catch (error) {
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#49de80] mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando prêmios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Prêmios Conquistados</h1>
                                <p className="text-gray-300">Resgate seus prêmios conquistados nas campanhas</p>
                            </div>
                        </div>
                        
                        {/* Saldo Total */}
                        <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-400">
                                R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-gray-300">Saldo Disponível</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lista de Prêmios */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-[#49de80]" />
                                Prêmios Disponíveis para Resgate
                            </h2>
                            
                            {premiosConquistados.length === 0 ? (
                                <div className="text-center py-12">
                                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum prêmio conquistado</h3>
                                    <p className="text-gray-600">Complete campanhas para conquistar prêmios!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {premiosConquistados.map((item) => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start space-x-4">
                                                {item.premio.imagem_miniatura_url ? (
                                                    <img
                                                        src={item.premio.imagem_miniatura_url}
                                                        alt={item.premio.nome}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-[#49de80] to-green-600 rounded-lg flex items-center justify-center">
                                                        <Gift className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{item.premio.nome}</h3>
                                                    <p className="text-sm text-gray-600 mb-2">Campanha: {item.campanha_titulo}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-lg font-bold text-[#49de80]">
                                                                R$ {item.premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Qtd: {item.quantidade}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => adicionarAoCarrinho(item.premio, 1)}
                                                            className="bg-[#49de80] hover:bg-[#22c55e] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Adicionar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Carrinho e Checkout */}
                    <div className="space-y-6">
                        {/* Carrinho */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-[#49de80]" />
                                Carrinho ({carrinho.length})
                            </h3>
                            
                            {carrinho.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Carrinho vazio</p>
                            ) : (
                                <div className="space-y-3">
                                    {carrinho.map((item) => (
                                        <div key={item.premio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 line-clamp-1">{item.premio.nome}</p>
                                                <p className="text-sm text-gray-600">Qtd: {item.quantidade}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-[#49de80]">
                                                    R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                    onClick={() => removerDoCarrinho(item.premio.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-center font-bold text-lg">
                                            <span>Total:</span>
                                            <span className="text-[#49de80]">
                                                R$ {totalCarrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Endereço de Entrega */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#49de80]" />
                                Endereço de Entrega
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="CEP"
                                        value={endereco.cep}
                                        onChange={(e) => setEndereco({...endereco, cep: e.target.value})}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={calcularFrete}
                                        className="bg-[#49de80] hover:bg-[#22c55e] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Calcular Frete
                                    </button>
                                </div>
                                
                                <input
                                    type="text"
                                    placeholder="Rua"
                                    value={endereco.rua}
                                    onChange={(e) => setEndereco({...endereco, rua: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Número"
                                        value={endereco.numero}
                                        onChange={(e) => setEndereco({...endereco, numero: e.target.value})}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Complemento"
                                        value={endereco.complemento}
                                        onChange={(e) => setEndereco({...endereco, complemento: e.target.value})}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Bairro"
                                        value={endereco.bairro}
                                        onChange={(e) => setEndereco({...endereco, bairro: e.target.value})}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cidade"
                                        value={endereco.cidade}
                                        onChange={(e) => setEndereco({...endereco, cidade: e.target.value})}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                
                                <input
                                    type="text"
                                    placeholder="Estado"
                                    value={endereco.estado}
                                    onChange={(e) => setEndereco({...endereco, estado: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* Frete e Prazo */}
                        {frete > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-[#49de80]" />
                                    Frete e Prazo
                                </h3>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Frete:</span>
                                        <span className="font-semibold">R$ {frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Prazo:</span>
                                        <span className="font-semibold">{prazo} dias úteis</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Finalizar Pedido */}
                        {carrinho.length > 0 && (
                            <button
                                onClick={finalizarPedido}
                                className="w-full bg-gradient-to-r from-[#49de80] to-green-600 hover:from-[#22c55e] hover:to-green-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <CreditCard className="w-5 h-5 inline mr-2" />
                                Finalizar Pedido
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiosPage;
