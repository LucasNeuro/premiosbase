
import type { CnpjData } from '../types';

export const fetchCnpjData = async (cnpj: string): Promise<CnpjData> => {
    const cleanedCnpj = cnpj.replace(/[^\d]/g, '');
    if (cleanedCnpj.length !== 14) {
        throw new Error('CNPJ inválido.');
    }

    try {
        // Usando a API do CNPJA
        const response = await fetch(`https://open.cnpja.com/office/${cleanedCnpj}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('CNPJ não encontrado');
            }
            throw new Error('Não foi possível validar o CNPJ. Verifique o número e tente novamente.');
        }

        const data = await response.json();
        
        // Mapeando os dados da API CNPJA para nosso formato (baseado na resposta real)
        const cnpjData: CnpjData = {
            cnpj: data.taxId || cleanedCnpj,
            razao_social: data.company?.name || '',
            nome_fantasia: data.alias || '',
            logradouro: data.address?.street || '',
            numero: data.address?.number || '',
            bairro: data.address?.district || '',
            municipio: data.address?.city || '',
            uf: data.address?.state || '',
            cep: data.address?.zip || '',
            telefone: data.phones?.[0] ? `${data.phones[0].area}${data.phones[0].number}` : '',
            email: data.emails?.[0]?.address || '',
            situacao: data.status?.text || '',
            data_situacao: data.statusDate || '',
            capital_social: data.company?.equity?.toString() || '',
            porte: data.company?.size?.text || '',
            natureza_juridica: data.company?.nature?.text || '',
            abertura: data.founded || '',
            atividade_principal: data.mainActivity?.text || '',
            atividades_secundarias: data.sideActivities?.map((act: any) => act.text) || []
        };

        return cnpjData;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Erro ao consultar CNPJ. Tente novamente.');
    }
};
