-- premiosbase/sql_queries/33_script_simples_timeline.sql
-- Script simples para criar dados do timeline sem triggers problemáticos

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. VERIFICAR DADOS EXISTENTES
SELECT 
    'VERIFICAÇÃO INICIAL:' as status,
    (SELECT COUNT(*) FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as apolices,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise;

-- 2. CRIAR CAMPANHA SIMPLES (SEM TRIGGERS PROBLEMÁTICOS)
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    record_type, campaign_type, target_type, acceptance_status, accepted_at, accepted_by, is_active
) 
SELECT 
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    'Campanha Timeline Simples' as title,
    'Campanha para testar timeline' as description,
    15000 as target,
    'reais' as unit,
    'valor' as type,
    CURRENT_DATE as start_date,
    CURRENT_DATE + INTERVAL '30 days' as end_date,
    'campaign' as record_type,
    'simple' as campaign_type,
    'individual' as target_type,
    'accepted' as acceptance_status,
    NOW() as accepted_at,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as accepted_by,
    true as is_active
WHERE NOT EXISTS (
    SELECT 1 FROM goals 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' 
    AND title = 'Campanha Timeline Simples'
);

-- 3. CRIAR DADOS SIMPLES PARA policy_campaign_links (TIMELINE)
-- Primeiro, vamos ver se existem apólices
SELECT 
    'APÓLICES DISPONÍVEIS:' as info,
    id,
    policy_number,
    type,
    premium_value
FROM policies 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC
LIMIT 3;

-- 4. CRIAR LINKS SIMPLES (SEM JSON COMPLEXO)
WITH 
    user_policies AS (
        SELECT id, policy_number, type, premium_value
        FROM policies 
        WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
        ORDER BY created_at DESC 
        LIMIT 2
    ),
    user_campaign AS (
        SELECT id, title
        FROM goals 
        WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' 
        AND record_type = 'campaign' 
        AND acceptance_status = 'accepted'
        ORDER BY created_at DESC
        LIMIT 1
    )
INSERT INTO policy_campaign_links (
    policy_id, campaign_id, user_id, linked_automatically, is_active, ai_confidence, ai_reasoning
)
SELECT 
    up.id as policy_id,
    uc.id as campaign_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    true as linked_automatically,
    true as is_active,
    90 as ai_confidence,
    'Teste do timeline - Apólice ' || up.policy_number || ' vinculada à campanha ' || uc.title as ai_reasoning
FROM user_policies up
CROSS JOIN user_campaign uc
WHERE NOT EXISTS (
    SELECT 1 FROM policy_campaign_links pcl 
    WHERE pcl.policy_id = up.id 
    AND pcl.campaign_id = uc.id
);

-- 5. CRIAR DADOS SIMPLES PARA policy_launch_audit (ANÁLISE)
-- Usando JSON simples para evitar problemas com triggers
WITH 
    user_policies AS (
        SELECT id, policy_number, type, premium_value
        FROM policies 
        WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
        ORDER BY created_at DESC 
        LIMIT 2
    )
INSERT INTO policy_launch_audit (
    policy_id, user_id, policy_number, policy_type, contract_type, premium_value,
    cpd_number, cpd_name, linked_campaigns_count, ai_analysis
)
SELECT 
    up.id as policy_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    up.policy_number,
    up.type as policy_type,
    'Novo' as contract_type,
    up.premium_value,
    'TESTE_' || EXTRACT(EPOCH FROM NOW())::text as cpd_number,
    'Sistema de Teste' as cpd_name,
    1 as linked_campaigns_count,
    '{"summary": "Análise de teste para apólice ' || up.policy_number || '", "confidence": 85, "criteriaMatch": true}'::jsonb as ai_analysis
FROM user_policies up
WHERE NOT EXISTS (
    SELECT 1 FROM policy_launch_audit pla 
    WHERE pla.policy_id = up.id
);

-- 6. VERIFICAR DADOS CRIADOS
SELECT 
    'DADOS CRIADOS COM SUCESSO!' as status,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas_aceitas;

-- 7. MOSTRAR DADOS DO TIMELINE (SIMPLES)
SELECT 
    'TIMELINE (policy_campaign_links):' as info,
    policy_id,
    campaign_id,
    linked_automatically,
    ai_confidence,
    ai_reasoning
FROM policy_campaign_links 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC;

-- 8. MOSTRAR DADOS DA ANÁLISE (SIMPLES)
SELECT 
    'ANÁLISE (policy_launch_audit):' as info,
    policy_number,
    policy_type,
    premium_value,
    linked_campaigns_count,
    ai_analysis->>'summary' as resumo_ia
FROM policy_launch_audit 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC;
