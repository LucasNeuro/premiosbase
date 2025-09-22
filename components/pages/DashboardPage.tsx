
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PoliciesAuxiliarProvider } from '../../hooks/usePoliciesAuxiliar';
import { GoalsProvider } from '../../hooks/useGoalsNew';
// import { useRealtimeEvents } from '../../hooks/useRealtimeEvents';
import TabsLayout from '../layout/TabsLayout';
import DynamicPolicyForm from '../dashboard/DynamicPolicyForm';
import PoliciesTable from '../dashboard/PoliciesTable';
import SummaryCards from '../dashboard/SummaryCards';
import CampaignsKanban from '../dashboard/CampaignsKanban';
// import RealtimeStatsOverview from '../dashboard/RealtimeStatsOverview';
import { Home, Target } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<'30' | '60' | 'geral'>('geral');
    
    
    // DESABILITADO: Sistema de eventos em tempo real (causando loops)
    // useRealtimeEvents(user?.id || '');

    if (!user?.id && !user?.email) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-lg text-gray-600">Carregando usuário...</div>
        </div>;
    }

    // Definir userId para uso nos componentes
    const userId = user?.id || user?.email || '';
    
    // Debug log
    console.log('🏠 DashboardPage - User ID:', userId, 'User:', user);
    
    const tabs = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: <Home className="w-5 h-5" />,
            component: () => {
                console.log('🏠 Dashboard tab renderizando com selectedPeriod:', selectedPeriod);
                return (
                    <div className="space-y-6">
                        <SummaryCards selectedPeriod={selectedPeriod} />
                        <DynamicPolicyForm selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
                        <PoliciesTable />
                    </div>
                );
            }
        },
        { 
            id: 'campanhas', 
            label: 'Campanhas', 
            icon: <Target className="w-5 h-5" />,
            component: () => {
                console.log('🎯 Campanhas tab renderizando');
                return (
                    <div className="space-y-6">
                        <CampaignsKanban />
                    </div>
                );
            }
        }
    ];
    
    return (
        <PoliciesAuxiliarProvider userId={user.id || user.email || ''}>
            <GoalsProvider userId={user.id || user.email || ''}>
                <TabsLayout tabs={tabs} defaultTab="dashboard" />
            </GoalsProvider>
        </PoliciesAuxiliarProvider>
    );
};

export default DashboardPage;
