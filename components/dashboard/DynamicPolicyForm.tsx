import React, { useState, useEffect } from 'react';
import { usePolicies } from '../../hooks/usePolicies';
import { PolicyType, ContractType, Policy } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { currencyMask, unmaskCurrency } from '../../utils/masks';
import Spinner from '../ui/Spinner';
import { Link } from 'lucide-react';

const DynamicPolicyForm: React.FC = () => {
    const [policyNumber, setPolicyNumber] = useState('');
    const [type, setType] = useState<PolicyType>(PolicyType.AUTO);
    const [contractType, setContractType] = useState<ContractType>(ContractType.NOVO);
    const [city, setCity] = useState('');
    const [originalPolicyId, setOriginalPolicyId] = useState('');
    const [premiumValue, setPremiumValue] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([]);
    const { addPolicy, policies } = usePolicies();

    // Carregar apólices disponíveis para vinculação
    useEffect(() => {
        if (contractType === ContractType.RENOVACAO) {
            setAvailablePolicies(policies.filter(p => p.contractType === ContractType.NOVO));
        }
    }, [contractType, policies]);

    // Resetar campos quando mudar tipo de contrato
    useEffect(() => {
        if (contractType === ContractType.NOVO) {
            setOriginalPolicyId('');
        }
    }, [contractType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);
        
        if (!policyNumber || !premiumValue || !city) {
            setMessage({ text: 'Todos os campos obrigatórios devem ser preenchidos.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        if (contractType === ContractType.RENOVACAO && !originalPolicyId) {
            setMessage({ text: 'Para renovações, é obrigatório vincular à apólice original.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            const numericPremium = unmaskCurrency(premiumValue);
            const result = await addPolicy({
                policyNumber,
                type,
                contractType,
                premiumValue: numericPremium,
                city,
                originalPolicyId: contractType === ContractType.RENOVACAO ? originalPolicyId : undefined,
            });

            if (result.success) {
                setMessage({ text: result.message, type: 'success' });
                setPolicyNumber('');
                setPremiumValue('');
                setCity('');
                setOriginalPolicyId('');
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Erro ao salvar apólice', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedOriginalPolicy = availablePolicies.find(p => p.id === originalPolicyId);

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-lg animate-fade-in">
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Registrar Nova Apólice</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`alert ${
                            message.type === 'success' 
                                ? 'alert-success' 
                                : 'alert-error'
                        }`}>
                            <span>{message.text}</span>
                        </div>
                    )}
                    
                    {/* Campos Básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número da Apólice *
                            </label>
                            <input
                                type="text"
                                value={policyNumber}
                                onChange={(e) => setPolicyNumber(e.target.value)}
                                placeholder="Digite o número da apólice"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Seguro *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as PolicyType)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={PolicyType.AUTO}>Seguro Auto</option>
                                <option value={PolicyType.RESIDENCIAL}>Seguro Residencial</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Contrato *
                            </label>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value as ContractType)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={ContractType.NOVO}>Novo</option>
                                <option value={ContractType.RENOVACAO}>Renovação</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cidade da Venda *
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: São Paulo, Rio de Janeiro"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valor do Prêmio *
                            </label>
                            <input
                                type="text"
                                value={premiumValue}
                                onChange={(e) => setPremiumValue(currencyMask(e.target.value))}
                                placeholder="R$ 0,00"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Campos Avançados - Apenas para Renovações */}
                    {contractType === ContractType.RENOVACAO && (
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <Link className="w-4 h-4" />
                                Vinculação de Renovação
                            </h4>
                            
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Apólice Original *
                                </label>
                                <select
                                    value={originalPolicyId}
                                    onChange={(e) => setOriginalPolicyId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Selecione a apólice original</option>
                                    {availablePolicies.map((policy) => (
                                        <option key={policy.id} value={policy.id}>
                                            {policy.policyNumber} - {policy.type} - R$ {policy.premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </option>
                                    ))}
                                </select>
                                
                                {selectedOriginalPolicy && (
                                    <div className="mt-2 p-3 bg-white border border-blue-300 rounded-lg">
                                        <div className="text-sm text-gray-800">
                                            <strong className="text-blue-800">Apólice Selecionada:</strong>
                                            <div className="mt-1 grid grid-cols-2 gap-2">
                                                <div><strong>Número:</strong> {selectedOriginalPolicy.policyNumber}</div>
                                                <div><strong>Tipo:</strong> {selectedOriginalPolicy.type}</div>
                                                <div><strong>Valor:</strong> R$ {selectedOriginalPolicy.premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                <div><strong>Ticket:</strong> {selectedOriginalPolicy.ticketCode}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Botão de Submit */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary h-12 text-base font-semibold shadow-lg hover:shadow-xl min-w-[120px]"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <Spinner size="sm" />
                                    Salvando...
                                </div>
                            ) : (
                                'Salvar Apólice'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DynamicPolicyForm;
