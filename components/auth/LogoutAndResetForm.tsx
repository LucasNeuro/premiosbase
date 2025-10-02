import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ModernResetPasswordForm from './ModernResetPasswordForm';

const LogoutAndResetForm: React.FC = () => {
    const { logout } = useAuth();

    useEffect(() => {
        // 🔄 SEMPRE FAZER LOGOUT quando acessar recuperação de senha
        const performLogout = async () => {
            try {
                await logout();
                console.log('✅ LOGOUT: Usuário deslogado automaticamente para recuperação de senha');
            } catch (error) {
                console.error('❌ LOGOUT: Erro ao fazer logout automático:', error);
            }
        };

        performLogout();
    }, [logout]);

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4">
            <ModernResetPasswordForm />
        </div>
    );
};

export default LogoutAndResetForm;
