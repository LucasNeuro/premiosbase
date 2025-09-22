import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Target } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1e293b] to-[#334155] border-b border-gray-700 px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Dashboard
                </h1>
                <p className="text-xs text-gray-300">Sistema de Campanhas</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div 
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
              onClick={logout}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name || 'U')}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {user?.name.split(' ')[0]}
                </span>
                <span className="text-xs text-gray-300">
                  Corretor
                </span>
              </div>
              <LogOut className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>
    </header>
  );
};

export default Header;
