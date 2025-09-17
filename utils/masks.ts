
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
    console.log('🔍 currencyMask - Input:', value);
    
    if (!value || value.trim() === '') {
        console.log('🔍 currencyMask - Empty value, returning empty');
        return '';
    }
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    console.log('🔍 currencyMask - Clean value:', cleanValue);
    
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') {
        console.log('🔍 currencyMask - Clean value is empty, returning empty');
        return '';
    }
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        console.log('🔍 currencyMask - Has comma, formatting existing value');
        // Limitar a 2 casas decimais após a vírgula
        let parts = cleanValue.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Apenas reaplicar a formatação de milhares
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const result = `R$ ${parts.join(',')}`;
        console.log('🔍 currencyMask - Formatted result:', result);
        return result;
    }
    
    // Se não tem vírgula, tratar como valor em reais (não centavos)
    let v = cleanValue.replace(/\D/g, '');
    console.log('🔍 currencyMask - Only numbers:', v);
    
    if (v === '') {
        console.log('🔍 currencyMask - No numbers found, returning empty');
        return '';
    }
    
    const numValue = parseInt(v, 10);
    console.log('🔍 currencyMask - Parsed number:', numValue);
    
    if (isNaN(numValue)) {
        console.log('🔍 currencyMask - Invalid number, returning empty');
        return '';
    }
    
    // Tratar como valor em reais, não centavos
    v = numValue.toString();
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const result = `R$ ${v},00`;
    console.log('🔍 currencyMask - Final result:', result);
    return result;
};

// Nova função para máscara automática como calculadora
export const currencyMaskAuto = (value: string): string => {
    console.log('🚀 currencyMaskAuto - Input:', value);
    
    if (!value || value.trim() === '') {
        console.log('🚀 currencyMaskAuto - Empty value, returning empty');
        return '';
    }
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    console.log('🚀 currencyMaskAuto - Clean value:', cleanValue);
    
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') {
        console.log('🚀 currencyMaskAuto - Clean value is empty, returning empty');
        return '';
    }
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        console.log('🚀 currencyMaskAuto - Has comma, formatting existing value');
        // Limitar a 2 casas decimais após a vírgula
        let parts = cleanValue.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Apenas reaplicar a formatação de milhares
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const result = `R$ ${parts.join(',')}`;
        console.log('🚀 currencyMaskAuto - Formatted result:', result);
        return result;
    }
    
    // Se não tem vírgula, tratar como valor em reais (não centavos)
    let v = cleanValue.replace(/\D/g, '');
    console.log('🚀 currencyMaskAuto - Only numbers:', v);
    
    if (v === '') {
        console.log('🚀 currencyMaskAuto - No numbers found, returning empty');
        return '';
    }
    
    const numValue = parseInt(v, 10);
    console.log('🚀 currencyMaskAuto - Parsed number:', numValue);
    
    if (isNaN(numValue)) {
        console.log('🚀 currencyMaskAuto - Invalid number, returning empty');
        return '';
    }
    
    // Tratar como valor em reais, não centavos
    v = numValue.toString();
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const result = `R$ ${v},00`;
    console.log('🚀 currencyMaskAuto - Final result:', result);
    return result;
};

// Função para máscara de moeda que funciona como calculadora real
export const currencyMaskCalculator = (value: string): string => {
    console.log('🧮 currencyMaskCalculator - Input:', value);
    
    if (!value || value.trim() === '') {
        console.log('🧮 currencyMaskCalculator - Empty value, returning empty');
        return '';
    }
    
    // Remover R$ e espaços
    let cleanValue = value.replace(/[R$\s]/g, '');
    console.log('🧮 currencyMaskCalculator - Clean value:', cleanValue);
    
    // Se está vazio após limpeza, retornar vazio
    if (cleanValue === '') {
        console.log('🧮 currencyMaskCalculator - Clean value is empty, returning empty');
        return '';
    }
    
    // Se tem vírgula, significa que já está formatado
    if (cleanValue.includes(',')) {
        console.log('🧮 currencyMaskCalculator - Has comma, formatting existing value');
        // Limitar a 2 casas decimais após a vírgula
        let parts = cleanValue.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Apenas reaplicar a formatação de milhares
        parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        const result = `R$ ${parts.join(',')}`;
        console.log('🧮 currencyMaskCalculator - Formatted result:', result);
        return result;
    }
    
    // Se não tem vírgula, tratar como valor em reais (não centavos)
    let v = cleanValue.replace(/\D/g, '');
    console.log('🧮 currencyMaskCalculator - Only numbers:', v);
    
    if (v === '') {
        console.log('🧮 currencyMaskCalculator - No numbers found, returning empty');
        return '';
    }
    
    const numValue = parseInt(v, 10);
    console.log('🧮 currencyMaskCalculator - Parsed number:', numValue);
    
    if (isNaN(numValue)) {
        console.log('🧮 currencyMaskCalculator - Invalid number, returning empty');
        return '';
    }
    
    // Tratar como valor em reais, não centavos
    v = numValue.toString();
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    const result = `R$ ${v},00`;
    console.log('🧮 currencyMaskCalculator - Final result:', result);
    return result;
};

// Função SIMPLES para máscara de moeda que SEMPRE funciona
export const currencyMaskSimple = (value: string): string => {
    console.log('✨ currencyMaskSimple - Input:', value);
    
    // Se está vazio, retornar vazio
    if (!value || value.trim() === '') {
        console.log('✨ currencyMaskSimple - Empty, returning empty');
        return '';
    }
    
    // Extrair apenas números
    const numbers = value.replace(/\D/g, '');
    console.log('✨ currencyMaskSimple - Numbers only:', numbers);
    
    if (numbers === '') {
        console.log('✨ currencyMaskSimple - No numbers, returning empty');
        return '';
    }
    
    // Converter para número
    const num = parseInt(numbers, 10);
    console.log('✨ currencyMaskSimple - Parsed number:', num);
    
    if (isNaN(num)) {
        console.log('✨ currencyMaskSimple - Invalid number, returning empty');
        return '';
    }
    
    // Formatar com pontos de milhares
    const formatted = num.toLocaleString('pt-BR');
    const result = `R$ ${formatted},00`;
    console.log('✨ currencyMaskSimple - Final result:', result);
    return result;
};

// Função LIBRE para máscara de moeda - deixa o usuário digitar livremente
export const currencyMaskFree = (value: string): string => {
    console.log('🆓 currencyMaskFree - Input:', value);
    
    // Se está vazio, retornar vazio
    if (!value || value.trim() === '') {
        console.log('🆓 currencyMaskFree - Empty, returning empty');
        return '';
    }
    
    // Se já tem R$, deixar como está
    if (value.startsWith('R$')) {
        console.log('🆓 currencyMaskFree - Already has R$, returning as is');
        return value;
    }
    
    // Se tem números, adicionar R$ na frente
    const hasNumbers = /\d/.test(value);
    if (hasNumbers) {
        const result = `R$ ${value}`;
        console.log('🆓 currencyMaskFree - Added R$, result:', result);
        return result;
    }
    
    console.log('🆓 currencyMaskFree - No numbers, returning empty');
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
    console.log('💰 unmaskCurrency - Input:', value);
    
    if (!value || value.trim() === '') {
        console.log('💰 unmaskCurrency - Empty value, returning 0');
        return 0;
    }
    
    // Remover R$ e espaços, manter apenas números, vírgulas e pontos
    let cleanValue = value.replace(/[R$\s]/g, '');
    console.log('💰 unmaskCurrency - Clean value:', cleanValue);
    
    // Se tem vírgula, é o separador decimal
    if (cleanValue.includes(',')) {
        // Remover pontos (separadores de milhares) e trocar vírgula por ponto
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        console.log('💰 unmaskCurrency - After comma processing:', cleanValue);
    }
    
    const numValue = parseFloat(cleanValue);
    console.log('💰 unmaskCurrency - Parsed number:', numValue);
    
    // Limitar a 2 casas decimais para evitar problemas de precisão
    const result = isNaN(numValue) ? 0 : Math.round(numValue * 100) / 100;
    console.log('💰 unmaskCurrency - Final result:', result);
    return result;
};
