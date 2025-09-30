-- premiosbase/sql_queries/37_script_simples_timeline.sql
-- Script simples para criar dados básicos do timeline

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. VERIFICAR DADOS EXISTENTES
SELECT 
    'VERIFICAÇÃO INICIAL:' as status,
    (SELECT COUNT(*) FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as apolices,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND acceptance_status = 'accepted') as campanhas_aceitas,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise;

-- 2. CRIAR CAMPANHA SIMPLES
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    acceptance_status, accepted_at, accepted_by, is_active
) 
VALUES (
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Timeline Teste',
    'Campanha para testar timeline',
    20000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true
)
ON CONFLICT DO NOTHING;

-- 3. CRIAR DADOS DE TESTE PARA TIMELINE
-- Primeiro, vamos pegar uma apólice existente
WITH apolice_teste AS (
    SELECT id, policy_number, type, premium_value
    FROM policies 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    LIMIT 1
),
campanha_teste AS (
    SELECT id, title
    FROM goals 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    AND acceptance_status = 'accepted'
    LIMIT 1
)
INSERT INTO policy_campaign_links (
    policy_id, campaign_id, user_id, linked_automatically, is_active, ai_confidence, ai_reasoning
)
SELECT 
    a.id as policy_id,
    c.id as campaign_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    true as linked_automatically,
    true as is_active,
    90 as ai_confidence,
    'Link de teste criado automaticamente - Apólice ' || a.policy_number || ' -> Campanha ' || c.title as ai_reasoning
FROM apolice_teste a
CROSS JOIN campanha_teste c
WHERE NOT EXISTS (
    SELECT 1 FROM policy_campaign_links pcl 
    WHERE pcl.policy_id = a.id 
    AND pcl.campaign_id = c.id
);

-- 4. CRIAR DADOS DE TESTE PARA AUDITORIA
WITH apolice_teste AS (
    SELECT id, policy_number, type, premium_value, cpd_number
    FROM policies 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    LIMIT 1
)
INSERT INTO policy_launch_audit (
    policy_id, user_id, policy_number, policy_type, contract_type, premium_value,
    cpd_number, cpd_name, linked_campaigns_count, ai_analysis
)
SELECT 
    a.id as policy_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    a.policy_number,
    a.type as policy_type,
    'Novo' as contract_type,
    a.premium_value,
    COALESCE(a.cpd_number, 'TESTE_' || EXTRACT(EPOCH FROM NOW())::text) as cpd_number,
    'CPD de Teste' as cpd_name,
    1 as linked_campaigns_count,
    '{"summary": "Análise de teste para ' || a.policy_number || '", "confidence": 85, "reasoning": "Teste do sistema de timeline"}'::jsonb as ai_analysis
FROM apolice_teste a
WHERE NOT EXISTS (
    SELECT 1 FROM policy_launch_audit pla 
    WHERE pla.policy_id = a.id
);

-- 5. VERIFICAR RESULTADOS
SELECT 
    'DADOS CRIADOS:' as status,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND acceptance_status = 'accepted') as campanhas_aceitas;

-- 6. MOSTRAR DADOS DO TIMELINE
SELECT 
    'TIMELINE CRIADO:' as info,
    pcl.policy_id,
    pcl.campaign_id,
    pcl.linked_automatically,
    pcl.ai_confidence,
    pcl.ai_reasoning,
    p.policy_number,
    g.title as campaign_title
FROM policy_campaign_links pcl
LEFT JOIN policies p ON pcl.policy_id = p.id
LEFT JOIN goals g ON pcl.campaign_id = g.id
WHERE pcl.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY pcl.created_at DESC;

-- 7. MOSTRAR DADOS DA ANÁLISE
SELECT 
    'ANÁLISE CRIADA:' as info,
    policy_number,
    policy_type,
    premium_value,
    linked_campaigns_count,
    ai_analysis->>'summary' as resumo_ia,
    created_at
FROM policy_launch_audit 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC;
