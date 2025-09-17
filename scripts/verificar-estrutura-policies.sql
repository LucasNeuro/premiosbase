-- Verificar se a tabela policies existe
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name IN ('policies', 'policy_campaign_links', 'goals')
AND table_schema = 'public';

-- Verificar colunas da tabela policies
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'policies' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se existe algum dado
SELECT 
    (SELECT COUNT(*) FROM policies) as total_policies,
    (SELECT COUNT(*) FROM policy_campaign_links) as total_links,
    (SELECT COUNT(*) FROM goals WHERE record_type = 'campaign') as total_campaigns;

