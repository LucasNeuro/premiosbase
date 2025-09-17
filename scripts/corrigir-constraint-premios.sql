-- ===============================================
-- CORRIGIR CONSTRAINT ÚNICA EM CAMPANHAS_PREMIOS
-- ===============================================

-- 1. VERIFICAR CONSTRAINT ATUAL
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'campanhas_premios' 
AND constraint_type = 'UNIQUE';

-- 2. VERIFICAR DUPLICATAS EXISTENTES
SELECT 
    goal_id,
    premio_id,
    COUNT(*) as duplicatas
FROM campanhas_premios
GROUP BY goal_id, premio_id
HAVING COUNT(*) > 1;

-- 3. REMOVER CONSTRAINT PROBLEMÁTICA (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'campanhas_premios' 
        AND constraint_name = 'campanhas_premios_unique'
    ) THEN
        ALTER TABLE campanhas_premios DROP CONSTRAINT campanhas_premios_unique;
        RAISE NOTICE 'Constraint campanhas_premios_unique removida';
    END IF;
END $$;

-- 4. REMOVER DUPLICATAS (manter apenas a mais recente)
DELETE FROM campanhas_premios 
WHERE id NOT IN (
    SELECT DISTINCT ON (goal_id, premio_id) id
    FROM campanhas_premios
    ORDER BY goal_id, premio_id, created_at DESC
);

-- 5. CRIAR NOVA CONSTRAINT MAIS FLEXÍVEL (apenas se necessário)
-- Comentado por enquanto - vamos testar sem constraint única primeiro
/*
ALTER TABLE campanhas_premios 
ADD CONSTRAINT campanhas_premios_goal_premio_unique 
UNIQUE (goal_id, premio_id);
*/

-- 6. VERIFICAR RESULTADO
SELECT 
    'LIMPEZA CONCLUÍDA' as status,
    COUNT(*) as total_vinculacoes,
    COUNT(DISTINCT goal_id) as campanhas_com_premio,
    COUNT(DISTINCT premio_id) as premios_vinculados
FROM campanhas_premios;
