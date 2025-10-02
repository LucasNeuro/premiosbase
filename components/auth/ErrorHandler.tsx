import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertCircle, RefreshCw } from 'lucide-react';

const ErrorHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (error === 'access_denied') {
            if (errorCode === 'otp_expired') {
                setErrorMessage('Link de recuperação expirado. Solicite um novo link.');
            } else {
                setErrorMessage('Erro de acesso. Tente novamente.');
            }
        } else if (error) {
            setErrorMessage('Erro inesperado. Tente novamente.');
        }

        // Limpar parâmetros da URL após 5 segundos
        setTimeout(() => {
            navigate('/forgot-password', { replace: true });
        }, 5000);
    }, [searchParams, navigate]);

    const handleRequestNewLink = () => {
        navigate('/forgot-password');
    };

    if (!errorMessage) {
        return (
            <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4">
            <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md mx-auto shadow-xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro no Link</h2>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleRequestNewLink}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Solicitar Novo Link</span>
                    </button>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Voltar ao Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorHandler;
