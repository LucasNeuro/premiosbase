import React from 'react';
import { useFormContext } from 'react-hook-form';
import InputMask from 'react-input-mask';

interface MaskedInputProps {
  name: string;
  label: string;
  mask: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onBlur?: () => void;
}

const MaskedInput: React.FC<MaskedInputProps> = ({
  name,
  label,
  mask,
  placeholder,
  required = false,
  className = '',
  onBlur
}) => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <InputMask
        mask={mask}
        placeholder={placeholder}
        onBlur={onBlur}
        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          errors[name] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...register(name, { required: required ? `${label} é obrigatório` : false })}
      >
        {(inputProps: any) => <input {...inputProps} type="text" id={name} />}
      </InputMask>
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message as string}</p>
      )}
    </div>
  );
};

export default MaskedInput;
