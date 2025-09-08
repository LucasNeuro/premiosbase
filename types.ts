
export interface User {
    id?: string;
    name: string;
    phone: string;
    email: string;
    cnpj: string;
    cpd: string;
}

export enum PolicyType {
    AUTO = 'Seguro Auto',
    RESIDENCIAL = 'Seguro Residencial',
}

export enum ContractType {
    NOVO = 'Novo',
    RENOVACAO = 'Renovação',
}

export interface Policy {
    id: string;
    policyNumber: string;
    type: PolicyType;
    premiumValue: number;
    registrationDate: string;
    ticketCode: string;
    contractType: ContractType;
    city?: string;
    originalPolicyId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CnpjData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    telefone: string;
    email: string;
    situacao: string;
    data_situacao: string;
    capital_social: string;
    porte: string;
    natureza_juridica: string;
    abertura: string;
    atividade_principal: string;
    atividades_secundarias: string[];
}
