
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
    let v = value.replace(/\D/g, '');
    v = (parseInt(v, 10) / 100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
};

export const unmaskCurrency = (value: string): number => {
    const onlyNumbers = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(onlyNumbers) || 0;
};
