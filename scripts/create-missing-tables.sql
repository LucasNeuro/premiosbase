-- Script para criar tabelas que podem estar faltando

-- 1. Verificar se a tabela premios_conquistados existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premios_conquistados' AND table_schema = 'public') THEN
        CREATE TABLE public.premios_conquistados (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            campaign_id UUID NOT NULL,
            campaign_title TEXT NOT NULL,
            premio_id UUID NOT NULL,
            premio_nome TEXT NOT NULL,
            premio_valor_estimado NUMERIC(10, 2) NOT NULL,
            premio_imagem_url TEXT,
            premio_categoria TEXT,
            premio_tipo TEXT,
            quantidade_conquistada INTEGER NOT NULL DEFAULT 1,
            valor_total_conquistado NUMERIC(10, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'resgatado', 'expirado')),
            data_conquista TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            data_resgate TIMESTAMP WITH TIME ZONE,
            pedido_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT premios_conquistados_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT premios_conquistados_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES goals (id) ON DELETE CASCADE,
            CONSTRAINT premios_conquistados_premio_id_fkey FOREIGN KEY (premio_id) REFERENCES premios (id) ON DELETE CASCADE
        );
        
        CREATE INDEX idx_premios_conquistados_user_id ON public.premios_conquistados (user_id);
        CREATE INDEX idx_premios_conquistados_campaign_id ON public.premios_conquistados (campaign_id);
        CREATE INDEX idx_premios_conquistados_status ON public.premios_conquistados (status);
        
        RAISE NOTICE 'Tabela premios_conquistados criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela premios_conquistados já existe.';
    END IF;
END $$;

-- 2. Verificar se a tabela pedidos_premios existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos_premios' AND table_schema = 'public') THEN
        CREATE TABLE public.pedidos_premios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            campaign_id UUID,
            campaign_title TEXT NOT NULL,
            premio_id UUID NOT NULL,
            premio_nome TEXT NOT NULL,
            premio_valor_estimado NUMERIC(10, 2) NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 1,
            valor_total NUMERIC(10, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delivered', 'cancelled')),
            data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            data_aprovacao TIMESTAMP WITH TIME ZONE,
            data_entrega TIMESTAMP WITH TIME ZONE,
            observacoes TEXT,
            aprovado_por UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT pedidos_premios_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT pedidos_premios_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES goals (id) ON DELETE CASCADE,
            CONSTRAINT pedidos_premios_premio_id_fkey FOREIGN KEY (premio_id) REFERENCES premios (id) ON DELETE CASCADE,
            CONSTRAINT pedidos_premios_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES users (id)
        );
        
        CREATE INDEX idx_pedidos_premios_user_id ON public.pedidos_premios (user_id);
        CREATE INDEX idx_pedidos_premios_campaign_id ON public.pedidos_premios (campaign_id);
        CREATE INDEX idx_pedidos_premios_status ON public.pedidos_premios (status);
        CREATE INDEX idx_pedidos_premios_data_solicitacao ON public.pedidos_premios (data_solicitacao);
        
        RAISE NOTICE 'Tabela pedidos_premios criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela pedidos_premios já existe.';
    END IF;
END $$;

-- 3. Verificar se a função calcular_saldo_premiacao_v2 existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'calcular_saldo_premiacao_v2' AND routine_schema = 'public') THEN
        CREATE OR REPLACE FUNCTION calcular_saldo_premiacao_v2(user_id_param UUID)
        RETURNS NUMERIC AS $$
        DECLARE
            total_conquistado NUMERIC := 0;
            total_resgatado NUMERIC := 0;
            saldo_disponivel NUMERIC := 0;
        BEGIN
            -- Soma prêmios conquistados disponíveis
            SELECT COALESCE(SUM(valor_total_conquistado), 0)
            INTO total_conquistado
            FROM premios_conquistados
            WHERE user_id = user_id_param
            AND status = 'disponivel';
            
            -- Soma pedidos aprovados/entregues
            SELECT COALESCE(SUM(valor_total), 0)
            INTO total_resgatado
            FROM pedidos_premios
            WHERE user_id = user_id_param
            AND status IN ('approved', 'delivered');
            
            saldo_disponivel := total_conquistado - total_resgatado;
            
            RETURN GREATEST(saldo_disponivel, 0);
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Função calcular_saldo_premiacao_v2 criada com sucesso!';
    ELSE
        RAISE NOTICE 'Função calcular_saldo_premiacao_v2 já existe.';
    END IF;
END $$;

-- 4. Verificar se a view v_premios_conquistados_disponiveis existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_premios_conquistados_disponiveis' AND table_schema = 'public') THEN
        CREATE OR REPLACE VIEW v_premios_conquistados_disponiveis AS
        SELECT 
            pc.id,
            pc.user_id,
            pc.campaign_id,
            pc.campaign_title,
            pc.premio_id,
            pc.premio_nome,
            pc.premio_valor_estimado,
            pc.premio_imagem_url,
            pc.premio_categoria,
            pc.premio_tipo,
            pc.quantidade_conquistada,
            pc.valor_total_conquistado,
            pc.data_conquista,
            u.name as user_name,
            u.email as user_email
        FROM premios_conquistados pc
        JOIN users u ON pc.user_id = u.id
        WHERE pc.status = 'disponivel'
        ORDER BY pc.data_conquista DESC;
        
        RAISE NOTICE 'View v_premios_conquistados_disponiveis criada com sucesso!';
    ELSE
        RAISE NOTICE 'View v_premios_conquistados_disponiveis já existe.';
    END IF;
END $$;
