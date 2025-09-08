import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  phone: yup.string().required('Telefone é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  cnpj: yup.string().required('CNPJ é obrigatório'),
  cpd: yup.string().required('CPD é obrigatório'),
  password: yup.string().min(6, 'Senha deve ter pelo menos 6 caracteres').required('Senha é obrigatória'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Senhas não coincidem').required('Confirmação de senha é obrigatória'),
}).required();

type FormData = yup.InferType<typeof schema>;

// Funções de máscara simples
const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const formatCPD = (value: string) => {
  return value.replace(/\D/g, '');
};

const SimpleRegisterForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para valores formatados
  const [cnpjValue, setCnpjValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [cpdValue, setCpdValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
  });

  // Handlers para máscaras
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpjValue(formatted);
    setValue('cnpj', formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneValue(formatted);
    setValue('phone', formatted);
  };

  const handleCpdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPD(e.target.value);
    setCpdValue(formatted);
    setValue('cpd', formatted);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await registerUser({
        name: data.name,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj,
        cpd: data.cpd,
        password: data.password,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Conta criada com sucesso! Redirecionando para o dashboard...' });
        // Limpar formulário
        setValue('name', '');
        setValue('phone', '');
        setValue('email', '');
        setValue('cnpj', '');
        setValue('cpd', '');
        setValue('password', '');
        setValue('confirmPassword', '');
        
        // Limpar estados das máscaras
        setCnpjValue('');
        setPhoneValue('');
        setCpdValue('');
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro interno do servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card animate-fade-in">
        <div className="card-body">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gradient mb-2">Criar Conta</h2>
            <p className="text-gray-600">Preencha os dados abaixo para criar sua conta</p>
          </div>

        {message && (
          <div className={`alert ${
            message.type === 'success' 
              ? 'alert-success' 
              : 'alert-error'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">
                CNPJ *
              </label>
              <input
                type="text"
                value={cnpjValue}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                className="form-input"
              />
              {errors.cnpj && (
                <div className="form-error">
                  <AlertCircle className="w-4 h-4" />
                  {errors.cnpj.message}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                CPD (SUSEP) *
              </label>
              <input
                type="text"
                value={cpdValue}
                onChange={handleCpdChange}
                placeholder="00000000000000"
                className="form-input"
              />
              {errors.cpd && (
                <div className="form-error">
                  <AlertCircle className="w-4 h-4" />
                  {errors.cpd.message}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Nome da Empresa *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Nome da empresa"
              className="form-input"
            />
            {errors.name && (
              <div className="form-error">
                <AlertCircle className="w-4 h-4" />
                {errors.name.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              className="form-input"
            />
            {errors.email && (
              <div className="form-error">
                <AlertCircle className="w-4 h-4" />
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Telefone *
            </label>
            <input
              type="text"
              value={phoneValue}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="form-input"
            />
            {errors.phone && (
              <div className="form-error">
                <AlertCircle className="w-4 h-4" />
                {errors.phone.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Senha *
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className="form-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <div className="form-error">
                <AlertCircle className="w-4 h-4" />
                {errors.password.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua senha"
                className="form-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="form-error">
                <AlertCircle className="w-4 h-4" />
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg w-full"
          >
            {isLoading ? (
              <>
                <div className="loading"></div>
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já possui uma conta?{' '}
            <a href="/login" className="text-gradient font-medium hover:underline">
              Faça login
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>  
  );
};

export default SimpleRegisterForm;