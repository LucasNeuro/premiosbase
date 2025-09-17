-- Script para limpar campanhas duplicadas
-- Mantém apenas a campanha mais recente por usuário/título

-- 1. Identificar duplicatas
WITH campanhas_duplicadas AS (
    SELECT 
        id,
        user_id,
        title,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, title, start_date, end_date 
            ORDER BY created_at DESC
        ) as rn
    FROM goals 
    WHERE record_type = 'campaign'
)

-- 2. Deletar campanhas duplicadas (mantém a mais recente)
DELETE FROM goals 
WHERE id IN (
    SELECT id 
    FROM campanhas_duplicadas 
    WHERE rn > 1
);

-- 3. Verificar resultado
SELECT 
    'Campanhas restantes após limpeza' as status,
    COUNT(*) as total,
    COUNT(DISTINCT CONCAT(user_id, '-', title, '-', start_date, '-', end_date)) as campanhas_unicas
FROM goals 
WHERE record_type = 'campaign';

-- 4. Mostrar campanhas por usuário
SELECT 
    user_id,
    COUNT(*) as total_campanhas,
    STRING_AGG(title, ', ') as titulos
FROM goals 
WHERE record_type = 'campaign'
GROUP BY user_id
ORDER BY total_campanhas DESC;