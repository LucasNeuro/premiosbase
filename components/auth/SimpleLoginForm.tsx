import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';

const SimpleLoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        if (!email || !password) {
            setMessage({ text: 'Email e senha são obrigatórios.', type: 'error' });
            setLoading(false);
            return;
        }

        const result = await login(email, password);
        setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
        
        if (result.success) {
            // Redirecionar baseado no role do usuário
            setTimeout(() => {
                if (user?.is_admin) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);
        }
        
        setLoading(false);
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
                {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}
                
                <Input
                    id="email"
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                
                <Input
                    id="password"
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                
                <Button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </Button>
            </form>
        </Card>
    );
};

export default SimpleLoginForm;
