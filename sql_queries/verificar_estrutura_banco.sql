-- Verificar estrutura da tabela policies
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'policies' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela policy_campaign_links
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'policy_campaign_links' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
