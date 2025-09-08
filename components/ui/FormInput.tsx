import React from 'react';
import { useFormContext } from 'react-hook-form';

interface FormInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  mask?: string;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  mask,
  className = ''
}) => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          errors[name] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...register(name, { required: required ? `${label} é obrigatório` : false })}
      />
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message as string}</p>
      )}
    </div>
  );
};

export default FormInput;
