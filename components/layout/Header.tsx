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
    <header className="header">
      <div className="header-left">
        {/* Header content removed */}
      </div>

      <div className="header-right">
        {/* Notifications */}
        <button className="p-2 text-white/60 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="user-menu" onClick={logout}>
          <div className="user-avatar">
            {getInitials(user?.name || 'U')}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {user?.name.split(' ')[0]}
            </span>
            <span className="text-xs text-white/70">
              Corretor
            </span>
          </div>
          <LogOut className="w-4 h-4 text-white/60" />
        </div>
      </div>
    </header>
  );
};

export default Header;
