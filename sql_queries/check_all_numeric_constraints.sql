-- Script para verificar todas as limitações numéricas no banco
-- Execute este script no Supabase SQL Editor

-- 1. Verificar constraints de goals
SELECT 
    'goals' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.goals'::regclass 
  AND pg_get_constraintdef(oid) LIKE '%numeric%'

UNION ALL

-- 2. Verificar constraints de policies
SELECT 
    'policies' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.policies'::regclass 
  AND pg_get_constraintdef(oid) LIKE '%numeric%'

UNION ALL

-- 3. Verificar constraints de policy_campaign_links
SELECT 
    'policy_campaign_links' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.policy_campaign_links'::regclass 
  AND pg_get_constraintdef(oid) LIKE '%numeric%'

ORDER BY table_name, constraint_name;

-- 4. Verificar estrutura de colunas numéricas
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND data_type = 'numeric'
  AND table_name IN ('goals', 'policies', 'policy_campaign_links')
ORDER BY table_name, column_name;
