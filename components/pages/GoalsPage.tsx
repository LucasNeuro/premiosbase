import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GoalsProvider } from '../../hooks/useGoals';
import { useAchievements } from '../../hooks/useAchievements';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import GoalsOverview from '../goals/GoalsOverview';
// import GoalsProgress from '../goals/GoalsProgress';
// import GoalsRanking from '../goals/GoalsRanking';
import GoalsAchievements from '../goals/GoalsAchievements';
import { Star, Award, TrendingUp, Target, Gift, Zap, Gem, Crown, Calendar } from 'lucide-react';

const GoalsPageContent: React.FC = () => {
    const { user } = useAuth();
    const { getUnlockedAchievements } = useAchievements();
    
    console.log('GoalsPage - User:', user);
    
    // Obter insígnias conquistadas
    const unlockedAchievements = getUnlockedAchievements();
    
    // Mapear ícones das insígnias
    const getAchievementIcon = (iconName: string) => {
        const iconMap: { [key: string]: React.ReactNode } = {
            'star': <Star className="w-6 h-6" />,
            'award': <Award className="w-6 h-6" />,
            'trending-up': <TrendingUp className="w-6 h-6" />,
            'target': <Target className="w-6 h-6" />,
            'gift': <Award className="w-6 h-6" />,
            'zap': <Zap className="w-6 h-6" />,
            'gem': <Gem className="w-6 h-6" />,
            'crown': <Crown className="w-6 h-6" />,
            'calendar': <Calendar className="w-6 h-6" />
        };
        return iconMap[iconName] || <Star className="w-6 h-6" />;
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <Header />
            <main className="main-content">
                <div className="space-y-6">
                    {/* Header da Página */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Metas & Gamificação</h1>
                            <p className="text-gray-600 mt-2">Acompanhe seu progresso e conquiste suas metas</p>
                        </div>
                        
                        {/* Insígnias Conquistadas */}
                        {unlockedAchievements.length > 0 ? (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Insígnias Conquistadas</p>
                                    <p className="text-2xl font-bold text-yellow-600">{unlockedAchievements.length}</p>
                                </div>
                                <div className="flex gap-2">
                                    {unlockedAchievements.slice(0, 3).map((achievement) => (
                                        <div key={achievement.id} className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                                            <div className="text-white">
                                                {getAchievementIcon(achievement.icon_name)}
                                            </div>
                                        </div>
                                    ))}
                                    {unlockedAchievements.length > 3 && (
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white text-sm font-bold">+{unlockedAchievements.length - 3}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Insígnias Conquistadas</p>
                                    <p className="text-2xl font-bold text-gray-400">0</p>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-2xl text-gray-500">🏆</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Seção Principal */}
                    <GoalsOverview />
                    
                    {/* Grid de Componentes */}
                    {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GoalsProgress />
                        <GoalsRanking />
                    </div> */}
                    
                    {/* Conquistas */}
                    <GoalsAchievements />
                </div>
            </main>
        </div>
    );
};

const GoalsPage: React.FC = () => {
    const { user } = useAuth();
    
    if (!user) {
        return <div>Carregando...</div>;
    }
    
    return (
        <GoalsProvider userId={user.id || user.email}>
            <GoalsPageContent />
        </GoalsProvider>
    );
};

export default GoalsPage;
