-- Consulta para verificar campanha "NOVA NOVA" e corretores que receberam
-- Data: $(date)
-- Objetivo: Verificar distribuição da campanha para categoria específica

-- 1. DETALHES DA CAMPANHA
SELECT 
    '=== DETALHES DA CAMPANHA ===' as secao,
    g.id as campanha_id,
    g.title as nome_campanha,
    g.description as descricao,
    g.acceptance_status as status_aceitacao,
    g.created_at as data_criacao,
    g.updated_at as data_atualizacao,
    g.record_type as tipo_registro
FROM goals g 
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY g.created_at DESC;

-- 2. CORRETORES QUE RECEBERAM A CAMPANHA
SELECT 
    '=== CORRETORES QUE RECEBERAM ===' as secao,
    u.id as corretor_id,
    u.name as nome_corretor,
    u.email as email_corretor,
    u.cpf as cpf_corretor,
    u.phone as telefone,
    u.created_at as data_cadastro_corretor,
    g.title as nome_campanha,
    g.acceptance_status as status_campanha,
    g.created_at as data_criacao_campanha
FROM users u
INNER JOIN user_goals ug ON u.id = ug.user_id
INNER JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY u.name;

-- 3. STATUS DE ACEITAÇÃO DOS CORRETORES
SELECT 
    '=== STATUS DE ACEITAÇÃO ===' as secao,
    u.name as nome_corretor,
    u.email as email_corretor,
    g.title as nome_campanha,
    ug.accepted as aceitou_campanha,
    ug.accepted_at as data_aceitacao,
    ug.rejected_at as data_rejeicao,
    ug.created_at as data_recebimento
FROM users u
INNER JOIN user_goals ug ON u.id = ug.user_id
INNER JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY ug.accepted DESC, u.name;

-- 4. CATEGORIA VINCULADA À CAMPANHA
SELECT 
    '=== CATEGORIA DA CAMPANHA ===' as secao,
    g.title as nome_campanha,
    c.id as categoria_id,
    c.nome as nome_categoria,
    c.descricao as descricao_categoria,
    c.created_at as data_criacao_categoria
FROM goals g
LEFT JOIN goal_categories gc ON g.id = gc.goal_id
LEFT JOIN categories c ON gc.category_id = c.id
WHERE g.title ILIKE '%NOVA NOVA%';

-- 5. RESUMO ESTATÍSTICO
SELECT 
    '=== RESUMO ESTATÍSTICO ===' as secao,
    COUNT(DISTINCT u.id) as total_corretores_receberam,
    COUNT(CASE WHEN ug.accepted = true THEN 1 END) as corretores_aceitaram,
    COUNT(CASE WHEN ug.accepted = false THEN 1 END) as corretores_rejeitaram,
    COUNT(CASE WHEN ug.accepted IS NULL THEN 1 END) as corretores_pendentes,
    ROUND(
        (COUNT(CASE WHEN ug.accepted = true THEN 1 END) * 100.0 / COUNT(DISTINCT u.id)), 2
    ) as percentual_aceitacao
FROM users u
INNER JOIN user_goals ug ON u.id = ug.user_id
INNER JOIN goals g ON ug.goal_id = g.id
WHERE g.title ILIKE '%NOVA NOVA%';

-- 6. PRÊMIOS DA CAMPANHA
SELECT 
    '=== PRÊMIOS DA CAMPANHA ===' as secao,
    g.title as nome_campanha,
    p.nome as nome_premio,
    p.valor_estimado as valor_premio,
    cp.quantidade as quantidade_premio,
    (p.valor_estimado * cp.quantidade) as valor_total_premio
FROM goals g
INNER JOIN campanhas_premios cp ON g.id = cp.goal_id
INNER JOIN premios p ON cp.premio_id = p.id
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY p.valor_estimado DESC;

-- 7. CRITÉRIOS DA CAMPANHA
SELECT 
    '=== CRITÉRIOS DA CAMPANHA ===' as secao,
    g.title as nome_campanha,
    cc.policy_type as tipo_apolice,
    cc.target_type as tipo_meta,
    cc.target_value as valor_meta,
    cc.min_value_per_policy as valor_minimo_apolice,
    cc.contract_type as tipo_contrato,
    cc.order_index as ordem_criterio
FROM goals g
INNER JOIN campaign_criteria cc ON g.id = cc.goal_id
WHERE g.title ILIKE '%NOVA NOVA%'
ORDER BY cc.order_index;

-- 8. CORRETORES POR CATEGORIA (se houver categoria vinculada)
SELECT 
    '=== CORRETORES POR CATEGORIA ===' as secao,
    c.nome as nome_categoria,
    COUNT(DISTINCT u.id) as total_corretores_categoria,
    COUNT(CASE WHEN ug.accepted = true THEN 1 END) as aceitaram_campanha,
    COUNT(CASE WHEN ug.accepted = false THEN 1 END) as rejeitaram_campanha
FROM categories c
INNER JOIN user_categories uc ON c.id = uc.category_id
INNER JOIN users u ON uc.user_id = u.id
INNER JOIN user_goals ug ON u.id = ug.user_id
INNER JOIN goals g ON ug.goal_id = g.id
INNER JOIN goal_categories gc ON g.id = gc.goal_id AND gc.category_id = c.id
WHERE g.title ILIKE '%NOVA NOVA%'
GROUP BY c.id, c.nome
ORDER BY total_corretores_categoria DESC;
