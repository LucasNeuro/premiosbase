
export interface User {
    id?: string;
    name: string;
    phone: string;
    email: string;
    cnpj: string;
    cpd: string;
    hasMultipleCpds?: boolean;
    is_admin?: boolean;
}

export interface UserCpd {
    id: string;
    userId: string;
    cpdNumber: string;
    cpdName?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export enum PolicyType {
    AUTO = 'Seguro Auto',
    RESIDENCIAL = 'Seguro Residencial',
}

export enum ContractType {
    NOVO = 'Novo',
    RENOVACAO = 'Renovação Bradesco',
}

export interface Policy {
    id: string;
    policyNumber: string;
    type: PolicyType;
    premiumValue: number;
    registrationDate: string;
    ticketCode: string;
    contractType: ContractType;
    cpdNumber?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    // Novos campos para vinculação com campanhas
    campaignId?: string;
    isLinkedToCampaign?: boolean;
}

export interface Goal {
    id: string;
    user_id?: string;
    title: string;
    target: number;
    current_value: number;
    unit: string;
    type: 'valor' | 'apolices' | 'crescimento';
    start_date: string;
    end_date: string;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    is_active: boolean;
    progress_percentage: number;
    description?: string;
    created_at: string;
    updated_at: string;
    // Campos de aceitação
    acceptance_status: 'pending' | 'accepted' | 'rejected';
    accepted_at?: string;
    accepted_by?: string;
    // Campos para campanhas compostas
    campaign_type?: 'simple' | 'composite';
    criteria?: any[];
    // Novos campos para a nova estrutura
    record_type?: 'campaign' | 'policy_link';
    campaign_master_id?: string;
    // Dados da apólice (quando record_type = 'policy_link')
    policy_id?: string;
    policy_number?: string;
    policy_type?: string;
    policy_premium_value?: number;
    policy_registration_date?: string;
    policy_ticket_code?: string;
    policy_contract_type?: string;
    policy_city?: string;
    policy_cpd_number?: string;
    policy_status?: string;
    // Controle de vinculação
    is_policy_linked?: boolean;
    vinculada_automaticamente?: boolean;
    vinculada_em?: string;
    vinculada_por?: string;
    // Relação com prêmios
    campanhas_premios?: CampanhaPremio[];
}

export interface Premio {
    id: string;
    nome: string;
    descricao?: string;
    imagem_url?: string;
    imagem_miniatura_url?: string;
    valor_estimado?: number;
    is_ativo: boolean;
    categoria?: {
        nome: string;
    };
    tipo?: {
        nome: string;
    };
}

export interface CampanhaPremio {
    id: string;
    quantidade: number;
    entregue: boolean;
    entregue_em?: string;
    entregue_por?: string;
    observacoes?: string;
    premio: Premio;
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
