-- ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT 
    t.table_name as tabela,
    c.column_name as coluna,
    c.data_type as tipo,
    c.is_nullable as nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN ('goals', 'policies', 'premios', 'premios_conquistados', 'pedidos_premios', 'campanhas_premios', 'policy_campaign_links', 'users')
ORDER BY t.table_name, c.ordinal_position;
