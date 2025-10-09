-- 🧪 SCRIPT PARA TESTAR DADOS DO DASHBOARD ADMINISTRATIVO
-- 
-- Este script testa todas as views criadas e verifica se os dados estão corretos

-- =====================================================
-- 1. TESTAR ESTATÍSTICAS GERAIS (MÉTRICAS DO TOPO)
-- =====================================================
SELECT 
    'ESTATÍSTICAS GERAIS' as teste,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas,
    ultima_atualizacao
FROM public.view_estatisticas_gerais;

-- =====================================================
-- 2. TESTAR RANKING DE CORRETORES (TOP 5)
-- =====================================================
SELECT 
    'RANKING TOP 5 CORRETORES' as teste,
    ranking_receita,
    nome_corretor,
    total_apolices,
    receita_total,
    ticket_medio,
    campanhas_concluidas,
    premios_conquistados
FROM public.view_ranking_corretores 
ORDER BY ranking_receita 
LIMIT 5;

-- =====================================================
-- 3. TESTAR DISTRIBUIÇÃO DE APÓLICES (DONUTS)
-- =====================================================

-- Donut: Por Tipo de Apólice
SELECT 
    'DONUT - TIPO DE APÓLICE' as teste,
    categoria_valor as tipo,
    quantidade,
    valor_total,
    percentual_quantidade,
    percentual_valor
FROM public.view_distribuicao_apolices 
WHERE categoria_tipo = 'Tipo de Apólice'
ORDER BY quantidade DESC;

-- Donut: Por Tipo de Contrato
SELECT 
    'DONUT - TIPO DE CONTRATO' as teste,
    categoria_valor as contrato,
    quantidade,
    valor_total,
    percentual_quantidade,
    percentual_valor
FROM public.view_distribuicao_apolices 
WHERE categoria_tipo = 'Tipo de Contrato'
ORDER BY quantidade DESC;

-- Donut: Por Faixa de Valor
SELECT 
    'DONUT - FAIXA DE VALOR' as teste,
    categoria_valor as faixa,
    quantidade,
    valor_total,
    percentual_quantidade,
    percentual_valor
FROM public.view_distribuicao_apolices 
WHERE categoria_tipo = 'Faixa de Valor'
ORDER BY valor_total DESC;

-- =====================================================
-- 4. TESTAR VENDAS POR CATEGORIA
-- =====================================================
SELECT 
    'VENDAS POR CATEGORIA' as teste,
    nome_categoria,
    total_corretores,
    total_apolices,
    receita_total,
    receita_por_corretor,
    ticket_medio
FROM public.view_vendas_por_categoria
ORDER BY receita_total DESC;

-- =====================================================
-- 5. TESTAR PERFORMANCE MENSAL (ÚLTIMOS 6 MESES)
-- =====================================================
SELECT 
    'PERFORMANCE MENSAL' as teste,
    mes_formatado,
    total_apolices,
    corretores_ativos,
    receita_mes,
    receita_por_corretor,
    ticket_medio
FROM public.view_performance_mensal
ORDER BY mes_ano DESC
LIMIT 6;

-- =====================================================
-- 6. TESTAR TOP CORRETORES DO MÊS
-- =====================================================
SELECT 
    'TOP CORRETORES MÊS ATUAL' as teste,
    ranking_mes,
    nome_corretor,
    apolices_mes,
    receita_mes,
    ticket_medio
FROM public.view_top_corretores_mes
ORDER BY ranking_mes;

-- =====================================================
-- 7. TESTAR RESUMO EXECUTIVO
-- =====================================================
SELECT 
    'RESUMO EXECUTIVO' as teste,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    top_corretor_mes,
    receita_top_corretor,
    ticket_medio_geral,
    ultima_atualizacao
FROM public.view_resumo_executivo;

-- =====================================================
-- 8. VERIFICAR DADOS BRUTOS (DEBUG)
-- =====================================================

-- Verificar se há usuários
SELECT 
    'DADOS BRUTOS - USUÁRIOS' as teste,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_admin = false THEN 1 END) as corretores,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admins
FROM public.users;

-- Verificar se há apólices
SELECT 
    'DADOS BRUTOS - APÓLICES' as teste,
    COUNT(*) as total_apolices,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
    SUM(premium_value) as receita_total
FROM public.policies;

-- Verificar se há campanhas
SELECT 
    'DADOS BRUTOS - CAMPANHAS' as teste,
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as concluidas,
    COUNT(CASE WHEN acceptance_status = 'accepted' THEN 1 END) as aceitas
FROM public.goals 
WHERE record_type = 'campaign';

-- Verificar se há categorias
SELECT 
    'DADOS BRUTOS - CATEGORIAS' as teste,
    COUNT(*) as total_categorias,
    COUNT(CASE WHEN is_ativo = true THEN 1 END) as ativas
FROM public.categorias_corretores;

-- =====================================================
-- 9. TESTAR QUERIES ESPECÍFICAS PARA DASHBOARD
-- =====================================================

-- Query para métricas do topo do dashboard
SELECT 
    'MÉTRICAS TOPO DASHBOARD' as teste,
    (SELECT total_corretores FROM public.view_estatisticas_gerais) as total_corretores,
    (SELECT total_apolices FROM public.view_estatisticas_gerais) as total_apolices,
    (SELECT receita_total FROM public.view_estatisticas_gerais) as receita_total,
    (SELECT crescimento_mensal FROM public.view_estatisticas_gerais) as crescimento_mensal,
    (SELECT campanhas_ativas FROM public.view_estatisticas_gerais) as metas_ativas,
    (SELECT campanhas_concluidas FROM public.view_estatisticas_gerais) as metas_concluidas;

-- Query para dados do gráfico de ranking
SELECT 
    'DADOS RANKING CORRETORES' as teste,
    nome_corretor,
    receita_total,
    total_apolices,
    ticket_medio
FROM public.view_ranking_corretores
ORDER BY receita_total DESC
LIMIT 10;

-- Query para dados dos donuts
SELECT 
    'DADOS DONUT TIPOS' as teste,
    categoria_valor,
    quantidade,
    percentual_quantidade
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Apólice'
ORDER BY quantidade DESC;

-- =====================================================
-- 10. VERIFICAR PERFORMANCE DAS VIEWS
-- =====================================================

-- Tempo de execução das views principais
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM public.view_ranking_corretores;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM public.view_distribuicao_apolices;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.view_estatisticas_gerais;

-- =====================================================
-- INSTRUÇÕES DE INTERPRETAÇÃO:
-- =====================================================

/*
COMO INTERPRETAR OS RESULTADOS:

1. ESTATÍSTICAS GERAIS:
   - Se total_corretores = 0 → Não há corretores cadastrados
   - Se total_apolices = 0 → Não há apólices vendidas
   - Se receita_total = 0 → Não há receita

2. RANKING DE CORRETORES:
   - Se vazio → Não há corretores com vendas
   - Verificar se ranking_receita está correto

3. DISTRIBUIÇÃO DE APÓLICES:
   - Se vazio → Não há apólices para distribuir
   - Percentuais devem somar 100%

4. PERFORMANCE:
   - Se tempos > 1s → Views podem precisar de otimização
   - Verificar se há índices adequados

5. DADOS BRUTOS:
   - Comparar com dados das views
   - Identificar discrepâncias

PRÓXIMOS PASSOS:
- Se dados estão vazios → Inserir dados de teste
- Se views estão lentas → Criar índices
- Se há erros → Verificar permissões RLS
*/

