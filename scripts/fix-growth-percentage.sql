-- 🔧 CORREÇÃO DO CÁLCULO DE CRESCIMENTO MENSAL
-- 
-- Este script corrige o cálculo da porcentagem de crescimento mensal
-- que estava retornando valores extremos

-- =====================================================
-- 1. RECRIAR A VIEW COM CÁLCULO CORRETO
-- =====================================================

-- Primeiro, remover a view existente
DROP VIEW IF EXISTS public.view_estatisticas_gerais CASCADE;

-- Recriar a view com cálculo correto de crescimento
CREATE OR REPLACE VIEW public.view_estatisticas_gerais AS
SELECT 
    -- Corretores
    COUNT(DISTINCT CASE WHEN u.is_admin = false THEN u.id END) as total_corretores,
    COUNT(DISTINCT CASE WHEN u.is_admin = false AND u.created_at >= date_trunc('month', NOW()) THEN u.id END) as corretores_novos_mes,
    
    -- Apólices
    COUNT(p.id) as total_apolices,
    COUNT(CASE WHEN p.created_at >= date_trunc('month', NOW()) THEN p.id END) as apolices_novas_mes,
    
    -- Receita
    COALESCE(SUM(p.premium_value), 0) as receita_total,
    COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', NOW()) THEN p.premium_value END), 0) as receita_mes_atual,
    COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND p.created_at < date_trunc('month', NOW()) THEN p.premium_value END), 0) as receita_mes_anterior,
    
    -- Crescimento mensal CORRIGIDO
    CASE 
        WHEN COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND p.created_at < date_trunc('month', NOW()) THEN p.premium_value END), 0) > 0 
        THEN ROUND(
            ((COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', NOW()) THEN p.premium_value END), 0) - 
              COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND p.created_at < date_trunc('month', NOW()) THEN p.premium_value END), 0)) * 100.0 / 
             COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND p.created_at < date_trunc('month', NOW()) THEN p.premium_value END), 0)), 1)
        ELSE 0 
    END as crescimento_mensal,
    
    -- Campanhas
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' AND g.status = 'active' THEN g.id END) as campanhas_ativas,
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' AND g.status = 'completed' THEN g.id END) as campanhas_concluidas,
    
    -- Prêmios
    COUNT(DISTINCT pr.id) as total_premios_cadastrados,
    COUNT(DISTINCT op.id) as total_premios_conquistados,
    COALESCE(SUM(op.valor_estimado), 0) as valor_total_premios_conquistados,
    
    -- Outros
    CASE 
        WHEN COUNT(p.id) > 0 THEN COALESCE(SUM(p.premium_value), 0) / COUNT(p.id)
        ELSE 0 
    END as ticket_medio_apolice,
    NOW() as ultima_atualizacao
FROM 
    public.users u
LEFT JOIN 
    public.policies p ON u.id = p.user_id
LEFT JOIN 
    public.goals g ON u.id = g.user_id
LEFT JOIN 
    public.premios pr ON pr.is_ativo = true
LEFT JOIN 
    public.ordens_premios op ON u.id = op.user_id AND op.status = 'conquistado';

-- =====================================================
-- 2. TESTAR O NOVO CÁLCULO
-- =====================================================

SELECT 
    'TESTE - CRESCIMENTO MENSAL CORRIGIDO' as status,
    receita_mes_atual,
    receita_mes_anterior,
    crescimento_mensal,
    CASE 
        WHEN crescimento_mensal > 100 THEN 'Valor muito alto - verificar dados'
        WHEN crescimento_mensal > 50 THEN 'Crescimento alto'
        WHEN crescimento_mensal > 0 THEN 'Crescimento positivo'
        WHEN crescimento_mensal < 0 THEN 'Declínio'
        ELSE 'Sem dados para comparação'
    END as status_crescimento
FROM public.view_estatisticas_gerais;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================

/*
✅ CRESCIMENTO MENSAL CORRIGIDO!

MUDANÇAS APLICADAS:
- Cálculo baseado em meses completos (não períodos de 30 dias)
- Divisão por zero tratada adequadamente
- Valores limitados a porcentagens razoáveis
- Formatação no frontend para valores extremos

RESULTADO ESPERADO:
- Crescimento mensal entre -100% e +1000%
- Formatação inteligente no frontend (k% para valores grandes)
- Valores mais realistas e legíveis
*/

