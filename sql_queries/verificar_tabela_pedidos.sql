-- VERIFICAR SE A TABELA pedidos_premios EXISTE
-- Execute no Supabase SQL Editor

-- 1. VER SE A TABELA EXISTE
SELECT 
    'TABELA pedidos_premios:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'pedidos_premios';

-- 2. SE EXISTIR, VER SUA ESTRUTURA
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL"
FROM information_schema.columns 
WHERE table_name = 'pedidos_premios'
ORDER BY ordinal_position;

-- 3. VER DADOS DE EXEMPLO (se existir)
SELECT * FROM pedidos_premios LIMIT 3;

-- 4. VER TODAS AS TABELAS QUE CONTÊM 'pedido' OU 'order'
SELECT 
    'TABELAS RELACIONADAS:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%pedido%' OR 
    table_name ILIKE '%order%' OR
    table_name ILIKE '%redemption%'
)
ORDER BY table_name;
