import React from 'react';

/**
 * 🎭 COMPONENTE DE SKELETON LOADING PARA CARDS DE CAMPANHA
 * Simula o layout dos cards reais durante o carregamento
 */
export const CampaignCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-pulse">
      {/* Seção Superior - Imagem e Prêmio */}
      <div className="relative bg-gray-200 h-64">
        {/* Skeleton da imagem */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-gray-300 rounded-lg"></div>
        </div>
        
        {/* Skeleton dos botões de navegação */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Skeleton do indicador de página */}
        <div className="absolute top-4 right-4">
          <div className="w-8 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>
      
      {/* Seção Inferior - Informações da Campanha */}
      <div className="p-6 bg-gray-800">
        {/* Título do prêmio */}
        <div className="mb-4">
          <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>
        
        {/* Categoria */}
        <div className="mb-4">
          <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
        </div>
        
        {/* Barra de progresso */}
        <div className="mb-4">
          <div className="h-2 bg-gray-600 rounded-full">
            <div className="h-2 bg-gray-500 rounded-full w-3/4"></div>
          </div>
          <div className="h-4 bg-gray-600 rounded w-12 mt-2"></div>
        </div>
        
        {/* Informações adicionais */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-20"></div>
          </div>
        </div>
        
        {/* Descrição */}
        <div className="mb-4">
          <div className="h-3 bg-gray-600 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-600 rounded w-5/6 mb-1"></div>
          <div className="h-3 bg-gray-600 rounded w-4/6"></div>
        </div>
        
        {/* Botão */}
        <div className="h-10 bg-gray-600 rounded-lg"></div>
      </div>
    </div>
  );
};

/**
 * 🎭 COMPONENTE DE SKELETON PARA MÚLTIPLOS CARDS
 */
export const CampaignCardsSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CampaignCardSkeleton key={index} />
      ))}
    </div>
  );
};

