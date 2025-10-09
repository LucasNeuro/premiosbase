import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../ui/Button';

interface PrizeGridProps {
    prizes: any[];
    onAddToCart: (prize: any) => void;
    isMultiPrizeCampaign: (campaignId: string) => boolean;
    hasPrizeFromCampaign: (campaignId: string) => boolean;
    loading?: boolean;
}

const PrizeGrid: React.FC<PrizeGridProps> = ({
    prizes,
    onAddToCart,
    isMultiPrizeCampaign,
    hasPrizeFromCampaign,
    loading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    // Obter categorias únicas
    const categories = ['all', ...Array.from(new Set(prizes.map(prize => prize.premio_categoria)))];

    // Filtrar e ordenar prêmios
    const filteredAndSortedPrizes = prizes
        .filter(prize => {
            const matchesSearch = prize.premio_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                prize.campaign_title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || prize.premio_categoria === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'value':
                    return b.premio_valor_estimado - a.premio_valor_estimado;
                case 'name':
                    return a.premio_nome.localeCompare(b.premio_nome);
                case 'campaign':
                    return a.campaign_title.localeCompare(b.campaign_title);
                default:
                    return 0;
            }
        });

    // Skeleton loading para grid
    const SkeletonCard = () => (
        <div className="bg-gray-200 rounded-xl shadow-lg animate-pulse">
            <div className="h-48 bg-gray-300 rounded-t-xl"></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
                    <div className="h-8 bg-gray-300 rounded w-24 animate-pulse"></div>
                </div>

                {/* Grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header com controles */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Prêmios Disponíveis</h3>
                    <p className="text-sm text-gray-600">
                        {filteredAndSortedPrizes.length} de {prizes.length} prêmios
                    </p>
                </div>

            </div>

            {/* Filtros e busca */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Busca - Azul funcional */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar prêmios ou campanhas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Filtro por categoria - Azul funcional */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all">Todas as categorias</option>
                    {categories.slice(1).map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>

                {/* Ordenação - Azul funcional */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="name">Ordenar por nome</option>
                    <option value="value">Ordenar por valor</option>
                    <option value="campaign">Ordenar por campanha</option>
                </select>
            </div>

            {/* Tabela moderna de prêmios */}
            {filteredAndSortedPrizes.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum prêmio encontrado
                    </h3>
                    <p className="text-gray-600">
                        {searchTerm || selectedCategory !== 'all' 
                            ? 'Tente ajustar os filtros de busca'
                            : 'Complete campanhas para conquistar prêmios'
                        }
                    </p>
                    {(searchTerm || selectedCategory !== 'all') && (
                        <Button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('all');
                            }}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Limpar filtros
                        </Button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Prêmio
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Campanha
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Categoria
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Quantidade
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ação
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredAndSortedPrizes.map((prize, index) => {
                                    const isDisabled = isMultiPrizeCampaign(prize.campaign_id) && hasPrizeFromCampaign(prize.campaign_id);
                                    
                                    return (
                                        <tr 
                                            key={prize.id} 
                                            className={`transition-all duration-200 hover:bg-gray-50 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                            }`}
                                        >
                                            {/* Coluna Prêmio */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                            <img
                                                                src={prize.premio_imagem_url}
                                                                alt={prize.premio_nome}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center hidden">
                                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {prize.premio_nome}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {prize.premio_tipo}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Coluna Campanha */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 max-w-xs truncate" title={prize.campaign_title}>
                                                    {prize.campaign_title}
                                                </div>
                                            </td>

                                            {/* Coluna Categoria */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {prize.premio_categoria}
                                                </span>
                                            </td>

                                            {/* Coluna Valor */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {new Intl.NumberFormat('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL'
                                                        }).format(prize.premio_valor_estimado)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Coluna Quantidade */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {prize.quantidade_conquistada}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Coluna Ação */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => !isDisabled && onAddToCart(prize)}
                                                    disabled={isDisabled}
                                                    className={`
                                                        inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg transition-all duration-200
                                                        ${isDisabled 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md transform hover:scale-105'
                                                        }
                                                    `}
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    {isDisabled ? 'Já Escolhido' : 'Adicionar'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrizeGrid;
