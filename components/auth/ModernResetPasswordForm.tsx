import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ModernForm from '../ui/ModernForm';
import ModernInput from '../ui/ModernInput';
import ModernButton from '../ui/ModernButton';
import Alert from '../ui/Alert';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModernResetPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { resetPassword } = useAuth();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'email') setEmail(value);
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
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

        const result = await resetPassword(email);
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        setLoading(false);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h2>
                <p className="text-gray-300">
                    Digite seu email para receber um link de recuperação
                </p>
            </div>

            <ModernForm onSubmit={handleSubmit}>
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
                
                <ModernButton
                    type="submit"
                    variant="gradient"
                    size="lg"
                    disabled={loading}
                    loading={loading}
                    className="w-full"
                >
                    Enviar Link de Recuperação
                </ModernButton>

                <div className="text-center mt-6">
                    <Link 
                        to="/login" 
                        className="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao Login
                    </Link>
                </div>
            </ModernForm>
        </div>
    );
};

export default ModernResetPasswordForm;


