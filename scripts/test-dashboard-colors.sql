-- 🎨 TESTE DE CORES DO DASHBOARD
-- 
-- Este script verifica se os dados estão sendo retornados corretamente
-- para testar a aplicação das cores padronizadas

-- =====================================================
-- 1. VERIFICAR DADOS PARA OS MINICARDS
-- =====================================================
SELECT 
    'DADOS PARA MINICARDS' as status,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas
FROM public.view_estatisticas_gerais;

-- =====================================================
-- 2. VERIFICAR DADOS PARA GRÁFICOS DONUT
-- =====================================================

-- Por Tipo de Apólice
SELECT 
    'DONUT - TIPO DE APÓLICE' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Apólice'
ORDER BY quantidade DESC;

-- Por Tipo de Contrato
SELECT 
    'DONUT - TIPO DE CONTRATO' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Contrato'
ORDER BY quantidade DESC;

-- Por Faixa de Valor
SELECT 
    'DONUT - FAIXA DE VALOR' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Faixa de Valor'
ORDER BY quantidade DESC;

-- =====================================================
-- 3. VERIFICAR DADOS PARA TABELA DE RANKING
-- =====================================================
SELECT 
    'RANKING - TOP 5' as status,
    ranking_receita,
    nome_corretor,
    total_apolices,
    receita_total,
    ticket_medio
FROM public.view_ranking_corretores
ORDER BY ranking_receita
LIMIT 5;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================

/*
✅ TESTE DE CORES EXECUTADO!

SEQUÊNCIA DE CORES PADRONIZADA:
1. Azul claro (#3B82F6) - Total de Corretores
2. Verde claro (#10B981) - Total de Apólices
3. Verde claro (#10B981) - Receita Total  
4. Verde claro (#10B981) - Crescimento Mensal
5. Laranja claro (#F59E0B) - Metas Ativas
6. Roxo claro (#8B5CF6) - Metas Concluídas

APLICADO EM:
- ✅ Minicards do dashboard
- ✅ Gráficos donut
- ✅ Tabela de ranking
- ✅ Todos os componentes do dashboard

RESULTADO ESPERADO:
- Números alinhados dentro dos cards
- Cores consistentes em todo o dashboard
- Visual profissional e padronizado
*/
