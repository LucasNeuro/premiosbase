import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, User, Mail, Phone, Building, Shield, Plus, Trash2 } from 'lucide-react';

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

interface CpdInfo {
    id: string;
    number: string;
    name: string;
    isActive: boolean;
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
        is_admin: user?.is_admin || false
    });

    const [cpds, setCpds] = useState<CpdInfo[]>([]);
    const [newCpdNumber, setNewCpdNumber] = useState('');
    const [newCpdName, setNewCpdName] = useState('');
    const [loading, setLoading] = useState(false);

    // Processar CPDs quando o usuário for carregado
    useEffect(() => {
        if (user?.cpd) {
            try {
                let cpdData = user.cpd;
                
                if (typeof cpdData === 'string') {
                    try {
                        cpdData = JSON.parse(cpdData);
                    } catch (e) {
                        // Se não conseguir fazer parse, tratar como string simples (CPD único)
                        const simpleCpd = [{
                            id: '1',
                            number: cpdData,
                            name: `CPD ${cpdData}`,
                            isActive: true
                        }];
                        setCpds(simpleCpd);
                        return;
                    }
                }
    
                if (cpdData && typeof cpdData === 'object' && cpdData.cpds && Array.isArray(cpdData.cpds)) {
                    setCpds(cpdData.cpds);
                } else if (cpdData && typeof cpdData === 'object' && Array.isArray(cpdData)) {
                    setCpds(cpdData);
                } else {
                    setCpds([]);
                }
            } catch (error) {
                setCpds([]);
            }
        } else {
            setCpds([]);
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addCpd = () => {
        if (!newCpdNumber.trim()) {
            alert('Número do CPD é obrigatório');
            return;
        }

        // Verificar se CPD já existe
        const cpdExists = cpds.some(cpd => cpd.number === newCpdNumber.trim());
        if (cpdExists) {
            alert('CPD já cadastrado');
            return;
        }

        const newCpd: CpdInfo = {
            id: crypto.randomUUID(),
            number: newCpdNumber.trim(),
            name: newCpdName.trim() || `CPD ${newCpdNumber.trim()}`,
            isActive: true
        };

        setCpds(prev => [...prev, newCpd]);
        setNewCpdNumber('');
        setNewCpdName('');
    };

    const removeCpd = (cpdId: string) => {
        setCpds(prev => prev.filter(cpd => cpd.id !== cpdId));
    };

    const toggleCpdStatus = (cpdId: string) => {
        setCpds(prev => prev.map(cpd => 
            cpd.id === cpdId ? { ...cpd, isActive: !cpd.isActive } : cpd
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.cnpj.trim()) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);

        try {
            // Preparar dados dos CPDs
            const cpdData = cpds.length > 0 ? { cpds } : null;
            
            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                cnpj: formData.cnpj.trim(),
                cpd: cpdData,
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
                    alert('Erro ao atualizar corretor');
                    return;
                }
            } else {
                // Criar novo usuário
                const { error } = await supabase
                    .from('users')
                    .insert([userData]);

                if (error) {
                    alert('Erro ao criar corretor');
                    return;
                }
            }

            onSave();
        } catch (error) {
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

                    {/* CPDs */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            CPDs Cadastrados ({cpds.length})
                        </label>
                        
                        {/* Estado quando não há CPDs */}
                        {cpds.length === 0 && (
                            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center mb-4">
                                <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    Nenhum CPD cadastrado para este corretor
                                </p>
                            </div>
                        )}
                        
                        {/* Lista de CPDs */}
                        {cpds.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {cpds.map((cpd) => (
                                    <div key={cpd.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                cpd.isActive ? 'bg-blue-100' : 'bg-gray-100'
                                            }`}>
                                                <Shield className={`w-5 h-5 ${
                                                    cpd.isActive ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{cpd.number}</div>
                                                <div className="text-sm text-gray-500">{cpd.name}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleCpdStatus(cpd.id)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                    cpd.isActive 
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {cpd.isActive ? 'Ativo' : 'Inativo'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeCpd(cpd.id)}
                                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                title="Remover CPD"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Adicionar novo CPD */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Adicionar Novo CPD</h4>
                            <div className="space-y-3">
                                <div className="relative">
                                    <Shield className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={newCpdNumber}
                                        onChange={(e) => setNewCpdNumber(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Número do CPD"
                                    />
                                </div>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={newCpdName}
                                        onChange={(e) => setNewCpdName(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nome do CPD (opcional)"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addCpd}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar CPD
                                </button>
                            </div>
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

