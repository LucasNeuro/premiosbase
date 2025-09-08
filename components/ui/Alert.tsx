
import React from 'react';

interface AlertProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type, onClose }) => {
    const baseClasses = "flex items-center p-4 mb-4 text-sm rounded-lg";
    const typeClasses = {
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
        info: "bg-sky-100 text-sky-800",
    };

    const Icon = () => {
        if (type === 'success') return (
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
        );
        if (type === 'error') return (
             <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
        );
        return (
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
        );
    }
    
    if (!message) return null;

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            <Icon />
            <div>
                <span className="font-medium">{message}</span>
            </div>
            {onClose && (
                <button type="button" className="ml-auto -mx-1.5 -my-1.5" onClick={onClose}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
            )}
        </div>
    );
};

export default Alert;
