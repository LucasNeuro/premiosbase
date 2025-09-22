import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from './Header';
import AdminHeader from './AdminHeader';
import { Home, Target, BarChart3, FileText, Users, Plus } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon: React.ReactNode;
    component: React.ComponentType | (() => React.ReactNode);
}

interface TabsLayoutProps {
    isAdmin?: boolean;
    tabs: Tab[];
    defaultTab?: string;
}

const TabsLayout: React.FC<TabsLayoutProps> = ({ isAdmin = false, tabs, defaultTab }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const renderContent = () => {
        const activeTabConfig = tabs.find(tab => tab.id === activeTab);
        if (!activeTabConfig) return null;

        // Se component é uma função, chamá-la
        if (typeof activeTabConfig.component === 'function') {
            return activeTabConfig.component();
        }
        
        // Se component é um componente React, renderizá-lo
        const Component = activeTabConfig.component;
        return <Component />;
    };

    if (!user) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            {isAdmin ? <AdminHeader /> : <Header />}
            
            {/* Main Content */}
            <main className="pt-16">
                {/* Tabs Navigation - FIXA */}
                <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex space-x-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-[#1E293B] text-white'
                                            : 'text-gray-600 hover:text-[#49de80] hover:bg-green-50'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default TabsLayout;
