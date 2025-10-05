-- 🗄️ SCHEMA OTIMIZADO - PREMIOSBASE BACKEND
-- PostgreSQL + Supabase

-- ==============================================
-- TABELAS PRINCIPAIS
-- ==============================================

-- Usuários (Corretores)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  cnpj VARCHAR UNIQUE NOT NULL,
  password_digest VARCHAR NOT NULL,
  cnpj_data JSONB,
  cpd_data JSONB,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índices
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_cnpj_check CHECK (cnpj ~* '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$')
);

-- Campanhas
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  target DECIMAL(15,2) NOT NULL CHECK (target > 0),
  current_value DECIMAL(15,2) DEFAULT 0,
  unit VARCHAR DEFAULT 'reais',
  type VARCHAR NOT NULL CHECK (type IN ('valor', 'apolices', 'crescimento')),
  campaign_type VARCHAR DEFAULT 'simple' CHECK (campaign_type IN ('simple', 'composite')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  acceptance_status VARCHAR DEFAULT 'pending' CHECK (acceptance_status IN ('pending', 'accepted', 'rejected')),
  start_date DATE,
  end_date DATE,
  criteria JSONB,
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES users(id)
);

-- Apólices
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_number VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('Seguro Auto', 'Seguro Residencial')),
  premium_value DECIMAL(15,2) NOT NULL CHECK (premium_value > 0),
  contract_type VARCHAR NOT NULL CHECK (contract_type IN ('Novo', 'Renovação Bradesco')),
  cpd_number VARCHAR NOT NULL,
  city VARCHAR,
  ticket_code VARCHAR UNIQUE,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  sale_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índices únicos
  UNIQUE(user_id, policy_number)
);

-- Vinculações Apólice-Campanha
CREATE TABLE policy_campaign_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  linked_by UUID REFERENCES users(id),
  linked_automatically BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  unlinked_at TIMESTAMP WITH TIME ZONE,
  unlinked_by UUID REFERENCES users(id),
  unlink_reason TEXT,
  ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índices únicos
  UNIQUE(policy_id, campaign_id)
);

-- Prêmios
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  estimated_value DECIMAL(15,2) DEFAULT 0,
  points_required INTEGER DEFAULT 0,
  category_id UUID,
  type_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Prêmios Conquistados
CREATE TABLE conquered_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  campaign_title VARCHAR NOT NULL,
  prize_name VARCHAR NOT NULL,
  prize_value DECIMAL(15,2) NOT NULL,
  quantity_conquered INTEGER DEFAULT 1,
  total_value DECIMAL(15,2) NOT NULL,
  status VARCHAR DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'expired')),
  conquered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('policy_added', 'campaign_completed', 'prize_conquered', 'system_alert')),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índices básicos
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cnpj ON users(cnpj);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_acceptance_status ON campaigns(acceptance_status);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);

CREATE INDEX idx_policies_user_id ON policies(user_id);
CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_sale_date ON policies(sale_date);

CREATE INDEX idx_policy_campaign_links_policy_id ON policy_campaign_links(policy_id);
CREATE INDEX idx_policy_campaign_links_campaign_id ON policy_campaign_links(campaign_id);
CREATE INDEX idx_policy_campaign_links_user_id ON policy_campaign_links(user_id);
CREATE INDEX idx_policy_campaign_links_is_active ON policy_campaign_links(is_active);

CREATE INDEX idx_conquered_prizes_user_id ON conquered_prizes(user_id);
CREATE INDEX idx_conquered_prizes_campaign_id ON conquered_prizes(campaign_id);
CREATE INDEX idx_conquered_prizes_status ON conquered_prizes(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Índices compostos para queries complexas
CREATE INDEX idx_campaigns_user_status ON campaigns(user_id, status, is_active);
CREATE INDEX idx_policies_user_type ON policies(user_id, type, status);
CREATE INDEX idx_policy_links_campaign_active ON policy_campaign_links(campaign_id, is_active);

-- Índices GIN para campos JSONB
CREATE INDEX idx_users_cnpj_data_gin ON users USING GIN(cnpj_data);
CREATE INDEX idx_users_cpd_data_gin ON users USING GIN(cpd_data);
CREATE INDEX idx_campaigns_criteria_gin ON campaigns USING GIN(criteria);
CREATE INDEX idx_notifications_data_gin ON notifications USING GIN(data);

-- ==============================================
-- TRIGGERS E FUNÇÕES
-- ==============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_campaign_links_updated_at BEFORE UPDATE ON policy_campaign_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conquered_prizes_updated_at BEFORE UPDATE ON conquered_prizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular progresso de campanha
CREATE OR REPLACE FUNCTION calculate_campaign_progress(campaign_uuid UUID)
RETURNS TABLE(
  current_value DECIMAL(15,2),
  progress_percentage DECIMAL(5,2),
  is_completed BOOLEAN
) AS $$
DECLARE
  campaign_record campaigns%ROWTYPE;
  calculated_value DECIMAL(15,2);
  calculated_percentage DECIMAL(5,2);
  is_done BOOLEAN;
BEGIN
  -- Buscar dados da campanha
  SELECT * INTO campaign_record FROM campaigns WHERE id = campaign_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calcular valor atual baseado no tipo
  IF campaign_record.type = 'valor' THEN
    SELECT COALESCE(SUM(p.premium_value), 0)
    INTO calculated_value
    FROM policy_campaign_links pcl
    JOIN policies p ON pcl.policy_id = p.id
    WHERE pcl.campaign_id = campaign_uuid
      AND pcl.is_active = true;
  ELSIF campaign_record.type = 'apolices' THEN
    SELECT COUNT(*)
    INTO calculated_value
    FROM policy_campaign_links pcl
    WHERE pcl.campaign_id = campaign_uuid
      AND pcl.is_active = true;
  ELSE
    calculated_value := 0;
  END IF;
  
  -- Calcular porcentagem
  IF campaign_record.target > 0 THEN
    calculated_percentage := LEAST((calculated_value / campaign_record.target) * 100, 100);
  ELSE
    calculated_percentage := 0;
  END IF;
  
  -- Verificar se está completa
  is_done := calculated_percentage >= 100;
  
  -- Atualizar campanha
  UPDATE campaigns SET
    current_value = calculated_value,
    progress_percentage = calculated_percentage,
    status = CASE WHEN is_done THEN 'completed' ELSE status END,
    updated_at = now()
  WHERE id = campaign_uuid;
  
  RETURN QUERY SELECT calculated_value, calculated_percentage, is_done;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE conquered_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para campanhas
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para apólices
CREATE POLICY "Users can view own policies" ON policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own policies" ON policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own policies" ON policies FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para vinculações
CREATE POLICY "Users can view own policy links" ON policy_campaign_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own policy links" ON policy_campaign_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own policy links" ON policy_campaign_links FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para prêmios conquistados
CREATE POLICY "Users can view own conquered prizes" ON conquered_prizes FOR SELECT USING (auth.uid() = user_id);

-- Políticas RLS para notificações
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- VIEWS PARA CONSULTAS COMPLEXAS
-- ==============================================

-- View para dashboard do usuário
CREATE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT c.id) as total_campaigns,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_campaigns,
  COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_campaigns,
  COUNT(DISTINCT p.id) as total_policies,
  COALESCE(SUM(p.premium_value), 0) as total_premium_value,
  COUNT(DISTINCT cp.id) as total_conquered_prizes,
  COALESCE(SUM(cp.total_value), 0) as total_prize_value
FROM users u
LEFT JOIN campaigns c ON u.id = c.user_id
LEFT JOIN policies p ON u.id = p.user_id
LEFT JOIN conquered_prizes cp ON u.id = cp.user_id
GROUP BY u.id;

-- View para progresso de campanhas
CREATE VIEW campaign_progress_view AS
SELECT 
  c.id as campaign_id,
  c.title as campaign_title,
  c.type as campaign_type,
  c.target,
  c.current_value,
  c.progress_percentage,
  c.status,
  COUNT(pcl.id) as linked_policies_count,
  c.user_id
FROM campaigns c
LEFT JOIN policy_campaign_links pcl ON c.id = pcl.campaign_id AND pcl.is_active = true
GROUP BY c.id, c.title, c.type, c.target, c.current_value, c.progress_percentage, c.status, c.user_id;