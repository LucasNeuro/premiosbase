-- TESTAR APÓLICES COM DIFERENTES TIPOS DE CONTRATO
-- Execute no Supabase SQL Editor

-- 1. VER APÓLICES EXISTENTES E SEUS TIPOS DE CONTRATO
SELECT 
    'APÓLICES EXISTENTES:' as info,
    id,
    policy_number,
    type,
    contract_type,
    premium_value,
    created_at
FROM policies 
ORDER BY created_at DESC
LIMIT 10;

-- 2. VER CAMPANHAS DE TESTE CRIADAS
SELECT 
    'CAMPANHAS DE TESTE:' as info,
    id,
    title,
    criteria
FROM goals 
WHERE title LIKE 'TESTE CONTRACT TYPE%'
ORDER BY created_at DESC;

-- 3. VER APÓLICES VINCULADAS ÀS CAMPANHAS
SELECT 
    'APÓLICES VINCULADAS:' as info,
    pcl.campaign_id,
    g.title as campaign_title,
    p.policy_number,
    p.type as policy_type,
    p.contract_type,
    p.premium_value,
    pcl.created_at as vinculada_em
FROM policy_campaign_links pcl
JOIN goals g ON pcl.campaign_id = g.id
JOIN policies p ON pcl.policy_id = p.id
WHERE g.title LIKE 'TESTE CONTRACT TYPE%'
ORDER BY pcl.created_at DESC;

-- 4. VER PROGRESSO DAS CAMPANHAS DE TESTE
SELECT 
    'PROGRESSO DAS CAMPANHAS:' as info,
    g.title,
    g.criteria,
    COUNT(pcl.id) as total_vinculadas,
    SUM(p.premium_value) as valor_total
FROM goals g
LEFT JOIN policy_campaign_links pcl ON g.id = pcl.campaign_id
LEFT JOIN policies p ON pcl.policy_id = p.id
WHERE g.title LIKE 'TESTE CONTRACT TYPE%'
GROUP BY g.id, g.title, g.criteria
ORDER BY g.created_at DESC;
