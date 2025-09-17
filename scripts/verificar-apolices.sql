-- Verificar dados na tabela policies
SELECT 
    'TOTAL DE POLÍTICAS' as info,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas,
    COUNT(CASE WHEN status != 'active' THEN 1 END) as inativas
FROM policies;

-- Verificar políticas por usuário
SELECT 
    user_id,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies
FROM policies 
GROUP BY user_id
ORDER BY total_policies DESC;

-- Verificar vinculações
SELECT 
    'VINCULAÇÕES' as info,
    COUNT(*) as total_links,
    COUNT(CASE WHEN is_active = true THEN 1 END) as links_ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as links_inativos
FROM policy_campaign_links;

-- Exemplo de políticas (primeiras 5)
SELECT 
    id, 
    user_id, 
    policy_number, 
    type, 
    premium_value, 
    status,
    registration_date
FROM policies 
ORDER BY registration_date DESC 
LIMIT 5;
