-- Script para limpar vinculações de apólices criadas ANTES de aceitar as campanhas
-- Isso garante que só contem apólices vinculadas APÓS a aceitação

-- 1. Verificar quantas vinculações problemáticas existem
SELECT 
    'Vinculações problemáticas encontradas' as status,
    COUNT(*) as total_vinculos_antigos
FROM policy_campaign_links pcl
INNER JOIN goals g ON pcl.campaign_id = g.id 
WHERE g.record_type = 'campaign'
AND g.acceptance_status = 'accepted'
AND g.accepted_at IS NOT NULL
AND pcl.created_at < g.accepted_at;

-- 2. Mostrar detalhes das vinculações problemáticas
SELECT 
    g.title as campanha,
    g.accepted_at as aceita_em,
    pcl.created_at as vinculo_criado_em,
    pcl.policy_id,
    p.policy_number as numero_apolice,
    p.premium_value as valor_premio
FROM policy_campaign_links pcl
INNER JOIN goals g ON pcl.campaign_id = g.id 
INNER JOIN policies p ON pcl.policy_id = p.id
WHERE g.record_type = 'campaign'
AND g.acceptance_status = 'accepted'
AND g.accepted_at IS NOT NULL
AND pcl.created_at < g.accepted_at
ORDER BY g.title, pcl.created_at;

-- 3. DELETAR as vinculações antigas (CUIDADO: execute apenas se tiver certeza!)
-- DELETE FROM policy_campaign_links 
-- WHERE id IN (
--     SELECT pcl.id
--     FROM policy_campaign_links pcl
--     INNER JOIN goals g ON pcl.campaign_id = g.id 
--     WHERE g.record_type = 'campaign'
--     AND g.acceptance_status = 'accepted'
--     AND g.accepted_at IS NOT NULL
--     AND pcl.created_at < g.accepted_at
-- );

-- 4. Resetar progresso das campanhas para 0
UPDATE goals 
SET 
    current_value = 0,
    progress_percentage = 0,
    last_updated = NOW()
WHERE record_type = 'campaign'
AND acceptance_status = 'accepted';

-- 5. Verificar resultado
SELECT 
    'Campanhas resetadas' as status,
    COUNT(*) as total_campanhas
FROM goals 
WHERE record_type = 'campaign'
AND acceptance_status = 'accepted'
AND current_value = 0;
