-- Script para testar atualização de notificações
-- Simular o que o frontend faz

-- 1. Verificar notificações não lidas antes da atualização
SELECT 
    'ANTES DA ATUALIZAÇÃO' as status,
    id,
    user_id,
    type,
    title,
    is_read,
    read_at
FROM notifications 
WHERE is_read = false
ORDER BY created_at DESC
LIMIT 5;

-- 2. Atualizar uma notificação específica (substitua o ID pela notificação que você quer testar)
-- UPDATE notifications 
-- SET 
--     is_read = true,
--     read_at = NOW()
-- WHERE id = 'SUBSTITUA_PELO_ID_DA_NOTIFICACAO'
-- AND is_read = false;

-- 3. Atualizar todas as notificações não lidas de um usuário específico
-- UPDATE notifications 
-- SET 
--     is_read = true,
--     read_at = NOW()
-- WHERE user_id = 'SUBSTITUA_PELO_USER_ID'
-- AND is_read = false;

-- 4. Verificar notificações não lidas após a atualização
SELECT 
    'APÓS ATUALIZAÇÃO' as status,
    id,
    user_id,
    type,
    title,
    is_read,
    read_at
FROM notifications 
WHERE is_read = false
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar notificações lidas
SELECT 
    'NOTIFICAÇÕES LIDAS' as status,
    id,
    user_id,
    type,
    title,
    is_read,
    read_at
FROM notifications 
WHERE is_read = true
ORDER BY read_at DESC
LIMIT 5;
