// Configuração da API de IA
export const AI_CONFIG = {
    MISTRAL_API_KEY: import.meta.env.VITE_MISTRAL_KEY || '',
    MISTRAL_API_URL: 'https://api.mistral.ai/v1/chat/completions',
    MODEL: 'mistral-small-latest',
    MAX_TOKENS: 500,
    TEMPERATURE: 0.7
};

// Configuração carregada silenciosamente para produção

// Função para verificar se a API está configurada
export const isAIConfigured = (): boolean => {
    return !!AI_CONFIG.MISTRAL_API_KEY && AI_CONFIG.MISTRAL_API_KEY.length > 0;
};

// Função para obter headers da API
export const getAIHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_CONFIG.MISTRAL_API_KEY}`
});
