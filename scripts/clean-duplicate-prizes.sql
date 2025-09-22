-- Script para limpar prêmios duplicados

-- 1. Verificar duplicatas antes da limpeza
SELECT 
    'Duplicatas Antes da Limpeza' as categoria,
    COUNT(*) as total_registros,
    COUNT(DISTINCT CONCAT(pc.premio_id, '-', pc.campaign_id)) as registros_unicos,
    COUNT(*) - COUNT(DISTINCT CONCAT(pc.premio_id, '-', pc.campaign_id)) as duplicatas
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%';

-- 2. Criar tabela temporária com prêmios únicos
CREATE TEMP TABLE temp_premios_unicos AS
SELECT DISTINCT ON (pc.premio_id, pc.campaign_id)
    pc.id,
    pc.user_id,
    pc.campaign_id,
    pc.campaign_title,
    pc.premio_id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.premio_imagem_url,
    pc.premio_categoria,
    pc.premio_tipo,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    pc.status,
    pc.data_conquista,
    pc.data_resgate,
    pc.pedido_id,
    pc.created_at,
    pc.updated_at
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
ORDER BY pc.premio_id, pc.campaign_id, pc.created_at DESC;

-- 3. Remover todos os prêmios do usuário
DELETE FROM public.premios_conquistados 
WHERE user_id IN (
    SELECT u.id 
    FROM public.users u 
    WHERE u.name ILIKE '%ERA SOLUCORES%'
);

-- 4. Inserir prêmios únicos
INSERT INTO public.premios_conquistados (
    id, user_id, campaign_id, campaign_title, premio_id, premio_nome,
    premio_valor_estimado, premio_imagem_url, premio_categoria, premio_tipo,
    quantidade_conquistada, valor_total_conquistado, status, data_conquista,
    data_resgate, pedido_id, created_at, updated_at
)
SELECT 
    id, user_id, campaign_id, campaign_title, premio_id, premio_nome,
    premio_valor_estimado, premio_imagem_url, premio_categoria, premio_tipo,
    quantidade_conquistada, valor_total_conquistado, status, data_conquista,
    data_resgate, pedido_id, created_at, updated_at
FROM temp_premios_unicos;

-- 5. Verificar resultado após limpeza
SELECT 
    'Resultado Após Limpeza' as categoria,
    COUNT(*) as total_registros,
    COUNT(DISTINCT CONCAT(pc.premio_id, '-', pc.campaign_id)) as registros_unicos,
    COUNT(*) - COUNT(DISTINCT CONCAT(pc.premio_id, '-', pc.campaign_id)) as duplicatas
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%';

-- 6. Listar prêmios após limpeza
SELECT 
    'Prêmios Após Limpeza' as categoria,
    pc.id,
    pc.campaign_id,
    pc.campaign_title,
    pc.premio_id,
    pc.premio_nome,
    pc.premio_valor_estimado,
    pc.quantidade_conquistada,
    pc.valor_total_conquistado,
    pc.status
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
ORDER BY pc.campaign_id, pc.premio_nome;

-- 7. Calcular total
SELECT 
    'Total Final' as categoria,
    COUNT(*) as total_premios,
    SUM(pc.valor_total_conquistado) as valor_total
FROM public.premios_conquistados pc
JOIN public.users u ON pc.user_id = u.id
WHERE u.name ILIKE '%ERA SOLUCORES%'
AND pc.status = 'disponivel';
