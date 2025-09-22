import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AdminChartsService, PolicyDistributionData } from '../../../services/adminChartsService';

const PolicyDistributionChart: React.FC = () => {
    const [data, setData] = useState<PolicyDistributionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const chartData = await AdminChartsService.getPolicyDistributionData();
            setData(chartData);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Cores do sistema: azul (#1e293b) e verde (#49de80) com variações
    const COLORS = [
        '#1e293b', // Azul escuro principal
        '#49de80', // Verde principal
        '#334155', // Azul médio
        '#22c55e', // Verde médio
        '#475569', // Azul claro
        '#16a34a', // Verde escuro
    ];

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                    <p>Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                    <p>Nenhum dado disponível</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={40} // Donut com furo no meio
                        fill="#8884d8"
                        dataKey="count"
                        stroke="#fff"
                        strokeWidth={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                            `${value} apólices (${props.payload.percentage}%)`,
                            props.payload.type
                        ]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend 
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => (
                            <span style={{ color: '#374151', fontSize: '12px' }}>
                                {entry.payload.type} ({entry.payload.percentage}%)
                            </span>
                        )}
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PolicyDistributionChart;
