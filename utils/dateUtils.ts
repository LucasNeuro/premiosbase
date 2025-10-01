/**
 * Utilitários para cálculos de data
 */

export const calculateDaysRemaining = (endDate: string): { 
    days: number; 
    isExpired: boolean; 
    label: string;
    urgencyLevel: 'safe' | 'warning' | 'critical' | 'expired';
} => {
    const now = new Date();
    
    // ✅ CORREÇÃO: Normalizar datas para evitar problemas de fuso horário
    const end = new Date(endDate + 'T23:59:59'); // Fim do dia
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Início do dia atual
    
    // Calcular diferença em milissegundos
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isExpired = diffDays < 0;
    
    let label = '';
    let urgencyLevel: 'safe' | 'warning' | 'critical' | 'expired' = 'safe';
    
    if (isExpired) {
        const expiredDays = Math.abs(diffDays);
        label = expiredDays === 1 ? 'Expirou há 1 dia' : `Expirou há ${expiredDays} dias`;
        urgencyLevel = 'expired';
    } else if (diffDays === 0) {
        label = 'Expira hoje';
        urgencyLevel = 'critical';
    } else if (diffDays === 1) {
        label = 'Expira amanhã';
        urgencyLevel = 'critical';
    } else if (diffDays <= 3) {
        label = `${diffDays} dias restantes`;
        urgencyLevel = 'critical';
    } else if (diffDays <= 7) {
        label = `${diffDays} dias restantes`;
        urgencyLevel = 'warning';
    } else {
        label = `${diffDays} dias restantes`;
        urgencyLevel = 'safe';
    }
    
    return {
        days: diffDays,
        isExpired,
        label,
        urgencyLevel
    };
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
};

