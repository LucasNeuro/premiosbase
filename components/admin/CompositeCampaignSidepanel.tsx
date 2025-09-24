import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CampaignCriteria } from '../../hooks/useGoals';
import { User } from '../../types';
import { Plus, X, Car, Home, Target, DollarSign, Hash, Users, Package, Search, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import AIDescriptionField from '../ui/AIDescriptionField';
import { currencyMask, unmaskCurrency, currencyMaskCalculator, currencyMaskSimple, currencyMaskFree } from '../../utils/masks';
import { useCampaigns } from '../../hooks/useCampaigns';
import { usePremios, Premio } from '../../hooks/usePremios';
import PremioSelector from './PremioSelector';
import CategoryPreview from './CategoryPreview';

interface CompositeCampaignSidepanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CompositeCampaignSidepanel: React.FC<CompositeCampaignSidepanelProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess 
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);
    
    const [formData, setFormData] = useState({
        target_type: 'individual' as 'individual' | 'group',
        user_id: '',
        category_id: '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        criteria: [] as CampaignCriteria[]
    });

    const [maskedValues, setMaskedValues] = useState<Record<string, string>>({});
    const [selectedPremios, setSelectedPremios] = useState<Array<{premio: Premio, quantidade: number}>>([]);
    const [currentPremio, setCurrentPremio] = useState<Premio | null>(null);
    const [currentQuantidade, setCurrentQuantidade] = useState(1);

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchCategories();
            // Reset form when opening
            setFormData({
                target_type: 'individual',
                user_id: '',
                category_id: '',
                title: '',
                description: '',
                start_date: '',
                end_date: '',
                criteria: []
            });
            setErrors({});
            setMessage(null);
            setSelectedPremios([]);
            setCurrentPremio(null);
            setCurrentQuantidade(1);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            // Tentar buscar todos os usuários primeiro
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, phone, cnpj, cpd')
                .order('name');

            if (error) {
                // Se der erro, tentar sem filtros
                const { data: allData, error: allError } = await supabase
                    .from('users')
                    .select('id, name, email, phone, cnpj, cpd')
                    .order('name');
                
                if (allError) throw allError;
                setUsers(allData || []);
            } else {
                setUsers(data || []);
            }
        } catch (error) {
            setUsers([]);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias_corretores')
                .select('id, nome, descricao, cor, icone')
                .eq('is_ativo', true)
                .order('nome');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
        }
    };

    const addCriteria = () => {
        const newIndex = formData.criteria.length;
        setFormData({
            ...formData,
            criteria: [
                ...formData.criteria,
                {
                    policy_type: 'auto',
                    target: 0,
                    type: 'quantity',
                    min_value: 0,
                    contract_type: 'ambos'
                }
            ]
        });
        
        // Inicializar valores mascarados
        setMaskedValues(prev => ({
            ...prev,
            [`${newIndex}_target`]: '',
            [`${newIndex}_min_value`]: ''
        }));
    };

    const removeCriteria = (index: number) => {
        setFormData({
            ...formData,
            criteria: formData.criteria.filter((_, i) => i !== index)
        });
        
        // Limpar valores mascarados do critério removido
        setMaskedValues(prev => {
            const newMaskedValues = { ...prev };
            delete newMaskedValues[`${index}_target`];
            delete newMaskedValues[`${index}_min_value`];
            return newMaskedValues;
        });
    };

    const updateCriteria = (index: number, field: keyof CampaignCriteria, value: any) => {
        const newCriteria = [...formData.criteria];
        newCriteria[index] = { ...newCriteria[index], [field]: value };
        setFormData({ ...formData, criteria: newCriteria });
    };

    const handleCurrencyInput = (index: number, value: string) => {
        // Se o valor está vazio, permitir limpar
        if (value === '' || value === 'R$ ' || value === 'R$') {
            setMaskedValues(prev => ({
                ...prev,
                [`${index}_target`]: ''
            }));
            updateCriteria(index, 'target', 0);
            return;
        }
        
        // Aplicar a máscara LIVRE - deixa o usuário digitar como quiser
        const masked = currencyMaskFree(value);
        const unmasked = unmaskCurrency(value);
        
        // Atualizar o valor mascarado
        setMaskedValues(prev => ({
            ...prev,
            [`${index}_target`]: masked
        }));
        
        // Atualizar o valor numérico
        updateCriteria(index, 'target', unmasked);
    };

    const handleMinValueInput = (index: number, value: string) => {
        // Se o valor está vazio, permitir limpar
        if (value === '' || value === 'R$ ' || value === 'R$') {
            setMaskedValues(prev => ({
                ...prev,
                [`${index}_min_value`]: ''
            }));
            updateCriteria(index, 'min_value', 0);
            return;
        }
        
        // Aplicar a máscara LIVRE - deixa o usuário digitar como quiser
        const masked = currencyMaskFree(value);
        const unmasked = unmaskCurrency(value);
        
        // Atualizar o valor mascarado
        setMaskedValues(prev => ({
            ...prev,
            [`${index}_min_value`]: masked
        }));
        
        // Atualizar o valor numérico
        updateCriteria(index, 'min_value', unmasked);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (formData.target_type === 'individual' && !formData.user_id) {
            newErrors.user_id = 'Selecione um corretor';
        }
        if (formData.target_type === 'group' && !formData.category_id) {
            newErrors.category_id = 'Selecione uma categoria';
        }
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.start_date) newErrors.start_date = 'Data de início é obrigatória';
        if (!formData.end_date) newErrors.end_date = 'Data de fim é obrigatória';

        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = 'Data de fim deve ser posterior à data de início';
        }

        if (formData.criteria.length === 0) {
            newErrors.criteria = 'Adicione pelo menos um critério';
        }

        // Validar se há pelo menos um critério de valor
        const hasValueCriteria = formData.criteria.some(criteria => 
            criteria.min_value !== undefined && criteria.min_value !== null && criteria.min_value > 0
        );
        
        if (!hasValueCriteria) {
            newErrors.value_criteria = 'É obrigatório sempre colocar pelo menos uma meta de valor';
        }

        if (selectedPremios.length === 0) {
            newErrors.premio = 'Selecione pelo menos um prêmio para a campanha';
        }
        
        if (selectedPremios.length > 4) {
            newErrors.premio = 'Máximo de 4 prêmios por campanha';
        }
        
        formData.criteria.forEach((criteria, index) => {
            // Validar meta
            if (!criteria.target || isNaN(criteria.target) || criteria.target <= 0) {
                newErrors[`criteria_${index}_target`] = 'Meta deve ser um valor válido maior que zero';
            }

            // Validar valor mínimo se preenchido
            if (criteria.min_value !== undefined && criteria.min_value !== null) {
                if (isNaN(criteria.min_value) || criteria.min_value < 0) {
                    newErrors[`criteria_${index}_min_value`] = 'Valor mínimo deve ser um valor válido maior ou igual a zero';
                }
            }

            // Validações específicas por tipo
            if (criteria.type === 'value' && criteria.target > 1000000) {
                newErrors[`criteria_${index}_target`] = 'Meta de valor muito alta (máximo R$ 1.000.000)';
            }

            if (criteria.type === 'quantity' && criteria.target > 1000) {
                newErrors[`criteria_${index}_target`] = 'Meta de quantidade muito alta (máximo 1000 apólices)';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { createCampaign } = useCampaigns();
    const { vincularPremioCampanha } = usePremios();

    // Funções para gerenciar múltiplos prêmios
    const addPremio = (premio?: Premio, quantidade?: number) => {
        const premioToAdd = premio || currentPremio;
        const quantidadeToAdd = quantidade || currentQuantidade;
        
        console.log('🎁 addPremio chamado:', { premioToAdd, quantidadeToAdd, selectedPremios: selectedPremios.length });
        
        if (premioToAdd && quantidadeToAdd > 0) {
            // Verificar limite de 4 prêmios
            if (selectedPremios.length >= 4) {
                alert('Limite máximo de 4 prêmios por campanha!');
                return;
            }
            
            // Verificar se o prêmio já foi adicionado
            const alreadyExists = selectedPremios.some(p => p.premio.id === premioToAdd.id);
            if (!alreadyExists) {
                const newPremio = { premio: premioToAdd, quantidade: quantidadeToAdd };
                setSelectedPremios(prev => {
                    const updated = [...prev, newPremio];
                    console.log('🎁 Prêmio adicionado:', newPremio, 'Total:', updated.length);
                    return updated;
                });
                
                // Só limpar se não foi passado como parâmetro (modo tradicional)
                if (!premio) {
                    setCurrentPremio(null);
                    setCurrentQuantidade(1);
                }
            } else {
                alert('Este prêmio já foi adicionado à campanha!');
            }
        }
    };

    const removePremio = (premioId: string) => {
        setSelectedPremios(prev => prev.filter(p => p.premio.id !== premioId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Proteção contra duplo clique
        if (loading) {
            return;
        }

        if (!validateForm()) return;

        setLoading(true);
        try {
            // Preparar dados da campanha
            const campaignData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                start_date: formData.start_date,
                end_date: formData.end_date,
                target_type: formData.target_type,
                target_user_id: formData.target_type === 'individual' ? formData.user_id : undefined,
                target_category_id: formData.target_type === 'group' ? formData.category_id : undefined,
                criteria: formData.criteria.map(criterion => ({
                    policy_type: criterion.policy_type,
                    target_type: criterion.type,
                    target_value: criterion.target,
                    min_value_per_policy: criterion.min_value || 0,
                    contract_type: criterion.contract_type || 'ambos',
                    order_index: 0
                })),
                selectedPremios: selectedPremios.map(p => ({
                    premio: { id: p.premio.id, nome: p.premio.nome },
                    quantidade: p.quantidade
                }))
            };

            const createdCampaign = await createCampaign(campaignData);
            // Verificar se houve corretores que excederam o limite (apenas para campanhas de grupo)
            if (formData.target_type === 'group' && (createdCampaign as any)?.limitExceededInfo) {
                const limitInfo = (createdCampaign as any).limitExceededInfo;
                
                let alertMessage = `Campanha criada com sucesso! ${limitInfo.createdCount} campanhas individuais geradas.`;
                
                if (limitInfo.skippedCount > 0) {
                    alertMessage += `\n\n⚠️ ATENÇÃO: ${limitInfo.skippedCount} corretor(es) não receberam a campanha por exceder o limite de 4 campanhas simultâneas no período:\n\n`;
                    
                    limitInfo.skippedCorretores.forEach((corretor: any) => {
                        alertMessage += `• ${corretor.name} (${corretor.activeCampaigns}/4 campanhas ativas)\n`;
                    });
                    
                    alertMessage += `\nPara incluir estes corretores, finalize algumas campanhas existentes primeiro.`;
                }
                
                setMessage({ 
                    text: alertMessage, 
                    type: limitInfo.skippedCount > 0 ? 'warning' : 'success' 
                });
            }

            // Prêmios já foram vinculados dentro do createCampaign para campanhas de grupo
            // Para campanhas individuais, vincular aqui
            if (formData.target_type === 'individual' && selectedPremios.length > 0 && createdCampaign?.id) {
                for (const premioData of selectedPremios) {
                    await vincularPremioCampanha(createdCampaign.id, premioData.premio.id, premioData.quantidade);
                }
                }

            if (formData.target_type === 'individual') {
                setMessage({ text: 'Campanha individual criada com sucesso!', type: 'success' });
            } else {
                setMessage({ text: 'Campanha de grupo criada com sucesso!', type: 'success' });
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (error: any) {
            setMessage({ text: 'Erro ao criar campanha: ' + error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-4xl h-full overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Criar Campanha</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {message && (
                        <Alert 
                            message={message.text} 
                            type={message.type} 
                            onClose={() => setMessage(null)} 
                        />
                    )}

                    {/* Aviso sobre critérios de valor - NO TOPO */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                    <span className="text-amber-600 text-sm font-bold">!</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-amber-800 mb-1">⚠️ Obrigatório: Meta de Valor</h4>
                                <p className="text-sm text-amber-700">
                                    <strong>É obrigatório sempre colocar pelo menos uma meta de valor.</strong>
                                </p>
                                <div className="mt-2 text-xs text-amber-600">
                                    <strong>Exemplo:</strong> "Auto - Meta: R$ 500.000,00 com valor mínimo de R$ 3.000,00 por apólice"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Erro de validação para critérios de valor */}
                    {errors.value_criteria && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 text-xs font-bold">!</span>
                                </div>
                                <p className="text-red-700 text-sm font-medium">{errors.value_criteria}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tipo de Destino */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Destino da Campanha *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ 
                                        ...formData, 
                                        target_type: 'individual',
                                        user_id: '',
                                        category_id: ''
                                    })}
                                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                        formData.target_type === 'individual'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Users className="w-5 h-5" />
                                        <span className="font-medium text-sm">Individual</span>
                                        <span className="text-xs text-gray-500">Um corretor</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ 
                                        ...formData, 
                                        target_type: 'group',
                                        user_id: '',
                                        category_id: ''
                                    })}
                                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                        formData.target_type === 'group'
                                            ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Users className="w-5 h-5" />
                                        <span className="font-medium text-sm">Grupo</span>
                                        <span className="text-xs text-gray-500">Categoria</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Seleção de Corretor ou Categoria */}
                        {formData.target_type === 'individual' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Corretor *
                                </label>
                                <select
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Selecione um corretor</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                {errors.user_id && <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoria de Corretores *
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.nome}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                
                                {/* Preview dos corretores da categoria */}
                                <CategoryPreview 
                                    categoryId={formData.category_id} 
                                    isVisible={formData.target_type === 'group' && !!formData.category_id}
                                />
                            </div>
                        )}

                        {/* Título da Campanha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título da Campanha *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ex: Campanha Agosto 2025 - Auto + Residencial"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        {/* Período */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data de Início *
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data de Fim *
                                </label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                            </div>
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição
                            </label>
                            <AIDescriptionField
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                goalType="campanha composta"
                                goalTitle={formData.title}
                                placeholder="Descreva os detalhes da campanha composta..."
                                rows={3}
                            />
                        </div>

                        {/* Prêmio da Campanha */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Prêmios da Campanha
                            </h3>
                            <p className="text-sm text-blue-700 mb-4">
                                Selecione os prêmios que serão entregues aos corretores que atingirem os critérios desta campanha.
                            </p>
                            
                            {/* Indicador de Progresso */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-blue-900">Prêmios Selecionados</span>
                                    <span className="text-sm text-blue-700">{selectedPremios.length}/4</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(selectedPremios.length / 4) * 100}%` }}
                                    />
                                </div>
                            </div>
                            
                            {/* Seletor de Prêmio - Modo Carrinho de Compras */}
                            {selectedPremios.length < 4 ? (
                                <div className="space-y-3">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">Modo Carrinho de Compras</span>
                                        </div>
                                        <p className="text-xs text-blue-700">
                                            Clique diretamente no prêmio para adicioná-lo à campanha. Quantidade padrão: {currentQuantidade}
                                        </p>
                                    </div>
                                    
                                    <PremioSelector
                                        selectedPremioId={currentPremio?.id}
                                        onPremioSelect={setCurrentPremio}
                                        quantidade={currentQuantidade}
                                        onQuantidadeChange={setCurrentQuantidade}
                                        allowMultiple={true}
                                        selectedPremios={selectedPremios}
                                        onAddPremio={addPremio}
                                        maxPremios={4}
                                    />
                                    
                                    {/* Controles de Quantidade */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Quantidade padrão:</span>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentQuantidade(Math.max(1, currentQuantidade - 1))}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-12 text-center font-medium">{currentQuantidade}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentQuantidade(Math.min(100, currentQuantidade + 1))}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                                    <div className="text-green-800 font-medium mb-1">✅ Limite de prêmios atingido!</div>
                                    <div className="text-sm text-green-600">Você já selecionou 4 prêmios para esta campanha.</div>
                                </div>
                            )}
                            
                            {/* Lista de Prêmios Selecionados - Sempre visível */}
                            <div className="mt-4">
                                <h4 className="font-medium text-blue-900 mb-2">Prêmios Selecionados:</h4>
                                
                                {selectedPremios.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedPremios.map((premioData, index) => (
                                            <div key={premioData.premio.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{premioData.premio.nome}</div>
                                                    <div className="text-sm text-gray-600">
                                                        Quantidade: {premioData.quantidade} | 
                                                        Valor unitário: R$ {premioData.premio.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | 
                                                        <strong> Total: R$ {(premioData.premio.valor_estimado * premioData.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePremio(premioData.premio.id)}
                                                    className="ml-3 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {/* Total Geral */}
                                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                                            <div className="text-sm text-blue-800">
                                                <strong>Total Geral dos Prêmios:</strong> R$ {selectedPremios.reduce((total, premioData) => total + (premioData.premio.valor_estimado * premioData.quantidade), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                        <div className="text-gray-500 text-sm">
                                            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p className="font-medium">Nenhum prêmio selecionado</p>
                                            <p className="text-xs mt-1">Clique nos prêmios acima para adicioná-los à campanha</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {errors.premio && <p className="text-red-500 text-sm mt-2">{errors.premio}</p>}
                        </div>

                        {/* Critérios da Campanha */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-900 text-lg">Critérios da Campanha</h3>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            // Exemplo rápido: Bilhete Composto Auto + Residencial
                                            setFormData({
                                                ...formData,
                                                criteria: [
                                                    {
                                                        policy_type: 'auto',
                                                        target: 15,
                                                        type: 'quantity',
                                                        min_value: 3000
                                                    },
                                                    {
                                                        policy_type: 'residencial',
                                                        target: 50000,
                                                        type: 'value',
                                                        min_value: 2000
                                                    }
                                                ]
                                            });
                                            setMaskedValues({
                                                '0_target': '15',
                                                '0_min_value': 'R$ 3.000,00',
                                                '1_target': 'R$ 50.000,00',
                                                '1_min_value': 'R$ 2.000,00'
                                            });
                                        }}
                                        className="text-sm px-4 py-2"
                                    >
                                        Exemplo Rápido
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={addCriteria}
                                        className="flex items-center gap-2 px-4 py-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar Critério
                                    </Button>
                                </div>
                            </div>
                            

                            {formData.criteria.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Nenhum critério adicionado</p>
                                    <p className="text-sm">Clique em "Adicionar Critério" para começar</p>
                                </div>
                            )}

                            {formData.criteria.map((criteria, index) => (
                                <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                            {criteria.policy_type === 'auto' ? (
                                                <Car className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Home className="w-5 h-5 text-green-600" />
                                            )}
                                            Critério {index + 1} - {criteria.policy_type === 'auto' ? 'Automóvel' : 'Residencial'}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => removeCriteria(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Apólice
                                            </label>
                                            <select
                                                value={criteria.policy_type}
                                                onChange={(e) => updateCriteria(index, 'policy_type', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="auto">Automóvel</option>
                                                <option value="residencial">Residencial</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Meta
                                            </label>
                                            <select
                                                value={criteria.type}
                                                onChange={(e) => updateCriteria(index, 'type', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="quantity">Quantidade</option>
                                                <option value="value">Valor</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                {criteria.type === 'value' ? (
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Hash className="w-4 h-4 text-blue-600" />
                                                )}
                                                Meta *
                                            </label>
                                            <input
                                                type="text"
                                                value={criteria.type === 'value' 
                                                    ? (maskedValues[`${index}_target`] || '') 
                                                    : (isNaN(criteria.target) ? '' : criteria.target.toString())
                                                }
                                                onChange={(e) => {
                                                    if (criteria.type === 'value') {
                                                        handleCurrencyInput(index, e.target.value);
                                                    } else {
                                                        const inputValue = e.target.value;
                                                        // Permitir apenas números
                                                        const cleanValue = inputValue.replace(/\D/g, '');
                                                        const numValue = cleanValue === '' ? 0 : Number(cleanValue);
                                                        const validValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
                                                        updateCriteria(index, 'target', validValue);
                                                    }
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={criteria.type === 'value' ? 'R$ 50.000,00' : '10'}
                                            />
                                            {errors[`criteria_${index}_target`] && (
                                                <p className="text-red-500 text-sm mt-1">{errors[`criteria_${index}_target`]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-orange-600" />
                                                Valor Mínimo
                                            </label>
                                            <input
                                                type="text"
                                                value={maskedValues[`${index}_min_value`] || ''}
                                                onChange={(e) => handleMinValueInput(index, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="R$ 2.000,00"
                                            />
                                            {errors[`criteria_${index}_min_value`] && (
                                                <p className="text-red-500 text-sm mt-1">{errors[`criteria_${index}_min_value`]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-purple-600" />
                                                Tipo de Contrato
                                            </label>
                                            <select
                                                value={criteria.contract_type || 'ambos'}
                                                onChange={(e) => updateCriteria(index, 'contract_type', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="novo">Apenas Novas</option>
                                                <option value="renovacao_bradesco">Renovação Bradesco</option>
                                                <option value="ambos">Ambos</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {errors.criteria && <p className="text-red-500 text-sm">{errors.criteria}</p>}
                        </div>

                        {/* Resumo */}
                        {formData.criteria.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    <strong>RESUMO DA CAMPANHA</strong>
                                </h4>
                                <div className="text-sm text-blue-800 space-y-3">
                                    <div className="flex justify-between">
                                        <span><strong>Tipo de destino:</strong></span>
                                        <span className="font-semibold">
                                            {formData.target_type === 'individual' ? 'Individual' : 'Grupo'}
                                        </span>
                                    </div>
                                    {formData.target_type === 'group' && formData.category_id && (
                                        <div className="flex justify-between">
                                            <span><strong>Categoria:</strong></span>
                                            <span className="font-semibold">
                                                {categories.find(c => c.id === formData.category_id)?.nome}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                                        <div className="text-xs text-blue-600 font-medium mb-2">BILHETE COMPOSTO:</div>
                                        <div className="space-y-1">
                                            {formData.criteria.map((c, index) => {
                                                const target = isNaN(c.target) ? 0 : c.target;
                                                const minValue = isNaN(c.min_value) ? 0 : (c.min_value || 0);
                                                const policyType = c.policy_type === 'auto' ? 'Auto' : 'Residencial';
                                                
                                                return (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span className="text-blue-700">
                                                            {c.type === 'quantity' 
                                                                ? `${target} apólices ${policyType}`
                                                                : `R$ ${target.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${policyType}`
                                                            }
                                                        </span>
                                                        {minValue > 0 && (
                                                            <span className="text-green-600 font-medium text-xs">
                                                                ≥ R$ {minValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-blue-600 italic">
                                        💡 Para ganhar o prêmio, o corretor deve atingir TODOS os critérios acima
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botões */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Criando...' : 'Criar Campanha'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompositeCampaignSidepanel;
