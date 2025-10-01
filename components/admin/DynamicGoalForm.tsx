import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Target, Calendar, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { currencyMask, unmaskCurrency } from '../../utils/masks';
import AIDescriptionField from '../ui/AIDescriptionField';

interface User {
    id: string;
    name: string;
    email: string;
}

interface DynamicGoalFormProps {
    goalType: string;
    onSuccess: () => void;
    onClose: () => void;
}

const DynamicGoalForm: React.FC<DynamicGoalFormProps> = ({ goalType, onSuccess, onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        title: '',
        target: '',
        targetValue: '',
        target_period: 'mes',
        start_date: '',
        end_date: '',
        description: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [userGoalsCount, setUserGoalsCount] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchUsers();
        fetchUserGoalsCount();
    }, []);

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

    const getGoalTypeConfig = () => {
        const configs = {
            valor: {
                name: 'Valor',
                icon: <DollarSign className="w-4 h-4" />,
                unit: 'reais',
                placeholder: 'R$ 0,00',
                description: 'Meta de faturamento em reais'
            },
            apolices: {
                name: 'Apólices',
                icon: <FileText className="w-4 h-4" />,
                unit: 'apólices',
                placeholder: '10',
                description: 'Meta de número de apólices'
            },
            crescimento: {
                name: 'Crescimento',
                icon: <TrendingUp className="w-4 h-4" />,
                unit: 'percentual',
                placeholder: '15',
                description: 'Meta de crescimento percentual'
            }
        };
        return configs[goalType as keyof typeof configs] || configs.valor;
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

        const targetValue = goalType === 'valor' ? unmaskCurrency(formData.targetValue) : Number(formData.target);
        if (!formData.target || targetValue <= 0) {
            newErrors.target = 'Meta deve ser maior que zero';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Data de início é obrigatória';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'Data de fim é obrigatória';
        }

        if (formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            
            if (endDate <= startDate) {
                newErrors.end_date = 'Data de fim deve ser posterior à data de início';
            }
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
            const config = getGoalTypeConfig();
            const targetValue = goalType === 'valor' ? unmaskCurrency(formData.targetValue) : Number(formData.target);
            
            const { error } = await supabase
                .from('goals')
                .insert({
                    user_id: formData.user_id,
                    title: formData.title.trim(),
                    target: targetValue,
                    current_value: 0,
                    unit: config.unit,
                    type: goalType,
                    status: 'active',
                    created_by: null, // Removido para evitar foreign key constraint error
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    is_active: true,
                    description: formData.description.trim()
                });

            if (error) {
                alert('Erro ao criar meta: ' + error.message);
                return;
            }

            // Só chama onSuccess se salvou com sucesso
            onSuccess();
        } catch (error) {
            alert('Erro ao criar meta');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Só fecha, não salva
        onClose();
    };

    const config = getGoalTypeConfig();

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder={`Ex: ${config.description.toLowerCase()}`}
                />
                {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
            </div>

            {/* Meta */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.icon}
                    <span className="ml-2">Meta ({config.name}) *</span>
                </label>
                {goalType === 'valor' ? (
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
                        placeholder={config.placeholder}
                    />
                ) : (
                    <input
                        type="number"
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.target ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={config.placeholder}
                        min="1"
                        step={goalType === 'crescimento' ? '0.1' : '1'}
                    />
                )}
                {errors.target && (
                    <p className="text-red-500 text-sm mt-1">{errors.target}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    {config.description}
                </p>
            </div>

            {/* Período por Datas */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Data de Início
                    </label>
                    <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.start_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.start_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Data de Fim
                    </label>
                    <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.end_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                    />
                    {errors.end_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
                    )}
                </div>
            </div>

            {/* Descrição com IA */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (Opcional)
                </label>
                <AIDescriptionField
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    goalType={goalType}
                    goalTitle={formData.title}
                    target={goalType === 'valor' ? unmaskCurrency(formData.targetValue) : Number(formData.target)}
                    period={formData.target_period}
                    placeholder="Adicione detalhes sobre esta meta..."
                    rows={3}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Salvando...' : 'Salvar Meta'}
                </button>
            </div>
        </form>
    );
};

export default DynamicGoalForm;
