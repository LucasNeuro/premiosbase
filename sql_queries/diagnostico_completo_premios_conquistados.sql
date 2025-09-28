-- DIAGNÓSTICO COMPLETO DA TABELA premios_conquistados
-- Execute no Supabase SQL Editor

-- 1. ESTRUTURA COMPLETA DA TABELA
SELECT 
    'ESTRUTURA DA TABELA:' as info,
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL",
    column_default as "Valor Padrão"
FROM information_schema.columns 
WHERE table_name = 'premios_conquistados'
ORDER BY ordinal_position;

-- 2. VER DADOS DE EXEMPLO (primeiros 3 registros)
SELECT 
    'DADOS DE EXEMPLO:' as info,
    *
FROM premios_conquistados 
LIMIT 3;

-- 3. VER QUANTIDADE TOTAL POR STATUS
SELECT 
    'QUANTIDADE POR STATUS:' as info,
    status,
    COUNT(*) as quantidade
FROM premios_conquistados 
GROUP BY status;

-- 4. VER USUÁRIOS COM PRÊMIOS
SELECT 
    'USUÁRIOS COM PRÊMIOS:' as info,
    user_id,
    COUNT(*) as total_premios,
    SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as disponiveis,
    SUM(CASE WHEN status = 'resgatado' THEN 1 ELSE 0 END) as resgatados
FROM premios_conquistados 
GROUP BY user_id
ORDER BY total_premios DESC;

-- 5. VER PRÊMIOS DISPONÍVEIS DE UM USUÁRIO ESPECÍFICO
-- (Substitua 'USER_ID_AQUI' pelo ID real do usuário que está testando)
SELECT 
    'PRÊMIOS DISPONÍVEIS DO USUÁRIO:' as info,
    id,
    user_id,
    campaign_title,
    premio_nome,
    premio_valor_estimado,
    quantidade_conquistada,
    valor_total_conquistado,
    status,
    created_at
FROM premios_conquistados 
WHERE user_id = 'USER_ID_AQUI'  -- SUBSTITUA PELO ID REAL
AND status = 'disponivel'
ORDER BY created_at DESC;
