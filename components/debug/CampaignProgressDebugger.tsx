import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database, 
  TrendingUp,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { UnifiedCampaignProgressServiceV2 } from '../../services/UnifiedCampaignProgressServiceV2';
import { CampaignDataIntegrityService } from '../../services/CampaignDataIntegrityService';
import { useUnifiedCampaignProgress, useIntegrityAudit } from '../../hooks/useUnifiedCampaignProgress';

interface CampaignProgressDebuggerProps {
  campaignId?: string;
  showIntegrityAudit?: boolean;
}

const CampaignProgressDebugger: React.FC<CampaignProgressDebuggerProps> = ({
  campaignId,
  showIntegrityAudit = true
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignId || '');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Hook para progresso da campanha selecionada
  const {
    progress,
    loading: progressLoading,
    error: progressError,
    lastUpdated,
    dataIntegrityScore,
    refresh: refreshProgress,
    clearCache
  } = useUnifiedCampaignProgress(selectedCampaignId || null, {
    autoRefresh: false,
    forceRefresh: true
  });

  // Hook para auditoria de integridade
  const {
    report,
    loading: auditLoading,
    error: auditError,
    lastAudit,
    runAudit,
    autoFix
  } = useIntegrityAudit({
    autoRun: false
  });

  // Buscar campanhas disponíveis
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data, error } = await supabase
          .from('goals')
          .select('id, title, status, campaign_type')
          .eq('record_type', 'campaign')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setCampaigns(data);
        }
      } catch (err) {
        console.error('Erro ao buscar campanhas:', err);
      }
    };

    fetchCampaigns();
  }, []);

  const handleRecalculateAll = async () => {
    setLoading(true);
    try {
      const result = await UnifiedCampaignProgressServiceV2.recalculateAllActiveCampaigns();
      alert(`Recálculo concluído: ${result.success} sucessos, ${result.errors} erros`);
    } catch (error) {
      alert(`Erro no recálculo: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Debug de Progresso das Campanhas
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleRecalculateAll}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recalcular Todas
          </button>
        </div>
      </div>

      {/* Seletor de Campanha */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Selecionar Campanha para Debug:
        </label>
        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Selecione uma campanha...</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.title} ({campaign.status}) - {campaign.campaign_type}
            </option>
          ))}
        </select>
      </div>

      {/* Progresso da Campanha Selecionada */}
      {selectedCampaignId && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Progresso da Campanha
            </h3>
            <div className="flex gap-2">
              <button
                onClick={refreshProgress}
                disabled={progressLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${progressLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={clearCache}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Limpar Cache
              </button>
            </div>
          </div>

          {progressLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Calculando progresso...</span>
            </div>
          )}

          {progressError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{progressError}</span>
            </div>
          )}

          {progress && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Progresso Principal */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Progresso</span>
                  <span className={`text-2xl font-bold ${getProgressColor(progress.progressPercentage)}`}>
                    {progress.progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-gray-600">
                    {progress.currentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className={`font-medium ${progress.isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                    {progress.isCompleted ? 'Completa' : 'Em andamento'}
                  </span>
                </div>
              </div>

              {/* Apólices Vinculadas */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Apólices</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{progress.linkedPolicies}</div>
                <div className="text-sm text-gray-600">
                  de {progress.totalPolicies} total
                </div>
              </div>

              {/* Score de Integridade */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Integridade</span>
                </div>
                <div className={`text-2xl font-bold ${getIntegrityScoreColor(progress.dataIntegrityScore)}`}>
                  {progress.dataIntegrityScore}%
                </div>
                <div className="text-sm text-gray-600">
                  {progress.dataIntegrityScore >= 90 ? 'Excelente' :
                   progress.dataIntegrityScore >= 70 ? 'Boa' :
                   progress.dataIntegrityScore >= 50 ? 'Regular' : 'Crítica'}
                </div>
              </div>
            </div>
          )}

          {/* Critérios (para campanhas compostas) */}
          {progress?.criteriaProgress && progress.criteriaProgress.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-800 mb-3">Progresso dos Critérios</h4>
              <div className="space-y-3">
                {progress.criteriaProgress.map((criterion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{criterion.criterionName}</div>
                      <div className="text-sm text-gray-600">
                        {criterion.currentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                        de {criterion.targetValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        ({criterion.matchingPolicies} apólices)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getProgressColor(criterion.progress)}`}>
                        {criterion.progress.toFixed(1)}%
                      </div>
                      {criterion.isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações de Debug */}
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Informações de Debug
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Última atualização:</span>
                <div className="font-medium">
                  {lastUpdated ? lastUpdated.toLocaleString('pt-BR') : 'Nunca'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Calculado em:</span>
                <div className="font-medium">
                  {progress?.lastCalculated ? new Date(progress.lastCalculated).toLocaleString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auditoria de Integridade */}
      {showIntegrityAudit && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Auditoria de Integridade
            </h3>
            <div className="flex gap-2">
              <button
                onClick={runAudit}
                disabled={auditLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
                Executar Auditoria
              </button>
              {report && (
                <button
                  onClick={autoFix}
                  disabled={auditLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Auto-Corrigir
                </button>
              )}
            </div>
          </div>

          {auditLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Executando auditoria...</span>
            </div>
          )}

          {auditError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{auditError}</span>
            </div>
          )}

          {report && (
            <div className="bg-white rounded-lg p-4 border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{report.criticalIssues}</div>
                  <div className="text-sm text-gray-600">Críticos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{report.highIssues}</div>
                  <div className="text-sm text-gray-600">Altos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{report.mediumIssues}</div>
                  <div className="text-sm text-gray-600">Médios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.autoFixed}</div>
                  <div className="text-sm text-gray-600">Corrigidos</div>
                </div>
              </div>

              {report.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Problemas Detectados:</h4>
                  {report.issues.map((issue: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        issue.severity === 'critical' ? 'bg-red-500' :
                        issue.severity === 'high' ? 'bg-orange-500' :
                        issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{issue.description}</div>
                        <div className="text-sm text-gray-600 mt-1">{issue.suggestedAction}</div>
                        {issue.affectedIds && issue.affectedIds.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            IDs: {issue.affectedIds.slice(0, 3).join(', ')}
                            {issue.affectedIds.length > 3 && ` (+${issue.affectedIds.length - 3})`}
                          </div>
                        )}
                      </div>
                      {issue.autoFixable && (
                        <Zap className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {lastAudit && (
                <div className="text-sm text-gray-600 mt-4 pt-4 border-t">
                  Última auditoria: {lastAudit.toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignProgressDebugger;


