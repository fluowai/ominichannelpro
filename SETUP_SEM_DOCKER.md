# 📝 Guia Sem Docker

Se você não tem Docker instalado, pode usar PostgreSQL local ou online.

## Opção 1: PostgreSQL Online (Mais Fácil)

### 1. Criar banco gratuito no Neon.tech

1. Acesse: https://neon.tech
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a `DATABASE_URL`

### 2. Configurar Backend

Edite `backend/.env` e cole a URL:

```env
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
```

### 3. Executar Migrations

```bash
cd backend
npm install
npm run db:push
```

### 4. Rodar Backend

```bash
npm run dev
```

---

## Opção 2: PostgreSQL Local (Windows)

### 1. Instalar PostgreSQL

1. Download: https://www.postgresql.org/download/windows/
2. Instale com as configurações padrão
3. Senha: anote a senha que você criar

### 2. Criar Banco de Dados

Abra o `SQL Shell (psql)` e:

```sql
CREATE DATABASE fluow_ai;
```

### 3. Configurar Backend

Edite `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/fluow_ai?schema=public"
```

### 4. Executar Migrations

```bash
cd backend
npm install
npm run db:push
```

### 5. Rodar Backend

```bash
npm run dev
```

---

## Redis (Opcional)

Se você não usar Redis:

1. Comente as linhas de Redis no `backend/src/server.ts`
2. O sistema funcionará sem cache/filas (para desenvolvimento básico)

---

## ✅ Próximo Passo

Depois de configurar o banco:

1. **Backend** rodando em `http://localhost:3333`
2. **Frontend**:
   ```bash
   cd ..
   npm install
   npm run dev
   ```
3. Acesse `http://localhost:3000`

---

## 🆘 Problemas?

### Erro de conexão com banco

- Verifique se o PostgreSQL está rodando
- Confirme usuário, senha e nome do banco
- Teste a conexão com `npm run db:studio`

### Erro "relation does not exist"

- Execute: `npm run db:push` no backend
- Isso cria as tabelas no banco
