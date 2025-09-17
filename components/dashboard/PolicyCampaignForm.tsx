import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { PolicyType, ContractType, Goal } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { currencyMaskFree, unmaskCurrency } from '../../utils/masks';
import Spinner from '../ui/Spinner';
import { Target, CheckCircle, XCircle } from 'lucide-react';

const PolicyCampaignForm: React.FC = () => {
    const { user } = useAuth();
    const [policyNumber, setPolicyNumber] = useState('');
    const [type, setType] = useState<PolicyType>(PolicyType.AUTO);
    const [contractType, setContractType] = useState<ContractType>(ContractType.NOVO);
    const [premiumValue, setPremiumValue] = useState('');
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [availableCampaigns, setAvailableCampaigns] = useState<Goal[]>([]);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchAvailableCampaigns();
        }
    }, [user?.id]);

    const fetchAvailableCampaigns = async () => {
        try {
            setLoadingCampaigns(true);
            
            // Buscar campanhas aceitas pelo corretor
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user?.id)
                .eq('record_type', 'campaign')
                .eq('acceptance_status', 'accepted')
                .eq('is_active', true)
                .eq('status', 'active')
                .gte('end_date', new Date().toISOString().split('T')[0]) // Campanhas que ainda não expiraram
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar campanhas:', error);
                return;
            }

            setAvailableCampaigns(data || []);
        } catch (error) {
            console.error('Erro ao buscar campanhas:', error);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);
        
        if (!policyNumber || !premiumValue) {
            setMessage({ text: 'Todos os campos são obrigatórios.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        if (!selectedCampaignId) {
            setMessage({ text: 'Selecione uma campanha para vincular a apólice.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            const numericPremium = unmaskCurrency(premiumValue);

            // 1. Primeiro criar a apólice na tabela policies (mantém histórico)
            const { data: policyData, error: policyError } = await supabase
                .from('policies')
                .insert({
                    user_id: user?.id,
                    policy_number: policyNumber,
                    type: type,
                    premium_value: numericPremium,
                    registration_date: new Date().toISOString(),
                    ticket_code: generateTicketCode(),
                    contract_type: contractType,
                    status: 'active',
                })
                .select()
                .single();

            if (policyError) {
                console.error('Erro ao criar apólice:', policyError);
                setMessage({ text: 'Erro ao registrar apólice: ' + policyError.message, type: 'error' });
                setIsSubmitting(false);
                return;
            }

            // 2. Vincular apólice à campanha usando a função do banco
            const { data: linkData, error: linkError } = await supabase
                .rpc('vincular_apolice_campanha', {
                    p_campaign_id: selectedCampaignId,
                    p_policy_id: policyData.id,
                    p_user_id: user?.id,
                    p_automatica: false
                });

            if (linkError) {
                console.error('Erro ao vincular à campanha:', linkError);
                setMessage({ text: 'Apólice criada, mas erro ao vincular à campanha: ' + linkError.message, type: 'error' });
                setIsSubmitting(false);
                return;
            }

            setMessage({ text: 'Apólice registrada e vinculada à campanha com sucesso!', type: 'success' });
            
            // Limpar formulário
            setPolicyNumber('');
            setPremiumValue('');
            setSelectedCampaignId('');
            
        } catch (error: any) {
            console.error('Erro geral:', error);
            setMessage({ text: 'Erro interno do sistema.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateTicketCode = (): string => {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `TKT${timestamp.slice(-6)}${random.toUpperCase()}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <Card>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Registrar Apólice em Campanha</h3>
                        <p className="text-sm text-gray-600">Vincule sua nova apólice a uma campanha ativa</p>
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
                        {loadingCampaigns ? (
                            <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                                <Spinner size="sm" />
                                <span className="text-sm text-gray-500">Carregando campanhas...</span>
                            </div>
                        ) : availableCampaigns.length === 0 ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-yellow-600" />
                                    <span className="text-sm text-yellow-800">
                                        Nenhuma campanha ativa encontrada. Aceite uma campanha primeiro.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <select
                                value={selectedCampaignId}
                                onChange={(e) => setSelectedCampaignId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Selecione uma campanha</option>
                                {availableCampaigns.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.title} - Meta: {formatCurrency(campaign.target)}
                                        {campaign.type === 'apolices' && ` (${campaign.target} apólices)`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Dados da Apólice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Número da Apólice *"
                            value={policyNumber}
                            onChange={(e) => setPolicyNumber(e.target.value)}
                            placeholder="Ex: 123456789"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Seguro *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as PolicyType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value={PolicyType.AUTO}>Seguro Auto</option>
                                <option value={PolicyType.RESIDENCIAL}>Seguro Residencial</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Contrato *
                            </label>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value as ContractType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value={ContractType.NOVO}>Novo</option>
                                <option value={ContractType.RENOVACAO}>Renovação Bradesco</option>
                            </select>
                        </div>

                        <Input
                            label="Valor do Prêmio *"
                            value={premiumValue}
                            onChange={(e) => setPremiumValue(currencyMaskFree(e.target.value))}
                            placeholder="R$ 0,00"
                            required
                        />
                    </div>

                    {/* Visualização da Campanha Selecionada */}
                    {selectedCampaignId && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            {(() => {
                                const campaign = availableCampaigns.find(c => c.id === selectedCampaignId);
                                if (!campaign) return null;
                                
                                return (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium text-green-800">
                                                Será vinculada à: {campaign.title}
                                            </p>
                                            <p className="text-sm text-green-600">
                                                Progresso atual: {formatCurrency(campaign.current_value || 0)} de {formatCurrency(campaign.target)}
                                                {campaign.type === 'apolices' && ` (${campaign.current_value || 0} de ${campaign.target} apólices)`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting || availableCampaigns.length === 0}
                        className="w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" />
                                Registrando...
                            </>
                        ) : (
                            'Registrar Apólice na Campanha'
                        )}
                    </Button>
                </form>
            </div>
        </Card>
    );
};

export default PolicyCampaignForm;

