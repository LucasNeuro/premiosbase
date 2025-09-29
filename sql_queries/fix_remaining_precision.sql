-- Corrigir as 2 colunas que ainda estão com precisão 5
-- Execute este script no Supabase

-- 1. Corrigir progress_percentage na tabela goals
ALTER TABLE goals 
ALTER COLUMN progress_percentage TYPE NUMERIC(10,2);

-- 2. Corrigir progress_percentage na tabela master_campaigns_data  
ALTER TABLE master_campaigns_data 
ALTER COLUMN progress_percentage TYPE NUMERIC(10,2);

-- 3. Verificar se foi corrigido
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'numeric'
AND column_name = 'progress_percentage'
ORDER BY table_name, column_name;
