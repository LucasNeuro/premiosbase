# 🔌 API ENDPOINTS - PREMIOSBASE BACKEND

## 📋 ROTAS PRINCIPAIS

### 🏠 **Base URL**: `https://api.premiosbase.com/v1`

---

## 👤 **USUÁRIOS**

### `GET /users/profile`
**Descrição**: Obter perfil do usuário logado
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "cnpj": "12.345.678/0001-90",
  "is_admin": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### `PUT /users/profile`
**Descrição**: Atualizar perfil do usuário
**Body**:
```json
{
  "name": "João Silva Santos",
  "phone": "(11) 88888-8888"
}
```

---

## 🎯 **CAMPANHAS**

### `GET /campaigns`
**Descrição**: Listar campanhas do usuário
**Query Params**: 
- `status`: `active|completed|paused|cancelled`
- `acceptance_status`: `pending|accepted|rejected`
- `page`: `1`
- `per_page`: `20`

**Response**:
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "Campanha Q1 2024",
      "description": "Meta de vendas primeiro trimestre",
      "target": 100000.00,
      "current_value": 75000.00,
      "progress_percentage": 75.0,
      "type": "valor",
      "status": "active",
      "acceptance_status": "accepted",
      "start_date": "2024-01-01",
      "end_date": "2024-03-31",
      "linked_policies_count": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100
  }
}
```

### `GET /campaigns/:id`
**Descrição**: Obter detalhes de uma campanha
**Response**:
```json
{
  "id": "uuid",
  "title": "Campanha Q1 2024",
  "description": "Meta de vendas primeiro trimestre",
  "target": 100000.00,
  "current_value": 75000.00,
  "progress_percentage": 75.0,
  "type": "valor",
  "status": "active",
  "criteria": [
    {
      "policy_type": "Seguro Auto",
      "contract_type": "Novo",
      "min_premium_value": 1000.00
    }
  ],
  "linked_policies": [
    {
      "id": "uuid",
      "policy_number": "AUTO001",
      "premium_value": 5000.00,
      "type": "Seguro Auto",
      "linked_at": "2024-01-15T10:30:00Z"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### `POST /campaigns/:id/accept`
**Descrição**: Aceitar uma campanha
**Response**:
```json
{
  "success": true,
  "message": "Campanha aceita com sucesso",
  "campaign": {
    "id": "uuid",
    "acceptance_status": "accepted",
    "accepted_at": "2024-01-15T10:30:00Z"
  }
}
```

### `POST /campaigns/:id/reject`
**Descrição**: Rejeitar uma campanha
**Body**:
```json
{
  "reason": "Não atende aos meus objetivos"
}
```

### `GET /campaigns/:id/progress`
**Descrição**: Obter progresso detalhado da campanha
**Response**:
```json
{
  "campaign_id": "uuid",
  "current_value": 75000.00,
  "target_value": 100000.00,
  "progress_percentage": 75.0,
  "is_completed": false,
  "linked_policies_count": 15,
  "criteria_progress": [
    {
      "criterion": "Seguro Auto - Novo",
      "target": 50000.00,
      "current": 40000.00,
      "progress": 80.0,
      "is_completed": false
    }
  ],
  "last_calculated": "2024-01-15T10:30:00Z"
}
```

---

## 📄 **APÓLICES**

### `GET /policies`
**Descrição**: Listar apólices do usuário
**Query Params**:
- `type`: `Seguro Auto|Seguro Residencial`
- `status`: `active|cancelled`
- `date_from`: `2024-01-01`
- `date_to`: `2024-12-31`
- `page`: `1`
- `per_page`: `20`

**Response**:
```json
{
  "policies": [
    {
      "id": "uuid",
      "policy_number": "AUTO001",
      "type": "Seguro Auto",
      "premium_value": 5000.00,
      "contract_type": "Novo",
      "cpd_number": "CPD123",
      "city": "São Paulo",
      "status": "active",
      "sale_date": "2024-01-15",
      "linked_campaigns": [
        {
          "id": "uuid",
          "title": "Campanha Q1 2024",
          "linked_at": "2024-01-15T10:30:00Z"
        }
      ],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_count": 200
  }
}
```

### `POST /policies`
**Descrição**: Criar nova apólice
**Body**:
```json
{
  "policy_number": "AUTO001",
  "type": "Seguro Auto",
  "premium_value": 5000.00,
  "contract_type": "Novo",
  "cpd_number": "CPD123",
  "city": "São Paulo",
  "sale_date": "2024-01-15"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Apólice criada com sucesso",
  "policy": {
    "id": "uuid",
    "policy_number": "AUTO001",
    "type": "Seguro Auto",
    "premium_value": 5000.00,
    "contract_type": "Novo",
    "cpd_number": "CPD123",
    "city": "São Paulo",
    "status": "active",
    "linked_campaigns": [
      {
        "id": "uuid",
        "title": "Campanha Q1 2024",
        "linked_automatically": true
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### `POST /policies/:id/link-to-campaign`
**Descrição**: Vincular apólice a campanha
**Body**:
```json
{
  "campaign_id": "uuid"
}
```

### `DELETE /policies/:id/unlink-from-campaign`
**Descrição**: Desvincular apólice de campanha
**Body**:
```json
{
  "campaign_id": "uuid",
  "reason": "Vínculo incorreto"
}
```

---

## 🏆 **PRÊMIOS**

### `GET /prizes`
**Descrição**: Listar prêmios disponíveis
**Query Params**:
- `category_id`: `uuid`
- `type_id`: `uuid`
- `is_active`: `true|false`

**Response**:
```json
{
  "prizes": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "description": "Smartphone Apple iPhone 15 Pro 256GB",
      "image_url": "https://...",
      "estimated_value": 8000.00,
      "points_required": 1000,
      "category": {
        "id": "uuid",
        "name": "Eletrônicos"
      },
      "type": {
        "id": "uuid",
        "name": "Smartphones"
      },
      "is_active": true
    }
  ]
}
```

### `GET /conquered-prizes`
**Descrição**: Listar prêmios conquistados pelo usuário
**Response**:
```json
{
  "conquered_prizes": [
    {
      "id": "uuid",
      "campaign_title": "Campanha Q1 2024",
      "prize_name": "iPhone 15 Pro",
      "prize_value": 8000.00,
      "quantity_conquered": 1,
      "total_value": 8000.00,
      "status": "available",
      "conquered_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### `POST /conquered-prizes/:id/redeem`
**Descrição**: Resgatar prêmio conquistado
**Response**:
```json
{
  "success": true,
  "message": "Prêmio resgatado com sucesso",
  "prize": {
    "id": "uuid",
    "status": "redeemed",
    "redeemed_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📊 **DASHBOARD**

### `GET /dashboard`
**Descrição**: Obter dados do dashboard
**Response**:
```json
{
  "user_stats": {
    "total_campaigns": 5,
    "active_campaigns": 3,
    "completed_campaigns": 2,
    "total_policies": 150,
    "total_premium_value": 750000.00,
    "total_conquered_prizes": 8,
    "total_prize_value": 25000.00
  },
  "recent_policies": [
    {
      "id": "uuid",
      "policy_number": "AUTO001",
      "type": "Seguro Auto",
      "premium_value": 5000.00,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "campaign_progress": [
    {
      "id": "uuid",
      "title": "Campanha Q1 2024",
      "progress_percentage": 75.0,
      "status": "active"
    }
  ],
  "notifications": [
    {
      "id": "uuid",
      "type": "campaign_completed",
      "title": "Campanha Concluída!",
      "message": "Você concluiu a campanha Q1 2024",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🔔 **NOTIFICAÇÕES**

### `GET /notifications`
**Descrição**: Listar notificações do usuário
**Query Params**:
- `is_read`: `true|false`
- `type`: `policy_added|campaign_completed|prize_conquered|system_alert`
- `page`: `1`
- `per_page`: `20`

### `PUT /notifications/:id/read`
**Descrição**: Marcar notificação como lida

### `PUT /notifications/read-all`
**Descrição**: Marcar todas as notificações como lidas

---

## 🔍 **VALIDAÇÕES**

### `POST /validations/cnpj`
**Descrição**: Validar CNPJ
**Body**:
```json
{
  "cnpj": "12.345.678/0001-90"
}
```

**Response**:
```json
{
  "valid": true,
  "cnpj_data": {
    "razao_social": "Empresa Exemplo LTDA",
    "nome_fantasia": "Exemplo",
    "situacao": "ATIVA",
    "endereco": "Rua Exemplo, 123"
  }
}
```

---

## 📈 **ANALYTICS (Admin)**

### `GET /admin/analytics/overview`
**Descrição**: Visão geral do sistema (apenas admin)
**Response**:
```json
{
  "total_users": 1000,
  "total_campaigns": 500,
  "total_policies": 10000,
  "total_premium_value": 50000000.00,
  "total_conquered_prizes": 200,
  "monthly_stats": {
    "new_users": 50,
    "new_campaigns": 25,
    "new_policies": 500,
    "new_premium_value": 2500000.00
  }
}
```

---

## 🚨 **CÓDIGOS DE ERRO**

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 422 | Erro de validação |
| 500 | Erro interno do servidor |

---

## 🔐 **AUTENTICAÇÃO**

### Headers Obrigatórios
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Renovação de Token
```
POST /auth/refresh
Body: { "refresh_token": "..." }
```