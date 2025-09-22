import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, AlertCircle, CheckCircle, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  phone: yup.string().required('Telefone é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  cnpj: yup.string().required('CNPJ é obrigatório'),
  additionalCpds: yup.array().min(1, 'Adicione pelo menos um CPD').max(5, 'Máximo de 5 CPDs permitidos'),
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
  
  // Estados para CPDs
  const [additionalCpds, setAdditionalCpds] = useState<Array<{id: string, number: string, name: string}>>([]);

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


  // Funções para gerenciar CPDs adicionais
  const addAdditionalCpd = () => {
    if (additionalCpds.length >= 5) {
      setMessage({ type: 'error', text: 'Máximo de 5 CPDs permitidos.' });
      return;
    }
    
    const newCpd = {
      id: Date.now().toString(),
      number: '',
      name: ''
    };
    setAdditionalCpds([...additionalCpds, newCpd]);
  };

  const removeAdditionalCpd = (id: string) => {
    setAdditionalCpds(additionalCpds.filter(cpd => cpd.id !== id));
  };

  const updateAdditionalCpd = (id: string, field: 'number' | 'name', value: string) => {
    setAdditionalCpds(additionalCpds.map(cpd => 
      cpd.id === id ? { ...cpd, [field]: value } : cpd
    ));
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
        cpd: '', // Campo vazio pois usamos apenas CPDs adicionais
        hasMultipleCpds: true,
        additionalCpds: additionalCpds,
        password: data.password,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Conta criada com sucesso! Redirecionando para o dashboard...' });
        // Limpar formulário
        setValue('name', '');
        setValue('phone', '');
        setValue('email', '');
        setValue('cnpj', '');
        setValue('password', '');
        setValue('confirmPassword', '');
        
        // Limpar estados das máscaras
        setCnpjValue('');
        setPhoneValue('');
        
        // Limpar estados de CPDs
        setAdditionalCpds([]);
        
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="card animate-fade-in">
        <div className="card-body">

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
          {/* Primeira linha: CNPJ e Nome da Empresa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>

          {/* Segunda linha: Email e Telefone */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>

          {/* Terceira linha: Senha e Confirmar Senha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>

          {/* Seção de CPDs - Por último, antes do botão */}
          <div className="form-group">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-blue-800">
                  Cadastre aqui seus CPDs
                </h3>
                <span className="text-sm text-blue-600">(Máximo 5 CPDs)</span>
              </div>
              
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">
                      {additionalCpds.length}/5 CPDs cadastrados
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addAdditionalCpd}
                    disabled={additionalCpds.length >= 5}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar CPD
                  </button>
                </div>
                
                {additionalCpds.map((cpd, index) => (
                  <div key={cpd.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Número do CPD
                      </label>
                      <input
                        type="text"
                        value={cpd.number}
                        onChange={(e) => updateAdditionalCpd(cpd.id, 'number', formatCPD(e.target.value))}
                        placeholder="00000000000000"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nome do CPD (opcional)
                      </label>
                      <input
                        type="text"
                        value={cpd.name}
                        onChange={(e) => updateAdditionalCpd(cpd.id, 'name', e.target.value)}
                        placeholder="Ex: CPD Filial SP"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeAdditionalCpd(cpd.id)}
                        className="w-full px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
                
                {additionalCpds.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Nenhum CPD adicional cadastrado
                    </p>
                    <p className="text-xs text-gray-500">
                      Clique em "Adicionar CPD" para incluir seus CPDs
                    </p>
                  </div>
                )}
              </div>
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