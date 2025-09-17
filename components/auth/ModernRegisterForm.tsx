import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { User, CnpjData } from '../../types';
import ModernForm from '../ui/ModernForm';
import ModernInput from '../ui/ModernInput';
import ModernButton from '../ui/ModernButton';
import Alert from '../ui/Alert';
import { CnpjCard } from '../ui/CnpjCard';
import { fetchCnpjData } from '../../services/cnpjService';
import { phoneMask, cnpjMask, cpdMask } from '../../utils/masks';


const ModernRegisterForm: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        cnpj: '',
        cpd: '',
        password: '',
    });
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [cnpjData, setCnpjData] = useState<any>(null); // Dados completos da API
    const [isCnpjLoading, setIsCnpjLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { register } = useAuth();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;
        
        if (name === 'phone') maskedValue = phoneMask(value);
        if (name === 'cnpj') maskedValue = cnpjMask(value);
        if (name === 'cpd') maskedValue = cpdMask(value);
        
        setFormData(prev => ({ ...prev, [name]: maskedValue }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'cnpj' && value.length !== 18) {
            setCnpjData(null);
        }
    };

    const handleCnpjBlur = useCallback(async () => {
        if (formData.cnpj.length === 18) {
            setIsCnpjLoading(true);
            setMessage(null);
            setCnpjData(null);
            try {
                // Buscar dados completos da API CNPJA
                const response = await fetch(`https://open.cnpja.com/office/${formData.cnpj.replace(/\D/g, '')}`);
                if (!response.ok) {
                    throw new Error('CNPJ não encontrado ou inválido');
                }
                const apiData = await response.json();
                setCnpjData(apiData);
            } catch (err: any) {
                setMessage({ text: err.message || 'Erro ao validar CNPJ.', type: 'error' });
            } finally {
                setIsCnpjLoading(false);
            }
        }
    }, [formData.cnpj]);

    const handleCnpjSelect = useCallback(() => {
        if (!cnpjData) return;
        
        setFormData(prev => ({
            ...prev,
            name: cnpjData.alias || cnpjData.company?.name || '',
            email: prev.email || cnpjData.emails?.[0]?.address || '',
            phone: prev.phone || (cnpjData.phones?.[0] ? `(${cnpjData.phones[0].area}) ${cnpjData.phones[0].number}` : ''),
        }));
        
        // Limpa erros relacionados aos campos preenchidos
        setErrors(prev => ({
            ...prev,
            name: '',
            email: '',
            phone: '',
        }));
        
        setMessage({ text: 'Dados da empresa preenchidos automaticamente! Verifique e complete os campos restantes.', type: 'success' });
    }, [cnpjData]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
        if (!formData.cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
        if (!formData.cpd.trim()) newErrors.cpd = 'CPD é obrigatório';
        if (!formData.password.trim()) newErrors.password = 'Senha é obrigatória';
        
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        if (!validateForm()) {
            return;
        }
        
        if (!cnpjData) {
            setMessage({ text: 'Por favor, valide o CNPJ antes de continuar.', type: 'error' });
            return;
        }

        setLoading(true);

        const userData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            cnpj: formData.cnpj,
            cpd: formData.cpd,
            password: formData.password,
            cnpjData: cnpjData, // Incluir dados completos do CNPJ
        };

        const result = await register(userData);
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        setLoading(false);
    };

    return (
        <ModernForm
            onSubmit={handleSubmit}
        >
            {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}

            {/* CNPJ e CPD primeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                    <ModernInput
                        id="cnpj"
                        name="cnpj"
                        label="CNPJ"
                        value={formData.cnpj}
                        onChange={handleInputChange}
                        onBlur={handleCnpjBlur}
                        placeholder="00.000.000/0000-00"
                        required
                        error={errors.cnpj}
                    />
                    {isCnpjLoading && (
                        <div className="absolute top-9 right-3 text-gray-400">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
                
                <ModernInput
                    id="cpd"
                    name="cpd"
                    label="CPD (SUSEP)"
                    value={formData.cpd}
                    onChange={handleInputChange}
                    placeholder="00000000000000"
                    required
                    error={errors.cpd}
                />
            </div>
            
            {cnpjData && <CnpjCard data={cnpjData} onSelect={handleCnpjSelect} isLoading={isCnpjLoading} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                    id="name"
                    name="name"
                    label="Nome Completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Digite seu nome completo"
                    required
                    error={errors.name}
                />
                
                <ModernInput
                    id="phone"
                    name="phone"
                    label="Telefone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    required
                    error={errors.phone}
                />
            </div>

            <ModernInput
                id="email"
                name="email"
                label="E-mail Corporativo"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@empresa.com"
                required
                error={errors.email}
            />

            <ModernInput
                id="password"
                name="password"
                label="Senha"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                required
                error={errors.password}
            />

            <ModernButton
                type="submit"
                variant="gradient"
                size="lg"
                disabled={isCnpjLoading || loading}
                loading={loading}
                className="w-full"
            >
                Criar Conta
            </ModernButton>
        </ModernForm>
    );
};

export default ModernRegisterForm;
