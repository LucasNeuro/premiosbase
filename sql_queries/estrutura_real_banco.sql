-- ESTRUTURA REAL DO BANCO DE DADOS
-- Execute no Supabase SQL Editor para descobrir as tabelas corretas

-- 1. VER TODAS AS TABELAS
SELECT 
    table_name as "Nome da Tabela",
    table_type as "Tipo"
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VER COLUNAS DA TABELA 'users' (se existir)
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL"
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. VER COLUNAS DA TABELA 'goals' (se existir)
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL"
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 4. VER COLUNAS DA TABELA 'user_goals' (se existir)
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL"
FROM information_schema.columns 
WHERE table_name = 'user_goals'
ORDER BY ordinal_position;

-- 5. VER COLUNAS DA TABELA 'campanhas_premios' (se existir)
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL"
FROM information_schema.columns 
WHERE table_name = 'campanhas_premios'
ORDER BY ordinal_position;

-- 6. VER COLUNAS DA TABELA 'premios' (se existir)
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Pode ser NULL"
FROM information_schema.columns 
WHERE table_name = 'premios'
ORDER BY ordinal_position;
