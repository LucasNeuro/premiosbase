
export const phoneMask = (value: string): string => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
};

export const cnpjMask = (value: string): string => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
};

export const cpdMask = (value: string): string => {
    return value.replace(/\D/g, '').substring(0, 10);
};

export const currencyMask = (value: string): string => {
    if (!value || value.trim() === '') {
        return '';
    }
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') {
        return '';
    }
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        // Limitar a 2 casas decimais após a vírgula
        let parts = cleanValue.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Apenas reaplicar a formatação de milhares
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const result = `R$ ${parts.join(',')}`;
        return result;
    }
    
    // Se não tem vírgula, tratar como valor em reais (não centavos)
    let v = cleanValue.replace(/\D/g, '');
    if (v === '') {
        return '';
    }
    
    const numValue = parseInt(v, 10);
    if (isNaN(numValue)) {
        return '';
    }
    
    // Tratar como valor em reais, não centavos
    v = numValue.toString();
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const result = `R$ ${v},00`;
    return result;
};

// Nova função para máscara automática como calculadora
export const currencyMaskAuto = (value: string): string => {
    if (!value || value.trim() === '') {
        return '';
    }
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') {
        return '';
    }
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        // Limitar a 2 casas decimais após a vírgula
        let parts = cleanValue.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Apenas reaplicar a formatação de milhares
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const result = `R$ ${parts.join(',')}`;
        return result;
    }
    
    // Se não tem vírgula, tratar como valor em reais (não centavos)
    let v = cleanValue.replace(/\D/g, '');
    if (v === '') {
        return '';
    }
    
    const numValue = parseInt(v, 10);
    if (isNaN(numValue)) {
        return '';
    }
    
    // Tratar como valor em reais, não centavos
    v = numValue.toString();
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const result = `R$ ${v},00`;
    return result;
};

// Função para máscara de moeda que funciona como calculadora real
export const currencyMaskCalculator = (value: string): string => {
    if (!value || value.trim() === '') {
        return '';
    }
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') {
        return '';
    }
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        // Limitar a 2 casas decimais após a vírgula
        let parts = cleanValue.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Apenas reaplicar a formatação de milhares
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const result = `R$ ${parts.join(',')}`;
        return result;
    }
    
    // Se não tem vírgula, tratar como valor em reais (não centavos)
    let v = cleanValue.replace(/\D/g, '');
    if (v === '') {
        return '';
    }
    
    const numValue = parseInt(v, 10);
    if (isNaN(numValue)) {
        return '';
    }
    
    // Tratar como valor em reais, não centavos
    v = numValue.toString();
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const result = `R$ ${v},00`;
    return result;
};

// Função SIMPLES para máscara de moeda que SEMPRE funciona
export const currencyMaskSimple = (value: string): string => {
    // Se está vazio, retornar vazio
    if (!value || value.trim() === '') {
        return '';
    }
    
    // Extrair apenas números
    const numbers = value.replace(/\D/g, '');
    if (numbers === '') {
        return '';
    }
    
    // Converter para número
    const num = parseInt(numbers, 10);
    if (isNaN(num)) {
        return '';
    }
    
    // Formatar com pontos de milhares
    const formatted = num.toLocaleString('pt-BR');
    const result = `R$ ${formatted},00`;
    return result;
};

// Função LIBRE para máscara de moeda - deixa o usuário digitar livremente
export const currencyMaskFree = (value: string): string => {
    // Se está vazio, retornar vazio
    if (!value || value.trim() === '') {
        return '';
    }
    
    // Se já tem R$, deixar como está
    if (value.startsWith('R$')) {
        return value;
    }
    
    // Se tem números, adicionar R$ na frente
    const hasNumbers = /\d/.test(value);
    if (hasNumbers) {
        const result = `R$ ${value}`;
        return result;
    }
    
    return '';
};

// Nova função para lidar com edição de moeda de forma mais inteligente
export const currencyMaskWithCursor = (value: string, cursorPosition: number): { value: string; cursorPosition: number } => {
    if (!value || value.trim() === '') return { value: '', cursorPosition: 0 };
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') return { value: '', cursorPosition: 0 };
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        // Apenas reaplicar a formatação de milhares
        let parts = cleanValue.split(',');
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const formatted = `R$ ${parts.join(',')}`;
        return { value: formatted, cursorPosition: formatted.length };
    }
    
    // Se não tem vírgula, tratar como valor inteiro (centavos)
    let v = cleanValue.replace(/\D/g, '');
    if (v === '') return { value: '', cursorPosition: 0 };
    
    const numValue = parseInt(v, 10);
    if (isNaN(numValue)) return { value: '', cursorPosition: 0 };
    
    // Converter centavos para reais e limitar a 2 casas decimais
    v = (numValue / 100).toFixed(2);
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const formatted = `R$ ${v}`;
    
    return { value: formatted, cursorPosition: formatted.length };
};

export const unmaskCurrency = (value: string): number => {
    if (!value || value.trim() === '') {
        return 0;
    }
    
    // Remover R$ e espaços, manter apenas números, vírgulas e pontos
    let cleanValue = value.replace(/[R$\s]/g, '');
    // Se tem vírgula, é o separador decimal
    if (cleanValue.includes(',')) {
        // Remover pontos (separadores de milhares) e trocar vírgula por ponto
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
    
    const numValue = parseFloat(cleanValue);
    // Limitar a 2 casas decimais para evitar problemas de precisão
    const result = isNaN(numValue) ? 0 : Math.round(numValue * 100) / 100;
    return result;
};
