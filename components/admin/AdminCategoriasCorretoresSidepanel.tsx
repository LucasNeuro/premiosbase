import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Users, Palette, Hash } from 'lucide-react';
import AIDescriptionField from '../ui/AIDescriptionField';

interface CategoriaCorretor {
    id: string;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    is_ativo: boolean;
    created_at: string;
    updated_at: string;
}

interface AdminCategoriasCorretoresSidepanelProps {
    categoria?: CategoriaCorretor | null;
    onClose: () => void;
    onSave: () => void;
}

const AdminCategoriasCorretoresSidepanel: React.FC<AdminCategoriasCorretoresSidepanelProps> = ({
    categoria,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        nome: categoria?.nome || '',
        descricao: categoria?.descricao || '',
        cor: categoria?.cor || '#3B82F6',
        icone: categoria?.icone || 'Users',
        is_ativo: categoria?.is_ativo ?? true
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.nome.trim()) {
            alert('Nome da categoria é obrigatório');
            return;
        }

        setLoading(true);

        try {
            const categoriaData = {
                nome: formData.nome.trim(),
                descricao: formData.descricao.trim(),
                cor: formData.cor,
                icone: formData.icone,
                is_ativo: formData.is_ativo,
                updated_at: new Date().toISOString()
            };

            if (categoria) {
                // Atualizar categoria existente
                const { error } = await supabase
                    .from('categorias_corretores')
                    .update(categoriaData)
                    .eq('id', categoria.id);

                if (error) {
                    console.error('Error updating categoria:', error);
                    alert('Erro ao atualizar categoria');
                    return;
                }
            } else {
                // Criar nova categoria
                const { error } = await supabase
                    .from('categorias_corretores')
                    .insert([categoriaData]);

                if (error) {
                    console.error('Error creating categoria:', error);
                    alert('Erro ao criar categoria');
                    return;
                }
            }

            onSave();
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao salvar categoria');
        } finally {
            setLoading(false);
        }
    };

    const coresDisponiveis = [
        { nome: 'Azul', valor: '#3B82F6' },
        { nome: 'Verde', valor: '#10B981' },
        { nome: 'Amarelo', valor: '#F59E0B' },
        { nome: 'Roxo', valor: '#8B5CF6' },
        { nome: 'Ciano', valor: '#06B6D4' },
        { nome: 'Vermelho', valor: '#EF4444' },
        { nome: 'Rosa', valor: '#EC4899' },
        { nome: 'Cinza', valor: '#6B7280' }
    ];

    const iconesDisponiveis = [
        { nome: 'Usuários', valor: 'Users' },
        { nome: 'Estrela', valor: 'Star' },
        { nome: 'Crown', valor: 'Crown' },
        { nome: 'Target', valor: 'Target' },
        { nome: 'TrendingUp', valor: 'TrendingUp' },
        { nome: 'MapPin', valor: 'MapPin' },
        { nome: 'Shield', valor: 'Shield' },
        { nome: 'Award', valor: 'Award' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {categoria ? 'Editar Categoria' : 'Nova Categoria'}
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
                    {/* Nome da Categoria */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome da Categoria *
                        </label>
                        <div className="relative">
                            <Hash className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Corretores Sênior"
                                required
                            />
                        </div>
                    </div>

                    {/* Descrição com IA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                        </label>
                        <AIDescriptionField
                            value={formData.descricao}
                            onChange={(value) => setFormData(prev => ({ ...prev, descricao: value }))}
                            goalType="categoria"
                            goalTitle={formData.nome}
                            target={0}
                            period=""
                            placeholder="Descreva a categoria de corretores..."
                            rows={3}
                        />
                    </div>

                    {/* Cor e Ícone */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Cor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cor
                            </label>
                            <div className="relative">
                                <Palette className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    name="cor"
                                    value={formData.cor}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {coresDisponiveis.map(cor => (
                                        <option key={cor.valor} value={cor.valor}>
                                            {cor.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div 
                                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                                    style={{ backgroundColor: formData.cor }}
                                ></div>
                                <span className="text-sm text-gray-500">{formData.cor}</span>
                            </div>
                        </div>

                        {/* Ícone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ícone
                            </label>
                            <div className="relative">
                                <Users className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    name="icone"
                                    value={formData.icone}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {iconesDisponiveis.map(icone => (
                                        <option key={icone.valor} value={icone.valor}>
                                            {icone.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_ativo"
                            name="is_ativo"
                            checked={formData.is_ativo}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_ativo" className="ml-3 block text-sm text-gray-700">
                            <span className="font-medium">Categoria Ativa</span>
                            <span className="block text-xs text-gray-500">
                                Categoria disponível para atribuição
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
                            {categoria ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCategoriasCorretoresSidepanel;

