-- Debug: Verificar campanhas aceitas para o usuário
SELECT 
    id,
    title,
    acceptance_status,
    accepted_at,
    accepted_by,
    status,
    is_active,
    criteria,
    created_at
FROM goals 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
  AND record_type = 'campaign'
ORDER BY created_at DESC;

-- Debug: Verificar se há campanhas aceitas
SELECT 
    COUNT(*) as total_campanhas,
    COUNT(CASE WHEN acceptance_status = 'accepted' THEN 1 END) as campanhas_aceitas,
    COUNT(CASE WHEN acceptance_status = 'pending' THEN 1 END) as campanhas_pendentes,
    COUNT(CASE WHEN acceptance_status = 'rejected' THEN 1 END) as campanhas_rejeitadas
FROM goals 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
  AND record_type = 'campaign';

-- Debug: Verificar critérios das campanhas aceitas
SELECT 
    id,
    title,
    criteria,
    acceptance_status
FROM goals 
WHERE user_id = '2cb2e9c9-182a-43a7-9c50-fcf34cd6451a'
  AND record_type = 'campaign'
  AND acceptance_status = 'accepted';


