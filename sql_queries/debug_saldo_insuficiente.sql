-- DEBUG: Problema "Saldo insuficiente" no resgate de prêmios
-- Execute no Supabase SQL Editor para diagnosticar

-- 1. VERIFICAR SE A FUNÇÃO EXISTE
SELECT 
    'VERIFICANDO FUNÇÃO verificar_saldo_suficiente:' as debug,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'verificar_saldo_suficiente';

-- 2. VERIFICAR PRÊMIOS CONQUISTADOS DO USUÁRIO
-- (Substitua 'USER_ID_AQUI' pelo ID real do usuário)
SELECT 
    'PRÊMIOS CONQUISTADOS:' as debug,
    id,
    user_id,
    premio_nome,
    premio_valor_estimado,
    quantidade_conquistada,
    valor_total_conquistado,
    status,
    created_at
FROM premios_conquistados 
WHERE user_id = 'USER_ID_AQUI'  -- SUBSTITUA PELO ID REAL
ORDER BY created_at DESC;

-- 3. CALCULAR SALDO MANUALMENTE
SELECT 
    'CÁLCULO MANUAL DO SALDO:' as debug,
    COUNT(*) as total_premios,
    SUM(valor_total_conquistado) as saldo_total,
    SUM(CASE WHEN status = 'disponivel' THEN valor_total_conquistado ELSE 0 END) as saldo_disponivel,
    SUM(CASE WHEN status = 'resgatado' THEN valor_total_conquistado ELSE 0 END) as ja_resgatado
FROM premios_conquistados 
WHERE user_id = 'USER_ID_AQUI'  -- SUBSTITUA PELO ID REAL
AND status IN ('disponivel', 'resgatado');

-- 4. VERIFICAR PEDIDOS PENDENTES
SELECT 
    'PEDIDOS PENDENTES:' as debug,
    COUNT(*) as total_pedidos,
    SUM(valor_total) as valor_pendente
FROM pedidos_premios 
WHERE user_id = 'USER_ID_AQUI'  -- SUBSTITUA PELO ID REAL
AND status = 'pending';

-- 5. TESTAR A FUNÇÃO DIRETAMENTE
-- (Substitua os valores pelos reais)
SELECT 
    'TESTE DA FUNÇÃO:' as debug,
    verificar_saldo_suficiente(
        'USER_ID_AQUI',  -- SUBSTITUA PELO ID REAL
        100.00          -- SUBSTITUA PELO VALOR REAL
    ) as resultado_teste;

-- 6. VERIFICAR ESTRUTURA DA TABELA premios_conquistados
SELECT 
    'ESTRUTURA DA TABELA:' as debug,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'premios_conquistados'
ORDER BY ordinal_position;
