
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
import PrizeRedemptionTab from '../dashboard/PrizeRedemptionTab';
import CampaignTimeline from '../dashboard/CampaignTimeline';
// import RealtimeStatsOverview from '../dashboard/RealtimeStatsOverview';
import ErrorBoundary from '../ui/ErrorBoundary';
import { Home, Target, Trophy, Clock } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<'30' | '60' | 'geral'>('geral');
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

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

    const tabs = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: <Home className="w-5 h-5" />,
            component: () => {

                return (
                    <div className="space-y-6">
                        <ErrorBoundary>
                            <SummaryCards selectedPeriod={selectedPeriod} />
                        </ErrorBoundary>
                        <ErrorBoundary>
                            <DynamicPolicyForm 
                                selectedPeriod={selectedPeriod} 
                                onPeriodChange={setSelectedPeriod}
                                onTimelineClick={() => setIsTimelineOpen(true)}
                            />
                        </ErrorBoundary>
                        <ErrorBoundary>
                            <PoliciesTable />
                        </ErrorBoundary>
                    </div>
                );
            }
        },
        { 
            id: 'campanhas', 
            label: 'Campanhas', 
            icon: <Target className="w-5 h-5" />,
            component: () => {

                return (
                    <div className="space-y-6">
                        <ErrorBoundary>
                            <CampaignsKanban />
                        </ErrorBoundary>
                    </div>
                );
            }
        },
        { 
            id: 'premios', 
            label: 'Prêmios', 
            icon: <Trophy className="w-5 h-5" />,
            component: () => {

                return (
                    <div className="space-y-6">
                        <ErrorBoundary>
                            <PrizeRedemptionTab />
                        </ErrorBoundary>
                    </div>
                );
            }
        }
    ];
    
    return (
        <PoliciesAuxiliarProvider userId={user.id || user.email || ''}>
            <GoalsProvider userId={user.id || user.email || ''}>
                <TabsLayout tabs={tabs} defaultTab="dashboard" />
                <CampaignTimeline 
                    isOpen={isTimelineOpen} 
                    onClose={() => setIsTimelineOpen(false)} 
                />
            </GoalsProvider>
        </PoliciesAuxiliarProvider>
    );
};

export default DashboardPage;
