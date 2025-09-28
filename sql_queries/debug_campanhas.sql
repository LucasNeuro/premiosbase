-- Debug: Verificar campanhas no banco
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existem campanhas na tabela goals
SELECT 
    id,
    title,
    record_type,
    campaign_type,
    is_active,
    created_at,
    user_id
FROM goals 
WHERE record_type = 'campaign'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar estrutura da tabela goals
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals' 
AND column_name IN ('record_type', 'campaign_type', 'is_active', 'user_id');

-- 3. Verificar se há campanhas compostas
SELECT 
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN campaign_type = 'composite' THEN 1 END) as campanhas_compostas,
    COUNT(CASE WHEN is_active = true THEN 1 END) as campanhas_ativas
FROM goals 
WHERE record_type = 'campaign';

-- 4. Verificar campanhas por usuário
SELECT 
    user_id,
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN is_active = true THEN 1 END) as campanhas_ativas
FROM goals 
WHERE record_type = 'campaign'
GROUP BY user_id
ORDER BY total_campanhas DESC;

-- 5. Verificar se há problemas de permissão
SELECT 
    schemaname,
    tablename,
    has_table_privilege('goals', 'SELECT') as can_select,
    has_table_privilege('goals', 'INSERT') as can_insert,
    has_table_privilege('goals', 'UPDATE') as can_update
FROM pg_tables 
WHERE tablename = 'goals';
