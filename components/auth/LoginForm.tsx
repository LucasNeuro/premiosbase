
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import FormInput from '../ui/FormInput';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';

// Schema de validação
const loginSchema = yup.object({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup.string().required('Senha é obrigatória'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

const LoginForm: React.FC = () => {
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const methods = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const { handleSubmit } = methods;

    const onSubmit = async (data: LoginFormData) => {
        setMessage(null);
        setLoading(true);

        const result = await login(data.email, data.password);
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        setLoading(false);
    };

    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}
                    
                    <FormInput
                        name="email"
                        label="E-mail"
                        type="email"
                        placeholder="seu@email.com"
                        required
                    />
                    
                    <FormInput
                        name="password"
                        label="Senha"
                        type="password"
                        placeholder="Digite sua senha"
                        required
                    />
                    
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>
            </FormProvider>
        </Card>
    );
};

export default LoginForm;
