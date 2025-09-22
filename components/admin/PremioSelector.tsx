import React, { useState, useEffect } from 'react';
import { Package, Search, X } from 'lucide-react';
import { usePremios, Premio } from '../../hooks/usePremios';
import Button from '../ui/Button';

interface PremioSelectorProps {
  selectedPremioId?: string;
  onPremioSelect: (premio: Premio | null) => void;
  quantidade?: number;
  onQuantidadeChange?: (quantidade: number) => void;
  disabled?: boolean;
  allowMultiple?: boolean;
  selectedPremios?: Array<{premio: Premio, quantidade: number}>;
}

const PremioSelector: React.FC<PremioSelectorProps> = ({
  selectedPremioId,
  onPremioSelect,
  quantidade = 1,
  onQuantidadeChange,
  disabled = false,
  allowMultiple = false,
  selectedPremios = []
}) => {
  const { premios, loading, error, fetchPremios } = usePremios();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPremio, setSelectedPremio] = useState<Premio | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Buscar prêmio selecionado
  useEffect(() => {
    if (selectedPremioId && premios.length > 0) {
      const premio = premios.find(p => p.id === selectedPremioId);
      if (premio) {
        setSelectedPremio(premio);
      }
    }
  }, [selectedPremioId, premios]);

  // Filtrar prêmios baseado na busca
  const filteredPremios = premios.filter(premio =>
    premio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    premio.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    premio.categoria?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    premio.tipo?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePremioSelect = (premio: Premio) => {
    setSelectedPremio(premio);
    onPremioSelect(premio);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleRemovePremio = () => {
    setSelectedPremio(null);
    onPremioSelect(null);
  };

  const handleQuantidadeChange = (newQuantidade: number) => {
    if (newQuantidade >= 1 && newQuantidade <= 100) {
      onQuantidadeChange?.(newQuantidade);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando prêmios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erro ao carregar prêmios: {error}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={fetchPremios}
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prêmio Selecionado */}
      {selectedPremio && !allowMultiple ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedPremio.imagem_miniatura_url ? (
                <img
                  src={selectedPremio.imagem_miniatura_url}
                  alt={selectedPremio.nome}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-900">{selectedPremio.nome}</h4>
                <p className="text-sm text-gray-600">
                  {selectedPremio.categoria?.nome} • {selectedPremio.tipo?.nome}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  R$ {selectedPremio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePremio}
              disabled={disabled}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quantidade */}
          {onQuantidadeChange && (
            <div className="mt-3 flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Quantidade:</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleQuantidadeChange(quantidade - 1)}
                  disabled={disabled || quantidade <= 1}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantidade}</span>
                <button
                  type="button"
                  onClick={() => handleQuantidadeChange(quantidade + 1)}
                  disabled={disabled || quantidade >= 100}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
         /* Seleção de Prêmio - Sempre visível quando allowMultiple é true */
         <div className="relative">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input
               type="text"
               placeholder="Buscar prêmio..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onFocus={() => setShowDropdown(true)}
               disabled={disabled}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
             />
           </div>

          {/* Dropdown de Prêmios */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredPremios.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'Nenhum prêmio encontrado' : 'Nenhum prêmio disponível'}
                </div>
              ) : (
                <div className="py-1">
                                                        {filteredPremios.map((premio) => {
                                                            const isAlreadySelected = allowMultiple && selectedPremios.some(p => p.premio.id === premio.id);
                                                            return (
                                                                <button
                                                                    key={premio.id}
                                                                    type="button"
                                                                    onClick={() => handlePremioSelect(premio)}
                                                                    disabled={isAlreadySelected}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                      <div className="flex items-center space-x-3">
                        {premio.imagem_miniatura_url ? (
                          <img
                            src={premio.imagem_miniatura_url}
                            alt={premio.nome}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{premio.nome}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {premio.categoria?.nome} • {premio.tipo?.nome}
                          </p>
                                                                        <p className="text-sm text-green-600 font-medium">
                                                                            R$ {premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                        </p>
                                                                        {isAlreadySelected && (
                                                                            <p className="text-xs text-orange-600">Já adicionado</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            );
                                                        })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estatísticas */}
      <div className="text-xs text-gray-500">
        {premios.length} prêmio(s) disponível(is)
        {searchTerm && ` • ${filteredPremios.length} resultado(s) para "${searchTerm}"`}
      </div>
    </div>
  );
};

export default PremioSelector;
