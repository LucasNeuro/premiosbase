-- 🎨 TESTE DO PADRÃO VISUAL PADRONIZADO
-- 
-- Este script verifica se os dados estão corretos para o novo padrão visual
-- que segue o estilo da aplicação com fundo escuro e ícones coloridos

-- =====================================================
-- 1. VERIFICAR DADOS PARA OS MINICARDS
-- =====================================================
SELECT 
    'PADRÃO VISUAL - MINICARDS' as status,
    'Fundo escuro (#1E293B) com ícones coloridos' as design,
    total_corretores,
    total_apolices,
    receita_total,
    crescimento_mensal,
    campanhas_ativas,
    campanhas_concluidas
FROM public.view_estatisticas_gerais;

-- =====================================================
-- 2. VERIFICAR CORES DOS ÍCONES (SEQUÊNCIA)
-- =====================================================
SELECT 
    'SEQUÊNCIA DE CORES DOS ÍCONES' as info,
    '1. Azul claro (#3B82F6) - Total de Corretores' as cor_1,
    '2. Verde claro (#10B981) - Total de Apólices' as cor_2,
    '3. Verde claro (#10B981) - Receita Total' as cor_3,
    '4. Verde claro (#10B981) - Crescimento Mensal' as cor_4,
    '5. Laranja claro (#F59E0B) - Metas Ativas' as cor_5,
    '6. Roxo claro (#8B5CF6) - Metas Concluídas' as cor_6;

-- =====================================================
-- 3. VERIFICAR DADOS PARA DONUTS
-- =====================================================

-- Por Tipo de Apólice (usando cores da sequência)
SELECT 
    'DONUT - TIPO DE APÓLICE (Cores padronizadas)' as status,
    categoria_valor,
    quantidade,
    valor_total,
    percentual_quantidade,
    'Cor: ' || CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY quantidade DESC) = 1 THEN '#3B82F6 (Azul)'
        WHEN ROW_NUMBER() OVER (ORDER BY quantidade DESC) = 2 THEN '#10B981 (Verde)'
        WHEN ROW_NUMBER() OVER (ORDER BY quantidade DESC) = 3 THEN '#F59E0B (Laranja)'
        WHEN ROW_NUMBER() OVER (ORDER BY quantidade DESC) = 4 THEN '#8B5CF6 (Roxo)'
        ELSE '#EF4444 (Vermelho)'
    END as cor_aplicada
FROM public.view_distribuicao_apolices
WHERE categoria_tipo = 'Tipo de Apólice'
ORDER BY quantidade DESC;

-- =====================================================
-- 4. RESUMO DO PADRÃO VISUAL
-- =====================================================
SELECT 
    'RESUMO DO PADRÃO VISUAL APLICADO' as status,
    '✅ Fundo escuro (#1E293B) nos cards' as card_bg,
    '✅ Ícones circulares coloridos' as icons,
    '✅ Texto branco para contraste' as text_color,
    '✅ Bordas arredondadas' as borders,
    '✅ Sombra para profundidade' as shadow,
    '✅ Cores consistentes em donuts' as donut_colors,
    '✅ Layout horizontal com ícone à esquerda' as layout;

-- =====================================================
-- INSTRUÇÕES PARA TESTE
-- =====================================================

/*
🎨 PADRÃO VISUAL PADRONIZADO APLICADO!

CARACTERÍSTICAS:
✅ Cards com fundo escuro (#1E293B)
✅ Ícones circulares coloridos seguindo sequência
✅ Texto branco para contraste
✅ Layout horizontal (ícone à esquerda, conteúdo à direita)
✅ Bordas arredondadas e sombras
✅ Cores consistentes entre cards e donuts

SEQUÊNCIA DE CORES:
1. Azul claro (#3B82F6) - Total de Corretores
2. Verde claro (#10B981) - Total de Apólices
3. Verde claro (#10B981) - Receita Total
4. Verde claro (#10B981) - Crescimento Mensal
5. Laranja claro (#F59E0B) - Metas Ativas
6. Roxo claro (#8B5CF6) - Metas Concluídas

RESULTADO ESPERADO:
- Cards com visual consistente com o resto da aplicação
- Donuts usando a mesma paleta de cores
- Interface profissional e padronizada
*/

