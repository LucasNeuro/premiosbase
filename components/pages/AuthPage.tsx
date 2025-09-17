import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import ModernLoginForm from '../auth/ModernLoginForm';
import SimpleRegisterForm from '../auth/SimpleRegisterForm';

const AuthPage: React.FC = () => {
    const location = useLocation();
    const isLoginView = location.pathname === '/login';

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                        {isLoginView ? 'Acesse sua conta' : 'Crie sua conta'}
                    </h2>
                    <p className="text-gray-300">
                        {isLoginView ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
                        <Link 
                            to={isLoginView ? '/register' : '/login'} 
                            className="font-medium text-primary-500 hover:text-primary-400 ml-1"
                        >
                            {isLoginView ? 'Cadastre-se' : 'Faça login'}
                        </Link>
                    </p>
                </div>

                {isLoginView ? <ModernLoginForm /> : <SimpleRegisterForm />}
            </div>
        </div>
    );
};

export default AuthPage;