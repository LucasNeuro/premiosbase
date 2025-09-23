import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Clock, X, Eye, Package } from 'lucide-react';
import { useEscolhaPremios, EscolhaPremio } from '../../hooks/useEscolhaPremios';
import { supabase } from '../../lib/supabase';

export default function GerenciarEscolhasPremios() {
  const [escolhas, setEscolhas] = useState<EscolhaPremio[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'escolhido' | 'entregue' | 'cancelado'>('todos');
  const [escolhaSelecionada, setEscolhaSelecionada] = useState<EscolhaPremio | null>(null);
  const [observacoesEntrega, setObservacoesEntrega] = useState('');

  const { 
    fetchEscolhas, 
    marcarPremioEntregue, 
    cancelarEscolhaPremio 
  } = useEscolhaPremios();

  useEffect(() => {
    carregarEscolhas();
  }, []);

  const carregarEscolhas = async () => {
    setLoading(true);
    try {
      const data = await fetchEscolhas();
      setEscolhas(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarEntregue = async (escolha: EscolhaPremio) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      await marcarPremioEntregue(escolha.id, user.id, observacoesEntrega);
      setEscolhaSelecionada(null);
      setObservacoesEntrega('');
      await carregarEscolhas();
      alert('Prêmio marcado como entregue!');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleCancelarEscolha = async (escolha: EscolhaPremio) => {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo) return;

    try {
      await cancelarEscolhaPremio(escolha.id, motivo);
      await carregarEscolhas();
      alert('Escolha cancelada!');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'escolhido':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'entregue':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelado':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escolhido':
        return 'bg-yellow-100 text-yellow-800';
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const escolhasFiltradas = escolhas.filter(escolha => 
    filtro === 'todos' || escolha.status === filtro
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Gift className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Escolhas de Prêmios</h1>
        </div>
        <button
          onClick={carregarEscolhas}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2">
        {(['todos', 'escolhido', 'entregue', 'cancelado'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFiltro(status)}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              filtro === status
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de Escolhas */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Carregando...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {escolhasFiltradas.map((escolha) => (
            <div key={escolha.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(escolha.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {escolha.corretor.name} - {escolha.campanha.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Prêmio escolhido: <span className="font-medium">{escolha.premio_escolhido.nome}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Escolhido em: {new Date(escolha.escolhido_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escolha.status)}`}>
                    {escolha.status}
                  </span>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEscolhaSelecionada(escolha)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {escolha.status === 'escolhido' && (
                      <>
                        <button
                          onClick={() => handleMarcarEntregue(escolha)}
                          className="p-1 text-green-400 hover:text-green-600"
                          title="Marcar como entregue"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelarEscolha(escolha)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Cancelar escolha"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {escolhaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Detalhes da Escolha</h2>
              <button
                onClick={() => setEscolhaSelecionada(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Corretor</h3>
                <p className="text-gray-600">{escolhaSelecionada.corretor.name} ({escolhaSelecionada.corretor.email})</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Campanha</h3>
                <p className="text-gray-600">{escolhaSelecionada.campanha.title}</p>
                <p className="text-sm text-gray-500">
                  Progresso: {escolhaSelecionada.campanha.progress_percentage.toFixed(2)}%
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Prêmio Escolhido</h3>
                <p className="text-gray-600">{escolhaSelecionada.premio_escolhido.nome}</p>
                {escolhaSelecionada.premio_escolhido.descricao && (
                  <p className="text-sm text-gray-500">{escolhaSelecionada.premio_escolhido.descricao}</p>
                )}
                <p className="text-sm text-green-600 font-medium">
                  R$ {escolhaSelecionada.premio_escolhido.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Status</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escolhaSelecionada.status)}`}>
                  {escolhaSelecionada.status}
                </span>
              </div>
              
              {escolhaSelecionada.observacoes && (
                <div>
                  <h3 className="font-medium text-gray-900">Observações</h3>
                  <p className="text-gray-600">{escolhaSelecionada.observacoes}</p>
                </div>
              )}
              
              {escolhaSelecionada.entregue && escolhaSelecionada.entregue_em && (
                <div>
                  <h3 className="font-medium text-gray-900">Entrega</h3>
                  <p className="text-gray-600">
                    Entregue em: {new Date(escolhaSelecionada.entregue_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

