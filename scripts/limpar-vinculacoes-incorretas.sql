-- Script para limpar vinculações incorretas e recalcular progresso

-- 1. Mostrar estado atual
SELECT 
    'VINCULAÇÕES ATUAIS' as info,
    COUNT(*) as total_links,
    COUNT(DISTINCT policy_id) as policies_distintas,
    COUNT(DISTINCT campaign_id) as campanhas_distintas
FROM policy_campaign_links
WHERE is_active = true;

-- 2. Mostrar vinculações por campanha
SELECT 
    g.title as campanha,
    COUNT(pcl.policy_id) as apolices_vinculadas,
    SUM(p.premium_value) as valor_total
FROM goals g
LEFT JOIN policy_campaign_links pcl ON g.id = pcl.campaign_id AND pcl.is_active = true
LEFT JOIN policies p ON pcl.policy_id = p.id AND p.status = 'active'
WHERE g.record_type = 'campaign'
GROUP BY g.id, g.title
ORDER BY g.title;

-- 3. Limpar TODAS as vinculações automáticas (manter apenas manuais se houver)
DELETE FROM policy_campaign_links 
WHERE linked_automatically = true;

-- 4. Resetar progresso das campanhas
UPDATE goals 
SET 
    current_value = 0,
    progress_percentage = 0,
    last_updated = NOW()
WHERE record_type = 'campaign';

-- 5. Verificar estado após limpeza
SELECT 
    'APÓS LIMPEZA' as info,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE is_active = true) as links_restantes,
    (SELECT COUNT(*) FROM goals WHERE record_type = 'campaign' AND current_value > 0) as campanhas_com_progresso
;
