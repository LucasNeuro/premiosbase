import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, AlertTriangle, Gift, Target, Users } from 'lucide-react';

const DebugPrizes: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const debugPrizes = async () => {
        if (!user?.id) return;

        setLoading(true);
        setResults(null);

        try {
            console.log('🔍 DebugPrizes - Verificando campanhas e prêmios do usuário:', user.id);

            // 1. Buscar campanhas do usuário
            const { data: campaigns, error: campaignsError } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('record_type', 'campaign')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (campaignsError) {
                setResults({ error: `Erro ao buscar campanhas: ${campaignsError.message}` });
                return;
            }

            // 2. Buscar prêmios conquistados
            const { data: conqueredPrizes, error: prizesError } = await supabase
                .from('premios_conquistados')
                .select('*')
                .eq('user_id', user.id)
                .order('data_conquista', { ascending: false });

            if (prizesError) {
                setResults({ error: `Erro ao buscar prêmios conquistados: ${prizesError.message}` });
                return;
            }

            // 3. Buscar prêmios das campanhas
            const campaignIds = campaigns?.map(c => c.id) || [];
            const { data: campaignPrizes, error: campaignPrizesError } = await supabase
                .from('campanhas_premios')
                .select(`
                    *,
                    premio:premios(
                        id,
                        nome,
                        descricao,
                        valor_estimado,
                        imagem_url,
                        imagem_miniatura_url,
                        categoria:categorias_premios(nome),
                        tipo:tipos_premios(nome)
                    )
                `)
                .in('goal_id', campaignIds);

            if (campaignPrizesError) {
                setResults({ error: `Erro ao buscar prêmios das campanhas: ${campaignPrizesError.message}` });
                return;
            }

            // 4. Analisar campanhas
            const campaignAnalysis = campaigns?.map(campaign => {
                const prizes = campaignPrizes?.filter(cp => cp.goal_id === campaign.id) || [];
                const conquered = conqueredPrizes?.filter(cp => cp.campaign_id === campaign.id) || [];
                
                return {
                    campaign,
                    prizes,
                    conquered,
                    hasPrizes: prizes.length > 0,
                    hasConqueredPrizes: conquered.length > 0,
                    progressPercentage: campaign.progress_percentage || 0,
                    isCompleted: (campaign.progress_percentage || 0) >= 100,
                    status: campaign.status
                };
            }) || [];

            setResults({
                campaigns: campaignAnalysis,
                totalCampaigns: campaigns?.length || 0,
                totalConqueredPrizes: conqueredPrizes?.length || 0,
                totalCampaignPrizes: campaignPrizes?.length || 0,
                completedCampaigns: campaignAnalysis.filter(c => c.isCompleted).length,
                campaignsWithPrizes: campaignAnalysis.filter(c => c.hasPrizes).length,
                campaignsWithConqueredPrizes: campaignAnalysis.filter(c => c.hasConqueredPrizes).length
            });

            console.log('✅ DebugPrizes - Análise concluída:', {
                totalCampaigns: campaigns?.length || 0,
                completedCampaigns: campaignAnalysis.filter(c => c.isCompleted).length,
                totalConqueredPrizes: conqueredPrizes?.length || 0
            });

        } catch (error) {
            console.error('❌ DebugPrizes - Erro na análise:', error);
            setResults({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Usuário não autenticado</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Gift className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Debug de Prêmios</h2>
            </div>

            <button
                onClick={debugPrizes}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
                <Gift className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                {loading ? 'Analisando...' : 'Analisar Prêmios'}
            </button>

            {results && (
                <div className="mt-6 space-y-6">
                    {results.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Erro</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">{results.error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Resumo */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-blue-800">Campanhas</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-800">{results.totalCampaigns}</div>
                                    <div className="text-sm text-blue-600">
                                        {results.completedCampaigns} completadas
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Gift className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-green-800">Prêmios</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-800">{results.totalConqueredPrizes}</div>
                                    <div className="text-sm text-green-600">
                                        {results.campaignsWithConqueredPrizes} campanhas com prêmios
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-5 h-5 text-orange-600" />
                                        <span className="font-medium text-orange-800">Configurados</span>
                                    </div>
                                    <div className="text-2xl font-bold text-orange-800">{results.totalCampaignPrizes}</div>
                                    <div className="text-sm text-orange-600">
                                        {results.campaignsWithPrizes} campanhas com prêmios configurados
                                    </div>
                                </div>
                            </div>

                            {/* Detalhes das Campanhas */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">Detalhes das Campanhas</h3>
                                {results.campaigns.map((campaign: any, index: number) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-800">{campaign.campaign.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    campaign.isCompleted 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {campaign.progressPercentage.toFixed(1)}%
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    campaign.status === 'completed' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {campaign.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium">Prêmios Configurados:</span> {campaign.prizes.length}
                                            </div>
                                            <div>
                                                <span className="font-medium">Prêmios Conquistados:</span> {campaign.conquered.length}
                                            </div>
                                            <div>
                                                <span className="font-medium">Tipo:</span> {campaign.campaign.campaign_type}
                                            </div>
                                        </div>

                                        {campaign.prizes.length > 0 && (
                                            <div className="mt-3">
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Prêmios Configurados:</h5>
                                                <div className="space-y-1">
                                                    {campaign.prizes.map((prize: any, prizeIndex: number) => (
                                                        <div key={prizeIndex} className="text-sm text-gray-600">
                                                            • {prize.premio?.nome || 'Prêmio'} - R$ {prize.premio?.valor_estimado?.toLocaleString() || '0'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {campaign.conquered.length > 0 && (
                                            <div className="mt-3">
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Prêmios Conquistados:</h5>
                                                <div className="space-y-1">
                                                    {campaign.conquered.map((conquered: any, conqueredIndex: number) => (
                                                        <div key={conqueredIndex} className="text-sm text-gray-600">
                                                            • {conquered.premio_nome} - R$ {conquered.premio_valor_estimado.toLocaleString()} 
                                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                                conquered.status === 'disponivel' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {conquered.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DebugPrizes;
