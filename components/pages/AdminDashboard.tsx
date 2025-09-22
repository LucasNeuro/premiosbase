import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminTabsLayout from '../layout/AdminTabsLayout';
import AdminGoalsManager from '../admin/AdminGoalsManager';
import AdminPoliciesTable from '../admin/AdminPoliciesTable';
import AdminUsersManager from '../admin/AdminUsersManager';
import AdminStatsOverview from '../admin/AdminStatsOverview';
import AdminPremiosManager from '../admin/AdminPremiosManager';
import AdminPrizeOrdersManager from '../admin/AdminPrizeOrdersManager';
import { Target, Users, FileText, BarChart3, Settings, Trophy, Package } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();

    const tabs = [
        { 
            id: 'overview', 
            label: 'Visão Geral', 
            icon: <BarChart3 className="w-5 h-5" />,
            component: AdminStatsOverview
        },
        { 
            id: 'goals', 
            label: 'Gerenciar Campanhas', 
            icon: <Target className="w-5 h-5" />,
            component: AdminGoalsManager
        },
        { 
            id: 'policies', 
            label: 'Todas as Vendas', 
            icon: <FileText className="w-5 h-5" />,
            component: AdminPoliciesTable
        },
        { 
            id: 'premios', 
            label: 'Gerenciar Prêmios', 
            icon: <Trophy className="w-5 h-5" />,
            component: AdminPremiosManager
        },
        { 
            id: 'users', 
            label: 'Gerenciar Corretores', 
            icon: <Users className="w-5 h-5" />,
            component: AdminUsersManager
        },
        { 
            id: 'prize-orders', 
            label: 'Gestão de Retirada', 
            icon: <Package className="w-5 h-5" />,
            component: AdminPrizeOrdersManager
        },
    ];

    if (!user?.is_admin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
                </div>
            </div>
        );
    }

    return <AdminTabsLayout tabs={tabs} defaultTab="overview" />;
};

export default AdminDashboard;
