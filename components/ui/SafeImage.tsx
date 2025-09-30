import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

interface SafeImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt = 'Imagem', 
  className = '', 
  fallback,
  onError 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.warn('🖼️ SafeImage: Erro ao carregar imagem:', src);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        {fallback || (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <SkeletonLoader 
          className="absolute inset-0 w-full h-full"
          variant="rectangular"
        />
      )}
      
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default SafeImage;
