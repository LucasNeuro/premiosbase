
import React, { useState } from 'react';
import { usePolicies } from '../../hooks/usePolicies';
import { PolicyType, ContractType } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { currencyMaskFree, unmaskCurrency } from '../../utils/masks';
import Spinner from '../ui/Spinner';

const PolicyForm: React.FC = () => {
    const [policyNumber, setPolicyNumber] = useState('');
    const [type, setType] = useState<PolicyType>(PolicyType.AUTO);
    const [contractType, setContractType] = useState<ContractType>(ContractType.NOVO);
    const [premiumValue, setPremiumValue] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addPolicy } = usePolicies();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);
        
        if (!policyNumber || !premiumValue) {
            setMessage({ text: 'Todos os campos são obrigatórios.', type: 'error' });
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
            });

            if (result.success) {
                setMessage({ text: result.message, type: 'success' });
                setPolicyNumber('');
                setPremiumValue('');
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Erro ao salvar apólice', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card animate-fade-in">
            <div className="card-body">
                <h3 className="text-xl font-bold text-gradient mb-6">Registrar Nova Apólice</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && (
                        <div className={`alert ${
                            message.type === 'success' 
                                ? 'alert-success' 
                                : 'alert-error'
                        }`}>
                            <span>{message.text}</span>
                        </div>
                    )}
                    
                    {/* Formulário em Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="form-group">
                            <label className="form-label">
                                Número da Apólice
                            </label>
                            <input
                                type="text"
                                value={policyNumber}
                                onChange={(e) => setPolicyNumber(e.target.value)}
                                placeholder="Digite o número da apólice"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Tipo de Seguro
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as PolicyType)}
                                className="form-select"
                            >
                                <option value={PolicyType.AUTO}>Seguro Auto</option>
                                <option value={PolicyType.RESIDENCIAL}>Seguro Residencial</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Tipo de Contrato
                            </label>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value as ContractType)}
                                className="form-select"
                            >
                                <option value={ContractType.NOVO}>Novo</option>
                                <option value={ContractType.RENOVACAO}>Renovação</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Valor do Prêmio
                            </label>
                            <input
                                type="text"
                                value={premiumValue}
                                onChange={(e) => setPremiumValue(currencyMaskFree(e.target.value))}
                                placeholder="R$ 0,00"
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <button 
                                type="submit" 
                                className="btn btn-primary w-full text-base font-semibold shadow-lg hover:shadow-xl"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <Spinner size="sm" />
                                        <span>Salvando...</span>
                                    </div>
                                ) : (
                                    'Salvar'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PolicyForm;
