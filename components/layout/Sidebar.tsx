import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Target,
  Trophy
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Relatórios',
      href: '/reports',
      icon: BarChart3,
      current: location.pathname === '/reports'
    },
    {
      name: 'Metas',
      href: '/goals',
      icon: Target,
      current: location.pathname === '/goals'
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-40 bg-[#1E293B] w-64">
      {/* Logo */}
      <div className="flex items-center p-4 border-b border-slate-700">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 overflow-hidden rounded-xl bg-gradient-to-br from-red-900/20 via-orange-900/20 to-red-900/20 backdrop-blur-sm border border-red-200/20 shadow-lg">
              <img 
                src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/premios_ftt.webp" 
                alt="PremiosBase Logo" 
                className="w-full h-full object-contain filter brightness-110"
                onError={(e) => {
                  // Fallback para ícone se a imagem não carregar
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement as HTMLElement;
                  parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>';
                }}
              />
            </div>
          </div>
          <span className="text-white font-bold text-lg">PremiosBase</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                item.current
                  ? 'bg-[#EF4444] text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
