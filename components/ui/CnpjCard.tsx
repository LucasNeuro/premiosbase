import React from 'react';
import { Building2, MapPin, Phone, Mail, Calendar, DollarSign, Users, FileText } from 'lucide-react';

interface CnpjCardProps {
    data: any;
    onSelect: () => void;
    isLoading?: boolean;
}

export const CnpjCard: React.FC<CnpjCardProps> = ({ data, onSelect, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-white/20 rounded w-48"></div>
                    <div className="h-8 bg-white/20 rounded w-20"></div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/20 rounded w-full"></div>
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group" onClick={onSelect}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                            {data.company?.name || 'Nome não disponível'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            CNPJ: {data.taxId || 'N/A'}
                        </p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm font-medium">
                    Usar Dados
                </button>
            </div>

            {/* Nome Fantasia */}
            {data.alias && (
                <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">Nome Fantasia</p>
                    <p className="text-white font-medium">{data.alias}</p>
                </div>
            )}

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Endereço */}
                {data.address && (
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Endereço</p>
                            <p className="text-white text-sm">
                                {data.address.street}, {data.address.number}
                                {data.address.details && `, ${data.address.details}`}
                            </p>
                            <p className="text-gray-400 text-xs">
                                {data.address.district} - {data.address.city}/{data.address.state}
                            </p>
                            <p className="text-gray-400 text-xs">CEP: {data.address.zip}</p>
                        </div>
                    </div>
                )}

                {/* Contato */}
                <div className="space-y-3">
                    {data.phones && data.phones.length > 0 && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-400">Telefone</p>
                                <p className="text-white text-sm">
                                    ({data.phones[0].area}) {data.phones[0].number}
                                </p>
                            </div>
                        </div>
                    )}

                    {data.emails && data.emails.length > 0 && (
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-400">Email</p>
                                <p className="text-white text-sm">{data.emails[0].address}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Informações da Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Status */}
                {data.status && (
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <p className="text-white text-sm">{data.status.text}</p>
                        </div>
                    </div>
                )}

                {/* Porte */}
                {data.company?.size && (
                    <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Porte</p>
                            <p className="text-white text-sm">{data.company.size.text}</p>
                        </div>
                    </div>
                )}

                {/* Capital Social */}
                {data.company?.equity && (
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Capital Social</p>
                            <p className="text-white text-sm">{formatCurrency(data.company.equity)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Atividade Principal */}
            {data.mainActivity && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-400">Atividade Principal</p>
                    </div>
                    <p className="text-white text-sm bg-white/5 rounded-lg p-3">
                        {data.mainActivity.text}
                    </p>
                </div>
            )}

            {/* Data de Fundação */}
            {data.founded && (
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-sm text-gray-400">Fundada em</p>
                        <p className="text-white text-sm">{formatDate(data.founded)}</p>
                    </div>
                </div>
            )}

            {/* Atividades Secundárias */}
            {data.sideActivities && data.sideActivities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Atividades Secundárias</p>
                    <div className="flex flex-wrap gap-2">
                        {data.sideActivities.slice(0, 3).map((activity: any, index: number) => (
                            <span key={index} className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                {activity.text}
                            </span>
                        ))}
                        {data.sideActivities.length > 3 && (
                            <span className="text-xs text-gray-400">
                                +{data.sideActivities.length - 3} mais
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

