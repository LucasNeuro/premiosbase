import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Package, DollarSign, Tag, Image, FileText, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import AIDescriptionField from '../ui/AIDescriptionField';
import ModernSelect from '../ui/ModernSelect';
import DynamicSelect from '../ui/DynamicSelect';
import ImageUpload from '../ui/ImageUpload';
import { currencyMask, unmaskCurrency } from '../../utils/masks';

interface Prize {
    id: string;
    nome: string;
    descricao: string;
    valor_estimado: number;
    pontos_necessarios: number;
    categoria_id?: string;
    tipo_id?: string;
    imagem_url?: string;
    imagem_miniatura_url?: string;
    is_ativo: boolean;
}

interface PrizeSidepanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    prize?: Prize | null;
}

const PrizeSidepanel: React.FC<PrizeSidepanelProps> = ({
    isOpen,
    onClose,
    prize,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        valor_estimado: '',
        pontos_necessarios: '',
        categoria_id: '',
        tipo_id: '',
        imagem_url: '',
        imagem_miniatura_url: '',
        is_ativo: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchTypes();
            
            if (prize) {
                setFormData({
                    nome: prize.nome,
                    descricao: prize.descricao || '',
                    valor_estimado: prize.valor_estimado.toString(),
                    pontos_necessarios: prize.pontos_necessarios.toString(),
                    categoria_id: prize.categoria_id || '',
                    tipo_id: prize.tipo_id || '',
                    imagem_url: prize.imagem_url || '',
                    imagem_miniatura_url: prize.imagem_miniatura_url || '',
                    is_ativo: prize.is_ativo
                });
            } else {
                setFormData({
                    nome: '',
                    descricao: '',
                    valor_estimado: '',
                    pontos_necessarios: '',
                    categoria_id: '',
                    tipo_id: '',
                    imagem_url: '',
                    imagem_miniatura_url: '',
                    is_ativo: true
                });
            }
            setErrors({});
            setMessage(null);
        }
    }, [isOpen, prize]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias_premios')
                .select('id, nome, descricao')
                .eq('is_ativo', true)
                .order('nome');

            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar categorias:', err);
            // Fallback para dados mockados se a tabela não existir
            setCategories([
                { id: '1', nome: 'Bronze', descricao: 'Prêmios de menor valor' },
                { id: '2', nome: 'Prata', descricao: 'Prêmios de valor médio' },
                { id: '3', nome: 'Ouro', descricao: 'Prêmios de alto valor' },
                { id: '4', nome: 'Platina', descricao: 'Prêmios premium' }
            ]);
        }
    };

    const fetchTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('tipos_premios')
                .select('id, nome, descricao')
                .eq('is_ativo', true)
                .order('nome');

            if (error) throw error;
            setTypes(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar tipos:', err);
            // Fallback para dados mockados se a tabela não existir
            setTypes([
                { id: '1', nome: 'Eletrônicos', descricao: 'Dispositivos eletrônicos' },
                { id: '2', nome: 'Vale Presente', descricao: 'Vales para compras' },
                { id: '3', nome: 'Experiências', descricao: 'Viagens e passeios' },
                { id: '4', nome: 'Casa e Decoração', descricao: 'Itens para casa' }
            ]);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nome.trim()) {
            newErrors.nome = 'Nome é obrigatório';
        }

        if (!formData.descricao.trim()) {
            newErrors.descricao = 'Descrição é obrigatória';
        }

        if (!formData.valor_estimado || isNaN(Number(unmaskCurrency(formData.valor_estimado)))) {
            newErrors.valor_estimado = 'Valor estimado é obrigatório';
        }

        if (!formData.pontos_necessarios || isNaN(Number(formData.pontos_necessarios))) {
            newErrors.pontos_necessarios = 'Pontos necessários é obrigatório';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setMessage({ text: 'Por favor, corrija os erros no formulário', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const prizeData = {
                nome: formData.nome.trim(),
                descricao: formData.descricao.trim(),
                valor_estimado: Number(unmaskCurrency(formData.valor_estimado)),
                pontos_necessarios: Number(formData.pontos_necessarios),
                categoria_id: formData.categoria_id || null,
                tipo_id: formData.tipo_id || null,
                imagem_url: formData.imagem_url.trim() || null,
                imagem_miniatura_url: formData.imagem_miniatura_url.trim() || null,
                is_ativo: formData.is_ativo
            };

            if (prize) {
                // Editar prêmio existente
                const { error } = await supabase
                    .from('premios')
                    .update(prizeData)
                    .eq('id', prize.id);

                if (error) throw error;
                setMessage({ text: 'Prêmio atualizado com sucesso!', type: 'success' });
            } else {
                // Criar novo prêmio
                const { error } = await supabase
                    .from('premios')
                    .insert([prizeData]);

                if (error) throw error;
                setMessage({ text: 'Prêmio criado com sucesso!', type: 'success' });
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error('Erro ao salvar prêmio:', err);
            setMessage({ text: `Erro ao salvar prêmio: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDescriptionChange = (description: string) => {
        setFormData({ ...formData, descricao: description });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {prize ? 'Editar Prêmio' : 'Criar Novo Prêmio'}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {prize ? 'Atualize as informações do prêmio' : 'Preencha os dados do novo prêmio'}
                            </p>
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nome do Prêmio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do Prêmio *
                            </label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.nome ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: Smartphone Samsung Galaxy"
                            />
                            {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
                        </div>

                        {/* Descrição com IA */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição *
                            </label>
                            <AIDescriptionField
                                value={formData.descricao}
                                onChange={handleDescriptionChange}
                                goalType="premio"
                                goalTitle={formData.nome || ''}
                                target={formData.valor_estimado || 0}
                                period="prêmio"
                                placeholder="Descreva o prêmio em detalhes..."
                                rows={3}
                            />
                            {errors.descricao && <p className="text-red-500 text-sm mt-1">{errors.descricao}</p>}
                        </div>

                        {/* Valor e Pontos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valor Estimado *
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.valor_estimado}
                                        onChange={(e) => setFormData({ ...formData, valor_estimado: currencyMask(e.target.value) })}
                                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.valor_estimado ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="R$ 0,00"
                                    />
                                </div>
                                {errors.valor_estimado && <p className="text-red-500 text-sm mt-1">{errors.valor_estimado}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pontos Necessários *
                                </label>
                                <input
                                    type="number"
                                    value={formData.pontos_necessarios}
                                    onChange={(e) => setFormData({ ...formData, pontos_necessarios: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.pontos_necessarios ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="1000"
                                    min="0"
                                />
                                {errors.pontos_necessarios && <p className="text-red-500 text-sm mt-1">{errors.pontos_necessarios}</p>}
                            </div>
                        </div>

                        {/* Categoria e Tipo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoria
                                </label>
                                <DynamicSelect
                                    options={(categories || []).map(cat => ({
                                        value: cat.id,
                                        label: cat.nome,
                                        description: cat.descricao
                                    }))}
                                    value={formData.categoria_id}
                                    onChange={(value) => setFormData({ ...formData, categoria_id: value })}
                                    placeholder="Selecione uma categoria"
                                    tableName="categorias_premios"
                                    onNewItem={(item) => {
                                        setCategories([...(categories || []), item]);
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo
                                </label>
                                <DynamicSelect
                                    options={(types || []).map(type => ({
                                        value: type.id,
                                        label: type.nome,
                                        description: type.descricao
                                    }))}
                                    value={formData.tipo_id}
                                    onChange={(value) => setFormData({ ...formData, tipo_id: value })}
                                    placeholder="Selecione um tipo"
                                    tableName="tipos_premios"
                                    onNewItem={(item) => {
                                        setTypes([...(types || []), item]);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Upload de Imagem */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Imagem do Prêmio
                            </label>
                            <ImageUpload
                                value={formData.imagem_url}
                                onChange={(url) => setFormData({ ...formData, imagem_url: url, imagem_miniatura_url: url })}
                                placeholder="Arraste a imagem do prêmio aqui"
                                bucketName="premios-img"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_ativo}
                                    onChange={(e) => setFormData({ ...formData, is_ativo: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Prêmio ativo (disponível para resgate)
                                </span>
                            </label>
                        </div>

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
                                {loading ? 'Salvando...' : (prize ? 'Atualizar Prêmio' : 'Criar Prêmio')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PrizeSidepanel;
