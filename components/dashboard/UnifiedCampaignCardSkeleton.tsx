import React from 'react';

/**
 * 🎭 COMPONENTE DE SKELETON LOADING PARA UNIFIEDCAMPAIGNCARD
 * Simula EXATAMENTE o layout do UnifiedCampaignCard real
 */
export const UnifiedCampaignCardSkeleton: React.FC = () => {
  return (
    <div 
      className="rounded-xl shadow-lg overflow-hidden relative flex flex-col animate-pulse"
      style={{ 
        backgroundColor: '#1E293B', // Mesmo background do card real
        height: '480px' // Mesma altura do card real
      }}
    >
      {/* Decorative quarter circle - skeleton */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-600 opacity-20 rounded-bl-full"></div>
      
      <div className="p-3 relative z-10 flex-1 flex flex-col">
        {/* Seção do Prêmio com Carrossel - EXATAMENTE como o real */}
        <div className="relative mb-4 p-2">
          {/* Imagem do prêmio com gradiente verde (skeleton) */}
          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg overflow-hidden">
            {/* Skeleton da imagem de fundo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-500 rounded-lg"></div>
            </div>

            {/* Skeleton das setas de navegação */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-500/20 rounded-full p-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-500/20 rounded-full p-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
            </div>
            
            {/* Skeleton do overlay com informações do prêmio */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-700 to-transparent p-4">
              <div className="text-white">
                <div className="h-5 bg-gray-500 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-500 rounded w-1/2"></div>
              </div>
            </div>
            
            {/* Skeleton dos indicadores do carrossel */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Skeleton do contador de posição */}
            <div className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">
              <div className="h-3 bg-gray-500 rounded w-6"></div>
            </div>
          </div>
        </div>

        {/* Título da Campanha com Progresso Integrado - EXATAMENTE como o real */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="h-5 sm:h-6 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 sm:h-5 bg-gray-600 rounded w-12"></div>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div className="bg-gray-500 h-2 rounded-full w-2/3"></div>
          </div>
        </div>

        {/* Informações da Campanha - EXATAMENTE como o real */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-2 mb-4">
            {/* Data */}
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-600 rounded w-32"></div>
            </div>
            
            {/* Dias restantes */}
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-600 rounded w-16"></div>
            </div>
            
            {/* Prêmios */}
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-600 rounded w-20"></div>
            </div>
          </div>

          {/* Botão de detalhes - EXATAMENTE como o real */}
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            disabled
          >
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <div className="h-4 bg-gray-500 rounded w-16"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎭 COMPONENTE DE SKELETON PARA MÚLTIPLOS UNIFIEDCAMPAIGNCARD
 */
export const UnifiedCampaignCardsSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <UnifiedCampaignCardSkeleton key={index} />
      ))}
    </div>
  );
};
