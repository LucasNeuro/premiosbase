-- Script para debugar notificações
-- Verificar estrutura da tabela e dados

-- 1. Verificar estrutura da tabela notifications
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar todas as notificações
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    read_at,
    created_at
FROM notifications 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar notificações não lidas
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    read_at,
    created_at
FROM notifications 
WHERE is_read = false
ORDER BY created_at DESC;

-- 4. Verificar notificações lidas
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    read_at,
    created_at
FROM notifications 
WHERE is_read = true
ORDER BY created_at DESC
LIMIT 5;

-- 5. Contar notificações por status
SELECT 
    is_read,
    COUNT(*) as total
FROM notifications 
GROUP BY is_read;

-- 6. Verificar se há notificações sem user_id
SELECT 
    COUNT(*) as notificacoes_sem_user_id
FROM notifications 
WHERE user_id IS NULL;
