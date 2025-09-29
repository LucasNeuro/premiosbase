-- Verificar se a precisão numérica foi corrigida
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND data_type = 'numeric'
AND table_name IN ('policies', 'goals', 'premios_conquistados', 'pedidos_premios', 'premios', 'master_campaigns_data')
ORDER BY table_name, column_name;
