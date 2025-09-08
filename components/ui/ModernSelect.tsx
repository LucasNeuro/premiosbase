import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ModernSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const ModernSelect: React.FC<ModernSelectProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-2 ${className}`}
    >
      <motion.label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 transition-colors duration-200"
        animate={{
          color: isFocused ? '#ef4444' : '#374151'
        }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>
      
      <div className="relative">
        <motion.select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`block w-full px-4 py-4 pr-12 border-2 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-0 appearance-none cursor-pointer ${
            error 
              ? 'border-red-300 bg-red-50 focus:border-red-500' 
              : isFocused
                ? 'border-primary-500 bg-primary-50/30 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>
        
        {/* Custom dropdown arrow */}
        <motion.div
          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          animate={{ rotate: isFocused ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
        
        {/* Focus indicator */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1 : 0.95
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-2 border-primary-500/20"></div>
        </motion.div>
      </div>
      
      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModernSelect;
