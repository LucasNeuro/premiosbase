import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Target } from 'lucide-react';
import AdminNotifications from '../admin/AdminNotifications';
import AdminSystemStatus from '../admin/AdminSystemStatus';

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'AD';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1e293b] to-[#334155] px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Dashboard Administrativo
                </h1>
                <p className="text-xs text-gray-300">Sistema de Gestão de Campanhas</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status */}
            <AdminSystemStatus />

            {/* Notifications */}
            <AdminNotifications />

            {/* User Menu */}
            <div 
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
              onClick={logout}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#49de80] to-[#22c55e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name || 'AD')}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {user?.name ? user.name.split(' ')[0] : 'Admin'}
                </span>
                <span className="text-xs text-gray-300">
                  Administrador
                </span>
              </div>
              <LogOut className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>
    </header>
  );
};

export default AdminHeader;
