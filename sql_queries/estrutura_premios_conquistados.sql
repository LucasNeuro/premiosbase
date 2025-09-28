-- ESTRUTURA DA TABELA premios_conquistados
-- Execute no Supabase SQL Editor

-- 1. VER COLUNAS DA TABELA premios_conquistados
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL",
    column_default as "Valor Padrão"
FROM information_schema.columns 
WHERE table_name = 'premios_conquistados'
ORDER BY ordinal_position;

-- 2. VER ALGUNS DADOS DE EXEMPLO
SELECT 
    id,
    user_id,
    campaign_id,
    campaign_title,
    premio_id,
    premio_nome,
    premio_valor_estimado,
    quantidade_conquistada,
    valor_total_conquistado,
    status,
    created_at
FROM premios_conquistados 
LIMIT 5;

-- 3. VER QUANTIDADE TOTAL DE REGISTROS
SELECT 
    'TOTAL DE REGISTROS:' as info,
    COUNT(*) as total
FROM premios_conquistados;

-- 4. VER STATUS DOS PRÊMIOS
SELECT 
    status,
    COUNT(*) as quantidade
FROM premios_conquistados 
GROUP BY status;
