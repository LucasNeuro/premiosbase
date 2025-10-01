import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, Target, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { currencyMask, unmaskCurrency } from '../../utils/masks';

interface User {
    id: string;
    name: string;
    email: string;
}

interface CreateGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        title: '',
        target: '',
        targetValue: '', // Para armazenar o valor formatado
        unit: 'apólices',
        period: 'mes',
        type: 'apolices',
        target_period: 'mes',
        description: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [userGoalsCount, setUserGoalsCount] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchUserGoalsCount();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('is_admin', false)
                .order('name');

            if (error) {
                return;
            }

            setUsers(data || []);
        } catch (error) {
        }
    };

    const fetchUserGoalsCount = async () => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('user_id')
                .eq('is_active', true);

            if (error) {
                return;
            }

            const countMap: Record<string, number> = {};
            data?.forEach(goal => {
                countMap[goal.user_id] = (countMap[goal.user_id] || 0) + 1;
            });

            setUserGoalsCount(countMap);
        } catch (error) {
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.user_id) {
            newErrors.user_id = 'Selecione um corretor';
        } else if (userGoalsCount[formData.user_id] >= 4) {
            newErrors.user_id = 'Este corretor já possui 4 metas ativas (máximo permitido)';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Título é obrigatório';
        }

        const targetValue = formData.type === 'valor' ? unmaskCurrency(formData.targetValue) : Number(formData.target);
        if (!formData.target || targetValue <= 0) {
            newErrors.target = 'Meta deve ser maior que zero';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const targetValue = formData.type === 'valor' ? unmaskCurrency(formData.targetValue) : Number(formData.target);
            
            const { error } = await supabase
                .from('goals')
                .insert({
                    user_id: formData.user_id,
                    title: formData.title.trim(),
                    target: targetValue,
                    current: 0,
                    unit: formData.unit,
                    period: formData.period,
                    type: formData.type,
                    status: 'active',
                    admin_created_by: null, // Removido para evitar foreign key constraint error
                    target_period: formData.target_period,
                    is_active: true,
                    description: formData.description.trim()
                });

            if (error) {
                alert('Erro ao criar meta: ' + error.message);
                return;
            }

            // Reset form
            setFormData({
                user_id: '',
                title: '',
                target: '',
                targetValue: '',
                unit: 'apólices',
                period: 'mes',
                type: 'apolices',
                target_period: 'mes',
                description: ''
            });
            setErrors({});

            onSuccess();
            onClose();
        } catch (error) {
            alert('Erro ao criar meta');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            user_id: '',
            title: '',
            target: '',
            targetValue: '',
            unit: 'apólices',
            period: 'mes',
            type: 'apolices',
            target_period: 'mes',
            description: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Criar Nova Meta</h3>
                        <p className="text-sm text-gray-600 mt-1">Defina uma meta para um corretor</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Corretor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Corretor *
                        </label>
                        <select
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.user_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Selecione um corretor</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} - {user.email}
                                    {userGoalsCount[user.id] >= 4 && ' (4 metas - limite atingido)'}
                                </option>
                            ))}
                        </select>
                        {errors.user_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>
                        )}
                        {formData.user_id && userGoalsCount[formData.user_id] < 4 && (
                            <p className="text-blue-600 text-sm mt-1">
                                Metas ativas: {userGoalsCount[formData.user_id] || 0}/4
                            </p>
                        )}
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Target className="w-4 h-4 inline mr-2" />
                            Título da Meta *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ex: Vender 10 apólices este mês"
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Tipo e Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Meta
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="apolices">Apólices</option>
                                <option value="valor">Valor</option>
                                <option value="crescimento">Crescimento</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meta (Valor) *
                            </label>
                            {formData.type === 'valor' ? (
                                <input
                                    type="text"
                                    value={formData.targetValue}
                                    onChange={(e) => {
                                        const formatted = currencyMask(e.target.value);
                                        setFormData({ ...formData, targetValue: formatted, target: formatted });
                                    }}
                                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.target ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="R$ 0,00"
                                />
                            ) : (
                                <input
                                    type="number"
                                    value={formData.target}
                                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.target ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="10"
                                    min="1"
                                />
                            )}
                            {errors.target && (
                                <p className="text-red-500 text-sm mt-1">{errors.target}</p>
                            )}
                        </div>
                    </div>

                    {/* Período */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Período da Meta
                        </label>
                        <select
                            value={formData.target_period}
                            onChange={(e) => setFormData({ ...formData, target_period: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="semana">Semana</option>
                            <option value="mes">Mês</option>
                            <option value="trimestre">Trimestre</option>
                            <option value="ano">Ano</option>
                        </select>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição (Opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Adicione detalhes sobre esta meta..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Criando...' : 'Criar Meta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGoalModal;
