# 🏗️ DIAGRAMA DE ARQUITETURA - BACKEND PREMIOSBASE

## 📊 ARQUITETURA GERAL DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  React App (PremiosBase)  │  Admin Dashboard  │  Mobile App    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Nginx (Load Balancer)  │  API Gateway (Rate Limiting)        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│ Campaign Service │ Policy Service │ User Service │ Notification │
│ (Ruby on Rails)  │ (Ruby on Rails)│ (Ruby on Rails)│ Service    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKGROUND JOBS LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Sidekiq (Job Processor)  │  Redis (Job Queue)                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│ Supabase PostgreSQL │ Redis (Cache) │ File Storage (Supabase)  │
│   (Primary DB)      │   (Sessions)  │                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│ CNPJ API │ Email Service │ AI Services │ Payment Gateway        │
│ (External)│ (SendGrid)   │ (Mistral)   │ (Future)              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 FLUXO DE DADOS PRINCIPAL

### 1. Criação de Apólice
```
Frontend → API Gateway → Policy Service → PostgreSQL
    ↓
Background Job → Campaign Linking → Progress Update
    ↓
WebSocket → Frontend Update
```

### 2. Cálculo de Progresso de Campanha
```
Policy Created → Sidekiq Job → Campaign Service
    ↓
Query Linked Policies → Calculate Progress → Update Database
    ↓
Cache Result → Notify Frontend
```

### 3. Sistema de Notificações
```
Event Triggered → Notification Service → Background Job
    ↓
Email/SMS Queue → External Service → User Notification
```