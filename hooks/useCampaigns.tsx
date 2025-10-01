import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { usePremios } from './usePremios';

export interface CampaignCriteria {
    id?: string;
    policy_type: 'auto' | 'residencial';
    target_type: 'quantity' | 'value';
    target_value: number;
    min_value_per_policy: number;
    contract_type?: 'novo' | 'renovacao_bradesco' | 'ambos';
    order_index: number;
}

export interface Campaign {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    campaign_type: 'simple' | 'composite';
    target_type: 'individual' | 'group';
    target_user_id?: string;
    target_category_id?: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Relacionamentos
    criteria?: CampaignCriteria[];
    target_user?: {
        id: string;
        name: string;
        email: string;
    };
    target_category?: {
        id: string;
        nome: string;
    };
    applications?: CampaignApplication[];
}

export interface CampaignApplication {
    id: string;
    campaign_id: string;
    user_id: string;
    applied_at: string;
    status: 'active' | 'completed' | 'cancelled';
    user?: {
        id: string;
        name: string;
        email: string;
    };
    progress?: CampaignProgress[];
}

export interface CampaignProgress {
    id: string;
    campaign_application_id: string;
    criteria_id: string;
    current_value: number;
    progress_percentage: number;
    last_updated: string;
    criteria?: CampaignCriteria;
}

export const useCampaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { vincularPremioCampanha } = usePremios();

    const fetchCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Buscando campanhas...');

            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('record_type', 'campaign')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Erro ao buscar campanhas:', error);
                throw error;
            }

            console.log('✅ Campanhas encontradas:', data?.length || 0);
            setCampaigns(data || []);
        } catch (err) {
            console.error('❌ Erro no fetchCampaigns:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
        } finally {
            setLoading(false);
        }
    }, []);

    const createCampaign = useCallback(async (campaignData: {
        title: string;
        description?: string;
        start_date: string;
        end_date: string;
        target_type: 'individual' | 'group';
        target_user_id?: string;
        target_category_id?: string;
        criteria: Omit<CampaignCriteria, 'id'>[];
        selectedPremios?: Array<{premio: {id: string; nome: string}, quantidade: number}>;
        // Fallback para compatibilidade
        selectedPremio?: {id: string; nome: string};
        premioQuantidade?: number;
    }) => {
        try {
            setLoading(true);
            setError(null);

            // Calcular target total baseado APENAS nos critérios de VALOR
            const totalTarget = campaignData.criteria.reduce((sum, criteria) => {
                // Só somar critérios de VALOR, não de QUANTIDADE
                if (criteria.target_type === 'value') {
                    return sum + (criteria.target_value || 0);
                }
                return sum; // Critérios de quantidade não são somados ao target total
            }, 0);
            // Para campanhas de GRUPO: criar campanhas individuais para cada corretor da categoria
            if (campaignData.target_type === 'group' && campaignData.target_category_id) {

                // Buscar todos os corretores da categoria
                const { data: corretoresCategoria, error: categoriaError } = await supabase
                    .from('user_categorias')
                    .select(`
                        user_id,
                        users!user_categorias_user_id_fkey(id, name, email)
                    `)
                    .eq('categoria_id', campaignData.target_category_id)
                    .eq('is_active', true);
                
                if (!corretoresCategoria || corretoresCategoria.length === 0 || categoriaError) {
                    throw new Error('Nenhum corretor encontrado na categoria selecionada');
                }

                // Verificar se já existe campanha para evitar duplicação
                const { data: existingCampaigns, error: existingError } = await supabase
                    .from('goals')
                    .select('user_id, title')
                    .eq('record_type', 'campaign')
                    .gte('created_at', new Date().toISOString().split('T')[0]); // Hoje

                if (existingError) {
                    }

                // Criar campanhas individuais para cada corretor
                const createdCampaigns = [];
                const skippedCorretores = [];
                
                for (const corretor of corretoresCategoria) {
                    // Verificar se já existe campanha para este corretor com o mesmo título
                    const campaignTitle = campaignData.title + ' - ' + (corretor.users as any)?.name;
                    const existingForUser = existingCampaigns?.filter(c => 
                        c.user_id === corretor.user_id && c.title === campaignTitle
                    ) || [];

                    if (existingForUser.length > 0) {
                        continue;
                    }

                    // NOVA VALIDAÇÃO: Verificar limite de 4 campanhas por corretor no período
                    const { data: activeCampaignsForUser, error: countError } = await supabase
                        .from('goals')
                        .select('id, title, start_date, end_date')
                        .eq('user_id', corretor.user_id)
                        .eq('record_type', 'campaign')
                        .eq('is_active', true)
                        .in('status', ['active', 'completed']);

                    if (countError) {
                        }

                    // Verificar sobreposição de período com as campanhas existentes
                    const newStartDate = new Date(campaignData.start_date);
                    const newEndDate = new Date(campaignData.end_date);
                    
                    const overlappingCampaigns = activeCampaignsForUser?.filter(existing => {
                        const existingStart = new Date(existing.start_date);
                        const existingEnd = new Date(existing.end_date);
                        
                        // Verificar se há sobreposição de período
                        return (newStartDate <= existingEnd) && (newEndDate >= existingStart);
                    }) || [];

                    if (overlappingCampaigns.length >= 4) {
                        skippedCorretores.push({
                            name: (corretor.users as any)?.name || 'Nome não encontrado',
                            email: (corretor.users as any)?.email || '',
                            activeCampaigns: overlappingCampaigns.length,
                            campaigns: overlappingCampaigns.map(c => c.title)
                        });
                        continue;
                    }

                    const goalData = {
                        title: campaignData.title + ' - ' + (corretor.users as any)?.name,
                        description: campaignData.description,
                        start_date: campaignData.start_date,
                        end_date: campaignData.end_date,
                        target_type: 'individual' as const, // SEMPRE individual
                        campaign_type: 'composite' as const,
                        type: 'valor' as const,
                        target: totalTarget > 0 ? totalTarget : 1,
                        unit: 'reais',
                        criteria: campaignData.criteria,
                        user_id: corretor.user_id, // Corretor específico
                        target_category_id: null, // Não precisa para campanhas individuais
                        created_by: null, // Removido para evitar foreign key constraint error
                        record_type: 'campaign' as const,
                        acceptance_status: 'pending' // ✅ IMPORTANTE: Definir como pending
                    };

                    const { data: campaign, error: campaignError } = await supabase
                        .from('goals')
                        .insert(goalData)
                        .select()
                        .single();
                    
                    if (campaignError) {
                        throw campaignError;
                    }

                    createdCampaigns.push(campaign);
                    }

                // Vincular prêmios às campanhas individuais criadas


                if (campaignData.selectedPremios && campaignData.selectedPremios.length > 0) {

                    for (const camp of createdCampaigns) {

                        for (const premioData of campaignData.selectedPremios) {

                            try {
                                const result = await vincularPremioCampanha(camp.id, premioData.premio.id, premioData.quantidade);

                            } catch (error) {
                            }
                        }
                    }
                } else if (campaignData.selectedPremio) {
                    // Fallback para compatibilidade com prêmio único
                    for (const camp of createdCampaigns) {

                        try {
                            const result = await vincularPremioCampanha(camp.id, campaignData.selectedPremio!.id, campaignData.premioQuantidade || 1);

                        } catch (error) {
                        }
                    }
                } else {

                }

                // Retornar a primeira campanha criada (para compatibilidade)
                const campaign = createdCampaigns[0];

                // Preparar retorno com informações sobre limites excedidos
                if (skippedCorretores.length > 0) {
                    const skippedDetails = skippedCorretores.map(c => 
                        `${c.name} (${c.activeCampaigns}/4 campanhas)`
                    ).join(', ');
                    
                    // Adicionar informação ao retorno para o frontend processar
                    if (campaign) {
                        (campaign as any).limitExceededInfo = {
                            skippedCount: skippedCorretores.length,
                            skippedCorretores,
                            createdCount: createdCampaigns.length
                        };
                    }
                }
                
                return campaign;
            }

            // Para campanhas INDIVIDUAIS: criar normalmente
            const goalData = {
                title: campaignData.title,
                description: campaignData.description,
                start_date: campaignData.start_date,
                end_date: campaignData.end_date,
                target_type: campaignData.target_type,
                campaign_type: 'composite' as const,
                type: 'valor' as const,
                target: totalTarget > 0 ? totalTarget : 1,
                unit: 'reais',
                criteria: campaignData.criteria,
                user_id: campaignData.target_user_id,
                target_category_id: null,
                created_by: null, // Removido para evitar foreign key constraint error
                record_type: 'campaign' as const
            };

            // Criar a campanha na tabela goals
            const { data: campaign, error: campaignError } = await supabase
                .from('goals')
                .insert(goalData)
                .select()
                .single();
            
            if (campaignError) throw campaignError;

            // 🚫 NÃO calcular progresso inicial automático!
            // O progresso deve ser ZERO até o corretor aceitar a campanha
            // e começar a vincular novas apólices
            // Vincular prêmios à campanha individual


            if (campaignData.selectedPremios && campaignData.selectedPremios.length > 0) {

                for (const premioData of campaignData.selectedPremios) {

                    try {
                        const result = await vincularPremioCampanha(campaign.id, premioData.premio.id, premioData.quantidade);

                    } catch (error) {
                    }
                }
            } else if (campaignData.selectedPremio) {
                // Fallback para compatibilidade com prêmio único
                try {
                    const result = await vincularPremioCampanha(campaign.id, campaignData.selectedPremio.id, campaignData.premioQuantidade || 1);

                } catch (error) {
                }
            } else {

            }

            // Para campanhas de grupo, as campanhas individuais já foram criadas acima
            // Não precisamos mais da função RPC

            // Recarregar campanhas
            await fetchCampaigns();

            return campaign;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar campanha');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCampaigns]);

    const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase
                .from('goals')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            await fetchCampaigns();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar campanha');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCampaigns]);

    const deleteCampaign = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchCampaigns();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir campanha');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCampaigns]);

    const getUserCampaigns = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('goals')
                .select(`
                    *
                `)
                .eq('user_id', userId)
                .eq('record_type', 'campaign')
                .eq('campaign_type', 'composite')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas do usuário');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
        
        // Configurar refresh automático a cada 30 segundos
        const interval = setInterval(() => {
            console.log('🔄 Auto-refresh: Atualizando campanhas...');
            fetchCampaigns();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [fetchCampaigns]);

    return {
        campaigns,
        loading,
        error,
        fetchCampaigns,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        getUserCampaigns
    };
};
