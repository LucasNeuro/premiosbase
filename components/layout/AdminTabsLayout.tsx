import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminHeader from './AdminHeader';

interface Tab {
    id: string;
    label: string;
    icon: React.ReactNode;
    component: React.ComponentType;
}

interface AdminTabsLayoutProps {
    tabs: Tab[];
    defaultTab?: string;
}

const AdminTabsLayout: React.FC<AdminTabsLayoutProps> = ({ tabs, defaultTab }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const renderContent = () => {
        const activeTabConfig = tabs.find(tab => tab.id === activeTab);
        if (!activeTabConfig) return null;
        
        const Component = activeTabConfig.component;
        return <Component />;
    };

    if (!user) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <AdminHeader />
            
            {/* Main Content */}
            <main className="pt-0">
                {/* Tabs Navigation - Colada no header */}
                <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm -mt-px">
                    <div className="px-6 py-3">
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
                <div className="px-6 pt-14 pb-14">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminTabsLayout;
