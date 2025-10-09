-- 🍩 TESTE DOS DONUTS MELHORADOS
-- 
-- Este script verifica se os dados estão corretos para testar
-- as melhorias implementadas nos gráficos donut

-- =====================================================
-- 1. VERIFICAR DADOS PARA DONUTS COM ANIMAÇÕES
-- =====================================================

-- Por Tipo de Apólice (com mais detalhes)
SELECT 
    'DONUT MELHORADO - TIPO DE APÓLICE' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade,
    ROUND((valor_total / quantidade), 2) as ticket_medio,
    CASE 
        WHEN quantidade > 10 THEN 'Alto Volume'
        WHEN quantidade > 5 THEN 'Médio Volume'
        ELSE 'Baixo Volume'
    END as categoria_volume
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Apólice'
ORDER BY quantidade DESC;

-- Por Tipo de Contrato (com análise de performance)
SELECT 
    'DONUT MELHORADO - TIPO DE CONTRATO' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade,
    ROUND((valor_total / quantidade), 2) as ticket_medio,
    CASE 
        WHEN percentual_quantidade > 50 THEN 'Dominante'
        WHEN percentual_quantidade > 25 THEN 'Significativo'
        ELSE 'Menor'
    END as categoria_importancia
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Contrato'
ORDER BY quantidade DESC;

-- Por Faixa de Valor (com insights)
SELECT 
    'DONUT MELHORADO - FAIXA DE VALOR' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade,
    ROUND((valor_total / quantidade), 2) as ticket_medio,
    CASE 
        WHEN valor_total > 100000 THEN 'Alto Valor'
        WHEN valor_total > 50000 THEN 'Médio Valor'
        ELSE 'Baixo Valor'
    END as categoria_valor_total
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Faixa de Valor'
ORDER BY valor_total DESC;

-- =====================================================
-- 2. VERIFICAR MÉTRICAS PARA ANIMAÇÕES
-- =====================================================

-- Totais para o centro do donut
SELECT 
    'MÉTRICAS CENTRAIS DO DONUT' as status,
    SUM(quantidade) as total_apolices,
    SUM(valor_total) as valor_total_geral,
    ROUND(AVG(valor_total / quantidade), 2) as ticket_medio_geral,
    COUNT(DISTINCT categoria_valor) as total_categorias
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Apólice';

-- =====================================================
-- 3. VERIFICAR DADOS PARA INTERATIVIDADE
-- =====================================================

-- Dados para hover effects e seleção
SELECT 
    'DADOS PARA INTERATIVIDADE' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade,
    ROUND((valor_total / quantidade), 2) as ticket_medio,
    -- Cores baseadas na performance
    CASE 
        WHEN percentual_quantidade > 40 THEN 'Azul (Alto)'
        WHEN percentual_quantidade > 20 THEN 'Verde (Médio)'
        ELSE 'Laranja (Baixo)'
    END as cor_sugerida,
    -- Indicadores de tendência
    CASE 
        WHEN quantidade > 10 THEN '↗ Crescimento'
        WHEN quantidade > 5 THEN '→ Estável'
        ELSE '↘ Declínio'
    END as tendencia
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Apólice'
ORDER BY percentual_quantidade DESC;

-- =====================================================
-- INSTRUÇÕES PARA TESTE
-- =====================================================

/*
🍩 DONUTS MELHORADOS TESTADOS!

MELHORIAS IMPLEMENTADAS:
✅ Animações suaves de entrada
✅ Tooltips interativos com mais informações
✅ Labels animados nos segmentos
✅ Centro do donut com estatísticas centrais
✅ Legenda interativa com barras de progresso
✅ Efeitos de hover e seleção
✅ Indicadores de "Live Data"
✅ Header melhorado com métricas
✅ CSS customizado para animações
✅ Responsividade aprimorada

FUNCIONALIDADES TESTADAS:
- Hover effects nos segmentos
- Seleção de categorias
- Tooltips com ticket médio
- Animações de entrada escalonadas
- Barras de progresso na legenda
- Indicadores visuais de status

RESULTADO ESPERADO:
- Donuts mais interativos e profissionais
- Animações suaves e elegantes
- Melhor experiência do usuário
- Visual mais moderno e atrativo
- Informações mais detalhadas e úteis
*/

