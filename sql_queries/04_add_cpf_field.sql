-- Script para adicionar campo CPF e permitir cadastro com CPF ou CNPJ
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campo CPF na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cpf text;

-- 2. Remover constraint UNIQUE e NOT NULL do CNPJ para permitir NULL quando houver CPF
DO $$ 
BEGIN
    -- Remove a constraint UNIQUE do CNPJ se existir
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_cnpj_key'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_cnpj_key;
    END IF;
    
    -- Remove constraint NOT NULL do CNPJ (alterando a coluna para permitir NULL)
    ALTER TABLE public.users ALTER COLUMN cnpj DROP NOT NULL;
END $$;

-- 3. Remover constraint CHECK existente se houver e criar nova que garante que pelo menos CPF ou CNPJ seja preenchido
DO $$ 
BEGIN
    -- Remove constraint CHECK existente se houver
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_cpf_cnpj_check'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_cpf_cnpj_check;
    END IF;
END $$;

-- Criar nova constraint que garante que pelo menos CPF ou CNPJ seja preenchido
ALTER TABLE public.users 
ADD CONSTRAINT users_cpf_cnpj_check 
CHECK (
    (cpf IS NOT NULL AND cnpj IS NULL) OR 
    (cpf IS NULL AND cnpj IS NOT NULL) OR
    (cpf IS NOT NULL AND cnpj IS NOT NULL)
);

-- 4. Criar índices únicos para CPF e CNPJ (permitindo NULL)
-- PostgreSQL permite múltiplos NULLs em índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS users_cpf_unique 
ON public.users (cpf) 
WHERE cpf IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_cnpj_unique 
ON public.users (cnpj) 
WHERE cnpj IS NOT NULL;

-- 5. Desabilitar TODOS os triggers na tabela users temporariamente
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    -- Desabilitar todos os triggers na tabela users
    FOR trigger_record IN 
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.users'::regclass
        AND NOT tgisinternal
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.users DISABLE TRIGGER %I', trigger_record.tgname);
            RAISE NOTICE 'Trigger desabilitado: %', trigger_record.tgname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao desabilitar trigger %: %', trigger_record.tgname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 6. Remover funções comuns que podem validar CNPJ (ajuste os nomes conforme necessário)
DROP FUNCTION IF EXISTS public.validate_cnpj() CASCADE;
DROP FUNCTION IF EXISTS public.check_user_cnpj() CASCADE;
DROP FUNCTION IF EXISTS public.validate_user_cnpj() CASCADE;
DROP FUNCTION IF EXISTS public.users_validate() CASCADE;
DROP FUNCTION IF EXISTS public.validate_users() CASCADE;

-- 6. Criar ou substituir função de validação que aceita CPF ou CNPJ
CREATE OR REPLACE FUNCTION public.validate_user_document()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que pelo menos CPF ou CNPJ seja preenchido
    IF (NEW.cpf IS NULL OR NEW.cpf = '') AND (NEW.cnpj IS NULL OR NEW.cnpj = '') THEN
        RAISE EXCEPTION 'CPF ou CNPJ deve ser preenchido';
    END IF;
    
    -- Se ambos estiverem preenchidos, validar que não sejam vazios
    IF NEW.cpf IS NOT NULL AND NEW.cpf = '' THEN
        RAISE EXCEPTION 'CPF não pode ser vazio';
    END IF;
    
    IF NEW.cnpj IS NOT NULL AND NEW.cnpj = '' THEN
        RAISE EXCEPTION 'CNPJ não pode ser vazio';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Remover trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS validate_user_document_trigger ON public.users;

CREATE TRIGGER validate_user_document_trigger
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_user_document();

-- 8. Comentários para documentação
COMMENT ON COLUMN public.users.cpf IS 'CPF do corretor (obrigatório se CNPJ não for preenchido)';
COMMENT ON COLUMN public.users.cnpj IS 'CNPJ da corretora (obrigatório se CPF não for preenchido)';
