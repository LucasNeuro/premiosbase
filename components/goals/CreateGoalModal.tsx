import React, { useState } from 'react';
import { X, Target, TrendingUp, Award, Calendar, DollarSign, FileText } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';

interface CreateGoalModalProps {
    onClose: () => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ onClose }) => {
    const { addGoal } = useGoals();
    const [formData, setFormData] = useState({
        title: '',
        target: '',
        period: '',
        type: 'apolices' as 'apolices' | 'valor'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Função para formatar valor monetário
    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        return formattedValue;
    };

    // Função para formatar número de apólices
    const formatNumber = (value: string) => {
        return value.replace(/\D/g, '');
    };

    // Função para gerar período baseado na data selecionada
    const generatePeriod = (date: string) => {
        if (!date) return '';
        const selectedDate = new Date(date);
        const month = selectedDate.toLocaleDateString('pt-BR', { month: 'long' });
        const year = selectedDate.getFullYear();
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);

        if (!formData.title || !formData.target || !formData.period) {
            setMessage({ text: 'Todos os campos são obrigatórios.', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            // Converter valor para número baseado no tipo
            let targetValue: number;
            if (formData.type === 'valor') {
                // Remover formatação de moeda e converter para centavos
                const numericValue = formData.target.replace(/\D/g, '');
                targetValue = parseInt(numericValue) / 100;
            } else {
                // Para apólices, usar o valor direto
                targetValue = parseInt(formData.target.replace(/\D/g, ''));
            }

            const result = await addGoal({
                title: formData.title,
                target: targetValue,
                period: formData.period,
                type: formData.type
            });

            if (result.success) {
                setMessage({ text: result.message, type: 'success' });
                // Limpar formulário
                setFormData({
                    title: '',
                    target: '',
                    period: '',
                    type: 'apolices'
                });
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Erro ao criar meta', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'apolices': return <FileText className="w-5 h-5" />;
            case 'valor': return <DollarSign className="w-5 h-5" />;
            default: return <Target className="w-5 h-5" />;
        }
    };

    const getTypeDescription = (type: string) => {
        switch (type) {
            case 'apolices': return 'Número de apólices vendidas';
            case 'valor': return 'Valor total em reais';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Criar Nova Meta</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {message && (
                        <div className={`p-3 rounded-lg ${
                            message.type === 'success' 
                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título da Meta
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Apólices Mensais, Faturamento Trimestral"
                                className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <Target className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Meta
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'apolices', label: 'Apólices', icon: <FileText className="w-5 h-5" />, color: 'blue' },
                                { value: 'valor', label: 'Valor', icon: <DollarSign className="w-5 h-5" />, color: 'green' }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value as any })}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                        formData.type === type.value
                                            ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700 shadow-md`
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-full ${
                                            formData.type === type.value 
                                                ? `bg-${type.color}-100` 
                                                : 'bg-gray-100'
                                        }`}>
                                            {type.icon}
                                        </div>
                                        <span className="text-sm font-medium">{type.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <span>💡</span>
                            {getTypeDescription(formData.type)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta {formData.type === 'apolices' ? '(Número de Apólices)' : '(Valor em R$)'}
                        </label>
                        <div className="relative">
                            {formData.type === 'valor' ? (
                                <input
                                    type="text"
                                    value={formData.target}
                                    onChange={(e) => {
                                        const formatted = formatCurrency(e.target.value);
                                        setFormData({ ...formData, target: formatted });
                                    }}
                                    placeholder="R$ 0,00"
                                    className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={formData.target}
                                    onChange={(e) => {
                                        const formatted = formatNumber(e.target.value);
                                        setFormData({ ...formData, target: formatted });
                                    }}
                                    placeholder="0"
                                    className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            )}
                            {formData.type === 'valor' ? (
                                <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            ) : (
                                <FileText className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período da Meta
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'semana', label: 'Esta Semana', description: 'Meta para os próximos 7 dias' },
                                { value: 'mes', label: 'Este Mês', description: 'Meta para o mês atual' }
                            ].map((period) => (
                                <button
                                    key={period.value}
                                    type="button"
                                    onClick={() => {
                                        const today = new Date();
                                        let periodText = '';
                                        
                                        if (period.value === 'semana') {
                                            const weekStart = new Date(today);
                                            weekStart.setDate(today.getDate() - today.getDay());
                                            const weekEnd = new Date(weekStart);
                                            weekEnd.setDate(weekStart.getDate() + 6);
                                            periodText = `Semana de ${weekStart.getDate()}/${weekStart.getMonth() + 1} a ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
                                        } else {
                                            const month = today.toLocaleDateString('pt-BR', { month: 'long' });
                                            const year = today.getFullYear();
                                            periodText = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
                                        }
                                        
                                        setFormData({ ...formData, period: periodText });
                                    }}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                        formData.period && formData.period.includes(period.value === 'semana' ? 'Semana' : 'mês')
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-full ${
                                            formData.period && formData.period.includes(period.value === 'semana' ? 'Semana' : 'mês')
                                                ? 'bg-blue-100' 
                                                : 'bg-gray-100'
                                        }`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm font-medium block">{period.label}</span>
                                            <span className="text-xs text-gray-500">{period.description}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {formData.period && (
                            <p className="text-xs text-gray-500 mt-2">
                                Período selecionado: <span className="font-medium text-blue-600">{formData.period}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Criando...
                                </>
                            ) : (
                                'Criar Meta'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGoalModal;
