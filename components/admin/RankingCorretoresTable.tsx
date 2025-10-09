import React from 'react';
import { RankingCorretor } from '../../services/AdminDashboardServiceV2';
import { Trophy, Medal, Award, TrendingUp, Users, FileText, DollarSign, Target } from 'lucide-react';
import { getChartColors } from '../../utils/dashboardColors';

interface RankingCorretoresTableProps {
  ranking: RankingCorretor[];
  loading?: boolean;
  limit?: number;
}

/**
 * 🏆 COMPONENTE DE TABELA DE RANKING DE CORRETORES
 */
export const RankingCorretoresTable: React.FC<RankingCorretoresTableProps> = ({
  ranking,
  loading = false,
  limit = 10
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRankingIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-[#49de80]" />;
    if (position === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-[#F59E0B]" />;
    return <span className="text-sm font-medium text-slate-400">#{position}</span>;
  };

  const getRankingBadge = (position: number) => {
    if (position === 1) return 'bg-[#49de80]/20 text-[#49de80] border border-[#49de80]/30';
    if (position === 2) return 'bg-slate-600/20 text-slate-300 border border-slate-600/30';
    if (position === 3) return 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30';
    return 'bg-slate-700/20 text-slate-300 border border-slate-700/30';
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-slate-600 rounded animate-pulse"></div>
            <div className="h-5 bg-slate-600 rounded w-40 animate-pulse"></div>
          </div>
        </div>
        <div className="divide-y divide-slate-700">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="px-6 py-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 bg-slate-600 rounded"></div>
                  <div className="h-4 bg-slate-600 rounded w-32"></div>
                </div>
                <div className="h-4 bg-slate-600 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">Ranking de Corretores</h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-white text-lg">Nenhum dado disponível</p>
          <p className="text-slate-400 text-sm mt-1">
            Não há corretores com vendas para exibir no ranking
          </p>
        </div>
      </div>
    );
  }

  const topRanking = ranking.slice(0, limit);

  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#49de80]" />
            <h3 className="text-lg font-semibold text-white">Ranking de Corretores</h3>
          </div>
          <div className="text-sm text-slate-400">
            {topRanking.length} corretores
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Posição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Corretor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Apólices
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Ticket Médio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Campanhas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#1E293B] divide-y divide-slate-700">
            {topRanking.map((corretor, index) => (
              <tr key={corretor.corretor_id} className="hover:bg-slate-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRankingIcon(corretor.ranking_receita)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {corretor.nome_corretor}
                    </div>
                    <div className="text-sm text-slate-400">
                      {corretor.email_corretor}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-white">
                      {corretor.total_apolices}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {corretor.apolices_auto} Auto • {corretor.apolices_residencial} Residencial
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#49de80]" />
                    <span className="text-sm font-medium text-[#49de80]">
                      {formatCurrency(corretor.receita_total)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatCurrency(corretor.receita_auto)} Auto
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">
                    {formatCurrency(corretor.ticket_medio)}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-white">
                      {corretor.campanhas_concluidas}/{corretor.total_campanhas}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {corretor.premios_conquistados} prêmios
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    corretor.ativo_ultimos_30_dias 
                      ? 'bg-[#49de80]/20 text-[#49de80] border border-[#49de80]/30' 
                      : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                  }`}>
                    {corretor.ativo_ultimos_30_dias ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer com estatísticas */}
      {topRanking.length > 0 && (
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-[#49de80]" />
                <span>Líder: {topRanking[0]?.nome_corretor}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-[#49de80]" />
                <span>Top Receita: {formatCurrency(topRanking[0]?.receita_total || 0)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-[#49de80]" />
              <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
