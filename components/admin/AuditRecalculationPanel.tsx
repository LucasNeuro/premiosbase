import React from 'react';
import { useAuditRecalculation } from '../../hooks/useAuditRecalculation';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
    Play, 
    Square, 
    RefreshCw, 
    Activity, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Clock,
    TrendingUp,
    Database
} from 'lucide-react';

export const AuditRecalculationPanel: React.FC = () => {
    const {
        isRunning,
        stats,
        lastResult,
        loading,
        startAutoRecalculation,
        stopAutoRecalculation,
        performManualRecalculation,
        clearErrors
    } = useAuditRecalculation();

    const handleStart = () => {
        startAutoRecalculation();
    };

    const handleStop = () => {
        stopAutoRecalculation();
    };

    const handleManualRecalculation = async () => {
        await performManualRecalculation();
    };

    const successRate = stats.totalRuns > 0 ? (stats.successfulRuns / stats.totalRuns) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Auditoria e Recálculo Automático</h2>
                        <p className="text-gray-600">Monitora tabelas e recalcula metas automaticamente</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Badge 
                        variant={isRunning ? "default" : "secondary"}
                        className={isRunning ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                        <div className={`w-2 h-2 rounded-full mr-2 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {isRunning ? 'Ativo' : 'Inativo'}
                    </Badge>
                </div>
            </div>

            {/* Controles */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Controles do Serviço</h3>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Intervalo: 5 minutos</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isRunning ? (
                        <Button
                            onClick={handleStart}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar Recálculo Automático
                        </Button>
                    ) : (
                        <Button
                            onClick={handleStop}
                            variant="destructive"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Parar Recálculo Automático
                        </Button>
                    )}

                    <Button
                        onClick={handleManualRecalculation}
                        disabled={loading}
                        variant="outline"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Recálculo Manual
                    </Button>
                </div>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Execuções</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalRuns}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                            <p className="text-2xl font-bold text-gray-900">{successRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Campanhas Recalculadas</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCampaignsRecalculated}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Erros</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.errors.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Último Resultado */}
            {lastResult && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Último Recálculo</h3>
                        <Badge variant={lastResult.success ? "default" : "destructive"}>
                            {lastResult.success ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {lastResult.success ? 'Sucesso' : 'Erro'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-600">Campanhas Recalculadas</p>
                            <p className="text-xl font-bold text-gray-900">{lastResult.recalculatedCampaigns}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Timestamp</p>
                            <p className="text-sm text-gray-900">{new Date(lastResult.timestamp).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Erros</p>
                            <p className="text-xl font-bold text-gray-900">{lastResult.errors.length}</p>
                        </div>
                    </div>

                    {lastResult.errors.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-red-600">Erros Encontrados</h4>
                                <Button
                                    onClick={clearErrors}
                                    variant="outline"
                                    size="sm"
                                >
                                    Limpar
                                </Button>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                {lastResult.errors.map((error, index) => (
                                    <p key={index} className="text-sm text-red-700 mb-1">
                                        • {error}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Informações do Sistema */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Como Funciona</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Monitoramento Automático</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Monitora tabela <code>policy_launch_audit</code></li>
                            <li>• Monitora tabela <code>policies</code></li>
                            <li>• Executa a cada 5 minutos</li>
                            <li>• Recalcula progresso das campanhas</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Verificações de Consistência</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Verifica auditorias órfãs</li>
                            <li>• Verifica políticas sem auditoria</li>
                            <li>• Valida critérios das campanhas</li>
                            <li>• Atualiza status das metas</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};
