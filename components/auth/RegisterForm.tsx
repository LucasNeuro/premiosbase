
import React, { useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import type { User, CnpjData } from '../../types';
import FormInput from '../ui/FormInput';
import MaskedInput from '../ui/MaskedInput';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { fetchCnpjData } from '../../services/cnpjService';

// Schema de validação
const registerSchema = yup.object({
  name: yup.string().required('Nome completo é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: yup.string().required('Telefone é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  cnpj: yup.string().required('CNPJ é obrigatório'),
  cpd: yup.string().required('CPD é obrigatório'),
  password: yup.string().required('Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

const CnpjCard: React.FC<{ data: CnpjData }> = ({ data }) => (
    <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md text-sm text-green-800">
        <p className="font-bold">{data.razao_social}</p>
        <p>{data.nome_fantasia}</p>
        <p>{`${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}`}</p>
    </div>
);

const RegisterForm: React.FC = () => {
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [cnpjData, setCnpjData] = useState<CnpjData | null>(null);
    const [isCnpjLoading, setIsCnpjLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    
    const methods = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            cnpj: '',
            cpd: '',
            password: '',
        }
    });

    const { handleSubmit, watch, setValue } = methods;
    const cnpjValue = watch('cnpj');

    const handleCnpjBlur = useCallback(async () => {
        if (cnpjValue && cnpjValue.replace(/\D/g, '').length === 14) {
            setIsCnpjLoading(true);
            setMessage(null);
            setCnpjData(null);
            try {
                const data = await fetchCnpjData(cnpjValue);
                setCnpjData(data);
            } catch (err: any) {
                setMessage({ text: err.message || 'Erro ao validar CNPJ.', type: 'error' });
            } finally {
                setIsCnpjLoading(false);
            }
        }
    }, [cnpjValue]);

    const onSubmit = async (data: RegisterFormData) => {
        setMessage(null);
        setLoading(true);

        if (!cnpjData) {
            setMessage({ text: 'Por favor, valide o CNPJ antes de continuar.', type: 'error' });
            setLoading(false);
            return;
        }

        const result = await register(data);
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        setLoading(false);
    };

    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}

                    <FormInput 
                        name="name" 
                        label="Nome Completo" 
                        type="text" 
                        placeholder="Digite seu nome completo"
                        required 
                    />
                    
                    <MaskedInput 
                        name="phone" 
                        label="Telefone" 
                        mask="(99) 99999-9999"
                        placeholder="(11) 99999-9999"
                        required 
                    />
                    
                    <FormInput 
                        name="email" 
                        label="E-mail" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                    />
                    
                    <div className="relative">
                        <MaskedInput 
                            name="cnpj" 
                            label="CNPJ" 
                            mask="99.999.999/9999-99"
                            placeholder="00.000.000/0000-00"
                            required 
                            onBlur={handleCnpjBlur}
                        />
                        {isCnpjLoading && (
                            <div className="absolute top-9 right-3 text-slate-400">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {cnpjData && <CnpjCard data={cnpjData} />}

                    <MaskedInput 
                        name="cpd" 
                        label="CPD (SUSEP)" 
                        mask="99999999999999"
                        placeholder="00000000000000"
                        required 
                    />
                    
                    <FormInput 
                        name="password" 
                        label="Senha" 
                        type="password" 
                        placeholder="Mínimo 6 caracteres"
                        required 
                    />

                    <div className="pt-2">
                        <Button type="submit" disabled={isCnpjLoading || loading}>
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </Card>
    );
};

export default RegisterForm;
