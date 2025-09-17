import React, { useState } from 'react';
import AIDescriptionField from '../ui/AIDescriptionField';
import { isAIConfigured } from '../../config/ai';

const AITestComponent: React.FC = () => {
    const [description, setDescription] = useState('');

    if (!isAIConfigured()) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold">IA não configurada</h3>
                <p className="text-red-600 text-sm">Verifique a configuração da API do Mistral</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Teste do Campo de Descrição com IA
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Meta
                    </label>
                    <AIDescriptionField
                        value={description}
                        onChange={setDescription}
                        goalType="valor"
                        goalTitle="Faturar R$ 50.000 este mês"
                        target={50000}
                        period="mês"
                        placeholder="Digite uma descrição para testar a IA..."
                        rows={4}
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Valor atual:</h4>
                    <p className="text-sm text-gray-600">{description || 'Nenhuma descrição'}</p>
                </div>
            </div>
        </div>
    );
};

export default AITestComponent;
