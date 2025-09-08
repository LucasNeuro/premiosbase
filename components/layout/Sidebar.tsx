import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Trophy, 
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
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="sidebar-logo-text">PremiosBase</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`sidebar-nav-item ${item.current ? 'active' : ''}`}
            >
              <Icon className="sidebar-nav-icon" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
};

export default Sidebar;
