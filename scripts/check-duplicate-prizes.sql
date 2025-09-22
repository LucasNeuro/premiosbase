-- Script para verificar prêmios duplicados

-- 1. Verificar prêmios conquistados duplicados
SELECT 
    'Prêmios Duplicados' as categoria,
    pc.campaign_id,
    pc.campaign_title,
    pc.premio_id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    pc.status,
    COUNT(*) as quantidade_registros
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
GROUP BY pc.campaign_id, pc.campaign_title, pc.premio_id, pc.premio_nome, pc.premio_valor_estimado, pc.quantidade_conquistada, pc.valor_total_conquistado, pc.status
HAVING COUNT(*) > 1
ORDER BY pc.campaign_id, pc.premio_nome;

-- 2. Verificar todos os prêmios conquistados
SELECT 
    'Todos os Prêmios Conquistados' as categoria,
    pc.id,
    pc.campaign_id,
    pc.campaign_title,
    pc.premio_id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    pc.status,
    pc.data_conquista
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
ORDER BY pc.campaign_id, pc.premio_nome, pc.data_conquista;

-- 3. Verificar campanhas com múltiplos prêmios
SELECT 
    'Campanhas com Múltiplos Prêmios' as categoria,
    pc.campaign_id,
    pc.campaign_title,
    COUNT(*) as total_premios,
    COUNT(DISTINCT pc.premio_id) as premios_unicos,
    STRING_AGG(pc.premio_nome, ', ') as lista_premios
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
GROUP BY pc.campaign_id, pc.campaign_title
HAVING COUNT(*) > 1
ORDER BY pc.campaign_id;

-- 4. Verificar se há prêmios com mesmo ID mas dados diferentes
SELECT 
    'Prêmios com Mesmo ID' as categoria,
    pc.premio_id,
    pc.premio_nome,
    COUNT(*) as quantidade_registros,
    STRING_AGG(DISTINCT pc.campaign_id::text, ', ') as campanhas,
    STRING_AGG(DISTINCT pc.valor_total_conquistado::text, ', ') as valores
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
GROUP BY pc.premio_id, pc.premio_nome
HAVING COUNT(*) > 1
ORDER BY pc.premio_id;
