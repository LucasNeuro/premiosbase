import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, Plus, Check, X } from 'lucide-react';

interface Tipo {
    id: string;
    nome: string;
    descricao: string;
    cor: string;
    icone: string;
    is_ativo: boolean;
}

interface SearchableTipoDropdownProps {
    selectedTipoId?: string;
    onTipoSelect: (tipoId: string) => void;
    onNewTipo?: (tipo: Tipo) => void;
}

const SearchableTipoDropdown: React.FC<SearchableTipoDropdownProps> = ({
    selectedTipoId,
    onTipoSelect,
    onNewTipo
}) => {
    const [tipos, setTipos] = useState<Tipo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTipo, setNewTipo] = useState({
        nome: ''
    });
    const [selectedTipo, setSelectedTipo] = useState<Tipo | null>(null);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTipos();
    }, []);

    useEffect(() => {
        if (selectedTipoId && tipos.length > 0) {
            const tipo = tipos.find(t => t.id === selectedTipoId);
            setSelectedTipo(tipo || null);
        }
    }, [selectedTipoId, tipos]);

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

    const fetchTipos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tipos_premios')
                .select('*')
                .eq('is_ativo', true)
                .order('nome');

            if (error) {
                return;
            }

            setTipos(data || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTipo = async () => {
        if (!newTipo.nome.trim()) {
            alert('Nome do tipo é obrigatório');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tipos_premios')
                .insert([{
                    nome: newTipo.nome.trim()
                }])
                .select()
                .single();

            if (error) {
                alert('Erro ao criar tipo: ' + error.message);
                return;
            }

            setTipos(prev => [...prev, data]);
            setSelectedTipo(data);
            onTipoSelect(data.id);
            setNewTipo({ nome: '' });
            setShowNewForm(false);
            setSearchTerm('');
            setIsOpen(false);
            
            if (onNewTipo) {
                onNewTipo(data);
            }
        } catch (error) {
            alert('Erro inesperado ao criar tipo');
        }
    };

    const filteredTipos = searchTerm 
        ? tipos.filter(tipo =>
            tipo.nome.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : tipos;

    const handleTipoClick = (tipo: Tipo) => {
        setSelectedTipo(tipo);
        onTipoSelect(tipo.id);
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
        
        // Se o usuário digitar algo que não existe, mostrar opção de criar novo
        if (value && !tipos.some(t => t.nome.toLowerCase().includes(value.toLowerCase()))) {
            setNewTipo(prev => ({ ...prev, nome: value }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchTerm && !filteredTipos.length) {
            // Se não encontrou tipo e pressionou Enter, criar novo
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
                        {selectedTipo ? (
                            <>
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedTipo.cor }}
                                />
                                <span className="text-sm">{selectedTipo.nome}</span>
                            </>
                        ) : (
                            <span className="text-gray-500 text-sm">Selecione um tipo...</span>
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
                            placeholder="Buscar tipo..."
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>

                    {/* Lista de tipos */}
                    <div className="max-h-40 overflow-y-auto">
                        {loading ? (
                            <div className="p-2 text-sm text-gray-500">Carregando tipos...</div>
                        ) : filteredTipos.length > 0 ? (
                            filteredTipos.map((tipo) => (
                                <div
                                    key={tipo.id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleTipoClick(tipo)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: tipo.cor }}
                                        />
                                        <span className="text-sm">{tipo.nome}</span>
                                    </div>
                                    {selectedTipoId === tipo.id && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                            ))
                        ) : searchTerm ? (
                            <div className="p-2 text-sm text-gray-500">
                                Nenhum tipo encontrado para "{searchTerm}"
                            </div>
                        ) : (
                            <div className="p-2 text-sm text-gray-500">
                                Nenhum tipo cadastrado
                            </div>
                        )}

                        {/* Opção para criar novo tipo */}
                        {searchTerm && !filteredTipos.length && (
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

                    {/* Formulário para novo tipo */}
                    {showNewForm && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Nome do tipo"
                                    value={newTipo.nome}
                                    onChange={(e) => setNewTipo(prev => ({ ...prev, nome: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleCreateTipo}
                                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        <Check className="w-3 h-3" />
                                        <span>Criar</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNewForm(false);
                                            setNewTipo({ nome: '' });
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

export default SearchableTipoDropdown;
