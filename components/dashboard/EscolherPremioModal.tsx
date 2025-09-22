import React, { useState, useEffect } from 'react';
import { X, Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { usePremios } from '../../hooks/usePremios';
import { useEscolhaPremios } from '../../hooks/useEscolhaPremios';

interface EscolherPremioModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  userId: string;
  onPremioEscolhido?: () => void;
}

export default function EscolherPremioModal({
  isOpen,
  onClose,
  goalId,
  userId,
  onPremioEscolhido
}: EscolherPremioModalProps) {
  const [premioSelecionado, setPremioSelecionado] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escolhaExistente, setEscolhaExistente] = useState<any>(null);

  const { premios, loading: loadingPremios } = usePremios();
  const { 
    verificarEscolhaExistente, 
    escolherPremio, 
    alterarEscolhaPremio 
  } = useEscolhaPremios();

  useEffect(() => {
    if (isOpen && goalId && userId) {
      verificarEscolhaExistente(goalId, userId)
        .then(escolha => {
          setEscolhaExistente(escolha);
          if (escolha) {
            setPremioSelecionado(escolha.premio_escolhido_id);
            setObservacoes(escolha.observacoes || '');
          }
        })
        .catch(() => {});
    }
  }, [isOpen, goalId, userId, verificarEscolhaExistente]);

  const handleSubmit = async () => {
    if (!premioSelecionado) {
      alert('Por favor, selecione um prêmio');
      return;
    }

    setIsSubmitting(true);
    try {
      if (escolhaExistente) {
        // Alterar escolha existente
        await alterarEscolhaPremio(escolhaExistente.id, premioSelecionado, observacoes);
        alert('Prêmio alterado com sucesso!');
      } else {
        // Nova escolha
        await escolherPremio(goalId, userId, premioSelecionado, observacoes);
        alert('Prêmio escolhido com sucesso!');
      }
      
      onPremioEscolhido?.();
      onClose();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPremioSelecionado(null);
    setObservacoes('');
    setEscolhaExistente(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {escolhaExistente ? 'Alterar Prêmio Escolhido' : 'Escolher Prêmio'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {escolhaExistente && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Você já escolheu um prêmio para esta campanha
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Você pode alterar sua escolha abaixo, desde que o prêmio ainda não tenha sido entregue.
              </p>
            </div>
          )}

          {loadingPremios ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Carregando prêmios...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premios.map((premio) => (
                <div
                  key={premio.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    premioSelecionado === premio.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setPremioSelecionado(premio.id)}
                >
                  <div className="flex items-center space-x-3">
                    {premioSelecionado === premio.id && (
                      <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {premio.nome}
                      </h3>
                      {premio.descricao && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {premio.descricao}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        {premio.categoria && (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${premio.categoria.cor}20`,
                              color: premio.categoria.cor 
                            }}
                          >
                            {premio.categoria.nome}
                          </span>
                        )}
                        {premio.tipo && (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${premio.tipo.cor}20`,
                              color: premio.tipo.cor 
                            }}
                          >
                            {premio.tipo.nome}
                          </span>
                        )}
                      </div>
                      {premio.valor_estimado && (
                        <p className="text-sm font-medium text-green-600 mt-2">
                          R$ {premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Observações */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Adicione alguma observação sobre sua escolha..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!premioSelecionado || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvando...</span>
              </div>
            ) : (
              escolhaExistente ? 'Alterar Escolha' : 'Confirmar Escolha'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
