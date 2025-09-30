-- premiosbase/sql_queries/34_script_basico_timeline.sql
-- Script básico para criar dados do timeline sem problemas

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. VERIFICAR DADOS EXISTENTES
SELECT 
    'VERIFICAÇÃO INICIAL:' as status,
    (SELECT COUNT(*) FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as apolices,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise;

-- 2. CRIAR CAMPANHA BÁSICA
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    record_type, campaign_type, target_type, acceptance_status, accepted_at, accepted_by, is_active
) 
VALUES (
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Básica Timeline',
    'Campanha básica para testar timeline',
    10000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'campaign',
    'simple',
    'individual',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true
);

-- 3. VERIFICAR APÓLICES DISPONÍVEIS
SELECT 
    'APÓLICES DO USUÁRIO:' as info,
    id,
    policy_number,
    type,
    premium_value
FROM policies 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC
LIMIT 5;

-- 4. CRIAR LINKS BÁSICOS PARA TIMELINE
-- Usando dados diretos sem CTEs complexos
INSERT INTO policy_campaign_links (
    policy_id, campaign_id, user_id, linked_automatically, is_active, ai_confidence, ai_reasoning
)
SELECT 
    p.id as policy_id,
    g.id as campaign_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    true as linked_automatically,
    true as is_active,
    85 as ai_confidence,
    'Link básico para teste - Apólice ' || p.policy_number || ' -> Campanha ' || g.title as ai_reasoning
FROM policies p
CROSS JOIN goals g
WHERE p.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
AND g.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
AND g.record_type = 'campaign'
AND g.acceptance_status = 'accepted'
AND NOT EXISTS (
    SELECT 1 FROM policy_campaign_links pcl 
    WHERE pcl.policy_id = p.id 
    AND pcl.campaign_id = g.id
)
LIMIT 3;

-- 5. CRIAR AUDITORIA BÁSICA PARA ANÁLISE
-- Usando JSON simples
INSERT INTO policy_launch_audit (
    policy_id, user_id, policy_number, policy_type, contract_type, premium_value,
    cpd_number, cpd_name, linked_campaigns_count, ai_analysis
)
SELECT 
    p.id as policy_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    p.policy_number,
    p.type as policy_type,
    'Novo' as contract_type,
    p.premium_value,
    'BASICO_' || EXTRACT(EPOCH FROM NOW())::text as cpd_number,
    'Sistema Básico' as cpd_name,
    1 as linked_campaigns_count,
    '{"summary": "Análise básica para ' || p.policy_number || '", "confidence": 80}'::jsonb as ai_analysis
FROM policies p
WHERE p.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
AND NOT EXISTS (
    SELECT 1 FROM policy_launch_audit pla 
    WHERE pla.policy_id = p.id
)
LIMIT 3;

-- 6. VERIFICAR RESULTADOS
SELECT 
    'DADOS CRIADOS:' as status,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas_aceitas;

-- 7. MOSTRAR DADOS DO TIMELINE
SELECT 
    'DADOS DO TIMELINE:' as info,
    policy_id,
    campaign_id,
    linked_automatically,
    ai_confidence,
    ai_reasoning
FROM policy_campaign_links 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC;

-- 8. MOSTRAR DADOS DA ANÁLISE
SELECT 
    'DADOS DA ANÁLISE:' as info,
    policy_number,
    policy_type,
    premium_value,
    linked_campaigns_count,
    ai_analysis->>'summary' as resumo_ia
FROM policy_launch_audit 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC;
