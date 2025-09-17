-- Script para zerar o progresso de campanhas que ainda não foram aceitas
-- Garantir que campanhas novas começam com 0% até serem aceitas

-- 1. Verificar campanhas com progresso > 0 mas ainda pendentes
SELECT 
    'Campanhas pendentes com progresso incorreto' as status,
    COUNT(*) as total,
    SUM(current_value) as valor_total_incorreto,
    AVG(progress_percentage) as progresso_medio_incorreto
FROM goals 
WHERE record_type = 'campaign'
AND acceptance_status = 'pending'
AND (current_value > 0 OR progress_percentage > 0);

-- 2. Mostrar detalhes das campanhas problemáticas
SELECT 
    id,
    title,
    current_value,
    progress_percentage,
    target,
    acceptance_status,
    created_at
FROM goals 
WHERE record_type = 'campaign'
AND acceptance_status = 'pending'
AND (current_value > 0 OR progress_percentage > 0)
ORDER BY created_at DESC;

-- 3. ZERAR o progresso de campanhas pendentes
UPDATE goals 
SET 
    current_value = 0,
    progress_percentage = 0,
    last_updated = NOW()
WHERE record_type = 'campaign'
AND acceptance_status = 'pending';

-- 4. Verificar resultado
SELECT 
    'Campanhas corrigidas' as status,
    COUNT(*) as total_campanhas_pendentes,
    SUM(current_value) as valor_total_apos_correcao,
    AVG(progress_percentage) as progresso_medio_apos_correcao
FROM goals 
WHERE record_type = 'campaign'
AND acceptance_status = 'pending';

-- 5. Confirmar que campanhas aceitas mantiveram seus dados
SELECT 
    acceptance_status,
    COUNT(*) as total_campanhas,
    AVG(progress_percentage) as progresso_medio,
    SUM(current_value) as valor_total
FROM goals 
WHERE record_type = 'campaign'
GROUP BY acceptance_status
ORDER BY acceptance_status;
