-- Script para encontrar funções e triggers que validam CNPJ
-- Execute este script primeiro para identificar o que precisa ser corrigido

-- 1. Listar todos os triggers na tabela users
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'users'
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. Listar todas as funções que podem validar CNPJ
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    pg_get_functiondef(p.oid) ILIKE '%cnpj%' OR
    pg_get_functiondef(p.oid) ILIKE '%CNPJ%'
)
ORDER BY p.proname;

-- 3. Verificar constraints na tabela users
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
ORDER BY conname;
