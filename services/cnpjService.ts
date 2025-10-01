
import type { CnpjData } from '../types';

export const fetchCnpjData = async (cnpj: string): Promise<CnpjData> => {
    const cleanedCnpj = cnpj.replace(/[^\d]/g, '');
    if (cleanedCnpj.length !== 14) {
        throw new Error('CNPJ inválido.');
    }

    try {
        // Usando a API OpenCNPJ (https://opencnpj.org/)
        const response = await fetch(`https://api.opencnpj.org/${cleanedCnpj}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('CNPJ não encontrado');
            }
            if (response.status === 429) {
                throw new Error('Limite de consultas excedido. Tente novamente em alguns segundos.');
            }
            throw new Error('Não foi possível validar o CNPJ. Verifique o número e tente novamente.');
        }

        const data = await response.json();
        
        // Mapeando os dados da API OpenCNPJ para nosso formato
        const cnpjData: CnpjData = {
            cnpj: data.cnpj || cleanedCnpj,
            razao_social: data.razao_social || '',
            nome_fantasia: data.nome_fantasia || '',
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            bairro: data.bairro || '',
            municipio: data.municipio || '',
            uf: data.uf || '',
            cep: data.cep || '',
            telefone: data.telefones?.[0] ? `(${data.telefones[0].ddd}) ${data.telefones[0].numero}` : '',
            email: data.email || '',
            situacao: data.situacao_cadastral || '',
            data_situacao: data.data_situacao_cadastral || '',
            capital_social: data.capital_social || '',
            porte: data.porte_empresa || '',
            natureza_juridica: data.natureza_juridica || '',
            abertura: data.data_inicio_atividade || '',
            atividade_principal: data.cnae_principal || '',
            atividades_secundarias: data.cnaes_secundarios || []
        };

        return cnpjData;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Erro ao consultar CNPJ. Tente novamente.');
    }
};
