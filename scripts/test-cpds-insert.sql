-- Script para testar inserção de CPDs com diferentes estruturas
-- Execute este script para criar dados de teste

-- 1. Inserir usuário com CPD único (string)
INSERT INTO users (name, email, phone, cnpj, cpd, password_hash, is_admin)
VALUES (
    'Teste CPD Único',
    'teste.cpd.unico@exemplo.com',
    '11999999999',
    '12345678000199',
    'CPD-001',
    '$2b$10$test.hash',
    false
) ON CONFLICT (email) DO NOTHING;

-- 2. Inserir usuário com múltiplos CPDs (JSONB)
INSERT INTO users (name, email, phone, cnpj, cpd, password_hash, is_admin, has_multiple_cpds)
VALUES (
    'Teste CPDs Múltiplos',
    'teste.cpds.multiplos@exemplo.com',
    '11999999998',
    '12345678000198',
    '{"cpds": [{"id": "1", "number": "CPD-001", "name": "CPD Principal", "isActive": true}, {"id": "2", "number": "CPD-002", "name": "CPD Secundário", "isActive": true}]}',
    '$2b$10$test.hash',
    false,
    true
) ON CONFLICT (email) DO NOTHING;

-- 3. Inserir usuário com CPDs em array direto
INSERT INTO users (name, email, phone, cnpj, cpd, password_hash, is_admin, has_multiple_cpds)
VALUES (
    'Teste CPDs Array',
    'teste.cpds.array@exemplo.com',
    '11999999997',
    '12345678000197',
    '[{"id": "1", "number": "CPD-003", "name": "CPD Array 1", "isActive": true}, {"id": "2", "number": "CPD-004", "name": "CPD Array 2", "isActive": false}]',
    '$2b$10$test.hash',
    false,
    true
) ON CONFLICT (email) DO NOTHING;

-- 4. Verificar os dados inseridos
SELECT 
    name,
    email,
    cpd,
    has_multiple_cpds,
    pg_typeof(cpd) as cpd_type,
    CASE 
        WHEN cpd IS NULL THEN 'NULL'
        WHEN jsonb_typeof(cpd) = 'object' THEN 'JSONB Object'
        WHEN jsonb_typeof(cpd) = 'array' THEN 'JSONB Array'
        WHEN jsonb_typeof(cpd) = 'string' THEN 'JSONB String'
        ELSE 'Unknown'
    END as cpd_json_type
FROM users 
WHERE email LIKE 'teste.cpd%'
ORDER BY created_at DESC;
