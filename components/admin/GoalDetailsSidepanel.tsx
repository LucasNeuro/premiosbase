import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Target, User, Calendar, TrendingUp, Award, Edit, Trash2, DollarSign, FileText } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import { currencyMask } from '../../utils/masks';

interface Goal {
    id: string;
    user_id: string;
    title: string;
    target: number;
    current_value: number;
    unit: string;
    period: string;
    type: string;
    status: string;
    target_period: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    description?: string;
    user_name: string;
    user_email: string;
    // Campos para campanhas compostas
    campaign_type?: 'simple' | 'composite';
    criteria?: any[];
    start_date?: string;
    end_date?: string;
    // Prêmios associados
    campanhas_premios?: Array<{
        id: string;
        quantidade: number;
        entregue: boolean;
        premio: {
            id: string;
            nome: string;
            valor_estimado: number;
            imagem_miniatura_url?: string;
            categoria: { nome: string };
            tipo: { nome: string };
        };
    }>;
}

interface GoalDetailsSidepanelProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    onGoalUpdated: () => void;
}

const GoalDetailsSidepanel: React.FC<GoalDetailsSidepanelProps> = ({ 
    isOpen, 
    onClose, 
    goal, 
    onGoalUpdated 
}) => {
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && goal) {
            fetchGoalPolicies();
        }
    }, [isOpen, goal]);

    const fetchGoalPolicies = async () => {
        if (!goal) return;

        try {
            // Buscar apólices do período da campanha
            let query = supabase
                .from('policies')
                .select('*')
                .gte('registration_date', goal.start_date)
                .lte('registration_date', goal.end_date)
                .order('registration_date', { ascending: false });

            // Para campanhas de grupo (user_id null), buscar todas as apólices do período
            // Para campanhas individuais, filtrar por user_id
            if (goal.user_id) {
                query = query.eq('user_id', goal.user_id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching policies:', error);
                return;
            }

            setPolicies(data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
        }
    };

    const handleDelete = async () => {
        if (!goal) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('goals')
                .update({ is_active: false })
                .eq('id', goal.id);

            if (error) {
                console.error('Error deleting goal:', error);
                alert('Erro ao excluir meta: ' + error.message);
                return;
            }

            onGoalUpdated();
            onClose();
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Erro ao excluir meta');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    const formatCurrency = (value: number) => {
        return currencyMask(value.toString());
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatProgress = (current: number, target: number) => {
        const percentage = target > 0 ? (current / target) * 100 : 0;
        return Math.min(percentage, 100);
    };

    const getPeriodLabel = (period: string) => {
        const labels = {
            'semana': 'Semana',
            'mes': 'Mês',
            'trimestre': 'Trimestre',
            'ano': 'Ano'
        };
        return labels[period as keyof typeof labels] || period;
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            'apolices': 'Apólices',
            'valor': 'Valor',
            'crescimento': 'Crescimento'
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getStatusConfig = (status: string) => {
        const configs = {
            'active': { label: 'Ativa', class: 'bg-green-100 text-green-800' },
            'completed': { label: 'Concluída', class: 'bg-blue-100 text-blue-800' },
            'pending': { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' }
        };
        return configs[status as keyof typeof configs] || { label: status, class: 'bg-gray-100 text-gray-800' };
    };

    if (!isOpen || !goal) return null;

    const progress = formatProgress(goal.current_value, goal.target);
    const statusConfig = getStatusConfig(goal.status);

    return (
        <>
            {/* Sidepanel */}
            <div className="fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
                
                <div className="absolute right-0 top-0 h-screen w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">Detalhes da Meta</h3>
                            <p className="text-sm text-gray-600 mt-1">Informações completas</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
                        {/* Prêmio da Campanha - NOVO: No topo como produto */}
                        {goal.campanhas_premios && goal.campanhas_premios.length > 0 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <Award className="w-6 h-6 text-yellow-600" />
                                    <h4 className="text-lg font-bold text-gray-900">🏆 Prêmio da Campanha</h4>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    {goal.campanhas_premios.map((campanhaPremio) => (
                                        <div key={campanhaPremio.id} className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                                            {campanhaPremio.premio.imagem_miniatura_url ? (
                                                <img
                                                    src={campanhaPremio.premio.imagem_miniatura_url}
                                                    alt={campanhaPremio.premio.nome}
                                                    className="w-16 h-16 object-cover rounded-lg shadow-md"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center shadow-md">
                                                    <Award className="w-8 h-8 text-yellow-600" />
                                                </div>
                                            )}
                                            
                                            <div className="flex-1">
                                                <h5 className="font-bold text-lg text-gray-900 mb-1">
                                                    {campanhaPremio.premio.nome}
                                                </h5>
                                                <div className="text-sm text-gray-600 mb-2">
                                                    {campanhaPremio.premio.categoria?.nome} • {campanhaPremio.premio.tipo?.nome}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-lg font-bold text-green-600">
                                                        R$ {campanhaPremio.premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Qtd: {campanhaPremio.quantidade}
                                                    </div>
                                                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        campanhaPremio.entregue 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {campanhaPremio.entregue ? '✅ Entregue' : '⏳ Pendente'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumo da Campanha */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="w-5 h-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <span className="text-gray-600">Tipo:</span>
                                    <span className="ml-2 font-medium">{getTypeLabel(goal.type)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Período:</span>
                                    <span className="ml-2 font-medium">{getPeriodLabel(goal.target_period)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.class}`}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Criada em:</span>
                                    <span className="ml-2 font-medium">{formatDate(goal.created_at)}</span>
                                </div>
                            </div>

                            {goal.description && (
                                <div className="pt-4 border-t border-gray-200">
                                    <span className="text-gray-600 text-sm font-medium">Descrição:</span>
                                    <p className="text-sm text-gray-800 mt-1">{goal.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Progresso
                            </h4>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {goal.type === 'valor' ? formatCurrency(goal.current_value) : goal.current_value.toLocaleString()}
                                    </span>
                                    <span className="text-gray-600">
                                        {goal.type === 'valor' ? formatCurrency(goal.target) : goal.target.toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-300 ${
                                            goal.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Progresso</span>
                                    <span className="font-medium text-gray-900">{progress.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Corretor Info */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Corretor
                            </h4>
                            
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Nome:</span>
                                    <span className="ml-2 font-medium">{goal.user_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Email:</span>
                                    <span className="ml-2 font-medium">{goal.user_email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Critérios da Campanha (se for composta) */}
                        {goal.campaign_type === 'composite' && goal.criteria && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Critérios da Campanha
                                </h4>
                                
                                <div className="space-y-3">
                                    {Array.isArray(goal.criteria) ? goal.criteria.map((criterio: any, index: number) => {
                                        const progress = ((criterio.current_value || 0) / (criterio.target_value || 1) * 100);
                                        const isCompleted = progress >= 100;
                                        
                                        return (
                                            <div key={index} className={`p-3 rounded-lg border ${
                                                isCompleted 
                                                    ? 'bg-green-50 border-green-200' 
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                                                            {criterio.policy_type || 'Tipo não definido'}
                                                            {isCompleted && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    ✓ Completo
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Meta: {criterio.target_type === 'value' 
                                                                ? formatCurrency(criterio.target_value || 0)
                                                                : `${criterio.target_value || 0} apólices`
                                                            }
                                                            {criterio.min_value_per_policy && criterio.min_value_per_policy > 0 && (
                                                                <span className="ml-2 text-blue-600">
                                                                    (mín. {formatCurrency(criterio.min_value_per_policy)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {criterio.target_type === 'value' 
                                                                ? formatCurrency(criterio.current_value || 0)
                                                                : `${criterio.current_value || 0} apólices`
                                                            }
                                                        </div>
                                                        <div className={`text-xs font-medium ${
                                                            isCompleted ? 'text-green-600' : 'text-gray-500'
                                                        }`}>
                                                            {progress.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Barra de progresso */}
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-300 ${
                                                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-gray-500 text-sm">Critérios não disponíveis</p>
                                    )}
                                </div>
                                
                                {/* Resumo dos critérios */}
                                {Array.isArray(goal.criteria) && goal.criteria.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                Critérios completos: {goal.criteria.filter((c: any) => 
                                                    ((c.current_value || 0) / (c.target_value || 1) * 100) >= 100
                                                ).length} / {goal.criteria.length}
                                            </span>
                                            <span className={`font-medium ${
                                                goal.criteria.every((c: any) => 
                                                    ((c.current_value || 0) / (c.target_value || 1) * 100) >= 100
                                                ) ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                                {goal.criteria.every((c: any) => 
                                                    ((c.current_value || 0) / (c.target_value || 1) * 100) >= 100
                                                ) ? 'Campanha Completa!' : 'Em Andamento'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Apólices da Campanha */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Apólices da Campanha
                            </h4>
                            
                            {policies.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Nenhuma apólice encontrada para este período</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Período: {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Resumo das apólices */}
                                    <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">{policies.length}</div>
                                            <div className="text-xs text-gray-600">Total de Apólices</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatCurrency(policies.reduce((sum, p) => sum + (p.premium_value || 0), 0))}
                                            </div>
                                            <div className="text-xs text-gray-600">Valor Total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-purple-600">
                                                {formatCurrency(policies.reduce((sum, p) => sum + (p.premium_value || 0), 0) / policies.length)}
                                            </div>
                                            <div className="text-xs text-gray-600">Valor Médio</div>
                                        </div>
                                    </div>
                                    
                                    {/* Lista de apólices */}
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {policies.map((policy) => (
                                            <div key={policy.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-gray-900">{policy.policy_number}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            policy.type === 'Seguro Auto' 
                                                                ? 'bg-blue-100 text-blue-800' 
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {policy.type}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            policy.contract_type === 'Novo' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-orange-100 text-orange-800'
                                                        }`}>
                                                            {policy.contract_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-sm text-gray-900">
                                                        {formatCurrency(policy.premium_value || 0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(policy.registration_date)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Ações</h4>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Meta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Excluir Meta"
                message={`Tem certeza que deseja excluir a meta "${goal.title}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                isLoading={loading}
            />
        </>
    );
};

export default GoalDetailsSidepanel;
