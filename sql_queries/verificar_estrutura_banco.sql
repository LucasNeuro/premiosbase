-- Verificar estrutura do banco de dados
-- Este script verifica se as tabelas principais existem

-- Verificar tabela goals
SELECT 
    'goals' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
    END as status;

-- Verificar tabela policies
SELECT 
    'policies' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policies') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
    END as status;

-- Verificar tabela policy_campaign_links
SELECT 
    'policy_campaign_links' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policy_campaign_links') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
    END as status;

-- Verificar tabela premios_conquistados
SELECT 
    'premios_conquistados' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premios_conquistados') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
    END as status;

-- Verificar tabela campanhas_premios
SELECT 
    'campanhas_premios' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campanhas_premios') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
    END as status;
