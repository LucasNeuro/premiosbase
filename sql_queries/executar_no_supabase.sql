-- ========================================
-- CONSULTA PARA CAMPANHA "NOVA NOVA"
-- Execute no Supabase SQL Editor
-- ========================================

-- PASSO 1: Verificar se a campanha existe
SELECT 
    'CAMPANHA ENCONTRADA:' as info,
    id,
    title,
    acceptance_status,
    created_at
FROM goals 
WHERE title ILIKE '%NOVA NOVA%';

-- PASSO 2: Listar todos os corretores que receberam
SELECT 
    'CORRETORES QUE RECEBERAM:' as info,
    u.name as corretor,
    u.email,
    u.cpf,
    CASE 
        WHEN ug.accepted = true THEN '✅ ACEITOU'
        WHEN ug.accepted = false THEN '❌ REJEITOU' 
        ELSE '⏳ PENDENTE'
    END as status,
    ug.accepted_at as data_aceitacao,
    ug.created_at as data_recebimento
FROM users u
JOIN user_goals ug ON u.id = ug.user_id
JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY ug.accepted DESC, u.name;

-- PASSO 3: Estatísticas resumidas
SELECT 
    'ESTATÍSTICAS:' as info,
    COUNT(*) as total_corretores,
    COUNT(CASE WHEN ug.accepted = true THEN 1 END) as aceitaram,
    COUNT(CASE WHEN ug.accepted = false THEN 1 END) as rejeitaram,
    COUNT(CASE WHEN ug.accepted IS NULL THEN 1 END) as pendentes,
    ROUND(
        (COUNT(CASE WHEN ug.accepted = true THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as percentual_aceitacao
FROM users u
JOIN user_goals ug ON u.id = ug.user_id
JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%';

-- PASSO 4: Verificar categoria (se houver)
SELECT 
    'CATEGORIA DA CAMPANHA:' as info,
    c.nome as categoria,
    c.descricao as descricao_categoria
FROM goals g
LEFT JOIN goal_categories gc ON g.id = gc.goal_id
LEFT JOIN categories c ON gc.category_id = c.id
WHERE g.title ILIKE '%NOVA NOVA%';
