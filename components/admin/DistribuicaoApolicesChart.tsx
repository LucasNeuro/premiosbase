import React, { useState, useEffect } from 'react';
import { DistribuicaoApolices } from '../../services/AdminDashboardServiceV2';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getChartColors } from '../../utils/dashboardColors';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DistribuicaoApolicesChartProps {
  distribuicao: DistribuicaoApolices[];
  tipo: 'Tipo de Apólice' | 'Tipo de Contrato' | 'Faixa de Valor';
  loading?: boolean;
}

/**
 * 🍩 COMPONENTE DE GRÁFICO DONUT PARA DISTRIBUIÇÃO DE APÓLICES
 */
export const DistribuicaoApolicesChart: React.FC<DistribuicaoApolicesChartProps> = ({
  distribuicao,
  tipo,
  loading = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  // 🎨 Usar cores padronizadas do dashboard
  const COLORS = getChartColors(distribuicao.length);

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Animação do progresso
  useEffect(() => {
    if (isVisible) {
      const timer = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 2;
        });
      }, 20);
      return () => clearInterval(timer);
    }
  }, [isVisible]);

  // Preparar dados para o gráfico
  const chartData = distribuicao.map((item, index) => ({
    name: item.categoria_valor,
    value: item.quantidade,
    percentual: item.percentual_quantidade,
    valor: item.valor_total,
    color: COLORS[index % COLORS.length]
  }));

  const totalQuantidade = distribuicao.reduce((sum, item) => sum + item.quantidade, 0);
  const totalValor = distribuicao.reduce((sum, item) => sum + item.valor_total, 0);

  // Tooltip simplificado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-[#1E293B] p-3 border border-slate-700 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            ></div>
            <p className="font-semibold text-white">{data.name}</p>
          </div>
          <p className="text-[#49de80] font-medium">
            {data.value} apólices ({data.percentual}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Sem labels nos segmentos - donut limpo
  const renderCustomizedLabel = () => null;

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-600 rounded w-48 mb-4"></div>
          <div className="flex items-center justify-center h-64 bg-slate-700 rounded">
            <div className="h-32 w-32 bg-slate-600 rounded-full"></div>
          </div>
          <div className="mt-4 space-y-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-4 w-4 bg-slate-600 rounded"></div>
                <div className="h-4 bg-slate-600 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!distribuicao || distribuicao.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 bg-slate-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-white text-lg">Nenhum dado disponível</p>
              <p className="text-slate-400 text-sm mt-1">
                Não há dados de distribuição para {tipo.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg p-4">
    {/* Header Simplificado */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          {tipo}
        </h3>
      </div>

      {/* Donut Fino e Elegante */}
      <div className="h-64 mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={75}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={600}
              animationEasing="ease-out"
              stroke="#1E293B"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centro minimalista */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {totalQuantidade}
            </div>
            <div className="text-xs text-slate-400">apólices</div>
          </div>
        </div>
      </div>

      {/* Legenda Simplificada */}
      <div className="space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-white">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-[#49de80]">
              {item.percentual}%
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};
