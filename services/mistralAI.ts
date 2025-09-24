// Serviço de IA usando Mistral para correção e sugestão de descrições

import { AI_CONFIG, getAIHeaders } from '../config/ai';

interface MistralResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export interface AISuggestion {
    original: string;
    corrected: string;
    suggestions: string[];
}

class MistralAIService {
    private async callMistralAPI(prompt: string): Promise<string> {
        try {
            console.log('🤖 MistralAI: Verificando configuração da API...');
            console.log('🤖 MistralAI: Chave API configurada:', !!AI_CONFIG.MISTRAL_API_KEY);
            console.log('🤖 MistralAI: URL da API:', AI_CONFIG.MISTRAL_API_URL);
            console.log('🤖 MistralAI: Modelo:', AI_CONFIG.MODEL);
            
            // Verificar se a chave API está configurada
            if (!AI_CONFIG.MISTRAL_API_KEY) {
                throw new Error('Chave da API Mistral não configurada. Verifique a variável VITE_MISTRAL_KEY no arquivo .env.local');
            }

            console.log('🤖 MistralAI: Enviando requisição para API...');
            const response = await fetch(AI_CONFIG.MISTRAL_API_URL, {
                method: 'POST',
                headers: getAIHeaders(),
                body: JSON.stringify({
                    model: AI_CONFIG.MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: AI_CONFIG.MAX_TOKENS,
                    temperature: AI_CONFIG.TEMPERATURE
                })
            });

            console.log('🤖 MistralAI: Status da resposta:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('🤖 MistralAI: Erro na resposta da API:', errorText);
                throw new Error(`Erro na API Mistral: ${response.status} - ${response.statusText}. Detalhes: ${errorText}`);
            }

            const data: MistralResponse = await response.json();
            console.log('🤖 MistralAI: Resposta da API recebida:', data);
            return data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('🤖 MistralAI: Erro na chamada da API:', error);
            throw error;
        }
    }

    async correctText(text: string): Promise<string> {
        console.log('🔧 MistralAI: Iniciando correção de texto:', text);
        
        const prompt = `
        Corrija o seguinte texto em português brasileiro, mantendo o tom profissional e objetivo.
        Corrija apenas erros de ortografia, gramática e pontuação. Mantenha o significado original.
        
        Texto: "${text}"
        
        Retorne apenas o texto corrigido, sem explicações adicionais.
        `;

        try {
            console.log('🔧 MistralAI: Enviando prompt para API...');
            const corrected = await this.callMistralAPI(prompt);
            console.log('🔧 MistralAI: Texto corrigido recebido:', corrected);
            return corrected.trim();
        } catch (error) {
            console.error('🔧 MistralAI: Erro na correção:', error);
            return text; // Retorna o texto original em caso de erro
        }
    }

    async suggestDescription(goalType: string, goalTitle: string, currentDescription?: string): Promise<string[]> {
        const isPremio = goalType === 'premio';
        const prompt = `
        Gere 3 sugestões de descrições profissionais para ${isPremio ? 'um prêmio' : `uma meta de ${goalType}`} com o título "${goalTitle}".
        
        ${currentDescription ? `Descrição atual: "${currentDescription}"` : ''}
        
        As sugestões devem ser:
        - Profissionais e objetivas
        - ${isPremio ? `Baseadas no título "${goalTitle}" e destacando características específicas deste prêmio` : 'Específicas para o tipo de meta'}
        - ${isPremio ? 'Atrativas e detalhadas sobre o prêmio, mencionando benefícios' : 'Motivacionais mas realistas'}
        - Em português brasileiro
        - Máximo 100 caracteres cada
        
        Retorne apenas as 3 sugestões, uma por linha, sem numeração ou marcadores.
        `;

        try {
            const suggestions = await this.callMistralAPI(prompt);
            return suggestions.split('\n').filter(s => s.trim()).slice(0, 3);
        } catch (error) {
            return [
                'Meta focada em resultados e crescimento profissional.',
                'Objetivo estratégico para desenvolvimento de vendas.',
                'Meta desafiadora mas alcançável para o período.'
            ];
        }
    }

    async improveDescription(description: string, goalType: string, goalTitle?: string): Promise<string> {
        console.log('✨ MistralAI: Iniciando melhoria de descrição:', { description, goalType, goalTitle });
        
        const isPremio = goalType === 'premio';
        const prompt = `
        Melhore a seguinte descrição de ${isPremio ? 'prêmio' : `meta de ${goalType}`}${goalTitle ? ` com o título "${goalTitle}"` : ''}, tornando-a mais profissional, clara e ${isPremio ? 'atrativa' : 'motivacional'}.
        
        Descrição atual: "${description}"
        
        Melhorias a aplicar:
        - Linguagem mais profissional
        - Clareza nos ${isPremio ? 'detalhes e benefícios' : 'objetivos'}
        - Tom ${isPremio ? 'atrativo e persuasivo' : 'motivacional'}
        - ${isPremio && goalTitle ? `Mencionar características específicas do "${goalTitle}"` : 'Estrutura organizada'}
        - Máximo 150 caracteres
        
        Retorne apenas a descrição melhorada, sem explicações.
        `;

        try {
            console.log('✨ MistralAI: Enviando prompt para API...');
            const improved = await this.callMistralAPI(prompt);
            console.log('✨ MistralAI: Descrição melhorada recebida:', improved);
            return improved.trim();
        } catch (error) {
            console.error('✨ MistralAI: Erro na melhoria:', error);
            return description;
        }
    }

    async generateGoalDescription(goalType: string, goalTitle: string, target: number, period: string): Promise<string> {
        const isPremio = goalType === 'premio';
        const prompt = `
        Gere uma descrição profissional para ${isPremio ? 'um prêmio' : `uma meta de ${goalType}`} com o título "${goalTitle}" ${isPremio ? `que custa R$ ${target}` : `com valor ${target} para o período de ${period}`}.
        
        A descrição deve ser:
        - Profissional e objetiva
        - ${isPremio ? `Baseada no título "${goalTitle}" e destacando características específicas deste prêmio` : 'Específica para o tipo de meta'}
        - ${isPremio ? 'Atrativa e detalhada sobre o prêmio, mencionando benefícios e características' : 'Motivacional'}
        - Em português brasileiro
        - Máximo 120 caracteres
        
        Retorne apenas a descrição gerada.
        `;

        try {
            const description = await this.callMistralAPI(prompt);
            return description.trim();
        } catch (error) {
            return isPremio 
                ? `Prêmio atrativo e de qualidade para motivar o desempenho.`
                : `Meta de ${goalType} para ${period} com foco em resultados e crescimento.`;
        }
    }

    // Função compatível com interface esperada pelo CampaignRecommendationService
    async chat(options: {
        model?: string;
        messages: Array<{role: string; content: string}>;
        temperature?: number;
        max_tokens?: number;
    }): Promise<{choices: Array<{message: {content: string}}>}> {
        try {
            // Verificar se a chave API está configurada
            if (!AI_CONFIG.MISTRAL_API_KEY) {
                throw new Error('Chave da API Mistral não configurada. Verifique a variável VITE_MISTRAL_KEY no arquivo .env.local');
            }

            const response = await fetch(AI_CONFIG.MISTRAL_API_URL, {
                method: 'POST',
                headers: getAIHeaders(),
                body: JSON.stringify({
                    model: options.model || AI_CONFIG.MODEL,
                    messages: options.messages,
                    max_tokens: options.max_tokens || AI_CONFIG.MAX_TOKENS,
                    temperature: options.temperature || AI_CONFIG.TEMPERATURE
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro na API Mistral: ${response.status} - ${response.statusText}. Detalhes: ${errorText}`);
            }

            const data: MistralResponse = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }
}

export const mistralAI = new MistralAIService();
export { MistralAIService };
