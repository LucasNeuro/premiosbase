import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DebugCampaignProgress from '../debug/DebugCampaignProgress';
import TestPolicyLinking from '../debug/TestPolicyLinking';
import CheckDatabaseTables from '../debug/CheckDatabaseTables';
import ExecuteSQLScript from '../debug/ExecuteSQLScript';
import CompareProgressCalculations from '../debug/CompareProgressCalculations';
import DebugPrizes from '../debug/DebugPrizes';
import { Database, TestTube, Settings, AlertTriangle, Server, Wrench, Calculator, Gift } from 'lucide-react';

const DebugPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('debug');

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
                </div>
            </div>
        );
    }

    const tabs = [
        {
            id: 'debug',
            label: 'Debug Geral',
            icon: <Database className="w-5 h-5" />,
            component: <DebugCampaignProgress />
        },
        {
            id: 'test',
            label: 'Teste de Vinculação',
            icon: <TestTube className="w-5 h-5" />,
            component: <TestPolicyLinking />
        },
        {
            id: 'database',
            label: 'Verificar Banco',
            icon: <Server className="w-5 h-5" />,
            component: <CheckDatabaseTables />
        },
        {
            id: 'sql',
            label: 'Criar Tabela',
            icon: <Wrench className="w-5 h-5" />,
            component: <ExecuteSQLScript />
        },
        {
            id: 'compare',
            label: 'Comparar Cálculos',
            icon: <Calculator className="w-5 h-5" />,
            component: <CompareProgressCalculations />
        },
        {
            id: 'prizes',
            label: 'Debug Prêmios',
            icon: <Gift className="w-5 h-5" />,
            component: <DebugPrizes />
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Ferramentas de Debug</h1>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {tabs.find(tab => tab.id === activeTab)?.component}
            </div>

            {/* Instruções */}
            <div className="bg-white border-t border-gray-200 p-6">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Como usar as ferramentas de debug:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">🔍 Debug Geral</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Visualiza campanhas, apólices e vinculações</li>
                                <li>• Mostra erros e inconsistências</li>
                                <li>• Testa recálculo de progresso</li>
                                <li>• Fornece visão geral do estado atual</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">🧪 Teste de Vinculação</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Cria apólice de teste automaticamente</li>
                                <li>• Testa vinculação a campanhas ativas</li>
                                <li>• Verifica atualização de progresso</li>
                                <li>• Mostra logs detalhados de cada etapa</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-800">Dica importante:</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Abra o console do navegador (F12) para ver logs detalhados de debug. 
                                    Isso ajudará a identificar exatamente onde está o problema na vinculação e cálculo de progresso.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugPage;
