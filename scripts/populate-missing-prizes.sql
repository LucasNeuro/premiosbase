-- Script para popular prêmios conquistados se não existirem

-- 1. Verificar se há prêmios conquistados para o usuário ERA SOLUCORES
SELECT 
    'Verificação Inicial' as categoria,
    COUNT(*) as total_premios_conquistados
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%';

-- 2. Se não houver prêmios, criar baseado nas campanhas concluídas
INSERT INTO public.premios_conquistados (
    user_id,
    campaign_id,
    campaign_title,
    premio_id,
    premio_nome,
    premio_valor_estimado,
    premio_imagem_url,
    premio_categoria,
    premio_tipo,
    quantidade_conquistada,
    valor_total_conquistado,
    status,
    data_conquista
)
SELECT 
    g.user_id,
    g.id as campaign_id,
    g.title as campaign_title,
    p.id as premio_id,
    p.nome as premio_nome,
    p.valor_estimado as premio_valor_estimado,
    p.imagem_url as premio_imagem_url,
    p.categoria as premio_categoria,
    p.tipo as premio_tipo,
    1 as quantidade_conquistada,
    p.valor_estimado as valor_total_conquistado,
    'disponivel' as status,
    NOW() as data_conquista
FROM public.goals g
JOIN public.users u ON g.user_id = u.id
JOIN public.escolha_premios ep ON g.id = ep.goal_id
JOIN public.premios p ON ep.premio_id = p.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND g.status = 'completed'
AND g.acceptance_status = 'accepted'
AND g.record_type = 'campaign'
AND NOT EXISTS (
    SELECT 1 FROM public.premios_conquistados pc2 
    WHERE pc2.user_id = g.user_id 
    AND pc2.campaign_id = g.id 
    AND pc2.premio_id = p.id
);

-- 3. Verificar se os prêmios foram criados
SELECT 
    'Prêmios Após Inserção' as categoria,
    pc.id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.valor_total_conquistado,
    pc.status,
    u.name as user_name
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
ORDER BY pc.data_conquista DESC;

-- 4. Calcular total
SELECT 
    'Total Final' as categoria,
    COUNT(*) as total_premios,
    SUM(pc.valor_total_conquistado) as valor_total
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND pc.status = 'disponivel';
