# 🚀 Guia de Início Rápido - Fluow AI

## Passo a Passo para Rodar o Sistema Completo

### 1️⃣ Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** 20 ou superior
- **Docker Desktop** (para banco de dados)
- **Git** (opcional)

### 2️⃣ Subir o Banco de Dados

Na pasta raiz do projeto:

```bash
docker-compose up -d
```

Isso irá subir:

- PostgreSQL na porta 5432
- Redis na porta 6379

### 3️⃣ Configurar Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

**IMPORTANTE**: Configure a `DATABASE_URL` no `.env`:

```env
DATABASE_URL="postgresql://fluow:fluow123@localhost:5432/fluow_ai?schema=public"
```

Execute as migrations do banco:

```bash
npm run db:push
```

Inicie o servidor backend:

```bash
npm run dev
```

✅ Backend rodando em `http://localhost:3333`

### 4️⃣ Configurar Frontend

Abra um **novo terminal** e:

```bash
cd ..
npm install
```

Crie o arquivo `.env.local`:

```bash
VITE_API_URL=http://localhost:3333/api
GEMINI_API_KEY=sua-chave-gemini-aqui
```

Inicie o frontend:

```bash
npm run dev
```

✅ Frontend rodando em `http://localhost:3000`

### 5️⃣ Acessar o Sistema

Abra o navegador em: **http://localhost:3000**

Você verá a tela de login/registro.

**Primeiro acesso**: Clique em "Registrar" e crie uma conta.

---

## 🛠️ Comandos Úteis

### Backend

```bash
cd backend

# Desenvolvimento
npm run dev

# Ver banco de dados visualmente
npm run db:studio

# Parar banco
docker-compose down
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
```

---

## 📝 Próximos Passos Recomendados

1. **Criar seu primeiro agente** na aba "Builder Agentes"
2. **Conectar Evolution API** em "Integrações"
3. **Iniciar uma conversa** simulada em "Conversas"
4. **Criar uma campanha** de broadcast

---

## ⚠️ Problemas Comuns

### Erro na conexão com o banco

- Verifique se o Docker está rodando: `docker ps`
- Verifique a `DATABASE_URL` no `.env`

### Backend não inicia

- Verifique se a porta 3333 está livre
- Execute `npm install` novamente

### Frontend não conecta ao backend

- Verifique se o backend está rodando em `localhost:3333`
- Confira a variável `VITE_API_URL` no `.env.local`

---

## 📞 Suporte

Em caso de dúvidas, consulte:

- `backend/README.md` - Documentação completa do backend
- `implementation_plan.md` - Plano de implementação
- `task.md` - Lista de tarefas

**Boa sorte! 🚀**
