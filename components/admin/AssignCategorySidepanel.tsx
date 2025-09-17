import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Users, Tag, CheckCircle } from 'lucide-react';

interface CategoriaCorretor {
    id: string;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    is_ativo: boolean;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface AssignCategorySidepanelProps {
    selectedUsers: User[];
    onClose: () => void;
    onSave: () => void;
}

const AssignCategorySidepanel: React.FC<AssignCategorySidepanelProps> = ({
    selectedUsers,
    onClose,
    onSave
}) => {
    const [categorias, setCategorias] = useState<CategoriaCorretor[]>([]);
    const [selectedCategoria, setSelectedCategoria] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias_corretores')
                .select('*')
                .eq('is_ativo', true)
                .order('nome');

            if (error) {
                console.error('Error fetching categorias:', error);
                return;
            }

            setCategorias(data || []);
        } catch (error) {
            console.error('Error fetching categorias:', error);
        }
    };

    const handleAssignCategory = async () => {
        if (!selectedCategoria) {
            alert('Selecione uma categoria');
            return;
        }

        setLoading(true);

        try {
            // Criar relacionamentos corretores_categorias
            const assignments = selectedUsers.map(user => ({
                corretor_id: user.id,
                categoria_id: selectedCategoria
            }));

            const { error } = await supabase
                .from('corretores_categorias')
                .insert(assignments);

            if (error) {
                console.error('Error assigning category:', error);
                alert('Erro ao atribuir categoria');
                return;
            }

            alert(`Categoria atribuída com sucesso para ${selectedUsers.length} corretor(es)!`);
            onSave();
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao atribuir categoria');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategoriaData = categorias.find(c => c.id === selectedCategoria);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Atribuir Categoria
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Corretores Selecionados */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-3">
                            Corretores Selecionados ({selectedUsers.length})
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                            <div className="space-y-2">
                                {selectedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold text-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Seleção de Categoria */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Selecione a Categoria *
                        </label>
                        <div className="space-y-3">
                            {categorias.map((categoria) => (
                                <div
                                    key={categoria.id}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedCategoria === categoria.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedCategoria(categoria.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="categoria"
                                            value={categoria.id}
                                            checked={selectedCategoria === categoria.id}
                                            onChange={() => setSelectedCategoria(categoria.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div 
                                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                                            style={{ backgroundColor: categoria.cor }}
                                        ></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{categoria.nome}</div>
                                            {categoria.descricao && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {categoria.descricao}
                                                </div>
                                            )}
                                        </div>
                                        {selectedCategoria === categoria.id && (
                                            <CheckCircle className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview da Atribuição */}
                    {selectedCategoriaData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Resumo da Atribuição</h4>
                            <div className="text-sm text-blue-700">
                                <p><strong>Categoria:</strong> {selectedCategoriaData.nome}</p>
                                <p><strong>Corretores:</strong> {selectedUsers.length} corretor(es)</p>
                                <p><strong>Descrição:</strong> {selectedCategoriaData.descricao || 'Sem descrição'}</p>
                            </div>
                        </div>
                    )}
                </div>

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
                            onClick={handleAssignCategory}
                            disabled={loading || !selectedCategoria}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Tag className="w-4 h-4" />
                            )}
                            Atribuir Categoria
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignCategorySidepanel;

