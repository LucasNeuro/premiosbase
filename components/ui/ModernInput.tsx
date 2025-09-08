import React, { useState } from 'react';

interface ModernInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  readOnly?: boolean;
}

const ModernInput: React.FC<ModernInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  className = '',
  readOnly = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.();
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`block w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            readOnly 
              ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
              : ''
          } ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
        />
        
        {/* Loading indicator for CNPJ validation - será controlado pelo componente pai */}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ModernInput;
