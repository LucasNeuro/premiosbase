
import React from 'react';
import { usePolicies } from '../../hooks/usePolicies';
import Card from '../ui/Card';

const PolicyHistory: React.FC = () => {
    const { policies } = usePolicies();
    
    const sortedPolicies = [...policies].sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

    return (
        <div className="card animate-fade-in">
            <div className="card-body">
                <h3 className="text-xl font-bold text-gradient mb-6">Histórico de Apólices</h3>
                <div className="overflow-x-auto">
                    {policies.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-lg font-semibold text-gray-900">Nenhuma apólice registrada</h3>
                            <p className="mt-1 text-gray-600">Comece registrando uma nova apólice ao lado.</p>
                        </div>

                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Nº da Apólice</th>
                                        <th>Tipo</th>
                                        <th className="text-right">Valor do Prêmio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPolicies.map((policy) => (
                                        <tr key={policy.id}>
                                            <td>{new Date(policy.registrationDate).toLocaleDateString('pt-BR')}</td>
                                            <td className="font-medium text-gray-900">{policy.policyNumber}</td>
                                            <td>
                                                <span className={`badge ${
                                                    policy.type === 'Seguro Auto' ? 'badge-info' : 'badge-success'
                                                }`}>
                                                    {policy.type}
                                                </span>
                                            </td>
                                            <td className="text-right font-semibold text-gradient">
                                                {policy.premiumValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PolicyHistory;
