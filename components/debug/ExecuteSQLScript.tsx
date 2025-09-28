import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, AlertTriangle, Play, Database } from 'lucide-react';

const ExecuteSQLScript: React.FC = () => {
    const { user } = useAuth();
    const [executing, setExecuting] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const executeScript = async () => {
        if (!user?.id) return;

        setExecuting(true);
        setResults([]);

        try {
            console.log('🔧 Executando script SQL para criar tabela policy_campaign_links...');

            // Script SQL para criar a tabela (versão simplificada)
            const sqlScript = `
                -- 1. Criar a tabela
                CREATE TABLE IF NOT EXISTS policy_campaign_links (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
                    campaign_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    linked_by UUID REFERENCES auth.users(id),
                    linked_automatically BOOLEAN DEFAULT false,
                    is_active BOOLEAN DEFAULT true,
                    ai_confidence INTEGER DEFAULT NULL,
                    ai_reasoning TEXT DEFAULT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    
                    -- Constraints
                    UNIQUE(policy_id, campaign_id),
                    CONSTRAINT valid_ai_confidence CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 100))
                );

                -- 2. Criar índices para performance
                CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_policy_id ON policy_campaign_links(policy_id);
                CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_campaign_id ON policy_campaign_links(campaign_id);
                CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_user_id ON policy_campaign_links(user_id);
                CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_is_active ON policy_campaign_links(is_active);
                CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_linked_at ON policy_campaign_links(linked_at);

                -- 3. Habilitar RLS
                ALTER TABLE policy_campaign_links ENABLE ROW LEVEL SECURITY;

                -- 4. Criar políticas RLS
                CREATE POLICY "Users can view their own policy campaign links" ON policy_campaign_links
                    FOR SELECT USING (auth.uid() = user_id);

                CREATE POLICY "Users can insert their own policy campaign links" ON policy_campaign_links
                    FOR INSERT WITH CHECK (auth.uid() = user_id);

                CREATE POLICY "Users can update their own policy campaign links" ON policy_campaign_links
                    FOR UPDATE USING (auth.uid() = user_id);

                CREATE POLICY "Users can delete their own policy campaign links" ON policy_campaign_links
                    FOR DELETE USING (auth.uid() = user_id);
            `;

            // Executar o script
            const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });

            if (error) {
                setResults(prev => [...prev, {
                    step: 'Executar Script SQL',
                    status: 'error',
                    message: `Erro: ${error.message}`
                }]);
                return;
            }

            setResults(prev => [...prev, {
                step: 'Executar Script SQL',
                status: 'success',
                message: 'Script executado com sucesso'
            }]);

            // Verificar se a tabela foi criada
            console.log('🔍 Verificando se a tabela foi criada...');
            const { data: tableCheck, error: tableError } = await supabase
                .from('policy_campaign_links')
                .select('id')
                .limit(1);

            if (tableError) {
                setResults(prev => [...prev, {
                    step: 'Verificar Tabela',
                    status: 'error',
                    message: `Erro ao verificar tabela: ${tableError.message}`
                }]);
            } else {
                setResults(prev => [...prev, {
                    step: 'Verificar Tabela',
                    status: 'success',
                    message: 'Tabela policy_campaign_links criada com sucesso!'
                }]);
            }

            console.log('✅ Script SQL executado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao executar script:', error);
            setResults(prev => [...prev, {
                step: 'Execução Geral',
                status: 'error',
                message: `Erro: ${error}`
            }]);
        } finally {
            setExecuting(false);
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
                <Database className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Criar Tabela policy_campaign_links</h2>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-800">Atenção:</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Este script irá criar a tabela <code>policy_campaign_links</code> que é necessária 
                            para o funcionamento correto do sistema de vinculação de apólices a campanhas.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <button
                    onClick={executeScript}
                    disabled={executing}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className={`w-5 h-5 ${executing ? 'animate-spin' : ''}`} />
                    {executing ? 'Executando Script...' : 'Executar Script SQL'}
                </button>
            </div>

            {/* Resultados */}
            {results.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-800">Resultados da Execução</h3>
                    {results.map((result, index) => (
                        <div key={index} className={`p-3 border rounded-lg ${
                            result.status === 'success' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center gap-2">
                                {result.status === 'success' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className="font-medium text-gray-800">{result.step}</span>
                            </div>
                            <p className={`text-sm mt-1 ${
                                result.status === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {result.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Instruções */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">O que este script faz:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Cria a tabela <code>policy_campaign_links</code></li>
                    <li>• Define as colunas necessárias para vinculação</li>
                    <li>• Cria índices para performance</li>
                    <li>• Configura Row Level Security (RLS)</li>
                    <li>• Define políticas de acesso para usuários</li>
                </ul>
            </div>
        </div>
    );
};

export default ExecuteSQLScript;
