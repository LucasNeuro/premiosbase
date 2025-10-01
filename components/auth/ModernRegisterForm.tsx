import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { User, CnpjData } from '../../types';
import ModernForm from '../ui/ModernForm';
import ModernInput from '../ui/ModernInput';
import ModernButton from '../ui/ModernButton';
import Alert from '../ui/Alert';
import { CnpjCard } from '../ui/CnpjCard';
import { fetchCnpjData } from '../../services/cnpjService';
import { validateCpds } from '../../services/cpdService';
import { phoneMask, cnpjMask, cpdMask } from '../../utils/masks';
import { Plus, Trash2, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const ModernRegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [cpds, setCpds] = useState<string[]>(['']);
    const [showPassword, setShowPassword] = useState(false);
    const [hasMultipleCpds, setHasMultipleCpds] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        cnpj: '',
        password: '',
    });
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [cnpjData, setCnpjData] = useState<any>(null);
    const [isCnpjLoading, setIsCnpjLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [cpdErrors, setCpdErrors] = useState<string[]>([]);
    const [cpdValidation, setCpdValidation] = useState<{
        isValidating: boolean;
        isValid: boolean | null;
        message: string;
        existingCpds: string[];
    }>({
        isValidating: false,
        isValid: null,
        message: '',
        existingCpds: []
    });
    const [passwordStrength, setPasswordStrength] = useState<{
        hasLength: boolean;
        hasNumber: boolean;
        hasSpecial: boolean;
        hasUppercase: boolean;
    }>({
        hasLength: false,
        hasNumber: false,
        hasSpecial: false,
        hasUppercase: false
    });

    const { register } = useAuth();

    // Funções para gerenciar CPDs
    const addCpd = () => {
        if (cpds.length < 6) {
            setCpds([...cpds, '']);
        }
    };

    const removeCpd = (index: number) => {
        if (cpds.length > 1) {
            const newCpds = cpds.filter((_, i) => i !== index);
            setCpds(newCpds);
        }
    };

    const handleCpdChange = (index: number, value: string) => {
        const maskedValue = cpdMask(value);
        const newCpds = [...cpds];
        newCpds[index] = maskedValue;
        setCpds(newCpds);
        
        // Limpar erro do CPD
        if (cpdErrors[index]) {
            const newErrors = [...cpdErrors];
            newErrors[index] = '';
            setCpdErrors(newErrors);
        }

        // Resetar validação quando CPD é alterado
        setCpdValidation({
            isValidating: false,
            isValid: null,
            message: '',
            existingCpds: []
        });
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;
        
        if (name === 'phone') maskedValue = phoneMask(value);
        if (name === 'cnpj') maskedValue = cnpjMask(value);
        
        setFormData(prev => ({ ...prev, [name]: maskedValue }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'cnpj' && value.length !== 18) {
            setCnpjData(null);
        }

        // Verificar força da senha
        if (name === 'password') {
            const hasLength = value.length >= 6;
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
            const hasUppercase = /[A-Z]/.test(value);
            
            setPasswordStrength({
                hasLength,
                hasNumber,
                hasSpecial,
                hasUppercase
            });
        }
    };

    const handleCnpjBlur = useCallback(async () => {
        if (formData.cnpj.length === 18) {
            setIsCnpjLoading(true);
            setMessage(null);
            setCnpjData(null);
            try {
                // Buscar dados completos da API OpenCNPJ
                const response = await fetch(`https://api.opencnpj.org/${formData.cnpj.replace(/\D/g, '')}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('CNPJ não encontrado');
                    }
                    if (response.status === 429) {
                        throw new Error('Limite de consultas excedido. Tente novamente em alguns segundos.');
                    }
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
            // Campos obrigatórios do formulário
            name: cnpjData.nome_fantasia || cnpjData.razao_social || '',
            email: prev.email || cnpjData.email || '',
            phone: prev.phone || (cnpjData.telefones?.[0] ? `(${cnpjData.telefones[0].ddd}) ${cnpjData.telefones[0].numero}` : ''),
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
        if (cpds.some(cpd => !cpd.trim())) newErrors.cpds = 'Todos os CPDs são obrigatórios';
        if (!formData.password.trim()) newErrors.password = 'Senha é obrigatória';
        
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }
        
        if (formData.password && !passwordStrength.hasNumber) {
            newErrors.password = 'Senha deve conter pelo menos um número';
        }
        
        if (formData.password && !passwordStrength.hasSpecial) {
            newErrors.password = 'Senha deve conter pelo menos um caractere especial (!@#$%^&*)';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        console.log('=== INICIANDO SUBMIT ===');
        console.log('formData:', formData);
        console.log('cnpjData:', cnpjData);
        console.log('cpds:', cpds);
        console.log('hasMultipleCpds:', hasMultipleCpds);
        
        if (!validateForm()) {
            console.log('❌ Validação falhou');
            return;
        }
        
        if (!cnpjData) {
            console.log('❌ CNPJ não validado');
            setMessage({ text: 'Por favor, valide o CNPJ antes de continuar.', type: 'error' });
            return;
        }

        console.log('✅ Validações passaram, iniciando cadastro...');
        setLoading(true);

        // Preparar dados do CNPJ para o banco (mapeando todos os campos da tabela)
        const cnpjDataForDB = cnpjData ? {
            // Campos específicos da tabela users
            natureza_juridica: cnpjData.natureza_juridica || null,
            endereco: cnpjData.logradouro && cnpjData.numero && cnpjData.bairro && cnpjData.municipio && cnpjData.uf ? 
                `${cnpjData.logradouro}, ${cnpjData.numero}, ${cnpjData.bairro}, ${cnpjData.municipio} - ${cnpjData.uf}`.trim() : null,
            capital_social: cnpjData.capital_social || null,
            porte_empresa: cnpjData.porte_empresa || null,
            razao_social: cnpjData.razao_social || null,
            nome_fantasia: cnpjData.nome_fantasia || null,
            situacao_cadastral: cnpjData.situacao_cadastral || null,
        } : null;

        // Preparar CPDs no formato JSON
        const cpdData = cpds.length === 1 ? 
            cpds[0] : 
            { cpds: cpds.map((cpd, index) => ({ 
                id: (index + 1).toString(), 
                number: cpd, 
                name: `CPD ${cpd}`, 
                isActive: true 
            })) };

        const userData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            cnpj: formData.cnpj,
            cpd: cpds[0], // Primeiro CPD como string
            password: formData.password,
            hasMultipleCpds: hasMultipleCpds,
            additionalCpds: hasMultipleCpds && cpds.length > 1 ? cpds.slice(1).map((cpd, index) => ({ 
                id: (index + 2).toString(), 
                number: cpd 
            })) : undefined,
            cnpjData: cnpjDataForDB, // Dados estruturados para o banco
        };

        console.log('📤 Enviando userData:', userData);
        const result = await register(userData);
        console.log('📥 Resultado do register:', result);
        
        if (result.success) {
            setMessage({ text: 'Conta criada com sucesso! Redirecionando para login...', type: 'success' });
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setMessage({ text: result.message, type: 'error' });
        }
        
        setLoading(false);
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep >= 1 ? 'bg-red-600 text-white scale-110' : 'bg-gray-300 text-gray-600'
                }`}>
                    1
                </div>
                <div className={`w-8 h-1 transition-all duration-500 ${
                    currentStep >= 2 ? 'bg-red-600' : 'bg-gray-300'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep >= 2 ? 'bg-red-600 text-white scale-110' : 'bg-gray-300 text-gray-600'
                }`}>
                    2
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-8xl mx-auto transform transition-all duration-500 ease-in-out animate-in slide-in-from-right-4 shadow-xl hover:shadow-2xl">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-white" />
                </div>
                
                <p className="text-gray-600">Primeiro, vamos validar seus CPDs para garantir que não estão em uso por outros corretores.</p>
            </div>

            <div className="space-y-6">
                {/* Toggle para múltiplos CPDs */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Tem mais de um CPD?</h3>
                            <p className="text-sm text-gray-600">Selecione se você possui múltiplos CPDs para validar</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setHasMultipleCpds(!hasMultipleCpds);
                                if (!hasMultipleCpds) {
                                    setCpds(['', '']);
                                } else {
                                    setCpds(['']);
                                }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                hasMultipleCpds ? 'bg-red-600' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    hasMultipleCpds ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* CPDs para validação */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">CPDs para Validação</h3>
                        {hasMultipleCpds && cpds.length < 6 && (
                            <button
                                type="button"
                                onClick={addCpd}
                                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Adicionar CPD</span>
                            </button>
                        )}
                    </div>
                    
                    {cpds.map((cpd, index) => (
                        <div key={index} className="flex items-center space-x-4 transform transition-all duration-300 hover:scale-105">
                            <div className={`w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300 ${
                                cpd.length === 6 ? 'bg-green-600 scale-110' : 'bg-red-600'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="relative">
                                    <input
                                        id={`cpd-${index}`}
                                        name={`cpd-${index}`}
                                        type="text"
                                        value={cpd}
                                        onChange={(e) => handleCpdChange(index, e.target.value)}
                                        placeholder="000000"
                                        required
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                            cpdErrors[index] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {cpdErrors[index] && (
                                        <p className="text-red-500 text-sm mt-1">{cpdErrors[index]}</p>
                                    )}
                                </div>
                            </div>
                            {hasMultipleCpds && cpds.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeCpd(index)}
                                    className="p-2 text-gray-400 hover:text-red-600 flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Status da validação */}
                {cpdValidation.message && (
                    <div className={`p-4 rounded-lg border ${
                        cpdValidation.isValid === true ? 'bg-green-50 border-green-200 text-green-800' :
                        cpdValidation.isValid === false ? 'bg-red-50 border-red-200 text-red-800' :
                        'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}>
                        <div className="flex items-center space-x-2">
                            {cpdValidation.isValidating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            ) : cpdValidation.isValid === true ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : cpdValidation.isValid === false ? (
                                <XCircle className="w-4 h-4 text-red-600" />
                            ) : null}
                            <span className="font-medium">{cpdValidation.message}</span>
                        </div>
                    </div>
                )}

                {/* Botão Continuar com validação automática */}
                <button
                    type="button"
                    onClick={async () => {
                        // Validar CPDs antes de continuar
                        const validCpds = cpds.filter(cpd => cpd.length === 6);
                        
                        if (validCpds.length === 0) {
                            setMessage({ text: 'Preencha pelo menos um CPD com 6 dígitos', type: 'error' });
                            return;
                        }

                        setCpdValidation({
                            isValidating: true,
                            isValid: null,
                            message: 'Validando CPDs...',
                            existingCpds: []
                        });

                        try {
                            const result = await validateCpds(validCpds);
                            
                            if (result.isValid) {
                                setCpdValidation({
                                    isValidating: false,
                                    isValid: true,
                                    message: result.message,
                                    existingCpds: []
                                });
                                setMessage({ text: 'CPDs validados com sucesso!', type: 'success' });
                                setCurrentStep(2);
                            } else {
                                setCpdValidation({
                                    isValidating: false,
                                    isValid: false,
                                    message: result.message,
                                    existingCpds: result.existingCpds || []
                                });
                                setMessage({ text: result.message, type: 'error' });
                            }
                        } catch (error) {
                            setCpdValidation({
                                isValidating: false,
                                isValid: false,
                                message: 'Erro ao validar CPDs',
                                existingCpds: []
                            });
                            setMessage({ text: 'Erro ao validar CPDs. Tente novamente.', type: 'error' });
                        }
                    }}
                    disabled={cpds.some(cpd => cpd.length !== 6) || cpdValidation.isValidating}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-red-700 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                    {cpdValidation.isValidating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Validando CPDs...</span>
                        </>
                    ) : (
                        <>
                            <span>Continuar</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8 max-w-9xl mx-auto transform transition-all duration-500 ease-in-out animate-in slide-in-from-left-4 shadow-xl hover:shadow-2xl">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dados Pessoais</h2>
                <p className="text-gray-600">Agora preencha seus dados pessoais e da empresa.</p>
            </div>

            {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}

            <div className="space-y-">
                {/* Dados pessoais */}
                <div className="space-y-6">
                    {/* Primeira linha - 2 campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                    <ModernInput
                        id="cnpj"
                        name="cnpj"
                                label="CNPJ*"
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
                    id="name"
                    name="name"
                            label="Nome*"
                    value={formData.name}
                    onChange={handleInputChange}
                            placeholder="Seu nome"
                    required
                    error={errors.name}
                />
                    </div>
                
                    {/* Segunda linha - 2 campos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                    id="phone"
                    name="phone"
                            label="Telefone*"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    required
                    error={errors.phone}
                />

            <ModernInput
                id="email"
                name="email"
                            label="E-mail Corporativo*"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@empresa.com"
                required
                error={errors.email}
            />
                    </div>

                    {/* Terceira linha - Senha ocupando toda a largura */}
                    <div className="space-y-4">
                        <div className="relative">
            <ModernInput
                id="password"
                name="password"
                                label="Senha*"
                                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                                placeholder="Mínimo 6 caracteres com número e caractere especial"
                required
                error={errors.password}
            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        
                        {/* Dicas de segurança da senha */}
                        {formData.password && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Requisitos de segurança:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className={`flex items-center space-x-2 text-sm ${
                                        passwordStrength.hasLength ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                            passwordStrength.hasLength ? 'bg-green-100' : 'bg-gray-200'
                                        }`}>
                                            {passwordStrength.hasLength ? (
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <span>Mínimo 6 caracteres</span>
                                    </div>
                                    
                                    <div className={`flex items-center space-x-2 text-sm ${
                                        passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                            passwordStrength.hasNumber ? 'bg-green-100' : 'bg-gray-200'
                                        }`}>
                                            {passwordStrength.hasNumber ? (
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <span>Pelo menos um número</span>
                                    </div>
                                    
                                    <div className={`flex items-center space-x-2 text-sm ${
                                        passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                            passwordStrength.hasSpecial ? 'bg-green-100' : 'bg-gray-200'
                                        }`}>
                                            {passwordStrength.hasSpecial ? (
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <span>Caractere especial (!@#$%^&*)</span>
                                    </div>
                                    
                                    <div className={`flex items-center space-x-2 text-sm ${
                                        passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                            passwordStrength.hasUppercase ? 'bg-green-100' : 'bg-gray-200'
                                        }`}>
                                            {passwordStrength.hasUppercase ? (
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <span>Letra maiúscula (opcional)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dados da empresa - sempre visíveis */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dados da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ModernInput
                            id="razao_social"
                            name="razao_social"
                            label="Razão Social"
                            value={cnpjData?.razao_social || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="nome_fantasia"
                            name="nome_fantasia"
                            label="Nome Fantasia"
                            value={cnpjData?.nome_fantasia || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="cnpj_display"
                            name="cnpj_display"
                            label="CNPJ"
                            value={formData.cnpj || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="natureza_juridica"
                            name="natureza_juridica"
                            label="Natureza Jurídica"
                            value={cnpjData?.natureza_juridica || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="porte_empresa"
                            name="porte_empresa"
                            label="Porte da Empresa"
                            value={cnpjData?.porte_empresa || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="capital_social"
                            name="capital_social"
                            label="Capital Social"
                            value={cnpjData?.capital_social || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="situacao_cadastral"
                            name="situacao_cadastral"
                            label="Situação Cadastral"
                            value={cnpjData?.situacao_cadastral || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="endereco_completo"
                            name="endereco_completo"
                            label="Endereço Completo"
                            value={
                                cnpjData?.logradouro && cnpjData?.numero && cnpjData?.bairro && cnpjData?.municipio && cnpjData?.uf ? 
                                    `${cnpjData.logradouro}, ${cnpjData.numero}, ${cnpjData.bairro}, ${cnpjData.municipio} - ${cnpjData.uf}` : ''
                            }
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                        <ModernInput
                            id="cep"
                            name="cep"
                            label="CEP"
                            value={cnpjData?.cep || ''}
                            onChange={() => {}}
                            placeholder=""
                            readOnly
                        />
                    </div>
                </div>

                {/* Espaçamento antes dos botões */}
                <div className="mt-8"></div>

                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                    </button>
                    <button
                type="submit"
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-red-700 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <span>Criar Conta</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );

    return (
        <div className="max-w-2xl mx-auto">
            {renderStepIndicator()}
            
            {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>
    );
};

export default ModernRegisterForm;
