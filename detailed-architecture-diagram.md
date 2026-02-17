# 🏗️ DIAGRAMA DE ARQUITETURA DETALHADO - PREMIOSBASE BACKEND

## 📊 ARQUITETURA COMPLETA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  React Web App    │  Admin Dashboard  │  Mobile App (Future) │  API Clients   │
│  (PremiosBase)    │  (Management)     │  (React Native)      │  (External)    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            LOAD BALANCER LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Nginx Load Balancer  │  SSL Termination  │  Rate Limiting  │  Health Checks  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  API Gateway        │  Authentication  │  Authorization  │  Request Routing  │
│  (Kong/AWS API)     │  (JWT Validation)│  (Pundit)       │  (Load Balancing) │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MICROSERVICES LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Campaign Service   │  Policy Service   │  User Service    │  Notification    │
│  (Ruby on Rails)    │  (Ruby on Rails)  │  (Ruby on Rails) │  Service (Ruby)  │
│                     │                   │                  │                  │
│  • Campaign CRUD    │  • Policy CRUD    │  • User CRUD     │  • Email/SMS     │
│  • Progress Calc    │  • Linking Logic  │  • Auth/Profile  │  • Push Notif    │
│  • Prize Logic      │  • Validation     │  • Permissions   │  • WebSockets    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BACKGROUND JOBS LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Sidekiq Cluster     │  Redis Queue        │  Job Scheduler    │  Dead Letter   │
│  (Job Processing)    │  (Job Storage)      │  (Cron Jobs)      │  Queue         │
│                      │                     │                   │                │
│  • Progress Updates  │  • Job Queues       │  • Daily Reports  │  • Failed Jobs │
│  • Policy Linking    │  • Priority Queues  │  • Data Cleanup   │  • Retry Logic │
│  • Prize Calculation │  • Delayed Jobs     │  • Notifications  │  • Monitoring  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL │  Redis Cache        │  File Storage      │  Backup       │
│  (Primary Database)  │  (Session/Cache)    │  (Supabase Storage)│  (Automated)  │
│                      │                     │                   │                │
│  • Users Table       │  • Session Store    │  • Images         │  • Daily       │
│  • Campaigns Table   │  • Query Cache      │  • Documents      │  • Weekly      │
│  • Policies Table    │  • Rate Limiting    │  • Exports        │  • Monthly     │
│  • Links Table       │  • Job Queues       │  • Backups        │  • Retention   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CNPJ API          │  Email Service      │  AI Services       │  Payment       │
│  (Validation)      │  (SendGrid/SES)     │  (Mistral/Gemini)  │  Gateway       │
│                    │                     │                   │                │
│  • CNPJ Validation │  • Transactional    │  • Campaign        │  • Stripe      │
│  • Company Data    │  • Marketing        │  • Recommendations │  • PayPal      │
│  • Status Check    │  • Templates        │  • Analysis        │  • PIX         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 FLUXOS DE DADOS PRINCIPAIS

### 1. **CRIAÇÃO DE APÓLICE**
```
Frontend → Load Balancer → API Gateway → Policy Service
    ↓
Policy Service → PostgreSQL (Insert Policy)
    ↓
Background Job → Campaign Linking Service
    ↓
Campaign Linking → Progress Calculator
    ↓
Progress Calculator → PostgreSQL (Update Campaign)
    ↓
WebSocket → Frontend (Real-time Update)
```

### 2. **CÁLCULO DE PROGRESSO DE CAMPANHA**
```
Policy Created → Sidekiq Job → Campaign Progress Calculator
    ↓
Query Policy Campaign Links → Calculate Progress
    ↓
Update Campaign Table → Cache Result
    ↓
WebSocket Notification → Frontend Update
```

### 3. **SISTEMA DE NOTIFICAÇÕES**
```
Event Triggered → Notification Service → Sidekiq Job
    ↓
Email/SMS Queue → External Service → User Notification
    ↓
WebSocket → Real-time Frontend Update
```

## 🏗️ ESTRUTURA DE MICROSERVIÇOS

### **Campaign Service**
```
Campaign Service (Ruby on Rails)
├── Controllers
│   ├── CampaignsController
│   ├── CampaignProgressController
│   └── CampaignPrizesController
├── Models
│   ├── Campaign
│   ├── CampaignProgress
│   └── CampaignPrize
├── Services
│   ├── CampaignProgressCalculator
│   ├── CampaignPrizeService
│   └── CampaignLinkingService
└── Jobs
    ├── CampaignProgressUpdateJob
    └── CampaignPrizeCalculationJob
```

### **Policy Service**
```
Policy Service (Ruby on Rails)
├── Controllers
│   ├── PoliciesController
│   ├── PolicyLinkingController
│   └── PolicyValidationController
├── Models
│   ├── Policy
│   ├── PolicyCampaignLink
│   └── PolicyValidation
├── Services
│   ├── PolicyLinkingService
│   ├── PolicyValidationService
│   └── CNPJValidationService
└── Jobs
    ├── PolicyLinkingJob
    └── PolicyValidationJob
```

## 🔐 SEGURANÇA E AUTENTICAÇÃO

### **Fluxo de Autenticação**
```
1. User Login → Frontend
2. Frontend → API Gateway (JWT Request)
3. API Gateway → User Service (Validate Credentials)
4. User Service → PostgreSQL (Check User)
5. User Service → JWT Token Generation
6. JWT Token → Frontend
7. Frontend → API Requests (Bearer Token)
8. API Gateway → JWT Validation
9. API Gateway → Route to Service
```

### **Autorização por Camadas**
```
1. API Gateway: Rate Limiting, CORS
2. Service Level: Pundit Policies
3. Database Level: Row Level Security (RLS)
4. Application Level: Business Logic Validation
```

## 📊 MONITORAMENTO E OBSERVABILIDADE

### **Stack de Monitoramento**
```
Application Metrics → Prometheus → Grafana
    ↓
Logs → ELK Stack (Elasticsearch, Logstash, Kibana)
    ↓
Traces → Jaeger/Zipkin
    ↓
Alerts → PagerDuty/Slack
```

### **Métricas Principais**
- **Performance**: Response time, throughput, error rate
- **Business**: Campaign completions, policy creations, prize redemptions
- **Infrastructure**: CPU, memory, disk, network
- **Database**: Query performance, connection pool, slow queries

## 🚀 DEPLOYMENT E CI/CD

### **Pipeline de Deploy**
```
Code Push → GitHub → CI/CD Pipeline
    ↓
Tests (Unit, Integration, E2E) → Build Docker Images
    ↓
Security Scan → Deploy to Staging
    ↓
Integration Tests → Deploy to Production
    ↓
Health Checks → Monitoring
```

### **Ambientes**
- **Development**: Local development
- **Staging**: Production-like testing
- **Production**: Live environment
- **Disaster Recovery**: Backup environment

## 📈 ESCALABILIDADE

### **Horizontal Scaling**
- **Load Balancer**: Distribute traffic
- **API Gateway**: Route and throttle
- **Microservices**: Scale independently
- **Database**: Read replicas, sharding
- **Cache**: Redis cluster

### **Vertical Scaling**
- **CPU**: More cores for processing
- **Memory**: Larger cache, more connections
- **Storage**: SSD, faster I/O
- **Network**: Higher bandwidth

## 🔄 BACKUP E DISASTER RECOVERY

### **Backup Strategy**
- **Database**: Daily automated backups
- **Files**: Real-time sync to cloud storage
- **Configuration**: Version controlled
- **Code**: Git repositories

### **Disaster Recovery**
- **RTO**: 4 hours (Recovery Time Objective)
- **RPO**: 1 hour (Recovery Point Objective)
- **Failover**: Automated with health checks
- **Testing**: Monthly DR drills

## 💰 CUSTOS ESTIMADOS (MENSAL)

### **Infraestrutura**
- **Supabase Pro**: $25/month
- **Ruby Servers**: $200/month
- **Redis Cloud**: $50/month
- **Load Balancer**: $100/month
- **Monitoring**: $75/month

### **Serviços Externos**
- **Email Service**: $30/month
- **CNPJ API**: $50/month
- **AI Services**: $100/month
- **Backup Storage**: $25/month

### **Total Mensal**: ~$655/month
### **Total Anual**: ~$7.860/year

## 🎯 BENEFÍCIOS DA ARQUITETURA

### **Técnicos**
- **Escalabilidade**: Independent scaling of services
- **Manutenibilidade**: Clear separation of concerns
- **Testabilidade**: Isolated testing of components
- **Performance**: Optimized queries and caching
- **Reliability**: Fault tolerance and redundancy

### **Negócio**
- **Time to Market**: Faster feature development
- **Cost Efficiency**: Pay only for what you use
- **User Experience**: Real-time updates and fast responses
- **Data Security**: Multiple layers of protection
- **Compliance**: Audit trails and data governance

## 🚀 PRÓXIMOS PASSOS

1. **Aprovação da Arquitetura** (1 semana)
2. **Setup do Ambiente de Desenvolvimento** (2 semanas)
3. **Implementação dos Microserviços Core** (8 semanas)
4. **Integração com Frontend** (4 semanas)
5. **Deploy e Monitoramento** (2 semanas)

**Total**: 17 semanas para implementação completa

---

## 📞 SUPORTE E MANUTENÇÃO

### **Níveis de Suporte**
- **L1**: Frontend issues, basic troubleshooting
- **L2**: Backend issues, API problems
- **L3**: Infrastructure, database, performance
- **L4**: Architecture, security, compliance

### **SLA (Service Level Agreement)**
- **Uptime**: 99.9%
- **Response Time**: < 200ms (95th percentile)
- **Support Response**: 4 hours (business hours)
- **Bug Fixes**: 48 hours (critical), 1 week (normal)

---

**Esta arquitetura Ruby + Supabase transformará a PremiosBase em uma plataforma enterprise-grade, escalável e confiável, pronta para crescer com o negócio.**