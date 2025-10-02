import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ModernForm from '../ui/ModernForm';
import ModernInput from '../ui/ModernInput';
import ModernButton from '../ui/ModernButton';
import Alert from '../ui/Alert';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ModernNewPasswordForm: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [passwordStrength, setPasswordStrength] = useState({
        hasLength: false,
        hasNumber: false,
        hasSpecial: false,
        hasUppercase: false
    });

    useEffect(() => {
        // Verificar se há sessão ativa (usuário clicou no link)
        const checkSession = async () => {
            try {
                // Verificar se há parâmetros de erro na URL (query params e hash)
                const urlParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                
                const error = urlParams.get('error') || hashParams.get('error');
                const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
                
                console.log('🔍 URL atual:', window.location.href);
                console.log('🔍 Query params:', window.location.search);
                console.log('🔍 Hash:', window.location.hash);
                console.log('🔍 Error detectado:', error);
                console.log('🔍 Error code:', errorCode);
                
                if (error === 'access_denied' && errorCode === 'otp_expired') {
                    setMessage({ 
                        text: 'Link de recuperação expirado. Solicite um novo link.', 
                        type: 'error' 
                    });
                    return;
                }
                
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setMessage({ 
                        text: 'Link inválido ou expirado. Solicite um novo link de recuperação.', 
                        type: 'error' 
                    });
                }
            } catch (error) {
                console.error('Erro ao verificar sessão:', error);
                setMessage({ 
                    text: 'Erro ao verificar link. Tente novamente.', 
                    type: 'error' 
                });
            }
        };
        checkSession();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'password') {
            setPassword(value);
            // Atualizar força da senha
            setPasswordStrength({
                hasLength: value.length >= 6,
                hasNumber: /\d/.test(value),
                hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
                hasUppercase: /[A-Z]/.test(value)
            });
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = async () => {
        const newErrors: Record<string, string> = {};
        
        // Validar nova senha
        if (!password.trim()) {
            newErrors.password = 'Nova senha é obrigatória';
        } else if (password.length < 6) {
            newErrors.password = 'Nova senha deve ter pelo menos 6 caracteres';
        } else if (!/\d/.test(password)) {
            newErrors.password = 'Nova senha deve conter pelo menos um número';
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            newErrors.password = 'Nova senha deve conter pelo menos um caractere especial';
        }
        
        // Validar confirmação
        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Senhas não coincidem';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        if (!(await validateForm())) {
            return;
        }

        setLoading(true);

        try {
            // 1. Atualizar senha no Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) {
                setMessage({ text: authError.message, type: 'error' });
                return;
            }

            // 2. Obter o usuário atual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                setMessage({ text: 'Erro ao obter dados do usuário', type: 'error' });
                return;
            }

            // 3. Hash da nova senha para a tabela users
            const bcrypt = await import('bcryptjs');
            const passwordHash = await bcrypt.hash(password, 10);

            // 4. Atualizar senha na tabela users
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    password_hash: passwordHash,
                    updated_at: new Date().toISOString()
                })
                .eq('email', user.email);

            if (updateError) {
                console.error('Erro ao atualizar senha na tabela users:', updateError);
                setMessage({ text: 'Erro ao atualizar senha no banco de dados', type: 'error' });
                return;
            }

            setMessage({ 
                text: 'Senha alterada com sucesso! Redirecionando para login...', 
                type: 'success' 
            });
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setMessage({ text: 'Erro interno do servidor.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Definir Nova Senha</h2>
                <p className="text-gray-300">
                    Crie uma nova senha segura para sua conta. Você foi redirecionado aqui através do link de recuperação.
                </p>
            </div>

            <ModernForm onSubmit={handleSubmit}>
                {message && <Alert message={message.text} type={message.type} onClose={() => setMessage(null)} />}

                <div className="space-y-4">
                    {/* Campo Nova Senha */}
                    <div className="relative">
                        <ModernInput
                            id="password"
                            name="password"
                            label="Nova Senha"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handleInputChange}
                            placeholder="Mínimo 6 caracteres com número e caractere especial"
                            required
                            error={errors.password}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center p-1"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    
                    {/* Dicas de segurança da senha */}
                    {password && (
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

                    <div className="relative">
                        <ModernInput
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirmar Nova Senha"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Digite a senha novamente"
                            required
                            error={errors.confirmPassword}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center p-1"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                
                <ModernButton
                    type="submit"
                    variant="gradient"
                    size="lg"
                    disabled={loading}
                    loading={loading}
                    className="w-full"
                >
                    Alterar Senha
                </ModernButton>
            </ModernForm>
        </div>
    );
};

export default ModernNewPasswordForm;
