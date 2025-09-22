import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Users, Database } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import { fixAllCampaignsStatus, fixAllUserCampaignsStatus, CampaignStatusFix } from '../../services/fixCampaignStatus';
import { useAuth } from '../../hooks/useAuth';

const FixCampaignStatusPanel: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<CampaignStatusFix[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [scope, setScope] = useState<'all' | 'user'>('all');

    const handleFixCampaigns = async () => {
        try {
            setLoading(true);
            setError(null);
            setResults([]);

            let fixResults: CampaignStatusFix[] = [];

            if (scope === 'all') {
                fixResults = await fixAllCampaignsStatus();
            } else {
                if (!user?.id) {
                    setError('Usuário não encontrado');
                    return;
                }
                fixResults = await fixAllUserCampaignsStatus(user.id);
            }

            setResults(fixResults);

        } catch (err: any) {
            setError(err.message || 'Erro ao corrigir campanhas');
        } finally {
            setLoading(false);
        }
    };

    const fixedCount = results.filter(r => r.wasFixed).length;
    const totalCount = results.length;

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Correção de Status de Campanhas</h2>
                            <p className="text-sm text-gray-600">
                                Corrige campanhas que foram marcadas como concluídas mas não atingiram todos os critérios
                            </p>
                        </div>
                    </div>

                    <Alert type="warning" className="mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-orange-800 mb-1">Atenção</h4>
                                <p className="text-sm text-orange-700">
                                    Esta ferramenta verifica e corrige campanhas que foram incorretamente marcadas como concluídas. 
                                    Uma campanha só deve ser considerada concluída quando <strong>TODOS</strong> os critérios forem 100% atingidos.
                                </p>
                            </div>
                        </div>
                    </Alert>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Escopo da Correção
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="all"
                                        checked={scope === 'all'}
                                        onChange={(e) => setScope(e.target.value as 'all' | 'user')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Todas as campanhas do sistema</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="user"
                                        checked={scope === 'user'}
                                        onChange={(e) => setScope(e.target.value as 'all' | 'user')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Apenas minhas campanhas</span>
                                </label>
                            </div>
                        </div>

                        <Button
                            onClick={handleFixCampaigns}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Corrigindo...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Executar Correção
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {error && (
                <Alert type="error">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </Alert>
            )}

            {results.length > 0 && (
                <Card>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Database className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Resultados da Correção</h3>
                                <p className="text-sm text-gray-600">
                                    {totalCount} campanhas verificadas, {fixedCount} corrigidas
                                </p>
                            </div>
                        </div>

                        {fixedCount > 0 && (
                            <Alert type="success" className="mb-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>
                                        <strong>{fixedCount}</strong> campanha(s) foram corrigidas com sucesso!
                                    </span>
                                </div>
                            </Alert>
                        )}

                        <div className="space-y-3">
                            {results.map((result, index) => (
                                <div
                                    key={result.campaignId}
                                    className={`p-4 rounded-lg border ${
                                        result.wasFixed
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'bg-green-50 border-green-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-1">
                                                {result.campaignTitle}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>
                                                    Status: <strong>{result.oldStatus}</strong>
                                                    {result.wasFixed && (
                                                        <span className="text-orange-600">
                                                            {' '}→ <strong>{result.newStatus}</strong>
                                                        </span>
                                                    )}
                                                </span>
                                                <span>
                                                    Critérios: {result.completedCriteria}/{result.criteriaCount}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {result.wasFixed ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Corrigida
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    OK
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {results.length === 0 && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h4 className="text-lg font-medium text-gray-900 mb-1">
                                    Nenhuma correção necessária
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Todas as campanhas estão com o status correto.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default FixCampaignStatusPanel;
