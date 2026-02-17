# 🏗️ ARQUITETURA PREMIOSBASE - DIAGRAMA PARA LINEAR

## 📊 DIAGRAMA DE ARQUITETURA PRINCIPAL

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App<br/>PremiosBase]
        B[Admin Dashboard]
        C[Mobile App<br/>Future]
    end
    
    subgraph "API Gateway Layer"
        D[Nginx<br/>Load Balancer]
        E[API Gateway<br/>Rate Limiting]
    end
    
    subgraph "Backend Services Layer"
        F[Campaign Service<br/>Ruby on Rails]
        G[Policy Service<br/>Ruby on Rails]
        H[User Service<br/>Ruby on Rails]
        I[Notification Service<br/>Ruby on Rails]
        J[Analytics Service<br/>Ruby on Rails]
    end
    
    subgraph "Background Jobs Layer"
        K[Sidekiq<br/>Job Processor]
        L[Redis<br/>Job Queue]
    end
    
    subgraph "Database Layer"
        M[Supabase PostgreSQL<br/>Primary Database]
        N[Redis<br/>Cache & Sessions]
        O[File Storage<br/>Supabase Storage]
    end
    
    subgraph "External Services"
        P[CNPJ API<br/>External Validation]
        Q[Email Service<br/>SendGrid/SES]
        R[AI Services<br/>Mistral/Gemini]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    
    K --> L
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    
    F --> N
    G --> N
    H --> N
    
    F --> O
    G --> O
    
    F --> P
    I --> Q
    F --> R
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style F fill:#f3e5f5
    style G fill:#f3e5f5
    style H fill:#f3e5f5
    style I fill:#f3e5f5
    style J fill:#f3e5f5
    style M fill:#e8f5e8
    style N fill:#fff3e0
```

## 🔄 FLUXO DE DADOS PRINCIPAL

```mermaid
sequenceDiagram
    participant F as Frontend
    participant AG as API Gateway
    participant PS as Policy Service
    participant DB as PostgreSQL
    participant SJ as Sidekiq Job
    participant CS as Campaign Service
    participant WS as WebSocket
    
    F->>AG: POST /policies
    AG->>PS: Create Policy
    PS->>DB: Insert Policy
    PS->>SJ: Trigger Linking Job
    SJ->>CS: Link to Campaigns
    CS->>DB: Update Campaign Progress
    CS->>WS: Notify Frontend
    WS->>F: Real-time Update
```

## 🏗️ ESTRUTURA DE MICROSERVIÇOS

```mermaid
graph LR
    subgraph "Campaign Service"
        CS1[CampaignsController]
        CS2[CampaignProgressController]
        CS3[CampaignPrizeController]
        CS4[Campaign Model]
        CS5[Progress Calculator]
        CS6[Prize Service]
    end
    
    subgraph "Policy Service"
        PS1[PoliciesController]
        PS2[PolicyLinkingController]
        PS3[PolicyValidationController]
        PS4[Policy Model]
        PS5[Linking Service]
        PS6[Validation Service]
    end
    
    subgraph "User Service"
        US1[UsersController]
        US2[AuthController]
        US3[ProfileController]
        US4[User Model]
        US5[Auth Service]
        US6[Permission Service]
    end
    
    subgraph "Notification Service"
        NS1[NotificationsController]
        NS2[EmailController]
        NS3[PushController]
        NS4[Notification Model]
        NS5[Email Service]
        NS6[Push Service]
    end
```

## 🗄️ SCHEMA DO BANCO DE DADOS

```mermaid
erDiagram
    USERS ||--o{ CAMPAIGNS : creates
    USERS ||--o{ POLICIES : owns
    USERS ||--o{ POLICY_CAMPAIGN_LINKS : has
    USERS ||--o{ CONQUERED_PRIZES : wins
    USERS ||--o{ NOTIFICATIONS : receives
    
    CAMPAIGNS ||--o{ POLICY_CAMPAIGN_LINKS : links
    CAMPAIGNS ||--o{ CONQUERED_PRIZES : generates
    
    POLICIES ||--o{ POLICY_CAMPAIGN_LINKS : linked_to
    POLICIES ||--o{ CONQUERED_PRIZES : triggers
    
    PRIZES ||--o{ CONQUERED_PRIZES : won_as
    
    USERS {
        uuid id PK
        string name
        string email UK
        string cnpj UK
        string phone
        jsonb cnpj_data
        jsonb cpd_data
        boolean is_admin
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    CAMPAIGNS {
        uuid id PK
        uuid user_id FK
        string title
        text description
        decimal target
        decimal current_value
        string type
        string status
        string acceptance_status
        date start_date
        date end_date
        jsonb criteria
        decimal progress_percentage
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    POLICIES {
        uuid id PK
        uuid user_id FK
        string policy_number
        string type
        decimal premium_value
        string contract_type
        string cpd_number
        string city
        string ticket_code UK
        string status
        date sale_date
        timestamp created_at
        timestamp updated_at
    }
    
    POLICY_CAMPAIGN_LINKS {
        uuid id PK
        uuid policy_id FK
        uuid campaign_id FK
        uuid user_id FK
        boolean linked_automatically
        boolean is_active
        timestamp linked_at
        timestamp created_at
        timestamp updated_at
    }
    
    CONQUERED_PRIZES {
        uuid id PK
        uuid user_id FK
        uuid campaign_id FK
        uuid prize_id FK
        string campaign_title
        string prize_name
        decimal prize_value
        integer quantity_conquered
        decimal total_value
        string status
        timestamp conquered_at
        timestamp redeemed_at
        timestamp created_at
        timestamp updated_at
    }
    
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        string title
        text message
        jsonb data
        boolean is_read
        timestamp read_at
        timestamp created_at
        timestamp updated_at
    }
    
    PRIZES {
        uuid id PK
        string name
        text description
        string image_url
        decimal estimated_value
        integer points_required
        uuid category_id
        uuid type_id
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
```

## 📊 FLUXO DE PROGRESSO DE CAMPANHA

```mermaid
flowchart TD
    A[Apólice Criada] --> B[Policy Service]
    B --> C[Salvar na Tabela Policies]
    C --> D[Trigger Sidekiq Job]
    D --> E[Policy Linking Service]
    E --> F[Buscar Campanhas Aceitas]
    F --> G{Campanha Compatível?}
    G -->|Sim| H[Criar Policy Campaign Link]
    G -->|Não| I[Pular Campanha]
    H --> J[Campaign Progress Calculator]
    I --> J
    J --> K[Calcular Progresso]
    K --> L[Atualizar Tabela Campaigns]
    L --> M[Cache Resultado]
    M --> N[WebSocket Notification]
    N --> O[Frontend Update]
```

## 🔐 SEGURANÇA E AUTENTICAÇÃO

```mermaid
graph TB
    subgraph "Client Layer"
        A[Frontend App]
    end
    
    subgraph "Security Layer"
        B[API Gateway]
        C[JWT Validation]
        D[Rate Limiting]
        E[CORS Policy]
    end
    
    subgraph "Application Layer"
        F[Pundit Policies]
        G[Business Logic]
        H[Data Validation]
    end
    
    subgraph "Database Layer"
        I[Row Level Security]
        J[Encrypted Data]
        K[Audit Logs]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
```

## 📈 MONITORAMENTO E OBSERVABILIDADE

```mermaid
graph TB
    subgraph "Application"
        A[Ruby Services]
        B[Background Jobs]
        C[Database Queries]
    end
    
    subgraph "Metrics Collection"
        D[Prometheus]
        E[Application Logs]
        F[Performance Metrics]
    end
    
    subgraph "Visualization"
        G[Grafana Dashboards]
        H[Alert Manager]
        I[Log Aggregation]
    end
    
    subgraph "Alerting"
        J[PagerDuty]
        K[Slack Notifications]
        L[Email Alerts]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> I
    F --> G
    G --> H
    H --> J
    H --> K
    H --> L
```

## 🚀 DEPLOYMENT PIPELINE

```mermaid
graph LR
    A[Code Push] --> B[GitHub]
    B --> C[CI/CD Pipeline]
    C --> D[Run Tests]
    D --> E{Tests Pass?}
    E -->|No| F[Fix Issues]
    F --> D
    E -->|Yes| G[Build Docker Images]
    G --> H[Security Scan]
    H --> I[Deploy to Staging]
    I --> J[Integration Tests]
    J --> K{Tests Pass?}
    K -->|No| L[Rollback]
    K -->|Yes| M[Deploy to Production]
    M --> N[Health Checks]
    N --> O[Monitoring]
```

## 💰 CUSTOS E RECURSOS

```mermaid
pie title Distribuição de Custos Mensais
    "Desenvolvimento" : 60
    "Infraestrutura" : 25
    "Serviços Externos" : 10
    "Monitoramento" : 5
```

## 🎯 ROADMAP DE IMPLEMENTAÇÃO

```mermaid
gantt
    title Cronograma de Implementação
    dateFormat  YYYY-MM-DD
    section Fase 1
    Setup e Configuração    :2024-02-01, 14d
    section Fase 2
    Desenvolvimento Core    :2024-02-15, 42d
    section Fase 3
    Integração Frontend     :2024-03-29, 28d
    section Fase 4
    Deploy e Otimização     :2024-04-26, 28d
```

---

## 📋 INSTRUÇÕES PARA O LINEAR

### **Como usar estes diagramas no Linear:**

1. **Copie o código Mermaid** de qualquer seção acima
2. **Cole no Linear** usando a funcionalidade de diagramas
3. **Personalize** conforme necessário para sua equipe
4. **Use como referência** durante o desenvolvimento

### **Diagramas recomendados para diferentes contextos:**

- **Arquitetura Geral**: Para apresentações e documentação
- **Fluxo de Dados**: Para entender processos
- **Schema do Banco**: Para desenvolvimento e migração
- **Pipeline de Deploy**: Para DevOps e CI/CD
- **Roadmap**: Para planejamento de sprints

### **Benefícios no Linear:**
- ✅ Visualização clara da arquitetura
- ✅ Colaboração em tempo real
- ✅ Integração com issues e tasks
- ✅ Versionamento de diagramas
- ✅ Acesso fácil para toda a equipe

---

**Estes diagramas estão prontos para serem usados no Linear e ajudarão muito no planejamento e execução do projeto!**