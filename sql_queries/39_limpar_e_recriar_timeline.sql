-- premiosbase/sql_queries/39_limpar_e_recriar_timeline.sql
-- Script para limpar dados antigos e criar dados organizados do timeline

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. LIMPAR DADOS ANTIGOS
DELETE FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a';
DELETE FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a';

-- 2. VERIFICAR DADOS LIMPOS
SELECT 
    'DADOS LIMPOS:' as status,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise;

-- 3. CRIAR CAMPANHA DE TESTE ORGANIZADA
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    acceptance_status, accepted_at, accepted_by, is_active
) 
VALUES (
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Renovação Bradesco',
    'Campanha focada em renovações Bradesco com critérios específicos',
    50000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '60 days',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true
)
ON CONFLICT DO NOTHING;

-- 4. CRIAR DADOS DE TIMELINE ORGANIZADOS
-- Pegar uma apólice de "Renovação Bradesco" (compatível)
WITH apolice_compativel AS (
    SELECT id, policy_number, type, premium_value
    FROM policies 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    AND contract_type = 'Renovação Bradesco'
    LIMIT 1
),
-- Pegar uma apólice "Novo" (incompatível)
apolice_incompativel AS (
    SELECT id, policy_number, type, premium_value
    FROM policies 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    AND contract_type = 'Novo'
    LIMIT 1
),
campanha_teste AS (
    SELECT id, title
    FROM goals 
    WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
    AND acceptance_status = 'accepted'
    LIMIT 1
)
-- Criar link COMPATÍVEL
INSERT INTO policy_campaign_links (
    policy_id, campaign_id, user_id, linked_automatically, is_active, ai_confidence, ai_reasoning
)
SELECT 
    a.id as policy_id,
    c.id as campaign_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    true as linked_automatically,
    true as is_active, -- COMPATÍVEL
    95 as ai_confidence,
    '✅ COMPATÍVEL: Apólice ' || a.policy_number || ' atende aos critérios da campanha ' || c.title || ' (Renovação Bradesco)' as ai_reasoning
FROM apolice_compativel a
CROSS JOIN campanha_teste c
WHERE a.id IS NOT NULL;

-- Criar link INCOMPATÍVEL
INSERT INTO policy_campaign_links (
    policy_id, campaign_id, user_id, linked_automatically, is_active, ai_confidence, ai_reasoning
)
SELECT 
    a.id as policy_id,
    c.id as campaign_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    true as linked_automatically,
    false as is_active, -- INCOMPATÍVEL
    25 as ai_confidence,
    '❌ INCOMPATÍVEL: Apólice ' || a.policy_number || ' NÃO atende aos critérios da campanha ' || c.title || ' (contrato Novo vs Renovação Bradesco)' as ai_reasoning
FROM apolice_incompativel a
CROSS JOIN campanha_teste c
WHERE a.id IS NOT NULL;

-- 5. CRIAR AUDITORIA ORGANIZADA
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
    COALESCE(a.contract_type, 'Novo') as contract_type,
    a.premium_value,
    COALESCE(a.cpd_number, 'AUDIT_ORG') as cpd_number,
    'CPD Organizado' as cpd_name,
    2 as linked_campaigns_count, -- 1 compatível + 1 incompatível
    '{"summary": "Análise organizada: 1 campanha compatível, 1 incompatível", "confidence": 60, "reasoning": "Sistema funcionando corretamente com dados organizados"}'::jsonb as ai_analysis
FROM apolice_teste a;

-- 6. VERIFICAR RESULTADOS FINAIS
SELECT 
    'DADOS ORGANIZADOS CRIADOS:' as status,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_timeline,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND is_active = true) as links_compatíveis,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND is_active = false) as links_incompatíveis,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_analise;

-- 7. MOSTRAR DADOS DO TIMELINE ORGANIZADO
SELECT 
    'TIMELINE ORGANIZADO:' as info,
    pcl.id as link_id,
    pcl.policy_id,
    pcl.campaign_id,
    pcl.linked_automatically,
    pcl.is_active,
    CASE 
        WHEN pcl.is_active = true THEN '✅ COMPATÍVEL'
        ELSE '❌ INCOMPATÍVEL'
    END as status,
    pcl.ai_confidence,
    pcl.ai_reasoning,
    p.policy_number,
    p.contract_type,
    g.title as campaign_title,
    pcl.created_at
FROM policy_campaign_links pcl
LEFT JOIN policies p ON pcl.policy_id = p.id
LEFT JOIN goals g ON pcl.campaign_id = g.id
WHERE pcl.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY pcl.created_at DESC;

-- 8. MOSTRAR DADOS DA AUDITORIA ORGANIZADA
SELECT 
    'AUDITORIA ORGANIZADA:' as info,
    pla.id as audit_id,
    pla.policy_number,
    pla.policy_type,
    pla.contract_type,
    pla.premium_value,
    pla.linked_campaigns_count,
    pla.ai_analysis->>'summary' as resumo_ia,
    pla.created_at
FROM policy_launch_audit pla
WHERE pla.user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY pla.created_at DESC;
