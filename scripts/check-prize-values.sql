-- Script para verificar valores dos prêmios conquistados

-- 1. Verificar prêmios conquistados do usuário ERA SOLUCORES
SELECT 
    'Prêmios Conquistados ERA SOLUCORES' as categoria,
    pc.id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    pc.status,
    pc.data_conquista,
    u.name as user_name
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
ORDER BY pc.data_conquista DESC;

-- 2. Verificar soma total dos prêmios
SELECT 
    'Soma Total dos Prêmios' as categoria,
    COUNT(*) as total_premios,
    SUM(pc.valor_total_conquistado) as valor_total_conquistado,
    SUM(pc.premio_valor_estimado) as valor_estimado_total
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND pc.status = 'disponivel';

-- 3. Verificar se há prêmios com valor zerado
SELECT 
    'Prêmios com Valor Zerado' as categoria,
    pc.id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.valor_total_conquistado,
    pc.status
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND (pc.premio_valor_estimado = 0 OR pc.valor_total_conquistado = 0);

-- 4. Verificar estrutura da tabela premios_conquistados
SELECT 
    'Estrutura da Tabela' as categoria,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'premios_conquistados' 
AND table_schema = 'public'
ORDER BY ordinal_position;
