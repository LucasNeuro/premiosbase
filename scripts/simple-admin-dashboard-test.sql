-- 🧪 TESTE SIMPLES DAS VIEWS DO DASHBOARD ADMINISTRATIVO
-- 
-- Este script testa apenas as views essenciais para verificar se funcionam

-- =====================================================
-- 1. VERIFICAR DADOS BRUTOS PRIMEIRO
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
    COALESCE(SUM(premium_value), 0) as receita_total
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
-- 2. TESTAR VIEW SIMPLES DE RANKING
-- =====================================================

-- Criar view simples de ranking
CREATE OR REPLACE VIEW public.view_ranking_simples AS
SELECT 
    u.id as corretor_id,
    u.name as nome_corretor,
    u.email as email_corretor,
    COUNT(p.id) as total_apolices,
    COALESCE(SUM(p.premium_value), 0) as receita_total,
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE COALESCE(SUM(p.premium_value), 0) / COUNT(p.id)
    END as ticket_medio
FROM public.users u
LEFT JOIN public.policies p ON u.id = p.user_id AND p.status = 'active'
WHERE u.is_admin = false
GROUP BY u.id, u.name, u.email
ORDER BY receita_total DESC;

-- Testar ranking simples
SELECT 
    'RANKING SIMPLES' as teste,
    nome_corretor,
    total_apolices,
    receita_total,
    ticket_medio
FROM public.view_ranking_simples
LIMIT 5;

-- =====================================================
-- 3. TESTAR VIEW SIMPLES DE DISTRIBUIÇÃO
-- =====================================================

-- Criar view simples de distribuição
CREATE OR REPLACE VIEW public.view_distribuicao_simples AS
SELECT 
    p.type as tipo_apolice,
    COUNT(*) as quantidade,
    COALESCE(SUM(p.premium_value), 0) as valor_total,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.policies WHERE status = 'active')), 2) as percentual
FROM public.policies p
WHERE p.status = 'active'
GROUP BY p.type
ORDER BY quantidade DESC;

-- Testar distribuição simples
SELECT 
    'DISTRIBUIÇÃO SIMPLES' as teste,
    tipo_apolice,
    quantidade,
    valor_total,
    percentual
FROM public.view_distribuicao_simples;

-- =====================================================
-- 4. TESTAR VIEW SIMPLES DE ESTATÍSTICAS
-- =====================================================

-- Criar view simples de estatísticas
CREATE OR REPLACE VIEW public.view_estatisticas_simples AS
SELECT 
    COUNT(DISTINCT CASE WHEN u.is_admin = false THEN u.id END) as total_corretores,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as total_apolices,
    COALESCE(SUM(CASE WHEN p.status = 'active' THEN p.premium_value ELSE 0 END), 0) as receita_total,
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' AND g.status = 'active' THEN g.id END) as campanhas_ativas,
    COUNT(DISTINCT CASE WHEN g.record_type = 'campaign' AND g.status = 'completed' THEN g.id END) as campanhas_concluidas
FROM public.users u
LEFT JOIN public.policies p ON u.id = p.user_id
LEFT JOIN public.goals g ON u.id = g.user_id;

-- Testar estatísticas simples
SELECT 
    'ESTATÍSTICAS SIMPLES' as teste,
    total_corretores,
    total_apolices,
    receita_total,
    campanhas_ativas,
    campanhas_concluidas
FROM public.view_estatisticas_simples;

-- =====================================================
-- 5. VERIFICAR SE AS VIEWS FORAM CRIADAS
-- =====================================================

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
✅ TESTE SIMPLES EXECUTADO!

RESULTADOS ESPERADOS:
- Dados brutos devem mostrar números > 0
- Views simples devem funcionar sem erro
- Se dados brutos = 0, inserir dados de teste
- Se views falham, verificar permissões RLS

PRÓXIMOS PASSOS:
1. Se este teste funcionou, executar script completo
2. Se falhou, verificar dados nas tabelas base
3. Integrar no frontend apenas se dados existem

DADOS MÍNIMOS NECESSÁRIOS:
- Pelo menos 1 usuário (corretor)
- Pelo menos 1 apólice ativa
- Pelo menos 1 campanha
*/

