import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface ModernSelectOption {
    value: string;
    label: string;
    description?: string;
    email?: string;
}

interface ModernSelectProps {
    options: ModernSelectOption[];
  value: string;
    onChange: (value: string) => void;
  placeholder?: string;
    searchable?: boolean;
    className?: string;
    disabled?: boolean;
  error?: string;
}

const ModernSelect: React.FC<ModernSelectProps> = ({
    options,
  value,
  onChange,
    placeholder = "Selecione uma opção",
    searchable = false,
    className = "",
    disabled = false,
    error
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState<'down' | 'up'>('down');
    const selectRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);

    const filteredOptions = searchable 
        ? options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && dropdownRef.current && selectRef.current) {
            const selectRect = selectRef.current.getBoundingClientRect();
            const dropdownRect = dropdownRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // Verificar se há espaço suficiente abaixo
            const spaceBelow = viewportHeight - selectRect.bottom;
            const spaceAbove = selectRect.top;
            
            if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                setDropdownPosition('up');
            } else {
                setDropdownPosition('down');
            }
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
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
                                {selectedOption.email && (
                                    <div className="text-sm text-gray-400 truncate">
                                        {selectedOption.email}
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
                <div
                    ref={dropdownRef}
                    className={`
                        absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg
                        max-h-60 overflow-hidden
                        ${dropdownPosition === 'up' ? 'bottom-full mb-1' : 'top-full'}
                    `}
                >
                    {/* Search Input */}
                    {searchable && (
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
                    )}

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Nenhuma opção encontrada
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
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
                                            {option.email && (
                                                <div className="text-sm text-gray-400 truncate">
                                                    {option.email}
                                                </div>
                                            )}
                                        </div>
                                        {value === option.value && (
                                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                        )}
                                    </div>
                                </button>
                            ))
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

export default ModernSelect;
