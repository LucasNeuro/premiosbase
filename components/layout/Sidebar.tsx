import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Target
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
            <img 
              src="https://wdqobcvasxfiettueifs.supabase.co/storage/v1/object/public/imagem_logo/base-premio.jpg" 
              alt="PremiosBase Logo" 
              className="w-8 h-8 rounded"
            />
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
