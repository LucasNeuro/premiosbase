-- 🧪 TESTE DE INTEGRAÇÃO DO DASHBOARD ADMINISTRATIVO
-- 
-- Este script testa se as views e dados estão funcionando para o dashboard

-- =====================================================
-- 1. VERIFICAR SE AS VIEWS EXISTEM
-- =====================================================
SELECT 
    'VERIFICAÇÃO DE VIEWS' as status,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname LIKE 'view_%'
ORDER BY viewname;

-- =====================================================
-- 2. TESTAR VIEW: ESTATÍSTICAS GERAIS
-- =====================================================
SELECT 
    'TESTE ESTATÍSTICAS GERAIS' as status,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas,
    total_premios_conquistados,
    valor_total_premios_conquistados,
    total_premios_cadastrados,
    ticket_medio_geral,
    apolices_por_corretor,
    ultima_atualizacao
FROM public.view_estatisticas_gerais;

-- =====================================================
-- 3. TESTAR VIEW: RANKING DE CORRETORES
-- =====================================================
SELECT 
    'TESTE RANKING CORRETORES' as status,
    corretor_id,
    nome_corretor,
    email_corretor,
    total_apolices,
    receita_total,
    ticket_medio,
    ranking_receita,
    ranking_apolices,
    ativo_ultimos_30_dias
FROM public.view_ranking_corretores
ORDER BY ranking_receita
LIMIT 5;

-- =====================================================
-- 4. TESTAR VIEW: DISTRIBUIÇÃO DE APÓLICES
-- =====================================================
SELECT 
    'TESTE DISTRIBUIÇÃO APÓLICES' as status,
    categoria_tipo,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade,
    percentual_valor
FROM public.view_distribuicao_apolices
ORDER BY categoria_tipo, quantidade DESC;

-- =====================================================
-- 5. VERIFICAR DADOS BRUTOS PARA COMPARAÇÃO
-- =====================================================

-- Usuários (corretores)
SELECT 
    'DADOS BRUTOS - USUÁRIOS' as status,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_admin = false THEN 1 END) as corretores,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admins
FROM public.users;

-- Apólices
SELECT 
    'DADOS BRUTOS - APÓLICES' as status,
    COUNT(*) as total_apolices,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
    COALESCE(SUM(premium_value), 0) as receita_total
FROM public.policies;

-- Campanhas
SELECT 
    'DADOS BRUTOS - CAMPANHAS' as status,
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as concluidas,
    COUNT(CASE WHEN acceptance_status = 'accepted' THEN 1 END) as aceitas
FROM public.goals 
WHERE record_type = 'campaign';

-- =====================================================
-- 6. TESTE DE PERFORMANCE
-- =====================================================
-- Verificar se as views retornam dados rapidamente
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.view_estatisticas_gerais;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.view_ranking_corretores LIMIT 10;

-- =====================================================
-- 7. VERIFICAR PERMISSÕES RLS
-- =====================================================
-- Verificar se as views são acessíveis
SELECT 
    'VERIFICAÇÃO RLS' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'policies', 'goals');

-- =====================================================
-- INSTRUÇÕES
-- =====================================================

/*
✅ TESTE DE INTEGRAÇÃO EXECUTADO!

RESULTADOS ESPERADOS:
- Views devem existir e retornar dados
- Dados brutos devem coincidir com as views
- Performance deve ser aceitável
- RLS deve estar configurado corretamente

PRÓXIMOS PASSOS:
1. Se views retornam dados, integrar no frontend
2. Se views estão vazias, verificar dados nas tabelas base
3. Se há erros, verificar permissões RLS
4. Testar dashboard administrativo no navegador

PROBLEMAS COMUNS:
- Views vazias: dados não existem nas tabelas base
- Erro de permissão: RLS bloqueando acesso
- Performance lenta: views precisam de índices
- Dados inconsistentes: views precisam ser recriadas
*/

