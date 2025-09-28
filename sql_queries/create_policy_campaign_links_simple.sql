-- Criar tabela policy_campaign_links se não existir
CREATE TABLE IF NOT EXISTS public.policy_campaign_links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    policy_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    user_id uuid NOT NULL,
    linked_at timestamp with time zone NOT NULL DEFAULT now(),
    linked_by uuid NULL,
    linked_automatically boolean NULL DEFAULT false,
    is_active boolean NULL DEFAULT true,
    unlinked_at timestamp with time zone NULL,
    unlinked_by uuid NULL,
    unlink_reason text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    ai_confidence integer NULL,
    ai_reasoning text NULL,
    CONSTRAINT policy_campaign_links_pkey PRIMARY KEY (id),
    CONSTRAINT policy_campaign_unique UNIQUE (policy_id, campaign_id),
    CONSTRAINT policy_campaign_links_linked_by_fkey FOREIGN KEY (linked_by) REFERENCES users (id),
    CONSTRAINT policy_campaign_links_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE CASCADE,
    CONSTRAINT policy_campaign_links_unlinked_by_fkey FOREIGN KEY (unlinked_by) REFERENCES users (id),
    CONSTRAINT policy_campaign_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_policy_id ON public.policy_campaign_links USING btree (policy_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_campaign_id ON public.policy_campaign_links USING btree (campaign_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_user_id ON public.policy_campaign_links USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_active ON public.policy_campaign_links USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_linked_at ON public.policy_campaign_links USING btree (linked_at) TABLESPACE pg_default;

-- Habilitar RLS
ALTER TABLE public.policy_campaign_links ENABLE ROW LEVEL SECURITY;

-- Política RLS para usuários
CREATE POLICY "Users can view their own policy campaign links" ON public.policy_campaign_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policy campaign links" ON public.policy_campaign_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy campaign links" ON public.policy_campaign_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policy campaign links" ON public.policy_campaign_links
    FOR DELETE USING (auth.uid() = user_id);
