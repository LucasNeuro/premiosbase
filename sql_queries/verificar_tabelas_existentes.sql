-- VERIFICAR TABELAS EXISTENTES NO BANCO
-- Execute no Supabase SQL Editor

-- 1. LISTAR TODAS AS TABELAS
SELECT 
    'TODAS AS TABELAS:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. PROCURAR TABELAS RELACIONADAS A PRÊMIOS
SELECT 
    'TABELAS DE PRÊMIOS:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%premio%' OR 
    table_name ILIKE '%prize%' OR 
    table_name ILIKE '%conquistado%' OR
    table_name ILIKE '%conquered%'
)
ORDER BY table_name;

-- 3. PROCURAR TABELAS RELACIONADAS A PEDIDOS
SELECT 
    'TABELAS DE PEDIDOS:' as info,
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

-- 4. VERIFICAR ESTRUTURA DAS TABELAS DE USUÁRIOS E METAS
SELECT 
    'TABELAS PRINCIPAIS:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('users', 'goals', 'user_goals', 'campanhas_premios', 'premios')
ORDER BY table_name;
