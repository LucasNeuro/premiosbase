import React from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';

interface RankingItem {
    position: number;
    name: string;
    apolices: number;
    valor: number;
    level: string;
    isCurrentUser: boolean;
}

const GoalsRanking: React.FC = () => {
    const { stats } = useGoals();
    
    // Calcular nível baseado nas estatísticas reais
    const getUserLevel = (apolices: number, valor: number) => {
        if (apolices >= 50 && valor >= 500000) return 'Diamante';
        if (apolices >= 30 && valor >= 300000) return 'Ouro';
        if (apolices >= 15 && valor >= 150000) return 'Prata';
        return 'Bronze';
    };

    const userLevel = getUserLevel(stats.totalApolices, stats.totalValor);
    
    // Mostrar apenas o usuário atual com dados reais
    const currentUser: RankingItem = {
        position: 1, // Posição será calculada quando houver outros usuários
        name: 'Você',
        apolices: stats.totalApolices,
        valor: stats.totalValor,
        level: userLevel,
        isCurrentUser: true
    };

    const getPositionIcon = (position: number) => {
        switch (position) {
            case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
            case 2: return <Medal className="w-5 h-5 text-gray-300" />;
            case 3: return <Award className="w-5 h-5 text-amber-600" />;
            default: return <span className="w-5 h-5 flex items-center justify-center text-slate-400 font-bold">{position}</span>;
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Diamante': return 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white';
            case 'Ouro': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 'Prata': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800';
            case 'Bronze': return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
            default: return 'bg-slate-600 text-white';
        }
    };

    const getPositionColor = (position: number) => {
        if (position <= 3) return 'bg-slate-700 border-l-4 border-yellow-400';
        return 'bg-slate-800';
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Seu Desempenho
                </h3>
                <div className="text-sm text-slate-400">
                    Estatísticas Reais
                </div>
            </div>

            {/* Card do Usuário Atual */}
            <div className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl font-bold text-blue-400">
                                    {currentUser.name}
                                </span>
                                <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full">
                                    Seu Perfil
                                </span>
                            </div>
                            <div className="text-sm text-slate-300">
                                {currentUser.apolices} apólices • R$ {currentUser.valor.toLocaleString('pt-BR')}
                            </div>
                        </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${getLevelColor(currentUser.level)}`}>
                        {currentUser.level}
                    </div>
                </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total de Apólices</p>
                            <p className="text-xl font-bold text-white">{stats.totalApolices}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Valor Total</p>
                            <p className="text-xl font-bold text-white">R$ {stats.totalValor.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Medal className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Crescimento</p>
                            <p className="text-xl font-bold text-white">+{stats.monthlyGrowth}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Próximos Objetivos */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg">
                <h5 className="text-green-400 font-semibold mb-3">🎯 Próximos Objetivos</h5>
                <div className="space-y-2 text-sm">
                    {userLevel === 'Bronze' && (
                        <div className="flex justify-between">
                            <span className="text-slate-300">Para Prata:</span>
                            <span className="text-white font-semibold">{Math.max(0, 15 - stats.totalApolices)} apólices</span>
                        </div>
                    )}
                    {userLevel === 'Prata' && (
                        <div className="flex justify-between">
                            <span className="text-slate-300">Para Ouro:</span>
                            <span className="text-white font-semibold">{Math.max(0, 30 - stats.totalApolices)} apólices</span>
                        </div>
                    )}
                    {userLevel === 'Ouro' && (
                        <div className="flex justify-between">
                            <span className="text-slate-300">Para Diamante:</span>
                            <span className="text-white font-semibold">{Math.max(0, 50 - stats.totalApolices)} apólices</span>
                        </div>
                    )}
                    {userLevel === 'Diamante' && (
                        <div className="text-center text-green-400 font-semibold">
                            🏆 Nível Máximo Alcançado!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoalsRanking;
