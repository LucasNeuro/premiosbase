import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, Plus, Check, X } from 'lucide-react';

interface Categoria {
    id: string;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    is_ativo: boolean;
}

interface SearchableCategoryDropdownProps {
    selectedCategoryId?: string;
    onCategorySelect: (categoryId: string) => void;
    onNewCategory?: (category: Categoria) => void;
}

const SearchableCategoryDropdown: React.FC<SearchableCategoryDropdownProps> = ({
    selectedCategoryId,
    onCategorySelect,
    onNewCategory
}) => {
    const [categories, setCategories] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const [newCategory, setNewCategory] = useState({
        nome: ''
    });
    const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategoryId && categories.length > 0) {
            const category = categories.find(cat => cat.id === selectedCategoryId);
            setSelectedCategory(category || null);
        }
    }, [selectedCategoryId, categories]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowNewForm(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
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
        if (!newCategory.nome.trim()) {
            alert('Nome da categoria é obrigatório');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('categorias_premios')
                .insert([{
                    nome: newCategory.nome.trim()
                }])
                .select()
                .single();

            if (error) {
                alert('Erro ao criar categoria: ' + error.message);
                return;
            }

            setCategories(prev => [...prev, data]);
            setSelectedCategory(data);
            onCategorySelect(data.id);
            setNewCategory({ nome: '' });
            setShowNewForm(false);
            setSearchTerm('');
            setIsOpen(false);
            
            if (onNewCategory) {
                onNewCategory(data);
            }
        } catch (error) {
            alert('Erro inesperado ao criar categoria');
        }
    };

    const filteredCategories = searchTerm 
        ? categories.filter(category =>
            category.nome.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : categories;

    const handleCategoryClick = (category: Categoria) => {
        setSelectedCategory(category);
        onCategorySelect(category.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setIsOpen(true);
        
        // Se o usuário digitar algo que não existe, mostrar opção de criar nova
        if (value && !categories.some(cat => cat.nome.toLowerCase().includes(value.toLowerCase()))) {
            setNewCategory(prev => ({ ...prev, nome: value }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchTerm && !filteredCategories.length) {
            // Se não encontrou categoria e pressionou Enter, criar nova
            setShowNewForm(true);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Input do dropdown */}
            <div
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
                onClick={handleInputFocus}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {selectedCategory ? (
                            <>
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedCategory.cor }}
                                />
                                <span className="text-sm">{selectedCategory.nome}</span>
                            </>
                        ) : (
                            <span className="text-gray-500 text-sm">Selecione uma categoria...</span>
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                    {/* Campo de busca */}
                    <div className="p-2 border-b border-gray-200">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar categoria..."
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>

                    {/* Lista de categorias */}
                    <div className="max-h-40 overflow-y-auto">
                        {loading ? (
                            <div className="p-2 text-sm text-gray-500">Carregando categorias...</div>
                        ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleCategoryClick(category)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: category.cor }}
                                        />
                                        <span className="text-sm">{category.nome}</span>
                                    </div>
                                    {selectedCategoryId === category.id && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                            ))
                        ) : searchTerm ? (
                            <div className="p-2 text-sm text-gray-500">
                                Nenhuma categoria encontrada para "{searchTerm}"
                            </div>
                        ) : (
                            <div className="p-2 text-sm text-gray-500">
                                Nenhuma categoria cadastrada
                            </div>
                        )}

                        {/* Opção para criar nova categoria */}
                        {searchTerm && !filteredCategories.length && (
                            <div className="border-t border-gray-200">
                                <button
                                    onClick={() => setShowNewForm(true)}
                                    className="w-full flex items-center space-x-2 p-2 text-sm text-blue-600 hover:bg-blue-50"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Criar "{searchTerm}"</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Formulário para nova categoria */}
                    {showNewForm && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Nome da categoria"
                                    value={newCategory.nome}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, nome: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleCreateCategory}
                                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        <Check className="w-3 h-3" />
                                        <span>Criar</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNewForm(false);
                                            setNewCategory({ nome: '' });
                                        }}
                                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                    >
                                        <X className="w-3 h-3" />
                                        <span>Cancelar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableCategoryDropdown;
