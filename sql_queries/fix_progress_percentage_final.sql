-- Script FINAL para corrigir progress_percentage
-- Execute este script no Supabase SQL Editor

-- 1. Verificar constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.goals'::regclass 
  AND conname LIKE '%progress%';

-- 2. Remover TODAS as constraints de progress_percentage
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_progress_percentage_check;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_progress_percentage_check1;
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_progress_percentage_check2;

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

-- 5. Testar inserção de valor alto
-- (Execute este teste para confirmar que funciona)
-- UPDATE public.goals 
-- SET progress_percentage = 150.50 
-- WHERE id = '4c5f4b1e-604f-4362-b877-fcbaf18188d6';
