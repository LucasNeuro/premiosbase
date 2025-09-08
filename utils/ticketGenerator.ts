/**
 * Gera um código de ticket único para apólices
 * Formato: TKT-YYYYMMDD-HHMMSS-XXXX (25 caracteres)
 * Versão curta: TKT-YYMMDD-HHMM-XXXX (18 caracteres)
 */
export function generateTicketCode(): string {
  const now = new Date();
  
  // Formato curto: YYMMDD (6 caracteres)
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  
  // Formato: HHMM (4 caracteres)
  const time = now.toTimeString().slice(0, 5).replace(/:/g, '');
  
  // Gera 4 dígitos aleatórios
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `TKT-${date}-${time}-${random}`;
}

/**
 * Valida se um ticket code está no formato correto
 */
export function validateTicketCode(ticketCode: string): boolean {
  const pattern = /^TKT-\d{6}-\d{4}-\d{4}$/;
  return pattern.test(ticketCode);
}

/**
 * Extrai informações do ticket code
 */
export function parseTicketCode(ticketCode: string): {
  date: string;
  time: string;
  random: string;
} | null {
  if (!validateTicketCode(ticketCode)) {
    return null;
  }
  
  const parts = ticketCode.split('-');
  if (parts.length !== 4) {
    return null;
  }
  
  const [, date, time, random] = parts;
  
  return {
    date: date,
    time: time,
    random: random
  };
}
