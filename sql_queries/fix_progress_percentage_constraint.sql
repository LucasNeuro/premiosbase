-- Script para corrigir constraint de progress_percentage
-- Execute este script no Supabase SQL Editor

-- 1. Verificar constraints existentes de progress_percentage
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.goals'::regclass 
  AND pg_get_constraintdef(oid) LIKE '%progress_percentage%';

-- 2. Remover constraint problemática (se existir)
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_progress_percentage_check;

-- 3. Adicionar nova constraint com limite mais alto
ALTER TABLE public.goals 
ADD CONSTRAINT goals_progress_percentage_check 
CHECK (progress_percentage >= 0::numeric AND progress_percentage <= 1000::numeric);

-- 4. Verificar se foi aplicado corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.goals'::regclass 
  AND conname = 'goals_progress_percentage_check';

-- 5. Testar se funciona (descomente para testar)
-- UPDATE public.goals 
-- SET progress_percentage = 150.50 
-- WHERE id = '4c5f4b1e-604f-4362-b877-fcbaf18188d6';
