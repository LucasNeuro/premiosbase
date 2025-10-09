import React from 'react';
import { EstatisticasGerais } from '../../services/AdminDashboardServiceV2';
import { Users, FileText, DollarSign, TrendingUp, Target, Trophy } from 'lucide-react';

interface DashboardStatsCardsProps {
  estatisticas: EstatisticasGerais | null;
  loading?: boolean;
}

/**
 * 🎯 COMPONENTE DE CARDS DE ESTATÍSTICAS
 */
export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({
  estatisticas,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 bg-slate-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-600 rounded w-3/4"></div>
                  <div className="h-6 bg-slate-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!estatisticas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg border-2 border-dashed border-slate-500">
            <div className="p-5">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 bg-slate-600 rounded-full"></div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Sem dados</p>
                  <p className="text-xl font-semibold text-slate-500">-</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    // Limitar valores extremos e formatar adequadamente
    if (Math.abs(value) > 1000) {
      return `${value >= 0 ? '+' : ''}${(value / 1000).toFixed(1)}k%`;
    } else if (Math.abs(value) > 100) {
      return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
    } else {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    }
  };

  // 🎨 SEQUÊNCIA DE CORES PADRONIZADA PARA TODO O DASHBOARD
  const cards = [
    {
      title: 'Total de Corretores',
      value: estatisticas.total_corretores,
      icon: Users,
      iconBg: 'bg-blue-500', // Azul claro
      format: (val: number) => val.toString()
    },
    {
      title: 'Total de Apólices',
      value: estatisticas.total_apolices,
      icon: FileText,
      iconBg: 'bg-green-500', // Verde claro
      format: (val: number) => val.toString()
    },
    {
      title: 'Receita Total',
      value: estatisticas.receita_total,
      icon: DollarSign,
      iconBg: 'bg-green-500', // Verde claro (mesmo do anterior)
      format: formatCurrency
    },
    {
      title: 'Crescimento Mensal',
      value: estatisticas.crescimento_mensal,
      icon: TrendingUp,
      iconBg: 'bg-green-500', // Verde claro (mesmo do anterior)
      format: formatPercentage
    },
    {
      title: 'Metas Ativas',
      value: estatisticas.campanhas_ativas,
      icon: Target,
      iconBg: 'bg-orange-500', // Laranja claro
      format: (val: number) => val.toString()
    },
    {
      title: 'Metas Concluídas',
      value: estatisticas.campanhas_concluidas,
      icon: Trophy,
      iconBg: 'bg-purple-500', // Roxo claro
      format: (val: number) => val.toString()
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        
        return (
          <div key={index} className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
            <div className="p-5">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full ${card.iconBg} text-white shadow-lg`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300 truncate">{card.title}</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {card.format(card.value)}
                  </p>
                  
                  {/* Indicador de tendência para crescimento mensal */}
                  {card.title === 'Crescimento Mensal' && estatisticas.crescimento_mensal !== 0 && (
                    <div className="mt-1">
                      <div className={`text-xs ${estatisticas.crescimento_mensal >= 0 ? 'text-[#49de80]' : 'text-red-400'}`}>
                        {estatisticas.crescimento_mensal >= 0 ? '↗' : '↘'} 
                        {formatPercentage(Math.abs(estatisticas.crescimento_mensal))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
