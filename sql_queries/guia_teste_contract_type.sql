-- GUIA DE TESTE PARA CONTRACT_TYPE
-- Execute no Supabase SQL Editor

-- PASSO 1: CRIAR CAMPANHAS DE TESTE
-- Execute o arquivo: criar_campanha_teste_contract_type.sql

-- PASSO 2: VERIFICAR CAMPANHAS CRIADAS
SELECT 
    'CAMPANHAS DE TESTE CRIADAS:' as info,
    id,
    title,
    criteria
FROM goals 
WHERE title LIKE 'TESTE CONTRACT TYPE%'
ORDER BY created_at DESC;

-- PASSO 3: CRIAR APÓLICES DE TESTE COM DIFERENTES TIPOS
-- Apólice NOVO
INSERT INTO policies (
    id,
    policy_number,
    type,
    contract_type,
    premium_value,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TESTE-NOVO-001',
    'Seguro Auto',
    'Novo',
    5000,
    'active',
    NOW(),
    NOW()
);

-- Apólice RENOVAÇÃO
INSERT INTO policies (
    id,
    policy_number,
    type,
    contract_type,
    premium_value,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TESTE-RENOV-001',
    'Seguro Auto',
    'Renovação Bradesco',
    5000,
    'active',
    NOW(),
    NOW()
);

-- PASSO 4: VERIFICAR APÓLICES CRIADAS
SELECT 
    'APÓLICES DE TESTE CRIADAS:' as info,
    id,
    policy_number,
    type,
    contract_type,
    premium_value
FROM policies 
WHERE policy_number LIKE 'TESTE-%'
ORDER BY created_at DESC;

-- PASSO 5: TESTAR VINCULAÇÃO MANUAL
-- Vincular apólice NOVO à campanha NOVO (deve aceitar)
-- Vincular apólice RENOVAÇÃO à campanha RENOVAÇÃO (deve aceitar)
-- Vincular apólice NOVO à campanha RENOVAÇÃO (deve rejeitar)
-- Vincular apólice RENOVAÇÃO à campanha NOVO (deve rejeitar)
-- Vincular qualquer apólice à campanha AMBOS (deve aceitar)

-- PASSO 6: VERIFICAR RESULTADOS
SELECT 
    'RESULTADO DOS TESTES:' as info,
    g.title as campanha,
    p.policy_number,
    p.contract_type as tipo_apolice,
    CASE 
        WHEN g.title LIKE '%NOVO%' AND p.contract_type = 'Novo' THEN '✅ DEVE ACEITAR'
        WHEN g.title LIKE '%RENOVAÇÃO%' AND p.contract_type = 'Renovação Bradesco' THEN '✅ DEVE ACEITAR'
        WHEN g.title LIKE '%AMBOS%' THEN '✅ DEVE ACEITAR'
        WHEN g.title LIKE '%NOVO%' AND p.contract_type = 'Renovação Bradesco' THEN '❌ DEVE REJEITAR'
        WHEN g.title LIKE '%RENOVAÇÃO%' AND p.contract_type = 'Novo' THEN '❌ DEVE REJEITAR'
        ELSE '⚠️ CASO NÃO COBERTO'
    END as resultado_esperado
FROM goals g
CROSS JOIN policies p
WHERE g.title LIKE 'TESTE CONTRACT TYPE%'
AND p.policy_number LIKE 'TESTE-%';
