import React from 'react';
import { Goal } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { 
    Award, 
    Calendar, 
    Clock, 
    Gift, 
    Eye,
    CheckCircle
} from 'lucide-react';

interface CompletedCampaignsCardProps {
    campaign: Goal;
    onViewDetails: (campaign: Goal) => void;
}

const CompletedCampaignsCard: React.FC<CompletedCampaignsCardProps> = ({ 
    campaign, 
    onViewDetails 
}) => {
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const calculateDaysRemaining = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysRemaining = calculateDaysRemaining(campaign.end_date);
    const progressPercentage = Math.min((campaign.progress_percentage || 0), 100);
    
    // Cor base: #2b374a (azul escuro acinzentado)
    // Tom mais claro para semitom: #3a4a5f
    const baseColor = '#2b374a';
    const lighterTone = '#3a4a5f';

    return (
        <div 
            className="rounded-xl border border-gray-200 shadow-lg overflow-hidden"
            style={{ backgroundColor: baseColor }}
        >
            {/* Header com ícone e título */}
            <div className="p-6 border-b" style={{ borderColor: lighterTone }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Campanhas Concluídas</h3>
                </div>
                <p className="text-sm text-gray-300">Parabéns! Campanhas finalizadas com sucesso</p>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
                {/* Seção do Prêmio */}
                <div className="mb-6">
                    <div className="relative bg-gradient-to-r from-gray-100 to-white rounded-lg p-4 border border-gray-200">
                        {/* Indicador de posição */}
                        <div className="absolute top-2 right-2 text-xs text-gray-400">2/2</div>
                        
                        {/* Informações do prêmio */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-white">Cartão Presente R$ 500</h4>
                                <p className="text-sm text-gray-300">Qtd: 1 • R$ 500,00</p>
                            </div>
                            
                            {/* Imagem do cartão presente */}
                            <div className="relative">
                                <div className="w-16 h-10 bg-black rounded-lg flex items-center justify-center">
                                    <span className="text-yellow-400 font-bold text-sm">R$500</span>
                                </div>
                                {/* Fita dourada */}
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                        </div>
                        
                        {/* Indicadores de navegação */}
                        <div className="flex justify-center gap-1 mt-3">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <div className="w-2 h-2 bg-white border border-gray-300 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">Progresso da Campanha</span>
                        <span className="text-sm font-bold text-white bg-green-600 px-2 py-1 rounded">
                            {progressPercentage.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full rounded-full h-3" style={{ backgroundColor: lighterTone }}>
                        <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Informações de Data e Prêmios */}
                <div className="flex items-center justify-between text-sm mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{daysRemaining} dias restantes</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-400">
                        <Gift className="w-4 h-4" />
                        <span className="font-medium">
                            {campaign.campanhas_premios?.length || 0} prêmio(s)
                        </span>
                    </div>
                </div>

                {/* Botão de Detalhes */}
                <button
                    onClick={() => onViewDetails(campaign)}
                    className="w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    style={{ 
                        backgroundColor: lighterTone,
                        color: 'white'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4a5a6f';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = lighterTone;
                    }}
                >
                    <Eye className="w-4 h-4" />
                    Detalhes
                </button>
            </div>
        </div>
    );
};

export default CompletedCampaignsCard;
