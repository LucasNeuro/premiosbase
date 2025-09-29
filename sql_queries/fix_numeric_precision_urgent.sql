-- CORREÇÃO URGENTE DA PRECISÃO NUMÉRICA
-- Execute este script no Supabase para corrigir o erro de overflow

-- 1. Remover views que podem estar bloqueando
DROP VIEW IF EXISTS v_monthly_sales CASCADE;
DROP VIEW IF EXISTS v_campaign_progress CASCADE;
DROP VIEW IF EXISTS v_policy_summary CASCADE;
DROP VIEW IF EXISTS v_prize_summary CASCADE;
DROP VIEW IF EXISTS v_broker_performance CASCADE;
DROP VIEW IF EXISTS v_policy_distribution CASCADE;

-- 2. Corrigir precisão das colunas principais
ALTER TABLE policies 
ALTER COLUMN premium_value TYPE NUMERIC(10,2);

ALTER TABLE goals 
ALTER COLUMN target TYPE NUMERIC(10,2),
ALTER COLUMN current_value TYPE NUMERIC(10,2),
ALTER COLUMN achieved_value TYPE NUMERIC(10,2);

ALTER TABLE premios_conquistados 
ALTER COLUMN premio_valor_estimado TYPE NUMERIC(10,2),
ALTER COLUMN valor_total_conquistado TYPE NUMERIC(10,2);

ALTER TABLE pedidos_premios 
ALTER COLUMN premio_valor_estimado TYPE NUMERIC(10,2),
ALTER COLUMN valor_total TYPE NUMERIC(10,2);

ALTER TABLE premios 
ALTER COLUMN valor_estimado TYPE NUMERIC(10,2);

ALTER TABLE master_campaigns_data 
ALTER COLUMN target TYPE NUMERIC(10,2),
ALTER COLUMN current_value TYPE NUMERIC(10,2);

-- 3. Verificar se funcionou
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
