import React, { useMemo } from 'react';
import { Star, Zap, Target, TrendingUp, Award, Gift, Gem, Crown, Calendar } from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements';

// Interface será importada do hook useAchievements

const GoalsAchievements: React.FC = () => {
    const { 
        achievements, 
        userAchievements, 
        userProgress, 
        stats, 
        loading, 
        error,
        isAchievementUnlocked,
        getAchievementProgress,
        getNextAchievements
    } = useAchievements();

    // Mapear ícones do Lucide React
    const getIcon = (iconName: string) => {
        const iconMap: { [key: string]: React.ReactNode } = {
            'star': <Star className="w-6 h-6" />,
            'award': <Award className="w-6 h-6" />,
            'trending-up': <TrendingUp className="w-6 h-6" />,
            'target': <Target className="w-6 h-6" />,
            'gift': <Gift className="w-6 h-6" />,
            'zap': <Zap className="w-6 h-6" />,
            'gem': <Gem className="w-6 h-6" />,
            'crown': <Crown className="w-6 h-6" />,
            'calendar': <Calendar className="w-6 h-6" />
        };
        return iconMap[iconName] || <Star className="w-6 h-6" />;
    };

    const getRarityColor = (rarity: string, unlocked: boolean) => {
        if (!unlocked) return 'border-gray-300 bg-gray-100';
        
        // Todos os cards desbloqueados usam cores neutras
        return 'border-gray-400 bg-white shadow-md';
    };

    const getRarityTextColor = (rarity: string, unlocked: boolean) => {
        if (!unlocked) return 'text-gray-400';
        
        // Cores neutras para melhor legibilidade
        return 'text-gray-600';
    };

    const getCategoryColor = (category: string) => {
        // Cores neutras para melhor legibilidade
        switch (category) {
            case 'vendas': return 'bg-gray-200 text-gray-700 border-gray-300';
            case 'crescimento': return 'bg-gray-200 text-gray-700 border-gray-300';
            case 'consistencia': return 'bg-gray-200 text-gray-700 border-gray-300';
            case 'especial': return 'bg-gray-200 text-gray-700 border-gray-300';
            default: return 'bg-gray-200 text-gray-700 border-gray-300';
        }
    };

    const unlockedCount = stats.unlockedAchievements;
    const totalCount = stats.totalAchievements;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Insígnias Automáticas</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Badges desbloqueados automaticamente baseados no seu desempenho real
                    </p>
                </div>
                <div className="text-sm text-gray-500">
                    {unlockedCount} de {totalCount} desbloqueadas
                </div>
            </div>

            {/* Informações sobre as Conquistas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm">ℹ️</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 mb-1">Sistema Automático de Insígnias</h3>
                        <p className="text-sm text-blue-700">
                            As insígnias são programadas automaticamente pelo sistema baseadas em critérios predefinidos. 
                            Cada badge é desbloqueado automaticamente quando você atinge o número de apólices ou valor de faturamento especificado. 
                            Não é necessário criar metas manualmente - o sistema monitora seu desempenho em tempo real.
                        </p>
                    </div>
                </div>
            </div>

            {/* Progresso Geral */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Progresso das Insígnias</h3>
                    <span className="text-2xl font-bold text-yellow-400">{unlockedCount}/{totalCount}</span>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                    <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-between text-sm text-slate-400">
                    <span>{((unlockedCount / totalCount) * 100).toFixed(1)}% das insígnias desbloqueadas</span>
                    <span>Baseado em dados reais de vendas</span>
                </div>
            </div>

            {/* Grid de Insígnias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Carregando insígnias...</p>
                    </div>
                ) : error ? (
                    <div className="col-span-full text-center py-8">
                        <p className="text-red-500">Erro ao carregar insígnias: {error}</p>
                    </div>
                ) : (
                    achievements.map((achievement) => {
                        const isUnlocked = isAchievementUnlocked(achievement.id);
                        const progress = getAchievementProgress(achievement.id);
                        const currentValue = progress?.current_value || 0;
                        const requiredValue = achievement.criteria_value;
                        const progressPercentage = Math.min((currentValue / requiredValue) * 100, 100);

                        return (
                            <div 
                                key={achievement.id}
                                className={`border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                                    isUnlocked 
                                        ? getRarityColor(achievement.rarity, true)
                                        : getRarityColor(achievement.rarity, false)
                                }`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    {/* Ícone com fundo circular */}
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                        isUnlocked 
                                            ? 'bg-gray-100 border-2 border-gray-300'
                                            : 'bg-gray-200 border-2 border-gray-300'
                                    }`}>
                                        <div className={getRarityTextColor(achievement.rarity, isUnlocked)}>
                                            {getIcon(achievement.icon_name)}
                                        </div>
                                    </div>
                                    
                                    {/* Título */}
                                    <h4 className={`font-bold text-lg mb-2 ${
                                        isUnlocked ? 'text-gray-800' : 'text-gray-500'
                                    }`}>
                                        {achievement.name}
                                    </h4>
                                    
                                    {/* Descrição */}
                                    <p className={`text-sm mb-4 ${
                                        isUnlocked ? 'text-gray-600' : 'text-gray-400'
                                    }`}>
                                        {achievement.description}
                                    </p>
                                    
                                    {/* Status */}
                                    <div className="mb-4">
                                        {isUnlocked ? (
                                            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-300">
                                                <span className="text-sm">✓</span>
                                                <span className="text-sm font-medium">Conquistada</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-3 py-1 rounded-full border border-gray-300">
                                                <span className="text-sm">🔒</span>
                                                <span className="text-sm font-medium">Bloqueada</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Categoria */}
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                                        isUnlocked 
                                            ? getCategoryColor(achievement.category)
                                            : 'bg-gray-100 text-gray-500 border-gray-300'
                                    }`}>
                                        {achievement.category}
                                    </div>
                                    
                                    {/* Barra de Progresso */}
                                    {!isUnlocked && (
                                        <div className="w-full mt-4">
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Progresso</span>
                                                <span>
                                                    {achievement.criteria_type === 'apolices' 
                                                        ? `${Math.floor(currentValue)} / ${requiredValue}`
                                                        : `R$ ${currentValue.toLocaleString('pt-BR')} / R$ ${requiredValue.toLocaleString('pt-BR')}`
                                                    }
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${progressPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Próximas Insígnias */}
            {getNextAchievements().length > 0 && (
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Target className="w-4 h-4 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Próximas Insígnias</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getNextAchievements(3).map((achievement) => {
                            const progress = getAchievementProgress(achievement.id);
                            const currentValue = progress?.current_value || 0;
                            const requiredValue = achievement.criteria_value;
                            const remaining = requiredValue - currentValue;

                            return (
                                <div key={achievement.id} className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                                            <div className="text-gray-600">
                                                {getIcon(achievement.icon_name)}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-gray-800 font-semibold text-sm">{achievement.name}</h4>
                                            <p className="text-gray-600 text-xs">{achievement.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                                            <span>Faltam</span>
                                            <span>
                                                {achievement.criteria_type === 'apolices' 
                                                    ? `${Math.ceil(remaining)} restantes`
                                                    : `R$ ${remaining.toLocaleString('pt-BR')} restantes`
                                                }
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                                                style={{ 
                                                    width: `${Math.min(
                                                        (currentValue / requiredValue) * 100, 
                                                        100
                                                    )}%` 
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsAchievements;
