/**
 * 🎨 PALETA DE CORES PADRONIZADA PARA O DASHBOARD
 * 
 * Esta paleta deve ser usada em todos os componentes do dashboard
 * para manter consistência visual.
 */

export const DASHBOARD_COLORS = {
  // Sequência de cores dos minicards (seguindo a ordem definida)
  PRIMARY: [
    '#3B82F6', // Azul claro - Total de Corretores
    '#10B981', // Verde claro - Total de Apólices  
    '#10B981', // Verde claro - Receita Total
    '#10B981', // Verde claro - Crescimento Mensal
    '#F59E0B', // Laranja claro - Metas Ativas
    '#8B5CF6', // Roxo claro - Metas Concluídas
  ],
  
  // Cores para gráficos donut (seguindo sequência dos cards)
  DONUT: [
    '#3B82F6', // Azul claro - Total de Corretores
    '#10B981', // Verde claro - Total de Apólices
    '#10B981', // Verde claro - Receita Total
    '#10B981', // Verde claro - Crescimento Mensal
    '#F59E0B', // Laranja claro - Metas Ativas
    '#8B5CF6', // Roxo claro - Metas Concluídas
    '#EF4444', // Vermelho (adicional)
    '#06B6D4', // Ciano (adicional)
  ],
  
  // Cores para gráficos de linha/barras
  CHART: [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Laranja
    '#8B5CF6', // Roxo
    '#EF4444', // Vermelho
    '#06B6D4', // Ciano
  ],
  
  // Cores para status
  STATUS: {
    success: '#10B981', // Verde
    warning: '#F59E0B', // Laranja
    error: '#EF4444',   // Vermelho
    info: '#3B82F6',    // Azul
    neutral: '#6B7280', // Cinza
  }
} as const;

/**
 * 🎯 FUNÇÃO PARA OBTER CORES DOS GRÁFICOS
 */
export const getChartColors = (count: number): string[] => {
  const colors = DASHBOARD_COLORS.DONUT;
  const result = [];
  
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
};

/**
 * 🎨 FUNÇÃO PARA OBTER CORES DOS CARDS
 */
export const getCardColors = (index: number): { bg: string; text: string } => {
  const bgColors = [
    'bg-blue-500',   // Azul
    'bg-green-500',  // Verde
    'bg-green-500',  // Verde
    'bg-green-500',  // Verde
    'bg-orange-500', // Laranja
    'bg-purple-500', // Roxo
  ];
  
  return {
    bg: bgColors[index % bgColors.length],
    text: 'text-white'
  };
};

/**
 * 📊 CONFIGURAÇÃO PARA RECHARTS
 */
export const RECHARTS_CONFIG = {
  colors: DASHBOARD_COLORS.DONUT,
  responsive: true,
  maintainAspectRatio: false,
};

export default DASHBOARD_COLORS;
