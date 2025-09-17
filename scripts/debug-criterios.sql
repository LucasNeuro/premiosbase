-- Debug: Verificar critérios das campanhas
SELECT 
    id,
    title,
    criteria,
    LENGTH(criteria) as criteria_length,
    CASE 
        WHEN criteria IS NULL THEN 'NULL'
        WHEN criteria = '' THEN 'EMPTY'
        WHEN criteria LIKE '[%]' THEN 'ARRAY_JSON'
        WHEN criteria LIKE '{%}' THEN 'OBJECT_JSON'
        ELSE 'OTHER'
    END as criteria_type,
    acceptance_status,
    accepted_at
FROM goals 
WHERE record_type = 'campaign' 
AND title LIKE '%TESTE%'
ORDER BY created_at DESC;
