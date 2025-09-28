/**
 * 🔥 UTILITÁRIOS NUMÉRICOS
 * Resolve problemas de overflow no banco de dados
 */

/**
 * Trunca valor para o limite do banco (precisão 5, escala 2 = máximo 999.99)
 */
export function truncateForDatabase(value: number): number {
    return Math.min(value, 999.99);
}

/**
 * Trunca array de valores para o limite do banco
 */
export function truncateArrayForDatabase(values: number[]): number[] {
    return values.map(truncateForDatabase);
}

/**
 * Soma valores truncando cada um para o limite do banco
 */
export function safeSum(values: number[]): number {
    return values.reduce((sum, value) => sum + truncateForDatabase(value), 0);
}

/**
 * Valida se valor está dentro do limite do banco
 */
export function isValidForDatabase(value: number): boolean {
    return value <= 999.99;
}


