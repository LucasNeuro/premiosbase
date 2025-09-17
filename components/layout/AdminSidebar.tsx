import React from 'react';
import { Home } from 'lucide-react';

const AdminSidebar: React.FC = () => {

    return (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-black shadow-lg">
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#EF4444] rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Admin</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <div className="space-y-1">
                        <div className="px-3 py-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Administração
                        </div>
                        <div className="px-3 py-2 text-sm text-gray-300 bg-[#EF4444] bg-opacity-20 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Home className="w-5 h-5 text-[#EF4444]" />
                                <span className="text-[#EF4444] font-medium">Dashboard</span>
                            </div>
                        </div>
                    </div>
                </nav>

            </div>
        </div>
    );
};

export default AdminSidebar;

