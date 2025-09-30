import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DynamicSelectOption {
    value: string;
    label: string;
    description?: string;
}

interface DynamicSelectProps {
    options: DynamicSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
    tableName: string;
    onNewItem?: (item: DynamicSelectOption) => void;
}

const DynamicSelect: React.FC<DynamicSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Selecione uma opção",
    className = "",
    disabled = false,
    error,
    tableName,
    onNewItem
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewItemForm, setShowNewItemForm] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = (options || []).find(option => option && option.value === value);

    const filteredOptions = (options || []).filter(option => {
        if (!option || !option.label) return false;
        return option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                setShowNewItemForm(false);
                setNewItemName('');
                setNewItemDescription('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCreateNew = async () => {
        if (!newItemName.trim()) {
            alert('Nome é obrigatório');
            return;
        }

        setIsCreating(true);

        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert([{
                    nome: newItemName.trim(),
                    descricao: newItemDescription.trim() || null,
                    is_ativo: true
                }])
                .select()
                .single();

            if (error) throw error;

            const newOption = {
                value: data.id,
                label: data.nome,
                description: data.descricao
            };

            onChange(data.id);
            setIsOpen(false);
            setSearchTerm('');
            setShowNewItemForm(false);
            setNewItemName('');
            setNewItemDescription('');

            if (onNewItem) {
                onNewItem(newOption);
            }

        } catch (error: any) {
            console.error('Erro ao criar item:', error);
            alert('Erro ao criar item: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={selectRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full px-4 py-3 text-left bg-white border rounded-lg shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-all duration-200 ease-in-out
                    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
                    ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'hover:border-gray-400'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        {selectedOption ? (
                            <div>
                                <div className="font-medium text-gray-900 truncate">
                                    {selectedOption.label}
                                </div>
                                {selectedOption.description && (
                                    <div className="text-sm text-gray-500 truncate">
                                        {selectedOption.description}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-500">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`} 
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 && !showNewItemForm ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Nenhuma opção encontrada
                            </div>
                        ) : (
                            <>
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50
                                            transition-colors duration-150 ease-in-out
                                            ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {option.label}
                                                </div>
                                                {option.description && (
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
                                            {value === option.value && (
                                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                            )}
                                        </div>
                                    </button>
                                ))}

                                {/* Create New Item */}
                                {!showNewItemForm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewItemForm(true)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-150 ease-in-out text-blue-600 border-t border-gray-200"
                                    >
                                        <div className="flex items-center">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Criar novo {tableName === 'tipos_premios' ? 'tipo' : 'categoria'}
                                        </div>
                                    </button>
                                ) : (
                                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    placeholder="Digite o nome..."
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Descrição
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newItemDescription}
                                                    onChange={(e) => setNewItemDescription(e.target.value)}
                                                    placeholder="Digite a descrição..."
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCreateNew}
                                                    disabled={isCreating}
                                                    className="flex-1 bg-blue-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isCreating ? 'Criando...' : 'Criar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowNewItemForm(false);
                                                        setNewItemName('');
                                                        setNewItemDescription('');
                                                    }}
                                                    className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 text-sm rounded-md hover:bg-gray-400"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default DynamicSelect;
