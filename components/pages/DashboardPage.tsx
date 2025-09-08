
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import DynamicPolicyForm from '../dashboard/DynamicPolicyForm';
import PoliciesTable from '../dashboard/PoliciesTable';
import SummaryCards from '../dashboard/SummaryCards';
import ImportPolicies from '../dashboard/ImportPolicies';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    
    console.log('DashboardPage - User:', user);
    
    return (
        <div className="min-h-screen bg-slate-900">
            <Sidebar />
            <Header />
            <main className="main-content">
                <div className="space-y-6">
                    <SummaryCards />
                    <DynamicPolicyForm />
                    <ImportPolicies />
                    <PoliciesTable />
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
