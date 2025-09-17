import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import AdminGoalsManager from '../admin/AdminGoalsManager';

const AdminGoalsPageContent: React.FC = () => {
    const { user } = useAuth();
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:ml-64">
                <Header />
                <main className="p-6 pt-24">
                    <div className="space-y-6">
                        {/* Header da Página */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Gerenciar Metas</h1>
                                <p className="text-gray-600 mt-2">Configure metas para todos os corretores da empresa</p>
                            </div>
                        </div>

                        {/* Componente de Gerenciamento */}
                        <AdminGoalsManager />
                    </div>
                </main>
            </div>
        </div>
    );
};

const AdminGoalsPage: React.FC = () => {
    const { user } = useAuth();
    
    if (!user) {
        return <div>Carregando...</div>;
    }
    
    return <AdminGoalsPageContent />;
};

export default AdminGoalsPage;
