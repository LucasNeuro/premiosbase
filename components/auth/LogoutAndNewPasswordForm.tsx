import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ModernNewPasswordForm from './ModernNewPasswordForm';

const LogoutAndNewPasswordForm: React.FC = () => {
    const { logout } = useAuth();

    useEffect(() => {
        // 🔄 SEMPRE FAZER LOGOUT quando acessar definir nova senha
        const performLogout = async () => {
            try {
                await logout();
                console.log('✅ LOGOUT: Usuário deslogado automaticamente para definir nova senha');
            } catch (error) {
                console.error('❌ LOGOUT: Erro ao fazer logout automático:', error);
            }
        };

        performLogout();
    }, [logout]);

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4">
            <ModernNewPasswordForm />
        </div>
    );
};

export default LogoutAndNewPasswordForm;
