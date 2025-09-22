-- Script simplificado para verificar prêmios

-- 1. Verificar usuário ERA SOLUCORES
SELECT 
    'Usuário ERA SOLUCORES' as categoria,
    u.id,
    u.name,
    u.email
FROM public.users u
WHERE u.name ILIKE '%ERA SOLUCORES%';

-- 2. Verificar campanhas concluídas
SELECT 
    'Campanhas Concluídas' as categoria,
    g.id,
    g.title,
    g.status,
    g.acceptance_status,
    g.progress_percentage,
    g.current_value,
    g.target
FROM public.goals g
JOIN public.users u ON g.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND g.status = 'completed'
AND g.acceptance_status = 'accepted'
AND g.record_type = 'campaign';

-- 3. Verificar se existe tabela premios_conquistados
SELECT 
    'Verificação premios_conquistados' as categoria,
    COUNT(*) as total_registros
FROM public.premios_conquistados;

-- 4. Verificar prêmios conquistados do usuário
SELECT 
    'Prêmios Conquistados' as categoria,
    pc.id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    pc.status,
    pc.data_conquista
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
ORDER BY pc.data_conquista DESC;
