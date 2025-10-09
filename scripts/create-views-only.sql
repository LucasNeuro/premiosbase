-- 🚀 CRIAR APENAS AS VIEWS ESSENCIAIS
-- 
-- Este script cria apenas as views necessárias sem tentar fazer DROP

-- =====================================================
-- 1. VIEW: RANKING DE CORRETORES
-- =====================================================
CREATE OR REPLACE VIEW public.view_ranking_corretores AS
SELECT 
    u.id as corretor_id,
    u.name as nome_corretor,
    u.email as email_corretor,
    u.cnpj as cnpj_corretor,
    
    -- Contadores de Apólices
    COUNT(p.id) as total_apolices,
    COUNT(CASE WHEN p.type = 'Seguro Auto' THEN 1 END) as apolices_auto,
    COUNT(CASE WHEN p.type = 'Seguro Residencial' THEN 1 END) as apolices_residencial,
    
    -- Valores Financeiros
    COALESCE(SUM(p.premium_value), 0) as receita_total,
    COALESCE(SUM(CASE WHEN p.type = 'Seguro Auto' THEN p.premium_value ELSE 0 END), 0) as receita_auto,
    COALESCE(SUM(CASE WHEN p.type = 'Seguro Residencial' THEN p.premium_value ELSE 0 END), 0) as receita_residencial,
    
    -- Contratos
    COUNT(CASE WHEN p.contract_type = 'Novo' THEN 1 END) as contratos_novos,
    COUNT(CASE WHEN p.contract_type = 'Renovação Bradesco' THEN 1 END) as contratos_renovacao,
    
    -- Campanhas
    COUNT(DISTINCT g.id) as total_campanhas,
    COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as campanhas_concluidas,
    COUNT(DISTINCT CASE WHEN g.status = 'active' THEN g.id END) as campanhas_ativas,
    
    -- Prêmios
    COUNT(DISTINCT pc.id) as premios_conquistados,
    COALESCE(SUM(pc.valor_total_conquistado), 0) as valor_premios_conquistados,
    
    -- Datas
    MIN(p.created_at) as primeira_venda,
    MAX(p.created_at) as ultima_venda,
    u.created_at as data_cadastro,
    
    -- Ranking
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(p.premium_value), 0) DESC) as ranking_receita,
    ROW_NUMBER() OVER (ORDER BY COUNT(p.id) DESC) as ranking_apolices,
    
    -- Performance
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(p.id)
    END as ticket_medio,
    
    -- Status Ativo
    CASE 
        WHEN MAX(p.created_at) > NOW() - INTERVAL '30 days' THEN true
        ELSE false
    END as ativo_ultimos_30_dias

FROM public.users u
LEFT JOIN public.policies p ON u.id = p.user_id AND p.status = 'active'
LEFT JOIN public.goals g ON u.id = g.user_id AND g.record_type = 'campaign'
LEFT JOIN public.premios_conquistados pc ON u.id = pc.user_id
WHERE u.is_admin = false
GROUP BY u.id, u.name, u.email, u.cnpj, u.created_at
ORDER BY receita_total DESC;

-- =====================================================
-- 2. VIEW: DISTRIBUIÇÃO DE APÓLICES
-- =====================================================
CREATE OR REPLACE VIEW public.view_distribuicao_apolices AS
SELECT 
    'Tipo de Apólice' as categoria_tipo,
    p.type as categoria_valor,
    COUNT(*) as quantidade,
    COALESCE(SUM(p.premium_value), 0) as valor_total,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.policies WHERE status = 'active')), 
        2
    ) as percentual_quantidade,
    ROUND(
        (COALESCE(SUM(p.premium_value), 0) * 100.0 / 
         (SELECT COALESCE(SUM(premium_value), 0) FROM public.policies WHERE status = 'active')), 
        2
    ) as percentual_valor
FROM public.policies p
WHERE p.status = 'active'
GROUP BY p.type

UNION ALL

SELECT 
    'Tipo de Contrato' as categoria_tipo,
    p.contract_type as categoria_valor,
    COUNT(*) as quantidade,
    COALESCE(SUM(p.premium_value), 0) as valor_total,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.policies WHERE status = 'active')), 
        2
    ) as percentual_quantidade,
    ROUND(
        (COALESCE(SUM(p.premium_value), 0) * 100.0 / 
         (SELECT COALESCE(SUM(premium_value), 0) FROM public.policies WHERE status = 'active')), 
        2
    ) as percentual_valor
FROM public.policies p
WHERE p.status = 'active'
GROUP BY p.contract_type

UNION ALL

SELECT 
    'Faixa de Valor' as categoria_tipo,
    CASE 
        WHEN p.premium_value < 3000 THEN 'Até R$ 3.000'
        WHEN p.premium_value < 5000 THEN 'R$ 3.000 - R$ 5.000'
        WHEN p.premium_value < 10000 THEN 'R$ 5.000 - R$ 10.000'
        WHEN p.premium_value < 20000 THEN 'R$ 10.000 - R$ 20.000'
        ELSE 'Acima de R$ 20.000'
    END as categoria_valor,
    COUNT(*) as quantidade,
    COALESCE(SUM(p.premium_value), 0) as valor_total,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.policies WHERE status = 'active')), 
        2
    ) as percentual_quantidade,
    ROUND(
        (COALESCE(SUM(p.premium_value), 0) * 100.0 / 
         (SELECT COALESCE(SUM(premium_value), 0) FROM public.policies WHERE status = 'active')), 
        2
    ) as percentual_valor
FROM public.policies p
WHERE p.status = 'active'
GROUP BY 
    CASE 
        WHEN p.premium_value < 3000 THEN 'Até R$ 3.000'
        WHEN p.premium_value < 5000 THEN 'R$ 3.000 - R$ 5.000'
        WHEN p.premium_value < 10000 THEN 'R$ 5.000 - R$ 10.000'
        WHEN p.premium_value < 20000 THEN 'R$ 10.000 - R$ 20.000'
        ELSE 'Acima de R$ 20.000'
    END

ORDER BY categoria_tipo, valor_total DESC;

-- =====================================================
-- 3. VIEW: ESTATÍSTICAS GERAIS (SEM CONFLITO)
-- =====================================================
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
-- 4. TESTAR AS VIEWS
-- =====================================================

-- Testar estatísticas gerais
SELECT 
    'TESTE ESTATÍSTICAS' as status,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas
FROM public.view_estatisticas_gerais;

-- Testar ranking
SELECT 
    'TESTE RANKING' as status,
    COUNT(*) as total_corretores_ranking,
    MAX(receita_total) as maior_receita,
    MIN(receita_total) as menor_receita
FROM public.view_ranking_corretores;

-- Testar distribuição
SELECT 
    'TESTE DISTRIBUIÇÃO' as status,
    categoria_tipo,
    COUNT(*) as total_categorias,
    SUM(quantidade) as total_apolices
FROM public.view_distribuicao_apolices
GROUP BY categoria_tipo;

-- Verificar views criadas
SELECT 
    'VIEWS CRIADAS' as status,
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
✅ VIEWS CRIADAS COM SUCESSO!

VIEWS DISPONÍVEIS:
- view_ranking_corretores - Ranking de corretores
- view_distribuicao_apolices - Dados para gráficos donut
- view_estatisticas_gerais - Métricas do dashboard

PRÓXIMOS PASSOS:
1. Verificar se os testes retornaram dados
2. Se dados = 0, inserir dados de teste
3. Integrar no frontend
4. Testar dashboard administrativo

SE AINDA HOUVER PROBLEMAS:
- Verificar se há dados nas tabelas base
- Executar scripts de inserção de dados
- Verificar permissões RLS
*/

