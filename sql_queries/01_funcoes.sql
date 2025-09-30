-- FUNÇÕES CUSTOMIZADAS
SELECT 
    p.proname as funcao,
    pg_get_function_result(p.oid) as retorno,
    pg_get_function_arguments(p.oid) as argumentos
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
