

# PremiosBase

A plataforma completa para corretores de seguros gerenciarem suas apólices, acompanharem performance e conquistarem prêmios incríveis.

## 🚀 Funcionalidades

- **Landing Page Moderna**: Design responsivo e atrativo
- **Sistema de Autenticação**: Login e registro seguros com Supabase
- **Gestão de Apólices**: Registro de seguros auto e residencial
- **Dashboard Intuitivo**: Métricas e estatísticas em tempo real
- **Sistema de Prêmios**: Pontuação baseada em performance
- **Validação de CNPJ**: Integração com API externa
- **Interface Responsiva**: Funciona em desktop e mobile

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- Git

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd premiosbase
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `supabase-schema.sql` no SQL Editor do Supabase
3. Copie o arquivo `env.example` para `.env.local`:
```bash
cp env.example .env.local
```

4. Configure as variáveis de ambiente no `.env.local`:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Execute a aplicação
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
premiosbase/
├── components/
│   ├── auth/           # Formulários de autenticação
│   ├── dashboard/      # Componentes do dashboard
│   ├── pages/          # Páginas principais
│   └── ui/             # Componentes reutilizáveis
├── hooks/              # Hooks customizados
├── lib/                # Configurações (Supabase)
├── services/           # Serviços externos
├── utils/              # Utilitários e máscaras
└── types.ts            # Definições de tipos
```

## 🎯 Como Usar

1. **Acesse a Landing Page**: Visualize informações sobre a plataforma
2. **Cadastre-se**: Crie sua conta de corretor
3. **Faça Login**: Acesse seu dashboard
4. **Registre Apólices**: Adicione seguros auto e residencial
5. **Acompanhe Métricas**: Veja seu desempenho em tempo real
6. **Conquiste Prêmios**: Acumule pontos baseados em suas vendas

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção

## 📊 Banco de Dados

O Supabase gerencia automaticamente:
- **Autenticação**: Login/registro de usuários
- **Dados**: Armazenamento de usuários e apólices
- **Segurança**: Row Level Security (RLS)
- **APIs**: Endpoints automáticos

## 🎨 Design System

- **Cores**: Gradientes azul/índigo
- **Tipografia**: Sistema de fontes responsivo
- **Componentes**: Cards, botões, inputs padronizados
- **Layout**: Grid responsivo e flexbox

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona perfeitamente em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔒 Segurança

- Autenticação segura com Supabase Auth
- Row Level Security no banco de dados
- Validação de dados no frontend e backend
- HTTPS obrigatório em produção

## 🚀 Deploy

Para fazer deploy em produção:

1. Configure as variáveis de ambiente
2. Execute `npm run build`
3. Faça upload dos arquivos da pasta `dist/`
4. Configure seu servidor web (Nginx, Apache, etc.)

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos canais oficiais.

---

**PremiosBase** - Transformando vendas em prêmios! 🏆
