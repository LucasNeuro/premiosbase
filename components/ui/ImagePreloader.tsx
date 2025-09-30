import { useEffect, useState } from 'react';

interface ImagePreloaderProps {
  images: string[];
  onComplete?: () => void;
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Componente para pré-carregar imagens em background
 * Melhora a experiência do usuário carregando imagens antecipadamente
 */
const ImagePreloader: React.FC<ImagePreloaderProps> = ({ 
  images, 
  onComplete, 
  onProgress 
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (images.length === 0) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          console.log(`🖼️ ImagePreloader: Imagem carregada: ${src}`);
          setLoadedImages(prev => new Set([...prev, src]));
          loadedCount++;
          onProgress?.(loadedCount, totalImages);
          
          if (loadedCount === totalImages) {
            setIsComplete(true);
            onComplete?.();
          }
          
          resolve();
        };
        
        img.onerror = () => {
          console.warn(`⚠️ ImagePreloader: Erro ao carregar: ${src}`);
          loadedCount++;
          onProgress?.(loadedCount, totalImages);
          
          if (loadedCount === totalImages) {
            setIsComplete(true);
            onComplete?.();
          }
          
          resolve(); // Resolve mesmo com erro para não travar
        };
        
        img.src = src;
      });
    };

    // Carregar todas as imagens em paralelo
    const preloadPromises = images.map(src => preloadImage(src));
    
    Promise.all(preloadPromises).then(() => {
      console.log('✅ ImagePreloader: Todas as imagens processadas');
    });

  }, [images, onComplete, onProgress]);

  // Componente invisível - apenas para lógica de preload
  return null;
};

export default ImagePreloader;
