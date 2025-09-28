/**
 * 🔥 SERVIÇO GLOBAL DE CACHE
 * Consolida TODOS os serviços de cache e otimização em um único ponto
 * Substitui: ImageCacheService, CampaignCacheService, ImageOptimizationService
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  accessCount: number;
  lastAccessed: number;
}

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

export class GlobalCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static imageCache = new Map<string, string>();
  private static loadingPromises = new Map<string, Promise<string>>();
  
  // Configurações de TTL
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private static readonly CAMPAIGN_TTL = 2 * 60 * 1000; // 2 minutos para campanhas
  private static readonly PROGRESS_TTL = 1 * 60 * 1000; // 1 minuto para progresso
  private static readonly IMAGE_TTL = 30 * 60 * 1000; // 30 minutos para imagens
  
  // Estatísticas
  private static stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  /**
   * 🔥 CACHE GERAL: Armazenar qualquer tipo de dados
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
    
    console.log(`💾 GlobalCacheService - Dados armazenados no cache: ${key}`);
  }

  /**
   * 🔥 CACHE GERAL: Recuperar dados do cache
   */
  static get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    console.log(`✅ GlobalCacheService - Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * 🔥 CACHE DE CAMPANHAS: Específico para dados de campanhas
   */
  static setCampaignData(campaignId: string, data: any): void {
    this.set(`campaign_${campaignId}`, data, this.CAMPAIGN_TTL);
  }

  static getCampaignData(campaignId: string): any | null {
    return this.get(`campaign_${campaignId}`);
  }

  /**
   * 🔥 CACHE DE PROGRESSO: Específico para dados de progresso
   */
  static setProgressData(userId: string, data: any): void {
    this.set(`progress_${userId}`, data, this.PROGRESS_TTL);
  }

  static getProgressData(userId: string): any | null {
    return this.get(`progress_${userId}`);
  }

  /**
   * 🔥 CACHE DE IMAGENS: Carregar imagem com cache local
   */
  static async loadImage(imageUrl: string): Promise<string> {
    // Verificar se já está no cache
    if (this.imageCache.has(imageUrl)) {
      console.log(`✅ GlobalCacheService - Imagem em cache: ${imageUrl}`);
      return this.imageCache.get(imageUrl)!;
    }

    // Verificar se já está carregando
    if (this.loadingPromises.has(imageUrl)) {
      console.log(`⏳ GlobalCacheService - Imagem já carregando: ${imageUrl}`);
      return this.loadingPromises.get(imageUrl)!;
    }

    // Iniciar carregamento
    const loadingPromise = this.loadImageFromUrl(imageUrl);
    this.loadingPromises.set(imageUrl, loadingPromise);

    try {
      const result = await loadingPromise;
      this.imageCache.set(imageUrl, result);
      this.loadingPromises.delete(imageUrl);
      return result;
    } catch (error) {
      this.loadingPromises.delete(imageUrl);
      throw error;
    }
  }

  /**
   * 🔥 CARREGAMENTO DE IMAGEM: Da URL
   */
  private static async loadImageFromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Criar canvas para otimizar
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Redimensionar se necessário
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem otimizada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(optimizedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error(`Erro ao carregar imagem: ${imageUrl}`));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * 🔥 OTIMIZAÇÃO DE IMAGEM: Redimensionar e comprimir
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
      
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Calcular dimensões otimizadas
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem otimizada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Erro ao otimizar imagem'));
          }
        }, `image/${format}`, quality);
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar arquivo de imagem'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 🔥 PRÉ-CARREGAMENTO: Carregar múltiplas imagens
   */
  static async preloadImages(imageUrls: string[]): Promise<void> {
    console.log(`🔄 GlobalCacheService - Pré-carregando ${imageUrls.length} imagens`);
    
    const loadPromises = imageUrls.map(url => this.loadImage(url));
    
    try {
      await Promise.all(loadPromises);
      console.log(`✅ GlobalCacheService - Todas as imagens pré-carregadas`);
    } catch (error) {
      console.error(`❌ GlobalCacheService - Erro no pré-carregamento:`, error);
    }
  }

  /**
   * 🔥 CACHE DE DADOS DE USUÁRIO: Para dados específicos do usuário
   */
  static setUserData(userId: string, dataType: string, data: any): void {
    this.set(`user_${userId}_${dataType}`, data, this.DEFAULT_TTL);
  }

  static getUserData(userId: string, dataType: string): any | null {
    return this.get(`user_${userId}_${dataType}`);
  }

  /**
   * 🔥 LIMPEZA AUTOMÁTICA: Remover entradas expiradas
   */
  static cleanExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 GlobalCacheService - ${cleanedCount} entradas expiradas removidas`);
    }
  }

  /**
   * 🔥 LIMPEZA COMPLETA: Remover todo o cache
   */
  static clearAll(): void {
    this.cache.clear();
    this.imageCache.clear();
    this.loadingPromises.clear();
    
    // Resetar estatísticas
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
    
    console.log(`🧹 GlobalCacheService - Cache completamente limpo`);
  }

  /**
   * 🔥 LIMPEZA SELETIVA: Por padrão
   */
  static clearByPattern(pattern: string): void {
    let cleanedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 GlobalCacheService - ${cleanedCount} entradas removidas (padrão: ${pattern})`);
  }

  /**
   * 🔥 ESTATÍSTICAS DO CACHE
   */
  static getCacheStats(): CacheStats {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    const totalSize = JSON.stringify(Array.from(this.cache.entries())).length;
    const hitRate = this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0;
    const missRate = 100 - hitRate;
    
    const timestamps = entries.map(e => e.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * 🔥 INICIALIZAÇÃO: Configurar limpeza automática
   */
  static initialize(): void {
    // Limpeza automática a cada 5 minutos
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 5 * 60 * 1000);
    
    console.log(`🚀 GlobalCacheService - Inicializado com limpeza automática`);
  }

  /**
   * 🔥 CACHE DE RELATÓRIOS: Para dados de relatórios
   */
  static setReportData(reportId: string, data: any): void {
    this.set(`report_${reportId}`, data, 60 * 60 * 1000); // 1 hora
  }

  static getReportData(reportId: string): any | null {
    return this.get(`report_${reportId}`);
  }

  /**
   * 🔥 CACHE DE NOTIFICAÇÕES: Para dados de notificações
   */
  static setNotificationData(userId: string, data: any): void {
    this.set(`notifications_${userId}`, data, 2 * 60 * 1000); // 2 minutos
  }

  static getNotificationData(userId: string): any | null {
    return this.get(`notifications_${userId}`);
  }

  /**
   * 🔥 CACHE DE DADOS DE ADMIN: Para dados administrativos
   */
  static setAdminData(dataType: string, data: any): void {
    this.set(`admin_${dataType}`, data, 10 * 60 * 1000); // 10 minutos
  }

  static getAdminData(dataType: string): any | null {
    return this.get(`admin_${dataType}`);
  }

  /**
   * 🔥 VERIFICAR SE EXISTE: Sem incrementar contador
   */
  static has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 🔥 REMOVER ENTRADA ESPECÍFICA
   */
  static remove(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 🔥 TAMANHO DO CACHE
   */
  static getSize(): number {
    return this.cache.size;
  }

  /**
   * 🔥 LISTAR CHAVES DO CACHE
   */
  static getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}
