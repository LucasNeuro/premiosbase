import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Target,
  DollarSign,
  FileText
} from 'lucide-react';
import { UnifiedCampaignProgressServiceV2 } from '../../services/UnifiedCampaignProgressServiceV2';

interface TestCampaignProgressProps {
  campaignId: string;
}

const TestCampaignProgress: React.FC<TestCampaignProgressProps> = ({ campaignId }) => {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const fetchProgress = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaignId, true);
      setProgress(result);
      
      // Analisar resultados dos critérios
      if (result?.criteriaProgress) {
        const analysis = result.criteriaProgress.map((criterion, index) => ({
          criterionNumber: index + 1,
          name: criterion.criterionName,
          progress: criterion.progress,
          isCompleted: criterion.isCompleted,
          currentValue: criterion.currentValue,
          targetValue: criterion.targetValue,
          matchingPolicies: criterion.matchingPolicies,
          status: criterion.isCompleted ? 'completed' : 'in_progress'
        }));
        setTestResults(analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchProgress();
    }
  }, [campaignId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Teste de Progresso da Campanha
        </h2>
        <button
          onClick={fetchProgress}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Calculando progresso...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {progress && (
        <>
          {/* Progresso Geral */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Progresso Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getProgressColor(progress.progressPercentage)}`}>
                  {progress.progressPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Progresso Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  R$ {progress.currentValue.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Valor Atual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {progress.linkedPolicies}
                </div>
                <div className="text-sm text-gray-600">Apólices Vinculadas</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${progress.isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                  {progress.isCompleted ? '✅' : '🔄'}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
            
            {/* Barra de Progresso Geral */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(progress.progressPercentage)}`}
                  style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Teste dos Critérios */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Análise dos Critérios</h3>
              
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <h4 className="font-semibold text-gray-800">
                        Critério {result.criterionNumber}: {result.name}
                      </h4>
                    </div>
                    <div className={`text-xl font-bold ${getProgressColor(result.progress)}`}>
                      {result.progress.toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Meta:</span>
                      </div>
                      <div className="font-medium">
                        {result.targetValue.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">Atual:</span>
                      </div>
                      <div className="font-medium">
                        {result.currentValue.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600">Apólices:</span>
                      </div>
                      <div className="font-medium">{result.matchingPolicies}</div>
                    </div>
                  </div>

                  {/* Barra de Progresso do Critério */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(result.progress)}`}
                      style={{ width: `${Math.min(result.progress, 100)}%` }}
                    ></div>
                  </div>

                  {/* Status do Critério */}
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      result.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {result.status === 'completed' ? '✅ Completo' : '🔄 Em andamento'}
                    </span>
                    <span className="text-gray-600">
                      {result.progress >= 100 ? 'Meta atingida!' : 'Meta não atingida'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informações de Debug */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Informações de Debug
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Score de Integridade:</span>
                <div className="font-medium text-blue-900">
                  {progress.dataIntegrityScore}%
                </div>
              </div>
              <div>
                <span className="text-blue-700">Último Cálculo:</span>
                <div className="font-medium text-blue-900">
                  {progress.lastCalculated ? new Date(progress.lastCalculated).toLocaleString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Instruções de Teste */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Instruções para Teste
            </h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>Para testar o Critério 1 (Auto):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Crie 2 apólices do tipo "Seguro Auto"</li>
                <li>Valor mínimo: R$ 3.000,00 cada</li>
                <li>Contrato pode ser "Novo" ou "Renovação Bradesco"</li>
              </ul>
              
              <p className="mt-3"><strong>Para testar o Critério 2 (Residencial):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Crie apólices do tipo "Seguro Residencial"</li>
                <li>Valor mínimo: R$ 2.000,00 cada</li>
                <li>Meta total: R$ 50.000,00</li>
              </ul>
              
              <p className="mt-3 text-yellow-800">
                <strong>Após criar cada apólice, clique em "Atualizar" para ver o progresso!</strong>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestCampaignProgress;


