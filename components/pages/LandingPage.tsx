import React from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, DollarSign, Calendar, Zap,
  Percent, RefreshCw, ArrowRight, Trophy, Award
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-900/20 via-orange-900/20 to-red-900/20 backdrop-blur-sm border border-red-200/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-red-500" fill="currentColor" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xl font-bold text-blue-400">Prêmios</span>
                <span className="text-xl font-bold text-red-400">Base</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200">
                Cadastrar
              </Link>
              <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-0 px-6 lg:px-10 overflow-visible min-h-[700px] bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative min-h-[600px]">
            {/* Texto */}
            <div className="space-y-8 relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Muito mais que prêmios: parceria de verdade para o corretor
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Inscreva-se no Prêmios Base, participe de campanhas a cada apólice emitida e troque por recompensas incríveis.
                Com o suporte comercial da Base, você vende mais e vai mais longe.
              </p>
              <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-200 inline-flex items-center">
                Vem pra Prêmios.Base
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Imagem Taça */}
            <div className="relative">
              <div className="w-full h-full flex items-center justify-start lg:justify-center">
                <div className="relative">
                  {/* Fundo branco sólido (sem gradiente/sombra) */}
                  <div className="absolute inset-0 bg-white rounded-full opacity-100"></div>

                  {/* Card branco sem sombra; imagem sem drop-shadow */}
                  <div className="relative z-10 rotate-6">
                    <div className="bg-white rounded-3xl p-6">
                      <img
                        src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/premios_ftt.webp"
                        alt="Troféu Prêmios Base"
                        className="w-[720px] h-[720px] object-contain"
                      />
                    </div>
                  </div>

                  {/* Selo por cima (não cortado) */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center z-40 pointer-events-none">
                    <Award className="w-12 h-12 text-white" />
                  </div>
                  {/* Ícone inferior removido */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features – alinhado ao mesmo container do Hero, 2 por linha e cards mais largos */}
      <section className="pt-0 pb-20 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 pt-12">
          {/* 2 colunas no desktop para aumentar largura de cada card; gap menor para ganhar largura útil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Card 1 */}
            <div className="bg-white p-16 rounded-3xl border border-gray-100">
              <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Vendeu? Ganhou.</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Cada apólice emitida conta para a premiação. Bateu a meta, você desbloqueia recompensas maiores – simples assim.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-16 rounded-3xl border border-gray-100">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Prêmios Exclusivos</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Cadastre suas apólices direto no site. Informe os dados, anexe os documentos e envie para a Base em poucos cliques.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-16 rounded-3xl border border-gray-100">
              <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Campanhas Contínuas</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Campanhas diárias, semanais e mensais – oportunidades constantes para você vender mais e ganhar prêmios com a Base.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-16 rounded-3xl border border-gray-100">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Rápido e Fácil</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Inscreva-se em minutos e já envie suas apólices pelo site.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Prizes Work */}
      <section className="pt-0 pb-20 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-red-600">COMO FUNCIONAM NOSSOS PRÊMIOS?</h2>
              <h3 className="text-4xl font-bold text-gray-900">Prêmios que combinam com você</h3>
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
              <Link to="/register" className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition-all duration-200 inline-flex items-center">
                Participe!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Imagem secundária (fundo branco, sem sombra) */}
            <div className="relative">
              <div className="w-full h-96 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-full opacity-100"></div>
                  <img
                    src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/premios_ftt.webp"
                    alt="Como funcionam os prêmios Prêmios Base"
                    className="w-[420px] h-[420px] object-contain relative z-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-gray-700 py-12">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="flex justify-center items-center">
            <div className="text-gray-400 text-sm font-medium">
              © 2024 Prêmios.Base. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
