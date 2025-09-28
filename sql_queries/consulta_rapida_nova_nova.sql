-- CONSULTA RÁPIDA: Campanha "NOVA NOVA" - Corretores que receberam
-- Execute esta consulta no Supabase SQL Editor

-- 1. DETALHES BÁSICOS DA CAMPANHA
SELECT 
    g.id,
    g.title as "Nome da Campanha",
    g.acceptance_status as "Status",
    g.created_at as "Data de Criação"
FROM goals g 
WHERE g.title ILIKE '%NOVA NOVA%';

-- 2. CORRETORES QUE RECEBERAM + STATUS
SELECT 
    u.name as "Nome do Corretor",
    u.email as "Email",
    u.cpf as "CPF",
    ug.accepted as "Aceitou?",
    ug.accepted_at as "Data Aceitação",
    ug.created_at as "Data Recebimento"
FROM users u
INNER JOIN user_goals ug ON u.id = ug.user_id
INNER JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY ug.accepted DESC, u.name;

-- 3. RESUMO RÁPIDO
SELECT 
    COUNT(*) as "Total Corretores",
    COUNT(CASE WHEN ug.accepted = true THEN 1 END) as "Aceitaram",
    COUNT(CASE WHEN ug.accepted = false THEN 1 END) as "Rejeitaram",
    COUNT(CASE WHEN ug.accepted IS NULL THEN 1 END) as "Pendentes"
FROM users u
INNER JOIN user_goals ug ON u.id = ug.user_id
INNER JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%';
