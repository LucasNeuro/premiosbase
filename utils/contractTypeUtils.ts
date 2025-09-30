/**
 * 🔧 UTILITÁRIOS PARA TIPO DE CONTRATO
 * 
 * Funções para padronizar a exibição e tratamento de tipos de contrato
 */

/**
 * Converte o valor interno do tipo de contrato para o texto de exibição
 */
export const getContractTypeLabel = (contractType: string): string => {
    switch (contractType) {
        case 'novo':
            return 'Novo';
        case 'renovacao_bradesco':
            return 'Renovação Bradesco';
        case 'ambos':
            return 'Ambos (Novo e Renovação)';
        case 'Novo':
            return 'Novo';
        case 'Renovação Bradesco':
            return 'Renovação Bradesco';
        default:
            return contractType || 'Renovação';
    }
};

/**
 * Converte o valor interno do tipo de contrato para o texto de exibição curto
 */
export const getContractTypeLabelShort = (contractType: string): string => {
    switch (contractType) {
        case 'novo':
            return 'Novo';
        case 'renovacao_bradesco':
            return 'Renovação';
        case 'ambos':
            return 'Ambos';
        case 'Novo':
            return 'Novo';
        case 'Renovação Bradesco':
            return 'Renovação';
        default:
            return contractType || 'Renovação';
    }
};

/**
 * Verifica se um tipo de contrato é válido para uma apólice
 */
export const isContractTypeValid = (campaignContractType: string, policyContractType: string): boolean => {
    // Se a campanha aceita "ambos", qualquer tipo é válido
    if (campaignContractType === 'ambos') {
        return true;
    }
    
    // Se a campanha é específica, deve ser exato
    if (campaignContractType === 'novo' && policyContractType === 'Novo') {
        return true;
    }
    
    if (campaignContractType === 'renovacao_bradesco' && policyContractType === 'Renovação Bradesco') {
        return true;
    }
    
    return false;
};

/**
 * Obtém as classes CSS para o badge do tipo de contrato
 */
export const getContractTypeBadgeClasses = (contractType: string): string => {
    switch (contractType) {
        case 'novo':
        case 'Novo':
            return 'bg-purple-100 text-purple-800';
        case 'renovacao_bradesco':
        case 'Renovação Bradesco':
            return 'bg-orange-100 text-orange-800';
        case 'ambos':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
