-- Script para debugar dados de CPDs no banco
-- Verificar estrutura e dados dos CPDs

-- 1. Verificar estrutura da tabela users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('cpd', 'has_multiple_cpds')
ORDER BY ordinal_position;

-- 2. Verificar dados de CPDs dos usuários
SELECT 
    id,
    name,
    email,
    cpd,
    has_multiple_cpds,
    created_at
FROM users 
WHERE cpd IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar tipos de dados dos CPDs
SELECT 
    name,
    cpd,
    pg_typeof(cpd) as cpd_type,
    CASE 
        WHEN cpd IS NULL THEN 'NULL'
        WHEN jsonb_typeof(cpd) = 'object' THEN 'JSONB Object'
        WHEN jsonb_typeof(cpd) = 'array' THEN 'JSONB Array'
        WHEN jsonb_typeof(cpd) = 'string' THEN 'JSONB String'
        WHEN jsonb_typeof(cpd) = 'number' THEN 'JSONB Number'
        WHEN jsonb_typeof(cpd) = 'boolean' THEN 'JSONB Boolean'
        ELSE 'Unknown'
    END as cpd_json_type
FROM users 
WHERE cpd IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se há CPDs com estrutura específica
SELECT 
    name,
    cpd,
    CASE 
        WHEN cpd ? 'cpds' THEN 'Tem campo cpds'
        WHEN jsonb_typeof(cpd) = 'array' THEN 'É array direto'
        ELSE 'Outra estrutura'
    END as estrutura_cpd
FROM users 
WHERE cpd IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Contar usuários com e sem CPDs
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(cpd) as usuarios_com_cpd,
    COUNT(*) - COUNT(cpd) as usuarios_sem_cpd
FROM users;

-- 6. Verificar se há CPDs duplicados (devido à constraint unique)
SELECT 
    cpd,
    COUNT(*) as quantidade
FROM users 
WHERE cpd IS NOT NULL
GROUP BY cpd
HAVING COUNT(*) > 1;
