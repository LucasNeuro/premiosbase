import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ModernForm from '../ui/ModernForm';
import ModernInput from '../ui/ModernInput';
import ModernButton from '../ui/ModernButton';
import Alert from '../ui/Alert';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const ModernLoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            
            <div className="relative">
                <ModernInput
                    id="password"
                    name="password"
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handleInputChange}
                    placeholder="Digite sua senha"
                    required
                    error={errors.password}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 translate-y-0.5 text-gray-400 hover:text-gray-600 flex items-center justify-center p-1"
                >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
            </div>
            
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

            <div className="text-center mt-4">
                <Link 
                    to="/forgot-password" 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                    Esqueci minha senha
                </Link>
            </div>
        </ModernForm>
    );
};

export default ModernLoginForm;
