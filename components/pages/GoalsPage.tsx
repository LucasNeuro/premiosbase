// Este arquivo não é mais necessário - as campanhas agora estão integradas no DashboardPage
// Mantido apenas para compatibilidade com rotas existentes

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import TabsLayout from '../layout/TabsLayout';
import GoalsOverview from '../dashboard/GoalsOverview';
import { Target } from 'lucide-react';

const GoalsPage: React.FC = () => {
    const { user } = useAuth();
    
    if (!user) {
        return <div>Carregando...</div>;
    }
    
    // Redireciona para o dashboard com a aba de campanhas ativa
    const tabs = [
        { 
            id: 'campanhas', 
            label: 'Campanhas', 
            icon: <Target className="w-5 h-5" />,
            component: GoalsOverview
        }
    ];
    
    return <TabsLayout tabs={tabs} defaultTab="campanhas" />;
};

export default GoalsPage;
