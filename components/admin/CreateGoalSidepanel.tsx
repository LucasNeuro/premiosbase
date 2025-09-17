import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import GoalTypeSelector from './GoalTypeSelector';
import DynamicGoalForm from './DynamicGoalForm';

interface CreateGoalSidepanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateGoalSidepanel: React.FC<CreateGoalSidepanelProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess 
}) => {
    const [selectedType, setSelectedType] = useState<string>('');
    const [currentStep, setCurrentStep] = useState<'select' | 'form'>('select');

    const handleTypeSelect = (type: string) => {
        setSelectedType(type);
        setCurrentStep('form');
    };

    const handleBack = () => {
        setCurrentStep('select');
        setSelectedType('');
    };

    const handleClose = () => {
        setCurrentStep('select');
        setSelectedType('');
        onClose();
    };

    const handleSuccess = () => {
        setCurrentStep('select');
        setSelectedType('');
        onSuccess();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
            
            <div className="absolute right-0 top-0 h-screen w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {currentStep === 'form' && (
                            <button
                                onClick={handleBack}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                {currentStep === 'select' ? 'Criar Nova Meta' : 'Configurar Meta'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {currentStep === 'select' 
                                    ? 'Escolha o tipo de meta que deseja criar' 
                                    : `Configurando meta de ${selectedType === 'valor' ? 'valor' : selectedType === 'apolices' ? 'apólices' : 'crescimento'}`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-120px)]">
                    {currentStep === 'select' ? (
                        <GoalTypeSelector
                            selectedType={selectedType}
                            onTypeSelect={handleTypeSelect}
                        />
                    ) : (
                        <DynamicGoalForm
                            goalType={selectedType}
                            onSuccess={handleSuccess}
                            onClose={handleClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateGoalSidepanel;

