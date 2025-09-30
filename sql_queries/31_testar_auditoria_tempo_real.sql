-- premiosbase/sql_queries/31_testar_auditoria_tempo_real.sql
-- Script para testar o sistema de auditoria em tempo real

-- ID do usuário: 2cb2e9c9-182a-43a7-9c50-fcf34cd6451a

-- 1. Verificar dados existentes
SELECT 
    'Dados atuais do sistema:' as status,
    (SELECT COUNT(*) FROM policies WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as apolices_existentes,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas_aceitas,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as audit_existentes,
    (SELECT COUNT(*) FROM policy_campaign_links WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as links_existentes;

-- 2. Criar campanhas de teste com critérios específicos
INSERT INTO goals (
    user_id, title, description, target, unit, type, start_date, end_date,
    record_type, campaign_type, target_type, acceptance_status, accepted_at, accepted_by, is_active,
    criteria, created_at, updated_at
) VALUES 
(
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Auto Premium',
    'Campanha para seguros auto com valor premium',
    50000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '60 days',
    'campaign',
    'simple',
    'individual',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true,
    jsonb_build_object(
        'min_premium_value', 2000,
        'max_premium_value', 15000,
        'allowed_types', ARRAY['Seguro Auto']::text[],
        'min_contract_age', 0,
        'max_contract_age', 365
    ),
    NOW(),
    NOW()
),
(
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Residencial Básica',
    'Campanha para seguros residenciais básicos',
    30000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '45 days',
    'campaign',
    'simple',
    'individual',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true,
    jsonb_build_object(
        'min_premium_value', 500,
        'max_premium_value', 5000,
        'allowed_types', ARRAY['Seguro Residencial']::text[],
        'min_contract_age', 0,
        'max_contract_age', 365
    ),
    NOW(),
    NOW()
),
(
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    'Campanha Universal',
    'Campanha que aceita todos os tipos de seguro',
    100000,
    'reais',
    'valor',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    'campaign',
    'simple',
    'individual',
    'accepted',
    NOW(),
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a',
    true,
    jsonb_build_object(
        'min_premium_value', 100,
        'max_premium_value', 50000,
        'allowed_types', ARRAY['Seguro Auto', 'Seguro Residencial']::text[],
        'min_contract_age', 0,
        'max_contract_age', 365
    ),
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Verificar campanhas criadas
SELECT 
    'Campanhas criadas:' as info,
    id,
    title,
    criteria
FROM goals 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' 
AND record_type = 'campaign' 
AND acceptance_status = 'accepted'
ORDER BY created_at DESC;

-- 4. Criar dados de teste para auditoria (simulando apólices já analisadas)
WITH 
    suas_apolices AS (
        SELECT id, policy_number, type, premium_value, registration_date
        FROM policies 
        WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
        ORDER BY created_at DESC 
        LIMIT 3
    ),
    suas_campanhas AS (
        SELECT id, title, criteria
        FROM goals 
        WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' 
        AND record_type = 'campaign' 
        AND acceptance_status = 'accepted'
        ORDER BY created_at DESC
        LIMIT 3
    )
INSERT INTO policy_launch_audit (
    policy_id, user_id, policy_number, policy_type, contract_type, premium_value,
    cpd_number, cpd_name, linked_campaigns_count, linked_campaigns_details, ai_analysis,
    created_at, updated_at
)
SELECT 
    sa.id as policy_id,
    '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' as user_id,
    sa.policy_number,
    sa.type as policy_type,
    'Novo' as contract_type,
    sa.premium_value,
    'AUDIT_' || EXTRACT(EPOCH FROM NOW())::text as cpd_number,
    'Sistema de Auditoria' as cpd_name,
    (SELECT COUNT(*) FROM suas_campanhas) as linked_campaigns_count,
    jsonb_build_object(
        'total_campaigns', (SELECT COUNT(*) FROM suas_campanhas),
        'compatible_campaigns', 
        CASE 
            WHEN sa.type = 'Seguro Auto' AND sa.premium_value >= 2000 THEN 2
            WHEN sa.type = 'Seguro Residencial' AND sa.premium_value >= 500 THEN 1
            ELSE 1
        END,
        'incompatible_campaigns',
        CASE 
            WHEN sa.type = 'Seguro Auto' AND sa.premium_value < 2000 THEN 1
            WHEN sa.type = 'Seguro Residencial' AND sa.premium_value < 500 THEN 2
            ELSE 0
        END,
        'audit_timestamp', NOW()::text
    ) as linked_campaigns_details,
    jsonb_build_object(
        'summary', 'Auditoria automática: Apólice ' || sa.policy_number || ' analisada contra ' || (SELECT COUNT(*) FROM suas_campanhas) || ' campanhas ativas. Sistema determinou compatibilidade baseada em critérios específicos.',
        'confidence', 
        CASE 
            WHEN sa.type = 'Seguro Auto' AND sa.premium_value >= 2000 THEN 95
            WHEN sa.type = 'Seguro Residencial' AND sa.premium_value >= 500 THEN 90
            ELSE 75
        END,
        'audit_timestamp', NOW()::text,
        'analyses', jsonb_build_array(
            jsonb_build_object(
                'campaignId', (SELECT id FROM suas_campanhas LIMIT 1),
                'campaignTitle', (SELECT title FROM suas_campanhas LIMIT 1),
                'isCompatible', 
                CASE 
                    WHEN sa.type = 'Seguro Auto' AND sa.premium_value >= 2000 THEN true
                    WHEN sa.type = 'Seguro Residencial' AND sa.premium_value >= 500 THEN true
                    ELSE false
                END,
                'confidence', 
                CASE 
                    WHEN sa.type = 'Seguro Auto' AND sa.premium_value >= 2000 THEN 95
                    WHEN sa.type = 'Seguro Residencial' AND sa.premium_value >= 500 THEN 90
                    ELSE 60
                END,
                'matchedCriteria', 
                CASE 
                    WHEN sa.type = 'Seguro Auto' AND sa.premium_value >= 2000 THEN 
                        ARRAY['Tipo de seguro compatível', 'Valor adequado para campanha premium']::text[]
                    WHEN sa.type = 'Seguro Residencial' AND sa.premium_value >= 500 THEN 
                        ARRAY['Tipo de seguro compatível', 'Valor adequado para campanha básica']::text[]
                    ELSE 
                        ARRAY['Tipo de seguro compatível']::text[]
                END,
                'unmatchedCriteria', 
                CASE 
                    WHEN sa.type = 'Seguro Auto' AND sa.premium_value < 2000 THEN 
                        ARRAY['Valor abaixo do mínimo para campanha premium']::text[]
                    WHEN sa.type = 'Seguro Residencial' AND sa.premium_value < 500 THEN 
                        ARRAY['Valor abaixo do mínimo para campanha básica']::text[]
                    ELSE 
                        ARRAY[]::text[]
                END,
                'reasoning', 'Análise automática baseada em critérios específicos da campanha'
            )
        )
    ) as ai_analysis,
    NOW() as created_at,
    NOW() as updated_at
FROM suas_apolices sa
WHERE NOT EXISTS (
    SELECT 1 FROM policy_launch_audit pla 
    WHERE pla.policy_id = sa.id
);

-- 5. Verificar dados finais
SELECT 
    'Sistema de auditoria configurado com sucesso!' as status,
    (SELECT COUNT(*) FROM goals WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a' AND record_type = 'campaign' AND acceptance_status = 'accepted') as campanhas_configuradas,
    (SELECT COUNT(*) FROM policy_launch_audit WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a') as auditorias_criadas;

-- 6. Mostrar exemplo de dados de auditoria
SELECT 
    'Exemplo de auditoria:' as info,
    policy_number,
    policy_type,
    premium_value,
    linked_campaigns_count,
    ai_analysis->>'summary' as resumo_ia
FROM policy_launch_audit 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
ORDER BY created_at DESC
LIMIT 1;
