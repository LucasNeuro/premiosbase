-- Script para verificar estrutura real do banco de dados

-- 1. Verificar todas as tabelas existentes
SELECT 
    'Tabelas Existentes' as categoria,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar se existe tabela de prêmios
SELECT 
    'Tabelas de Prêmios' as categoria,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%premio%'
ORDER BY table_name;

-- 3. Verificar se existe tabela de escolhas
SELECT 
    'Tabelas de Escolhas' as categoria,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%escolha%'
ORDER BY table_name;

-- 4. Verificar estrutura da tabela goals
SELECT 
    'Estrutura da Tabela Goals' as categoria,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar se existe tabela premios_conquistados
SELECT 
    'Verificação premios_conquistados' as categoria,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premios_conquistados' AND table_schema = 'public') 
        THEN '✅ Tabela existe'
        ELSE '❌ Tabela não existe'
    END as status;

-- 6. Verificar se existe tabela pedidos_premios
SELECT 
    'Verificação pedidos_premios' as categoria,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos_premios' AND table_schema = 'public') 
        THEN '✅ Tabela existe'
        ELSE '❌ Tabela não existe'
    END as status;
