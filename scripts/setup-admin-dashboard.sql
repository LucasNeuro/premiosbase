-- 🚀 SETUP COMPLETO DO DASHBOARD ADMINISTRATIVO
-- 
-- Este script:
-- 1. Cria todas as views necessárias
-- 2. Testa os dados
-- 3. Verifica se tudo está funcionando
-- 4. Fornece instruções de uso

-- =====================================================
-- PARTE 1: CRIAR VIEWS
-- =====================================================

-- View: Ranking de Corretores
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

-- View: Distribuição de Apólices
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

-- View: Estatísticas Gerais
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
    CASE 
        WHEN COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0) > 0 
        THEN ROUND(
            ((COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at > NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0) - 
              COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0)) * 100.0 / 
             COALESCE(SUM(CASE WHEN p.status = 'active' AND p.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' THEN p.premium_value ELSE 0 END), 0)), 1)
        ELSE 0 
    END as crescimento_mensal,
    
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

-- View: Vendas por Categoria
CREATE OR REPLACE VIEW public.view_vendas_por_categoria AS
SELECT 
    cc.id as categoria_id,
    cc.nome as nome_categoria,
    cc.descricao as descricao_categoria,
    cc.cor as cor_categoria,
    cc.icone as icone_categoria,
    
    -- Contadores de Corretores
    COUNT(DISTINCT uc.user_id) as total_corretores,
    COUNT(DISTINCT CASE WHEN uc.is_active = true THEN uc.user_id END) as corretores_ativos,
    
    -- Apólices da Categoria
    COUNT(DISTINCT p.id) as total_apolices,
    COUNT(DISTINCT CASE WHEN p.type = 'Seguro Auto' THEN p.id END) as apolices_auto,
    COUNT(DISTINCT CASE WHEN p.type = 'Seguro Residencial' THEN p.id END) as apolices_residencial,
    
    -- Receita da Categoria
    COALESCE(SUM(p.premium_value), 0) as receita_total,
    COALESCE(SUM(CASE WHEN p.type = 'Seguro Auto' THEN p.premium_value ELSE 0 END), 0) as receita_auto,
    COALESCE(SUM(CASE WHEN p.type = 'Seguro Residencial' THEN p.premium_value ELSE 0 END), 0) as receita_residencial,
    
    -- Campanhas da Categoria
    COUNT(DISTINCT g.id) as total_campanhas,
    COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as campanhas_concluidas,
    COUNT(DISTINCT CASE WHEN g.status = 'active' THEN g.id END) as campanhas_ativas,
    
    -- Performance
    CASE 
        WHEN COUNT(DISTINCT uc.user_id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(DISTINCT uc.user_id)
    END as receita_por_corretor,
    
    CASE 
        WHEN COUNT(DISTINCT p.id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(DISTINCT p.id)
    END as ticket_medio,
    
    -- Datas
    MIN(p.created_at) as primeira_venda,
    MAX(p.created_at) as ultima_venda

FROM public.categorias_corretores cc
LEFT JOIN public.user_categorias uc ON cc.id = uc.categoria_id AND uc.is_active = true
LEFT JOIN public.users u ON uc.user_id = u.id
LEFT JOIN public.policies p ON u.id = p.user_id AND p.status = 'active'
LEFT JOIN public.goals g ON u.id = g.user_id AND g.record_type = 'campaign'
WHERE cc.is_ativo = true
GROUP BY cc.id, cc.nome, cc.descricao, cc.cor, cc.icone
ORDER BY receita_total DESC;

-- View: Performance Mensal
CREATE OR REPLACE VIEW public.view_performance_mensal AS
SELECT 
    DATE_TRUNC('month', p.created_at) as mes_ano,
    TO_CHAR(DATE_TRUNC('month', p.created_at), 'MM/YYYY') as mes_formatado,
    
    -- Contadores
    COUNT(DISTINCT p.id) as total_apolices,
    COUNT(DISTINCT p.user_id) as corretores_ativos,
    
    -- Receita
    COALESCE(SUM(p.premium_value), 0) as receita_mes,
    
    -- Tipos
    COUNT(CASE WHEN p.type = 'Seguro Auto' THEN 1 END) as apolices_auto,
    COUNT(CASE WHEN p.type = 'Seguro Residencial' THEN 1 END) as apolices_residencial,
    
    -- Contratos
    COUNT(CASE WHEN p.contract_type = 'Novo' THEN 1 END) as contratos_novos,
    COUNT(CASE WHEN p.contract_type = 'Renovação Bradesco' THEN 1 END) as contratos_renovacao,
    
    -- Performance
    CASE 
        WHEN COUNT(DISTINCT p.user_id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(DISTINCT p.user_id)
    END as receita_por_corretor,
    
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(p.id)
    END as ticket_medio

FROM public.policies p
WHERE p.status = 'active'
    AND p.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY mes_ano DESC;

-- View: Top Corretores do Mês
CREATE OR REPLACE VIEW public.view_top_corretores_mes AS
SELECT 
    u.id as corretor_id,
    u.name as nome_corretor,
    u.email as email_corretor,
    
    COUNT(p.id) as apolices_mes,
    COALESCE(SUM(p.premium_value), 0) as receita_mes,
    
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(p.id)
    END as ticket_medio,
    
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(p.premium_value), 0) DESC) as ranking_mes

FROM public.users u
LEFT JOIN public.policies p ON u.id = p.user_id 
    AND p.status = 'active' 
    AND p.created_at >= DATE_TRUNC('month', NOW())
WHERE u.is_admin = false
GROUP BY u.id, u.name, u.email
ORDER BY receita_mes DESC
LIMIT 10;

-- View: Resumo Executivo
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
-- PARTE 2: TESTAR DADOS
-- =====================================================

-- Verificar se as views foram criadas
SELECT 
    'VIEWS CRIADAS' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'view_%'
ORDER BY viewname;

-- Testar dados básicos
SELECT 
    'TESTE ESTATÍSTICAS' as teste,
    total_corretores,
    total_apolices,
    receita_total,
    campanhas_ativas,
    campanhas_concluidas
FROM public.view_estatisticas_gerais;

-- Testar ranking
SELECT 
    'TESTE RANKING' as teste,
    COUNT(*) as total_corretores_ranking,
    MAX(receita_total) as maior_receita,
    MIN(receita_total) as menor_receita
FROM public.view_ranking_corretores;

-- Testar distribuição
SELECT 
    'TESTE DISTRIBUIÇÃO' as teste,
    categoria_tipo,
    COUNT(*) as total_categorias,
    SUM(quantidade) as total_apolices
FROM public.view_distribuicao_apolices
GROUP BY categoria_tipo;

-- =====================================================
-- PARTE 3: VERIFICAR DADOS BRUTOS
-- =====================================================

-- Verificar usuários
SELECT 
    'DADOS BRUTOS - USUÁRIOS' as teste,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_admin = false THEN 1 END) as corretores,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admins
FROM public.users;

-- Verificar apólices
SELECT 
    'DADOS BRUTOS - APÓLICES' as teste,
    COUNT(*) as total_apolices,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
    SUM(premium_value) as receita_total
FROM public.policies;

-- Verificar campanhas
SELECT 
    'DADOS BRUTOS - CAMPANHAS' as teste,
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as concluidas,
    COUNT(CASE WHEN acceptance_status = 'accepted' THEN 1 END) as aceitas
FROM public.goals 
WHERE record_type = 'campaign';

-- =====================================================
-- PARTE 4: INSTRUÇÕES FINAIS
-- =====================================================

/*
🎉 SETUP CONCLUÍDO!

VIEWS CRIADAS:
✅ view_ranking_corretores - Ranking completo de corretores
✅ view_distribuicao_apolices - Dados para gráficos donut
✅ view_estatisticas_gerais - Métricas do topo do dashboard
✅ view_vendas_por_categoria - Vendas por categoria de corretor
✅ view_performance_mensal - Performance dos últimos 12 meses
✅ view_top_corretores_mes - Top 10 corretores do mês
✅ view_resumo_executivo - Resumo executivo

PRÓXIMOS PASSOS:

1. INTEGRAR NO FRONTEND:
   - Usar AdminDashboardService.ts
   - Usar useAdminDashboard.tsx hook
   - Usar componentes React criados

2. TESTAR NO DASHBOARD:
   - Verificar se dados aparecem
   - Testar gráficos donut
   - Verificar ranking de corretores
   - Confirmar métricas do topo

3. SE DADOS ESTÃO VAZIOS:
   - Inserir dados de teste
   - Verificar permissões RLS
   - Confirmar se há dados nas tabelas base

4. OTIMIZAÇÕES:
   - Criar índices se necessário
   - Monitorar performance das views
   - Ajustar queries se lento

DADOS PARA TESTE:
- Se não há dados, execute scripts de inserção de dados de teste
- Verifique se RLS está configurado corretamente
- Confirme se usuário tem permissões adequadas

CONTATO:
- Se houver problemas, verifique logs do console
- Teste views individualmente no Supabase
- Use scripts de debug fornecidos
*/
