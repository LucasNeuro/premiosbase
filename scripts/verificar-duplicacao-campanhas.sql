-- Script para verificar problema de duplicação de campanhas em grupo

-- 1. Verificar se há corretores duplicados nas categorias
SELECT 
    'CORRETORES POR CATEGORIA' as info,
    categoria_id,
    corretor_id,
    COUNT(*) as quantidade_registros
FROM corretores_categorias 
GROUP BY categoria_id, corretor_id
HAVING COUNT(*) > 1
ORDER BY quantidade_registros DESC;

-- 2. Verificar campanhas criadas para o mesmo usuário no mesmo período
SELECT 
    'CAMPANHAS DUPLICADAS RECENTES' as info,
    user_id,
    title,
    start_date,
    end_date,
    target_type,
    COUNT(*) as quantidade_campanhas,
    STRING_AGG(id::text, ', ') as campaign_ids
FROM goals 
WHERE record_type = 'campaign' 
    AND created_at >= CURRENT_DATE
GROUP BY user_id, title, start_date, end_date, target_type
HAVING COUNT(*) > 1
ORDER BY quantidade_campanhas DESC;

-- 3. Verificar estrutura atual da tabela corretores_categorias
SELECT 
    cc.categoria_id,
    cat.nome as categoria_nome,
    cc.corretor_id,
    u.name as corretor_nome,
    u.email as corretor_email,
    COUNT(g.id) as campanhas_criadas_hoje
FROM corretores_categorias cc
LEFT JOIN categorias_corretores cat ON cc.categoria_id = cat.id
LEFT JOIN users u ON cc.corretor_id = u.id
LEFT JOIN goals g ON g.user_id = cc.corretor_id 
    AND g.created_at >= CURRENT_DATE 
    AND g.record_type = 'campaign'
GROUP BY cc.categoria_id, cat.nome, cc.corretor_id, u.name, u.email
ORDER BY cat.nome, u.name;

-- 4. Verificar último log de criação de campanha em grupo
SELECT 
    'ÚLTIMAS CAMPANHAS CRIADAS' as info,
    id,
    user_id,
    title,
    target_type,
    campaign_type,
    created_at,
    target_category_id
FROM goals 
WHERE record_type = 'campaign'
    AND created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 20;
