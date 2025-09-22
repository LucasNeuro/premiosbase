-- Script para debugar valores dos prêmios

-- 1. Verificar prêmios conquistados do usuário ERA SOLUCORES
SELECT 
    'Prêmios Conquistados' as categoria,
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

-- 2. Verificar se há prêmios com valores zerados
SELECT 
    'Prêmios com Valores Zerados' as categoria,
    pc.id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.valor_total_conquistado,
    pc.status
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND (pc.premio_valor_estimado = 0 OR pc.valor_total_conquistado = 0);

-- 3. Calcular total manualmente
SELECT 
    'Cálculo Manual' as categoria,
    COUNT(*) as total_premios,
    SUM(pc.premio_valor_estimado) as soma_valor_estimado,
    SUM(pc.valor_total_conquistado) as soma_valor_total_conquistado,
    SUM(CASE WHEN pc.status = 'disponivel' THEN pc.valor_total_conquistado ELSE 0 END) as soma_disponiveis
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%';

-- 4. Verificar se os dados estão corretos
SELECT 
    'Verificação de Dados' as categoria,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    CASE 
        WHEN pc.valor_total_conquistado = pc.premio_valor_estimado * pc.quantidade_conquistada 
        THEN '✅ Correto' 
        ELSE '❌ Incorreto' 
    END as calculo_correto
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%';
