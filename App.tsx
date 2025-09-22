
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './components/pages/LandingPage';
import AuthPage from './components/pages/AuthPage';
import DashboardPage from './components/pages/DashboardPage';
import GoalsPage from './components/pages/GoalsPage';
import AdminDashboard from './components/pages/AdminDashboard';
import PremiosPage from './components/pages/PremiosPage';
import AdminRedirect from './components/auth/AdminRedirect';
import { PoliciesProvider } from './hooks/usePolicies';

const AppContent: React.FC = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
                path="/login" 
                element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
            />
            <Route 
                path="/register" 
                element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
            />
            <Route 
                path="/dashboard" 
                element={
                    user ? (
                        user.is_admin ? (
                            <Navigate to="/admin/dashboard" replace />
                        ) : (
                            <PoliciesProvider userId={user.id || user.email}>
                                <DashboardPage />
                            </PoliciesProvider>
                        )
                    ) : (
                        <Navigate to="/login" replace />
                    )
                } 
            />
            <Route 
                path="/goals" 
                element={
                    user ? (
                        <PoliciesProvider userId={user.id || user.email}>
                            <GoalsPage />
                        </PoliciesProvider>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                } 
            />
            <Route 
                path="/premios" 
                element={
                    user ? (
                        <PremiosPage />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                } 
            />
            <Route 
                path="/admin/dashboard" 
                element={
                    user && user.is_admin ? (
                        <AdminDashboard />
                    ) : (
                        <Navigate to="/dashboard" replace />
                    )
                } 
            />
            <Route 
                path="/admin/redirect" 
                element={<AdminRedirect />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen font-sans text-slate-800">
                    <AppContent />
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
