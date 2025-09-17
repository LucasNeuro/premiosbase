-- Testar a query exata que o hook está fazendo
-- Substitua 'fe445198-4f0a-4656-b85d-99e8125eb265' pelo user_id do corretor logado

SELECT 
    p.*,
    pcl.campaign_id,
    pcl.linked_at,
    pcl.linked_automatically,
    pcl.is_active as link_active,
    g.title as campaign_title
FROM policies p
LEFT JOIN policy_campaign_links pcl ON p.id = pcl.policy_id AND pcl.is_active = true
LEFT JOIN goals g ON pcl.campaign_id = g.id
WHERE p.user_id = 'fe445198-4f0a-4656-b85d-99e8125eb265'
AND p.status = 'active'
ORDER BY p.registration_date DESC;

-- Verificar se existem vinculações
SELECT 
    'VINCULAÇÕES PARA ESTE USER' as info,
    COUNT(*) as total
FROM policy_campaign_links pcl
JOIN policies p ON pcl.policy_id = p.id
WHERE p.user_id = 'fe445198-4f0a-4656-b85d-99e8125eb265';

-- Verificar campanhas aceitas pelo usuário
SELECT 
    'CAMPANHAS ACEITAS' as info,
    id,
    title,
    acceptance_status,
    status
FROM goals 
WHERE user_id = 'fe445198-4f0a-4656-b85d-99e8125eb265'
AND record_type = 'campaign'
AND acceptance_status = 'accepted';
