import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ModernForm from '../ui/ModernForm';
import ModernInput from '../ui/ModernInput';
import ModernButton from '../ui/ModernButton';
import Alert from '../ui/Alert';

const ModernLoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { login } = useAuth();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'email') setEmail(value);
        if (name === 'password') setPassword(value);
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!email.trim()) newErrors.email = 'Email é obrigatório';
        if (!password.trim()) newErrors.password = 'Senha é obrigatória';
        
        if (email && !/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email inválido';
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

        setLoading(true);

        const result = await login(email, password);
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        setLoading(false);
    };

    return (
        <ModernForm
            title="Entrar"
            subtitle="Digite suas credenciais para acessar sua conta"
            onSubmit={handleSubmit}
        >
            {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}

            <ModernInput
                id="email"
                name="email"
                label="E-mail"
                type="email"
                value={email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                required
                error={errors.email}
            />
            
            <ModernInput
                id="password"
                name="password"
                label="Senha"
                type="password"
                value={password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                required
                error={errors.password}
            />
            
            <ModernButton
                type="submit"
                variant="gradient"
                size="lg"
                disabled={loading}
                loading={loading}
                className="w-full"
            >
                Entrar
            </ModernButton>
        </ModernForm>
    );
};

export default ModernLoginForm;
