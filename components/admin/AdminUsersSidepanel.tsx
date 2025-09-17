import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, User, Mail, Phone, Building, Shield } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    cnpj: string;
    cpd: any;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

interface AdminUsersSidepanelProps {
    user?: User | null;
    onClose: () => void;
    onSave: () => void;
}

const AdminUsersSidepanel: React.FC<AdminUsersSidepanelProps> = ({
    user,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        cnpj: user?.cnpj || '',
        cpd: user?.cpd || '',
        is_admin: user?.is_admin || false
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.cnpj.trim()) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);

        try {
            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                cnpj: formData.cnpj.trim(),
                cpd: formData.cpd.trim(),
                is_admin: formData.is_admin,
                updated_at: new Date().toISOString()
            };

            if (user) {
                // Atualizar usuário existente
                const { error } = await supabase
                    .from('users')
                    .update(userData)
                    .eq('id', user.id);

                if (error) {
                    console.error('Error updating user:', error);
                    alert('Erro ao atualizar corretor');
                    return;
                }
            } else {
                // Criar novo usuário
                const { error } = await supabase
                    .from('users')
                    .insert([userData]);

                if (error) {
                    console.error('Error creating user:', error);
                    alert('Erro ao criar corretor');
                    return;
                }
            }

            onSave();
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao salvar corretor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {user ? 'Editar Corretor' : 'Novo Corretor'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome Completo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome Completo *
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Digite o nome completo"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Telefone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefone *
                        </label>
                        <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="(11) 99999-9999"
                                required
                            />
                        </div>
                    </div>

                    {/* CNPJ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            CNPJ *
                        </label>
                        <div className="relative">
                            <Building className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="00.000.000/0000-00"
                                required
                            />
                        </div>
                    </div>

                    {/* CPD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            CPD
                        </label>
                        <div className="relative">
                            <Shield className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="cpd"
                                value={formData.cpd}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Número do CPD"
                            />
                        </div>
                    </div>

                    {/* Administrador */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_admin"
                            name="is_admin"
                            checked={formData.is_admin}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_admin" className="ml-3 block text-sm text-gray-700">
                            <span className="font-medium">Administrador</span>
                            <span className="block text-xs text-gray-500">
                                Concede acesso total ao sistema
                            </span>
                        </label>
                    </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {user ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersSidepanel;

