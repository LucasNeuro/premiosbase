import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange: (date: string | null) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Selecionar data",
  className = ""
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (date: string) => {
    onChange(date);
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange(null);
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDate();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
