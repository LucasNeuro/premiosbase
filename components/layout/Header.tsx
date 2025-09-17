import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, LogOut } from 'lucide-react';

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1E293B] border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Page Title */}
          <h1 className="text-xl font-semibold text-white">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div 
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-700 transition-colors"
            onClick={logout}
          >
            <div className="w-8 h-8 bg-[#49de80] rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {user?.name.split(' ')[0]}
              </span>
              <span className="text-xs text-slate-300">
                Corretor
              </span>
            </div>
            <LogOut className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
