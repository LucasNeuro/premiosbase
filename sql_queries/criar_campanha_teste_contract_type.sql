-- CRIAR CAMPANHA DE TESTE PARA VERIFICAR CONTRACT_TYPE
-- Execute no Supabase SQL Editor

-- 1. CRIAR CAMPANHA DE TESTE PARA "NOVO"
INSERT INTO goals (
    id,
    title,
    description,
    type,
    target,
    start_date,
    end_date,
    record_type,
    is_active,
    criteria,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TESTE CONTRACT TYPE - NOVO',
    'Campanha de teste para verificar se apólices NOVO são aceitas corretamente',
    'valor',
    10000,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'campaign',
    true,
    '[
        {
            "id": "1",
            "policy_type": "auto",
            "target_type": "value",
            "target_value": 10000,
            "min_value_per_policy": 1000,
            "contract_type": "novo",
            "order_index": 1
        }
    ]'::jsonb,
    NOW(),
    NOW()
);

-- 2. CRIAR CAMPANHA DE TESTE PARA "RENOVAÇÃO"
INSERT INTO goals (
    id,
    title,
    description,
    type,
    target,
    start_date,
    end_date,
    record_type,
    is_active,
    criteria,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TESTE CONTRACT TYPE - RENOVAÇÃO',
    'Campanha de teste para verificar se apólices RENOVAÇÃO são aceitas corretamente',
    'valor',
    10000,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'campaign',
    true,
    '[
        {
            "id": "1",
            "policy_type": "auto",
            "target_type": "value",
            "target_value": 10000,
            "min_value_per_policy": 1000,
            "contract_type": "renovacao_bradesco",
            "order_index": 1
        }
    ]'::jsonb,
    NOW(),
    NOW()
);

-- 3. CRIAR CAMPANHA DE TESTE PARA "AMBOS"
INSERT INTO goals (
    id,
    title,
    description,
    type,
    target,
    start_date,
    end_date,
    record_type,
    is_active,
    criteria,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'TESTE CONTRACT TYPE - AMBOS',
    'Campanha de teste para verificar se apólices AMBOS são aceitas corretamente',
    'valor',
    10000,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'campaign',
    true,
    '[
        {
            "id": "1",
            "policy_type": "auto",
            "target_type": "value",
            "target_value": 10000,
            "min_value_per_policy": 1000,
            "contract_type": "ambos",
            "order_index": 1
        }
    ]'::jsonb,
    NOW(),
    NOW()
);

-- 4. VERIFICAR AS CAMPANHAS CRIADAS
SELECT 
    'CAMPANHAS DE TESTE CRIADAS:' as info,
    id,
    title,
    criteria
FROM goals 
WHERE title LIKE 'TESTE CONTRACT TYPE%'
ORDER BY created_at DESC;
