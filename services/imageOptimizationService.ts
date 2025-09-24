/**
 * Serviço de Otimização de Imagens
 * Redimensiona e otimiza imagens automaticamente para melhor qualidade
 */

interface ImageOptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

class ImageOptimizationService {
    /**
     * Otimiza uma imagem redimensionando e comprimindo
     */
    static async optimizeImage(
        file: File, 
        options: ImageOptimizationOptions = {}
    ): Promise<File> {
        const {
            maxWidth = 1200,
            maxHeight = 1200,
            quality = 0.9,
            format = 'jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calcular novas dimensões mantendo proporção
                    let { width, height } = this.calculateDimensions(
                        img.width, 
                        img.height, 
                        maxWidth, 
                        maxHeight
                    );

                    // Configurar canvas
                    canvas.width = width;
                    canvas.height = height;

                    // Desenhar imagem redimensionada
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Converter para blob otimizado
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                // Criar novo arquivo com nome otimizado
                                const fileName = file.name.replace(/\.[^/.]+$/, `_optimized.${format}`);
                                const optimizedFile = new File([blob], fileName, {
                                    type: `image/${format}`,
                                    lastModified: Date.now()
                                });
                                resolve(optimizedFile);
                            } else {
                                reject(new Error('Erro ao otimizar imagem'));
                            }
                        },
                        `image/${format}`,
                        quality
                    );
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Erro ao carregar imagem'));
            };

            // Carregar imagem
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Cria uma miniatura otimizada
     */
    static async createThumbnail(
        file: File,
        size: number = 300
    ): Promise<File> {
        return this.optimizeImage(file, {
            maxWidth: size,
            maxHeight: size,
            quality: 0.8,
            format: 'jpeg'
        });
    }

    /**
     * Calcula dimensões mantendo proporção
     */
    private static calculateDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number
    ): { width: number; height: number } {
        let width = originalWidth;
        let height = originalHeight;

        // Redimensionar se necessário
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }

        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }

    /**
     * Valida se a imagem precisa de otimização
     */
    static needsOptimization(file: File): boolean {
        // Verificar se é uma imagem
        if (!file.type.startsWith('image/')) {
            return false;
        }

        // Verificar tamanho (se > 1MB, precisa otimizar)
        if (file.size > 1024 * 1024) {
            return true;
        }

        return false;
    }

    /**
     * Obtém informações da imagem
     */
    static async getImageInfo(file: File): Promise<{
        width: number;
        height: number;
        size: number;
        type: string;
    }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    type: file.type
                });
            };

            img.onerror = () => {
                reject(new Error('Erro ao carregar imagem'));
            };

            img.src = URL.createObjectURL(file);
        });
    }
}

export default ImageOptimizationService;
