import React from 'react';

interface ModernFormProps {
  subtitle?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

const ModernForm: React.FC<ModernFormProps> = ({
  subtitle,
  children,
  onSubmit,
  className = ''
}) => {
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {subtitle && (
            <p className="text-gray-600 text-lg">
              {subtitle}
            </p>
          )}
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          {children}
        </form>
      </div>
    </div>
  );
};

export default ModernForm;
