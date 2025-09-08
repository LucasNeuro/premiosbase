import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Trophy, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Star,
  Award,
  Target,
  Zap,
  BarChart3,
  FileText,
  Smartphone
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                PREMIOS<span className="text-blue-500">.</span><span className="text-primary-500">base</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Começar
              </Link>
              <Link 
                to="/register" 
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-all duration-200"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                A plataforma completa para{' '}
                <span className="text-primary-500">corretores</span>{' '}
                de seguros gerenciarem suas{' '}
                <span className="text-primary-500">apólices</span>{' '}
                de forma{' '}
                <span className="text-primary-500">simples</span>{' '}
                e eficiente.
              </h1>
              
              <h2 className="text-2xl font-bold text-white">
                Organize, registre e acompanhe suas apólices em um só lugar!
              </h2>
              
              <p className="text-lg text-gray-300 leading-relaxed">
                Sistema desenvolvido especialmente para corretores de seguros, com foco na simplicidade e 
                praticidade. Cadastre apólices de seguro auto e residencial, visualize histórico completo 
                e mantenha controle total sobre seus negócios.
              </p>
              
            </div>

            {/* Right Side - Visual Element */}
            <div className="relative">
              <div className="relative z-10">
                {/* Trophy Statue Illustration */}
                <div className="w-full h-96 bg-gradient-to-br from-primary-500/20 to-primary-700/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <Trophy className="w-32 h-32 text-primary-500 mx-auto mb-4" />
                    <div className="w-24 h-24 bg-primary-600 rounded-full mx-auto flex items-center justify-center">
                      <Award className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-primary-400 rounded-full opacity-60"></div>
                  <div className="absolute bottom-8 left-8 w-6 h-6 bg-primary-300 rounded-full opacity-40"></div>
                  <div className="absolute top-1/2 left-4 w-4 h-4 bg-primary-500 rounded-full opacity-50"></div>
                </div>
              </div>
              
              {/* Background Elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary-600/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary-500/10 rounded-full blur-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Red Section */}
        <div className="absolute -bottom-16 left-0 right-0 h-32 bg-primary-600 transform skew-y-1"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Gerencie suas apólices, acompanhe métricas e conquiste prêmios de forma simples e eficiente.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestão de Apólices</h3>
              <p className="text-gray-600">
                Registre e gerencie todas as suas apólices de seguro auto e residencial em um só lugar.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Métricas em Tempo Real</h3>
              <p className="text-gray-600">
                Acompanhe seu desempenho com dashboards intuitivos e relatórios detalhados.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relatórios Detalhados</h3>
              <p className="text-gray-600">
                Acompanhe seu desempenho com relatórios completos e métricas detalhadas.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl border border-orange-100">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Validação de CNPJ</h3>
              <p className="text-gray-600">
                Validação automática de CNPJ para garantir dados corretos e confiáveis.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-8 rounded-2xl border border-red-100">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Metas e Objetivos</h3>
              <p className="text-gray-600">
                Defina metas personalizadas e acompanhe seu progresso em tempo real.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-2xl border border-teal-100">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Interface Intuitiva</h3>
              <p className="text-gray-600">
                Design moderno e responsivo para uma experiência de usuário excepcional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher o PremiosBase?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              A plataforma mais completa e confiável para corretores de seguros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">100% Seguro</h3>
              <p className="text-blue-100">Seus dados protegidos com criptografia de nível bancário.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Organização Total</h3>
              <p className="text-blue-100">Mantenha todos os seus dados organizados e acessíveis.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Aumente Vendas</h3>
              <p className="text-blue-100">Ferramentas que impulsionam seu desempenho comercial.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Suporte 24/7</h3>
              <p className="text-blue-100">Equipe especializada sempre disponível para ajudar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Pronto para organizar seus negócios?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Junte-se a milhares de corretores que já estão organizando suas apólices de forma eficiente.
          </p>
          <Link 
            to="/login" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
          >
            Começar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PremiosBase</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 PremiosBase. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
