# Fluow AI - Backend

API REST com Fastify + PostgreSQL + Prisma + WebSocket

## 🚀 Começar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (para banco de dados)
- npm ou yarn

### Instalação

1. **Instalar dependências**:

   ```bash
   cd backend
   npm install
   ```

2. **Configurar variáveis de ambiente**:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` e configure:

   - `DATABASE_URL` - URL do PostgreSQL
   - `JWT_SECRET` - Chave secreta para JWT
   - `GEMINI_API_KEY` - Sua chave da API Gemini
   - Outras configurações conforme necessário

3. **Subir banco de dados (Docker)**:

   ```bash
   cd ..
   docker-compose up -d
   ```

4. **Executar migrations**:

   ```bash
   npm run db:push
   # ou
   npm run db:migrate
   ```

5. **Rodar servidor**:

   ```bash
   npm run dev
   ```

   O servidor estará rodando em `http://localhost:3333`

## 📁 Estrutura

```
backend/
├── prisma/
│   └── schema.prisma        # Schema do banco de dados
├── src/
│   ├── lib/
│   │   ├── prisma.ts        # Cliente Prisma
│   │   └── hash.ts          # Funções de hash
│   ├── middleware/
│   │   └── auth.ts          # Middleware de autenticação
│   ├── routes/
│   │   ├── auth.routes.ts   # Rotas de autenticação
│   │   ├── agent.routes.ts  # CRUD de agentes
│   │   ├── conversation.routes.ts
│   │   ├── campaign.routes.ts
│   │   ├── integration.routes.ts
│   │   └── user.routes.ts
│   ├── websocket/
│   │   └── chat.ts          # WebSocket para chat
│   └── server.ts            # Servidor principal
├── .env.example
├── package.json
└── tsconfig.json
```

## 🔌 Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

### Agentes

- `GET /api/agents` - Listar agentes
- `POST /api/agents` - Criar agente
- `GET /api/agents/:id` - Detalhes do agente
- `PUT /api/agents/:id` - Atualizar agente
- `DELETE /api/agents/:id` - Deletar agente

### Conversas

- `GET /api/conversations` - Listar conversas
- `GET /api/conversations/:id` - Detalhes da conversa
- `POST /api/conversations/:id/messages` - Enviar mensagem
- `PATCH /api/conversations/:id/assign` - Atribuir conversa
- `PATCH /api/conversations/:id/status` - Atualizar status

### Campanhas

- `GET /api/campaigns` - Listar campanhas
- `POST /api/campaigns` - Criar campanha
- `GET /api/campaigns/:id/stats` - Estatísticas
- `DELETE /api/campaigns/:id` - Deletar campanha

### Integrações

- `GET /api/integrations` - Listar integrações
- `POST /api/integrations` - Criar integração
- `POST /api/integrations/:id/test` - Testar conexão
- `DELETE /api/integrations/:id` - Deletar integração

### Usuários

- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/password` - Alterar senha
- `GET /api/users` - Listar usuários (admin)

### WebSocket

- `ws://localhost:3333/ws/chat?userId=ID` - Chat em tempo real

## 🛠️ Scripts

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build de produção
- `npm start` - Rodar build de produção
- `npm run db:generate` - Gerar Prisma Client
- `npm run db:push` - Push schema para DB
- `npm run db:migrate` - Executar migrations
- `npm run db:studio` - Abrir Prisma Studio

## 🔒 Autenticação

O sistema usa **JWT** com access tokens (15min) e refresh tokens (7 dias).

**Headers necessários**:

```
Authorization: Bearer <access_token>
```

## 📝 TODO

- [ ] Implementar serviços de LLM (Gemini, OpenAI, Groq)
- [ ] Integração real com Evolution API
- [ ] Integração com Instagram Graph API
- [ ] Sistema de filas (BullMQ)
- [ ] Rate limiting
- [ ] Logs estruturados
- [ ] Testes automatizados
- [ ] Documentação Swagger/OpenAPI
