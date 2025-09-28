-- Script para corrigir limitações do schema do banco
-- Execute este script no Supabase SQL Editor

-- 1. Remover a limitação de progress_percentage <= 999
ALTER TABLE public.goals 
DROP CONSTRAINT IF EXISTS goals_progress_percentage_check;

-- 2. Adicionar nova constraint com limite mais alto (1000%)
ALTER TABLE public.goals 
ADD CONSTRAINT goals_progress_percentage_check 
CHECK (progress_percentage >= 0::numeric AND progress_percentage <= 1000::numeric);

-- 3. Verificar se a coluna premium_value tem limitações
-- (Se necessário, podemos ajustar também)

-- 4. Verificar estrutura atualizada
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
  AND column_name = 'progress_percentage';
