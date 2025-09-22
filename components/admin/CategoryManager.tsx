import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Categoria {
    id: string;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    is_ativo: boolean;
    created_at: string;
    updated_at: string;
}

interface CategoryManagerProps {
    selectedCategoryId?: string;
    onCategorySelect: (categoryId: string) => void;
    onNewCategory?: (category: Categoria) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
    selectedCategoryId,
    onCategorySelect,
    onNewCategory
}) => {
    const [categories, setCategories] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
    const [newCategory, setNewCategory] = useState({
        nome: '',
        descricao: '',
        cor: '#3B82F6',
        icone: 'Package'
    });

    const cores = [
        '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
        '#EF4444', '#EC4899', '#06B6D4', '#6B7280'
    ];

    const icones = [
        'Package', 'Smartphone', 'Plane', 'CreditCard', 
        'Home', 'Dumbbell', 'Heart', 'BookOpen', 'Gift'
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias_premios')
                .select('*')
                .eq('is_ativo', true)
                .order('nome');

            if (error) {
                return;
            }

            setCategories(data || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.nome.trim()) return;

        try {
            const { data, error } = await supabase
                .from('categorias_premios')
                .insert([{
                    nome: newCategory.nome,
                    descricao: newCategory.descricao,
                    cor: newCategory.cor,
                    icone: newCategory.icone
                }])
                .select()
                .single();

            if (error) {
                return;
            }

            setCategories(prev => [...prev, data]);
            setNewCategory({ nome: '', descricao: '', cor: '#3B82F6', icone: 'Package' });
            setShowNewForm(false);
            
            if (onNewCategory) {
                onNewCategory(data);
            }
        } catch (error) {
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;

        try {
            const { error } = await supabase
                .from('categorias_premios')
                .update({
                    nome: editingCategory.nome,
                    descricao: editingCategory.descricao,
                    cor: editingCategory.cor,
                    icone: editingCategory.icone
                })
                .eq('id', editingCategory.id);

            if (error) {
                return;
            }

            setCategories(prev => 
                prev.map(cat => 
                    cat.id === editingCategory.id ? editingCategory : cat
                )
            );
            setEditingCategory(null);
        } catch (error) {
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

        try {
            const { error } = await supabase
                .from('categorias_premios')
                .update({ is_ativo: false })
                .eq('id', id);

            if (error) {
                return;
            }

            setCategories(prev => prev.filter(cat => cat.id !== id));
        } catch (error) {
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Carregando categorias...</div>;
    }

    return (
        <div className="space-y-2">
            {/* Lista de categorias */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedCategoryId === category.id
                                ? 'bg-blue-100 border border-blue-300'
                                : 'hover:bg-gray-100'
                        }`}
                        onClick={() => onCategorySelect(category.id)}
                    >
                        <div className="flex items-center space-x-2">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.cor }}
                            />
                            <span className="text-sm font-medium">{category.nome}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCategory(category);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Editar"
                            >
                                <Edit className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Excluir"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botão para nova categoria */}
            {!showNewForm && (
                <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nova Categoria</span>
                </button>
            )}

            {/* Formulário para nova categoria */}
            {showNewForm && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                    <div>
                        <input
                            type="text"
                            placeholder="Nome da categoria"
                            value={newCategory.nome}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Descrição (opcional)"
                            value={newCategory.descricao}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, descricao: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                            {cores.map((cor) => (
                                <button
                                    key={cor}
                                    onClick={() => setNewCategory(prev => ({ ...prev, cor }))}
                                    className={`w-6 h-6 rounded-full border-2 ${
                                        newCategory.cor === cor ? 'border-gray-400' : 'border-gray-200'
                                    }`}
                                    style={{ backgroundColor: cor }}
                                />
                            ))}
                        </div>
                        <select
                            value={newCategory.icone}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, icone: e.target.value }))}
                            className="text-xs border border-gray-300 rounded px-1 py-1"
                        >
                            {icones.map((icone) => (
                                <option key={icone} value={icone}>{icone}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleCreateCategory}
                            className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                            <Save className="w-3 h-3" />
                            <span>Salvar</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowNewForm(false);
                                setNewCategory({ nome: '', descricao: '', cor: '#3B82F6', icone: 'Package' });
                            }}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modal para editar categoria */}
            {editingCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-4 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Editar Categoria</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nome da categoria"
                                value={editingCategory.nome}
                                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, nome: e.target.value } : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="Descrição (opcional)"
                                value={editingCategory.descricao}
                                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-4">
                                <div className="flex space-x-1">
                                    {cores.map((cor) => (
                                        <button
                                            key={cor}
                                            onClick={() => setEditingCategory(prev => prev ? { ...prev, cor } : null)}
                                            className={`w-8 h-8 rounded-full border-2 ${
                                                editingCategory.cor === cor ? 'border-gray-400' : 'border-gray-200'
                                            }`}
                                            style={{ backgroundColor: cor }}
                                        />
                                    ))}
                                </div>
                                <select
                                    value={editingCategory.icone}
                                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, icone: e.target.value } : null)}
                                    className="border border-gray-300 rounded px-2 py-1"
                                >
                                    {icones.map((icone) => (
                                        <option key={icone} value={icone}>{icone}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => setEditingCategory(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateCategory}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;

