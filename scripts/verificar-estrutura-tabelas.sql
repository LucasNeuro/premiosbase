-- ===============================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- ===============================================

-- 1. VERIFICAR SE TABELA policy_campaign_links EXISTE
SELECT 
    'TABELA policy_campaign_links' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policy_campaign_links') 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as status;

-- 2. VERIFICAR SE TABELA policies EXISTE
SELECT 
    'TABELA policies' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policies') 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as status;

-- 3. VERIFICAR ESTRUTURA DA TABELA goals
SELECT 
    'CAMPOS DA TABELA goals' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS NA TABELA goals
SELECT 
    'DADOS goals' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE record_type = 'campaign') as campanhas
FROM goals;

-- 5. VERIFICAR DADOS NA TABELA campanhas_premios
SELECT 
    'DADOS campanhas_premios' as info,
    COUNT(*) as total_vinculacoes
FROM campanhas_premios;

