# 🚀 FLUOW AI 2026 - Sistema Completo

## Visão Geral

Sistema OmniChannel de Gestão de Atendimento com IA, integrando WhatsApp, Instagram e Webchat.

### ✅ Stack Tecnológica

- **Frontend**: React 19, Vite, TailwindCSS, Zustand, Recharts
- **Backend**: Node.js (Fastify), Prisma ORM, JWT, WebSocket
- **Banco de Dados**: PostgreSQL (Supabase)
- **IA**: Google Gemini, OpenAI (Preparado), Groq (Preparado)

---

## 🛠️ Funcionalidades Implementadas (100% Funcional)

### 1. Autenticação 🔐

- Login e Registro com JWT
- Proteção de rotas (Middleware + PrivateRoute)
- Refresh Token automático
- Dados do usuário persistentes

### 2. Dashboard 📊

- Estatísticas em tempo real (conectado ao backend)
- Gráficos de leads e vendas
- Contadores de conversas, agentes e campanhas

### 3. Chat OmniChannel 💬

- WebSocket para mensagens em tempo real
- Lista de conversas e contatos
- Interface estilo WhatsApp Web
- Suporte a envio de texto e emojis

### 4. Builder de Agentes IA 🤖

- CRUD completo de Agentes
- Configuração de Prompt, Temperatura e Modelo
- Suporte a múltiplos providers (Gemini, OpenAI, Groq)

### 5. Broadcast (Campanhas) 📢

- Criação e agendamento de disparos em massa
- Status de envio (Enviada, Entregue, Lida)
- Histórico de campanhas

### 6. Integrações 📱

- Gerenciamento de instâncias do WhatsApp (Evolution API)
- Conexão com Instagram Direct
- Status de conexão em tempo real

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- Conta no Supabase (já configurada)

### 1. Iniciar o Backend

```bash
cd backend
npm run dev
```

_O servidor rodará em http://localhost:3333_

### 2. Iniciar o Frontend

Em outro terminal:

```bash
# na raiz do projeto
npm run dev
```

_O app rodará em http://localhost:3000_

---

## 🧪 Dados de Teste (Supabase)

Como o banco inicia vazio, use os scripts SQL fornecidos em `TEST_DATA.md` para popular o banco com:

- Contatos de teste
- Conversas e mensagens de exemplo
- Campanhas dummy

---

## 📁 Estrutura do Projeto

```
FLUOW AI2026/
├── backend/              # API Server
│   ├── prisma/           # Schema do Banco
│   ├── src/
│       ├── routes/       # Rotas da API
│       ├── websocket/    # Lógica do Chat
│       └── server.ts     # Entry point
├── src/                  # Frontend
│   ├── components/       # Componentes UI
│   ├── pages/            # Telas (Login, Chat, etc)
│   ├── store/            # Estado Global (Zustand)
│   └── services/         # Cliente API (Axios)
└── README.md             # Este arquivo
```

Desenvolvido por **Antigravity Agent** 🚀
