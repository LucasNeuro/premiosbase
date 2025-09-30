-- premiosbase/sql_queries/35_verificar_estrutura_goals.sql
-- Script para verificar a estrutura real da tabela goals

-- 1. VERIFICAR ESTRUTURA DA TABELA GOALS
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as nullable,
    column_default as default_value
FROM information_schema.columns 
WHERE table_name = 'goals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS EXISTENTES NA TABELA GOALS
SELECT 
    'DADOS EXISTENTES EM GOALS:' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' THEN 1 END) as registros_usuario
FROM goals;

-- 3. VERIFICAR CAMPANHAS DO USUÁRIO (SEM USAR record_type)
SELECT 
    'CAMPANHAS DO USUÁRIO:' as info,
    id,
    title,
    description,
    target,
    unit,
    type,
    start_date,
    end_date,
    acceptance_status,
    is_active,
    created_at
FROM goals 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC
LIMIT 10;

-- 4. VERIFICAR APÓLICES DO USUÁRIO
SELECT 
    'APÓLICES DO USUÁRIO:' as info,
    id,
    policy_number,
    type,
    premium_value,
    registration_date,
    created_at
FROM policies 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC
LIMIT 10;

-- 5. VERIFICAR LINKS EXISTENTES
SELECT 
    'LINKS EXISTENTES:' as info,
    COUNT(*) as total_links,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' THEN 1 END) as links_usuario
FROM policy_campaign_links;

-- 6. VERIFICAR AUDITORIA EXISTENTE
SELECT 
    'AUDITORIA EXISTENTE:' as info,
    COUNT(*) as total_audit,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' THEN 1 END) as audit_usuario
FROM policy_launch_audit;
