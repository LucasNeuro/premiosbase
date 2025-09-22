import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Cpd {
    id: string;
    number: string;
    name: string;
    isActive: boolean;
}

export const useCpds = (userId: string | null) => {
    const [cpds, setCpds] = useState<Cpd[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCpds = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('users')
                .select('cpd, has_multiple_cpds')
                .eq('id', userId)
                .single();

            if (error) {
                throw error;
            }

            if (data?.cpd) {
                // Se cpd é uma string JSON, fazer parse
                let cpdData = data.cpd;
                if (typeof cpdData === 'string') {
                    try {
                        cpdData = JSON.parse(cpdData);
                    } catch (e) {
                        // Se não conseguir fazer parse, tratar como string simples (CPD único)
                        const simpleCpd = {
                            id: '1',
                            number: cpdData,
                            name: `CPD ${cpdData}`,
                            isActive: true
                        };
                        setCpds([simpleCpd]);
                        return;
                    }
                }

                if (cpdData && typeof cpdData === 'object' && cpdData.cpds && Array.isArray(cpdData.cpds)) {
                    // Filtrar apenas CPDs ativos
                    const activeCpds = cpdData.cpds.filter((cpd: Cpd) => cpd.isActive);
                    setCpds(activeCpds);
                } else {
                    setCpds([]);
                }
            } else {
                setCpds([]);
            }
        } catch (err) {
            console.error('Erro ao buscar CPDs:', err);
            setError('Erro ao carregar CPDs');
        } finally {
            setLoading(false);
        }
    };

    const addCpd = async (cpdNumber: string, cpdName: string) => {
        if (!userId) return false;

        setLoading(true);
        setError(null);

        try {
            const { data: currentUser, error: fetchError } = await supabase
                .from('users')
                .select('cpd')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            let currentCpds = currentUser?.cpd || { cpds: [] };
            
            // Verificar se CPD já existe
            const cpdExists = currentCpds.cpds?.some((cpd: Cpd) => cpd.number === cpdNumber);
            if (cpdExists) {
                setError('CPD já cadastrado');
                return false;
            }

            // Adicionar novo CPD
            const newCpd: Cpd = {
                id: crypto.randomUUID(),
                number: cpdNumber,
                name: cpdName || `CPD ${cpdNumber}`,
                isActive: true
            };

            const updatedCpds = {
                cpds: [...(currentCpds.cpds || []), newCpd]
            };

            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    cpd: updatedCpds,
                    has_multiple_cpds: updatedCpds.cpds.length > 1
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            setCpds(updatedCpds.cpds.filter((cpd: Cpd) => cpd.isActive));
            return true;
        } catch (err) {
            console.error('Erro ao adicionar CPD:', err);
            setError('Erro ao adicionar CPD');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const removeCpd = async (cpdId: string) => {
        if (!userId) return false;

        setLoading(true);
        setError(null);

        try {
            const { data: currentUser, error: fetchError } = await supabase
                .from('users')
                .select('cpd')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            let currentCpds = currentUser?.cpd || { cpds: [] };
            
            // Remover CPD
            const updatedCpds = {
                cpds: currentCpds.cpds?.filter((cpd: Cpd) => cpd.id !== cpdId) || []
            };

            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    cpd: updatedCpds,
                    has_multiple_cpds: updatedCpds.cpds.length > 1
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            setCpds(updatedCpds.cpds.filter((cpd: Cpd) => cpd.isActive));
            return true;
        } catch (err) {
            console.error('Erro ao remover CPD:', err);
            setError('Erro ao remover CPD');
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCpds();
    }, [userId]);

    return {
        cpds,
        loading,
        error,
        addCpd,
        removeCpd,
        refetch: fetchCpds
    };
};
