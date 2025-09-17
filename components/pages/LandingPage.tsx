import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Gift, 
  DollarSign, 
  Calendar, 
  Zap,
  Percent,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="max-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/tft_base.png" 
                alt="PremiosBase Logo" 
                className="w-8 h-8"
              />
              <div className="flex items-center space-x-1">
                <span className="text-xl font-bold text-blue-400">Premios</span>
                <span className="text-xl font-bold text-red-400">Base</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Cadastrar
              </Link>
              <Link 
                to="/login" 
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-0 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[700px]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center relative min-h-[600px]">
            {/* Left Side - Text Content */}
            <div className="space-y-8 relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Muito mais que prêmios: parceria de verdade para o corretor
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Inscreva-se no Prêmios Base, participe de campanhas a cada apólice emitida e troque por recompensas incríveis. 
                Com o suporte comercial da Base, você vende mais e vai mais longe.
              </p>
              
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-200 inline-flex items-center"
              >
                Vem pra Premios.Base
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Right Side - Trophy Image */}
            <div className="relative">
              <div className="w-full h-full flex items-center justify-start lg:justify-center">
                <img 
                  src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/premios_ftt.webp" 
                  alt="Troféu Base Recompensas" 
                  className="w-[700px] h-[700px] object-contain transform rotate-12"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-0 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1: Vendeu? Ganhou */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vendeu? Ganhou.</h3>
              <p className="text-gray-600">
                Cada apólice emitida conta para a premiação. Bateu a meta, você desbloqueia recompensas maiores – simples assim.
              </p>
            </div>

            {/* Card 2: Prêmios exclusivos */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Prêmios exclusivos</h3>
              <p className="text-gray-600">
                Preencha suas apólices aqui. Cadastre suas apólices direto no site. Informe os dados, anexe os documentos e envie para a Base em poucos cliques.
              </p>
            </div>

            {/* Card 3: Campanhas Contínuas */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Campanhas Contínuas</h3>
              <p className="text-gray-600">
                Campanhas diárias, semanais e mensais – oportunidades constantes para você vender mais e ganhar prêmios com a Base.
              </p>
            </div>

            {/* Card 4: Rápido e fácil */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rápido e fácil</h3>
              <p className="text-gray-600">
                Inscreva-se em minutos e já envie suas apólices pelo site.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Prizes Work Section */}
      <section className="pt-0 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-red-600">
                COMO FUNCIONAM NOSSOS PRÊMIOS?
              </h2>
              
              <h3 className="text-4xl font-bold text-gray-900">
                Prêmios que combinam com você
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-600">
                    Participação gratuita e resgate sem burocracia, direto pelo Portal do Corretor.
                  </p>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-600">
                    Campanhas que cabem no seu ritmo, com metas claras para todo perfil de corretor.
                  </p>
                </div>
              </div>
              
              <Link 
                to="/register" 
                className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition-all duration-200 inline-flex items-center"
              >
                Participe!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Right Side - Image */}
            <div className="relative">
              <div className="w-full h-80 flex items-center justify-center">
                <img 
                  src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/premios_ftt.webp" 
                  alt="Como funcionam os prêmios" 
                  className="w-[300px] h-[300px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/tft_base.png" 
                alt="PremiosBase Logo" 
                className="w-8 h-8"
              />
              <div className="flex items-center space-x-1">
                <span className="text-xl font-bold text-blue-400">Premios</span>
                <span className="text-xl font-bold text-red-400">Base</span>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 Premios.Base. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
