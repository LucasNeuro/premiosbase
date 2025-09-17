import React, { useState } from 'react';
import { useGoalsNew } from '../../hooks/useGoalsNew';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import { currencyMaskFree, unmaskCurrency } from '../../utils/masks';
import { Target, Link, CheckCircle } from 'lucide-react';

const PolicyLinkForm: React.FC = () => {
    const { acceptedCampaigns, linkPolicyToCampaign, loading: contextLoading } = useGoalsNew();
    
    const [formData, setFormData] = useState({
        campaignId: '',
        policyNumber: '',
        policyType: 'Seguro Auto' as 'Seguro Auto' | 'Seguro Residencial',
        premiumValue: '',
        contractType: 'Novo' as 'Novo' | 'Renovação Bradesco',
        cpdNumber: '',
        city: ''
    });
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validações
        if (!formData.campaignId) {
            setMessage({ text: 'Selecione uma campanha', type: 'error' });
            return;
        }

        if (!formData.policyNumber || !formData.premiumValue) {
            setMessage({ text: 'Preencha todos os campos obrigatórios', type: 'error' });
            return;
        }

        const numericValue = unmaskCurrency(formData.premiumValue);
        if (numericValue <= 0) {
            setMessage({ text: 'Valor do prêmio deve ser maior que zero', type: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await linkPolicyToCampaign({
                campaignId: formData.campaignId,
                policyNumber: formData.policyNumber,
                policyType: formData.policyType,
                premiumValue: numericValue,
                contractType: formData.contractType,
                cpdNumber: formData.cpdNumber || undefined,
                city: formData.city || undefined
            });

            if (result.success) {
                setMessage({ text: result.message, type: 'success' });
                // Limpar formulário
                setFormData({
                    campaignId: '',
                    policyNumber: '',
                    policyType: 'Seguro Auto',
                    premiumValue: '',
                    contractType: 'Novo',
                    cpdNumber: '',
                    city: ''
                });
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: 'Erro interno do sistema', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const selectedCampaign = acceptedCampaigns.find(c => c.id === formData.campaignId);

    if (contextLoading) {
        return (
            <Card>
                <div className="p-6 flex items-center justify-center">
                    <Spinner size="md" />
                    <span className="ml-2 text-gray-600">Carregando campanhas...</span>
                </div>
            </Card>
        );
    }

    if (acceptedCampaigns.length === 0) {
        return (
            <Card>
                <div className="p-6 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Nenhuma campanha ativa
                    </h3>
                    <p className="text-gray-600">
                        Aceite uma campanha primeiro para poder vincular apólices.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Link className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Vincular Apólice à Campanha</h3>
                        <p className="text-sm text-gray-600">Registre uma nova apólice e vincule a uma campanha ativa</p>
                    </div>
                </div>

                {message && (
                    <Alert
                        type={message.type}
                        message={message.text}
                        onClose={() => setMessage(null)}
                        className="mb-4"
                    />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Seleção de Campanha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campanha *
                        </label>
                        <select
                            value={formData.campaignId}
                            onChange={(e) => handleInputChange('campaignId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Selecione uma campanha</option>
                            {acceptedCampaigns.map((campaign) => (
                                <option key={campaign.id} value={campaign.id}>
                                    {campaign.title} - Meta: {formatCurrency(campaign.target)}
                                    {campaign.type === 'apolices' && ` (${campaign.target} apólices)`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Preview da Campanha Selecionada */}
                    {selectedCampaign && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-800">Campanha selecionada:</span>
                            </div>
                            <p className="text-sm text-blue-700">
                                <strong>{selectedCampaign.title}</strong>
                            </p>
                            <p className="text-sm text-blue-600">
                                Progresso atual: {formatCurrency(selectedCampaign.current_value || 0)} 
                                de {formatCurrency(selectedCampaign.target)}
                                {selectedCampaign.type === 'apolices' && ` (${selectedCampaign.current_value || 0} de ${selectedCampaign.target} apólices)`}
                            </p>
                        </div>
                    )}

                    {/* Dados da Apólice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Número da Apólice *"
                            value={formData.policyNumber}
                            onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                            placeholder="Ex: 123456789"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Seguro *
                            </label>
                            <select
                                value={formData.policyType}
                                onChange={(e) => handleInputChange('policyType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="Seguro Auto">Seguro Auto</option>
                                <option value="Seguro Residencial">Seguro Residencial</option>
                            </select>
                        </div>

                        <Input
                            label="Valor do Prêmio *"
                            value={formData.premiumValue}
                            onChange={(e) => handleInputChange('premiumValue', currencyMaskFree(e.target.value))}
                            placeholder="R$ 0,00"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Contrato *
                            </label>
                            <select
                                value={formData.contractType}
                                onChange={(e) => handleInputChange('contractType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="Novo">Novo</option>
                                <option value="Renovação Bradesco">Renovação Bradesco</option>
                            </select>
                        </div>

                        <Input
                            label="Número CPD"
                            value={formData.cpdNumber}
                            onChange={(e) => handleInputChange('cpdNumber', e.target.value)}
                            placeholder="Opcional"
                        />

                        <Input
                            label="Cidade"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || !formData.campaignId}
                        className="w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" />
                                Vinculando...
                            </>
                        ) : (
                            <>
                                <Link className="w-4 h-4 mr-2" />
                                Vincular Apólice à Campanha
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </Card>
    );
};

export default PolicyLinkForm;

