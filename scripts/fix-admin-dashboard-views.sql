-- 🔧 CORREÇÃO DAS VIEWS DO DASHBOARD ADMINISTRATIVO
-- 
-- Este script corrige o erro de alias duplicado na view_estatisticas_gerais

-- =====================================================
-- CORRIGIR VIEW: ESTATÍSTICAS GERAIS
-- =====================================================
-- Primeiro remover a view que depende
DROP VIEW IF EXISTS public.view_resumo_executivo CASCADE;
-- Agora podemos remover a view principal
DROP VIEW IF EXISTS public.view_estatisticas_gerais CASCADE;

CREATE OR REPLACE VIEW public.view_estatisticas_gerais AS
SELECT 
    -- Corretores
    COUNT(DISTINCT CASE WHEN u.is_admin = false THEN u.id END) as total_corretores,
    COUNT(DISTINCT CASE WHEN u.is_admin = false AND u.created_at > NOW() - INTERVAL '30 days' THEN u.id END) as corretores_novos_mes,
    
    -- Apólices
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as total_apolices,
    COUNT(DISTINCT CASE WHEN p.status = 'active' AND p.created_at > NOW() - INTERVAL '30 days' THEN p.id END) as apolices_novas_mes,
    
    -- Receita
    COALESCE(SUM(CASE WHEN p.status = 'active' THEN p.premium_value ELSE 0 END), 0) as receita_total,
    COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at > NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0) as receita_mes_atual,
    COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at > NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0) as crescimento_mensal,
    
    -- Campanhas
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' THEN g.id END) as total_campanhas,
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' AND g.status = 'active' THEN g.id END) as campanhas_ativas,
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' AND g.status = 'completed' THEN g.id END) as campanhas_concluidas,
    
    -- Prêmios
    COUNT(DISTINCT pc.id) as total_premios_conquistados,
    COALESCE(SUM(pc.valor_total_conquistado), 0) as valor_total_premios_conquistados,
    (SELECT COUNT(*) FROM public.premios WHERE is_ativo = true) as total_premios_cadastrados,
    
    -- Performance
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) = 0 THEN 0
        ELSE COALESCE(SUM(CASE WHEN p.status = 'active' THEN p.premium_value ELSE 0 END), 0) / COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END)
    END as ticket_medio_geral,
    
    -- Taxa de Conversão
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN u.is_admin = false THEN u.id END) = 0 THEN 0
        ELSE (COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END)::numeric / COUNT(DISTINCT CASE WHEN u.is_admin = false THEN u.id END))
    END as apolices_por_corretor,
    
    -- Datas
    MIN(p.created_at) as primeira_venda_sistema,
    MAX(p.created_at) as ultima_venda_sistema,
    NOW() as ultima_atualizacao

FROM public.users u
LEFT JOIN public.policies p ON u.id = p.user_id
LEFT JOIN public.goals g ON u.id = g.user_id
LEFT JOIN public.premios_conquistados pc ON u.id = pc.user_id;

-- =====================================================
-- CORRIGIR VIEW: RESUMO EXECUTIVO
-- =====================================================
DROP VIEW IF EXISTS public.view_resumo_executivo;

CREATE OR REPLACE VIEW public.view_resumo_executivo AS
SELECT 
    -- Dados das outras views
    (SELECT total_corretores FROM public.view_estatisticas_gerais) as total_corretores,
    (SELECT total_apolices FROM public.view_estatisticas_gerais) as total_apolices,
    (SELECT receita_total FROM public.view_estatisticas_gerais) as receita_total,
    (SELECT crescimento_mensal FROM public.view_estatisticas_gerais) as crescimento_mensal,
    (SELECT campanhas_ativas FROM public.view_estatisticas_gerais) as campanhas_ativas,
    (SELECT campanhas_concluidas FROM public.view_estatisticas_gerais) as campanhas_concluidas,
    
    -- Top Corretor do Mês
    (SELECT nome_corretor FROM public.view_top_corretores_mes LIMIT 1) as top_corretor_mes,
    (SELECT receita_mes FROM public.view_top_corretores_mes LIMIT 1) as receita_top_corretor,
    
    -- Performance Geral
    (SELECT ticket_medio_geral FROM public.view_estatisticas_gerais) as ticket_medio_geral,
    (SELECT apolices_por_corretor FROM public.view_estatisticas_gerais) as apolices_por_corretor,
    
    -- Última Atualização
    NOW() as ultima_atualizacao;

-- =====================================================
-- TESTAR AS VIEWS CORRIGIDAS
-- =====================================================

-- Testar estatísticas gerais
SELECT 
    'TESTE ESTATÍSTICAS CORRIGIDAS' as status,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas
FROM public.view_estatisticas_gerais;

-- Testar resumo executivo
SELECT 
    'TESTE RESUMO EXECUTIVO CORRIGIDO' as status,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas,
    top_corretor_mes,
    ultima_atualizacao
FROM public.view_resumo_executivo;

-- Verificar se todas as views existem
SELECT 
    'VIEWS DISPONÍVEIS' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'view_%'
ORDER BY viewname;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================

/*
✅ CORREÇÃO APLICADA!

PROBLEMA RESOLVIDO:
- Removido alias duplicado 'p' na view_estatisticas_gerais
- Corrigido JOIN com tabela premios
- Views agora devem funcionar corretamente

PRÓXIMOS PASSOS:
1. Execute este script no Supabase
2. Teste as views individualmente
3. Integre no frontend
4. Verifique se dados aparecem no dashboard

SE AINDA HOUVER PROBLEMAS:
- Verifique se há dados nas tabelas base
- Execute scripts de inserção de dados de teste
- Verifique permissões RLS
*/
