
import React, { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    icon?: React.ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, id, error, icon, ...props }, ref) => {
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
                {label}
            </label>
            <div className="relative">
                {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>}
                <input
                    id={id}
                    ref={ref}
                    className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm transition duration-150 ease-in-out ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
