-- premiosbase/sql_queries/38_teste_direto_timeline.sql
-- Teste direto para verificar se o sistema de timeline está funcionando

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. VERIFICAR SE EXISTEM DADOS BÁSICOS
SELECT 
    'DADOS BÁSICOS:' as info,
    (SELECT COUNT(*) FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as apolices,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as goals,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit;

-- 2. SE NÃO HOUVER DADOS, CRIAR DADOS DE TESTE MÍNIMOS
-- Criar uma apólice de teste se não existir
INSERT INTO policies (
    user_id, policy_number, type, premium_value, contract_type, cpd_number, status
)
SELECT 
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'TESTE_' || EXTRACT(EPOCH FROM NOW())::text,
    'Seguro Auto',
    5000,
    'Novo',
    'CPD_TESTE',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
);

-- Criar uma campanha de teste se não existir
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    acceptance_status, accepted_at, accepted_by, is_active
)
SELECT 
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Teste Timeline',
    'Campanha para testar o sistema de timeline',
    10000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND acceptance_status = 'accepted'
);

-- 3. CRIAR LINK DE TESTE
WITH apolice_teste AS (
    SELECT id, policy_number
    FROM policies 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    ORDER BY created_at DESC
    LIMIT 1
),
campanha_teste AS (
    SELECT id, title
    FROM goals 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    AND acceptance_status = 'accepted'
    ORDER BY created_at DESC
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
    95 as ai_confidence,
    'Link de teste criado - Apólice ' || a.policy_number || ' -> Campanha ' || c.title as ai_reasoning
FROM apolice_teste a
CROSS JOIN campanha_teste c
WHERE NOT EXISTS (
    SELECT 1 FROM policy_campaign_links pcl 
    WHERE pcl.policy_id = a.id 
    AND pcl.campaign_id = c.id
);

-- 4. CRIAR AUDITORIA DE TESTE
WITH apolice_teste AS (
    SELECT id, policy_number, type, premium_value, cpd_number
    FROM policies 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    ORDER BY created_at DESC
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
    COALESCE(a.cpd_number, 'TESTE_AUDIT') as cpd_number,
    'CPD de Teste' as cpd_name,
    1 as linked_campaigns_count,
    '{"summary": "Análise de teste para ' || a.policy_number || '", "confidence": 90, "reasoning": "Teste do sistema de auditoria"}'::jsonb as ai_analysis
FROM apolice_teste a
WHERE NOT EXISTS (
    SELECT 1 FROM policy_launch_audit pla 
    WHERE pla.policy_id = a.id
);

-- 5. VERIFICAR RESULTADOS FINAIS
SELECT 
    'RESULTADOS FINAIS:' as info,
    (SELECT COUNT(*) FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as apolices,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND acceptance_status = 'accepted') as campanhas_aceitas,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise;

-- 6. MOSTRAR DADOS CRIADOS
SELECT 
    'DADOS DO TIMELINE:' as info,
    pcl.id as link_id,
    pcl.policy_id,
    pcl.campaign_id,
    pcl.linked_automatically,
    pcl.ai_confidence,
    pcl.ai_reasoning,
    p.policy_number,
    g.title as campaign_title,
    pcl.created_at
FROM policy_campaign_links pcl
LEFT JOIN policies p ON pcl.policy_id = p.id
LEFT JOIN goals g ON pcl.campaign_id = g.id
WHERE pcl.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY pcl.created_at DESC;

-- 7. MOSTRAR DADOS DA AUDITORIA
SELECT 
    'DADOS DA AUDITORIA:' as info,
    pla.id as audit_id,
    pla.policy_number,
    pla.policy_type,
    pla.premium_value,
    pla.linked_campaigns_count,
    pla.ai_analysis->>'summary' as resumo_ia,
    pla.created_at
FROM policy_launch_audit pla
WHERE pla.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY pla.created_at DESC;
