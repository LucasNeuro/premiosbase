-- premiosbase/sql_queries/32_verificar_tabelas_timeline.sql
-- Script para verificar tabelas do timeline e criar dados de teste

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. VERIFICAR TABELAS DO TIMELINE
SELECT 
    'TABELAS DO TIMELINE:' as info,
    'policy_campaign_links' as tabela_timeline,
    'policy_launch_audit' as tabela_analise;

-- 2. VERIFICAR DADOS EM policy_campaign_links (TIMELINE)
SELECT 
    'policy_campaign_links - TIMELINE:' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' THEN 1 END) as registros_usuario,
    COUNT(CASE WHEN is_active = true THEN 1 END) as registros_ativos
FROM policy_campaign_links;

-- 3. VERIFICAR DADOS EM policy_launch_audit (ANÁLISE)
SELECT 
    'policy_launch_audit - ANÁLISE:' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' THEN 1 END) as registros_usuario,
    COUNT(CASE WHEN ai_analysis IS NOT NULL THEN 1 END) as com_analise_ia
FROM policy_launch_audit;

-- 4. VERIFICAR APÓLICES DO USUÁRIO
SELECT 
    'policies - APÓLICES:' as tabela,
    COUNT(*) as total_apolices,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' THEN 1 END) as apolices_usuario
FROM policies;

-- 5. VERIFICAR CAMPANHAS DO USUÁRIO
SELECT 
    'goals - CAMPANHAS:' as tabela,
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted' THEN 1 END) as campanhas_aceitas_usuario
FROM goals;

-- 6. CRIAR CAMPANHA DE TESTE SIMPLES (SEM ON CONFLICT)
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    record_type, campaign_type, target_type, acceptance_status, accepted_at, accepted_by, is_active,
    created_at, updated_at
) 
SELECT 
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    'Campanha Teste Timeline' as title,
    'Campanha para testar o timeline' as description,
    20000 as target,
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
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM goals 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' 
    AND title = 'Campanha Teste Timeline'
);

-- 7. CRIAR DADOS DE TESTE PARA policy_campaign_links (TIMELINE)
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
    policy_id, campaign_id, user_id, linked_automatically, is_active, ai_confidence, ai_reasoning,
    created_at, updated_at
)
SELECT 
    up.id as policy_id,
    uc.id as campaign_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    true as linked_automatically,
    true as is_active,
    95 as ai_confidence,
    'Vinculação automática para teste do timeline - Apólice ' || up.policy_number || ' vinculada à campanha ' || uc.title as ai_reasoning,
    NOW() as created_at,
    NOW() as updated_at
FROM user_policies up
CROSS JOIN user_campaign uc
WHERE NOT EXISTS (
    SELECT 1 FROM policy_campaign_links pcl 
    WHERE pcl.policy_id = up.id 
    AND pcl.campaign_id = uc.id
);

-- 8. CRIAR DADOS DE TESTE PARA policy_launch_audit (ANÁLISE)
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
    cpd_number, cpd_name, linked_campaigns_count, linked_campaigns_details, ai_analysis,
    created_at, updated_at
)
SELECT 
    up.id as policy_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    up.policy_number,
    up.type as policy_type,
    'Novo' as contract_type,
    up.premium_value,
    'AUDIT_' || EXTRACT(EPOCH FROM NOW())::text as cpd_number,
    'Sistema de Auditoria' as cpd_name,
    1 as linked_campaigns_count,
    jsonb_build_object(
        'total_campaigns', 1,
        'compatible_campaigns', 1,
        'incompatible_campaigns', 0,
        'audit_timestamp', NOW()::text
    ) as linked_campaigns_details,
    jsonb_build_object(
        'summary', 'Auditoria automática: Apólice ' || up.policy_number || ' analisada e vinculada com sucesso.',
        'confidence', 95,
        'audit_timestamp', NOW()::text,
        'criteriaMatch', true,
        'matchedCriteria', ARRAY['Tipo de seguro compatível', 'Valor adequado']::text[],
        'unmatchedCriteria', ARRAY[]::text[],
        'suggestions', ARRAY['Continue com esse perfil de cliente']::text[],
        'reasoning', 'Apólice ' || up.policy_number || ' atende aos critérios da campanha',
        'recommendation', 'aceitar'
    ) as ai_analysis,
    NOW() as created_at,
    NOW() as updated_at
FROM user_policies up
WHERE NOT EXISTS (
    SELECT 1 FROM policy_launch_audit pla 
    WHERE pla.policy_id = up.id
);

-- 9. VERIFICAR DADOS CRIADOS
SELECT 
    'DADOS CRIADOS COM SUCESSO!' as status,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas_aceitas;

-- 10. MOSTRAR DADOS DO TIMELINE
SELECT 
    'DADOS DO TIMELINE (policy_campaign_links):' as info,
    policy_id,
    campaign_id,
    linked_automatically,
    ai_confidence,
    ai_reasoning,
    linked_at
FROM policy_campaign_links 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY linked_at DESC;

-- 11. MOSTRAR DADOS DA ANÁLISE
SELECT 
    'DADOS DA ANÁLISE (policy_launch_audit):' as info,
    policy_number,
    policy_type,
    premium_value,
    linked_campaigns_count,
    ai_analysis->>'summary' as resumo_ia
FROM policy_launch_audit 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC;
