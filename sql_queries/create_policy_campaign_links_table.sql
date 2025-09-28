-- Criar tabela policy_campaign_links para vincular apólices a campanhas
-- Esta tabela é essencial para o funcionamento do sistema de progresso

CREATE TABLE IF NOT EXISTS policy_campaign_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    linked_by UUID REFERENCES auth.users(id),
    linked_automatically BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    ai_confidence INTEGER DEFAULT NULL,
    ai_reasoning TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(policy_id, campaign_id),
    CONSTRAINT valid_ai_confidence CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 100))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_policy_id ON policy_campaign_links(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_campaign_id ON policy_campaign_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_user_id ON policy_campaign_links(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_is_active ON policy_campaign_links(is_active);
CREATE INDEX IF NOT EXISTS idx_policy_campaign_links_linked_at ON policy_campaign_links(linked_at);

-- RLS (Row Level Security)
ALTER TABLE policy_campaign_links ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só podem ver suas próprias vinculações
CREATE POLICY "Users can view their own policy campaign links" ON policy_campaign_links
    FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: usuários podem inserir suas próprias vinculações
CREATE POLICY "Users can insert their own policy campaign links" ON policy_campaign_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: usuários podem atualizar suas próprias vinculações
CREATE POLICY "Users can update their own policy campaign links" ON policy_campaign_links
    FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: usuários podem deletar suas próprias vinculações
CREATE POLICY "Users can delete their own policy campaign links" ON policy_campaign_links
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_policy_campaign_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_policy_campaign_links_updated_at
    BEFORE UPDATE ON policy_campaign_links
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_campaign_links_updated_at();

-- Comentários para documentação
COMMENT ON TABLE policy_campaign_links IS 'Tabela para vincular apólices a campanhas com dados de IA';
COMMENT ON COLUMN policy_campaign_links.policy_id IS 'ID da apólice';
COMMENT ON COLUMN policy_campaign_links.campaign_id IS 'ID da campanha (goals)';
COMMENT ON COLUMN policy_campaign_links.user_id IS 'ID do usuário (corretor)';
COMMENT ON COLUMN policy_campaign_links.linked_at IS 'Data/hora da vinculação';
COMMENT ON COLUMN policy_campaign_links.linked_by IS 'ID do usuário que fez a vinculação';
COMMENT ON COLUMN policy_campaign_links.linked_automatically IS 'Se a vinculação foi automática';
COMMENT ON COLUMN policy_campaign_links.is_active IS 'Se a vinculação está ativa';
COMMENT ON COLUMN policy_campaign_links.ai_confidence IS 'Confiança da IA (0-100)';
COMMENT ON COLUMN policy_campaign_links.ai_reasoning IS 'Raciocínio da IA para a vinculação';
