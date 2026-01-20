# 🗄️ Configuração Supabase

## Opção 1: Criar Schema do Zero (RECOMENDADO)

### 1️⃣ Executar SQL de Criação

1. Acesse: https://supabase.com/dashboard
2. Vá no seu projeto
3. Clique em **SQL Editor** (lado esquerdo)
4. Clique em **New query**
5. Cole o conteúdo do arquivo `backend/prisma/create-schema.sql`
6. Clique em **Run** (ou F5)
7. ✅ Todas as tabelas criadas!

### 2️⃣ Verificar Tabelas Criadas

No painel, vá em **Table Editor**. Você deve ver:

- Agent
- Campaign
- Contact
- Conversation
- Integration
- Message
- QuickReply
- RefreshToken
- Template
- User

---

## Opção 2: Usar Prisma (Alternativa)

1. No painel do Supabase, vá em **Settings** (⚙️)
2. Clique em **Database**
3. Role até **Connection string**
4. Copie a **Connection Pooling** (recomendado) ou **Direct connection**
5. Exemplo:
   ```
   postgresql://postgres.xxxxx:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### 3️⃣ Configurar Backend

Edite o arquivo `backend/.env`:

```env
DATABASE_URL="postgresql://postgres.xxxxx:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

⚠️ **IMPORTANTE**:

- Substitua `[SUA-SENHA]` pela senha do projeto Supabase
- Use `?pgbouncer=true` no final para connection pooling

### 4️⃣ Criar Tabelas no Supabase

No terminal do backend:

```bash
npm run db:push
```

Isso criará todas as tabelas automaticamente usando o Prisma!

### 5️⃣ Iniciar Backend

```bash
npm run dev
```

✅ Backend rodando conectado ao Supabase!

---

## 🔍 Verificar se Funcionou

### No Supabase Dashboard:

1. Vá em **Table Editor**
2. Você deve ver as tabelas:
   - User
   - RefreshToken
   - Agent
   - Conversation
   - Message
   - Contact
   - Campaign
   - Template
   - QuickReply
   - Integration

### No Terminal:

Você deve ver:

```
🚀 Server running at http://localhost:3333
```

---

## ❓ Problemas Comuns

### "Connection refused"

- Verifique se copiou a senha correta
- Confirme que está usando a string de **Connection Pooling**

### "relation does not exist"

- Execute `npm run db:push` novamente

### "too many connections"

- Use a Connection Pooling (porta 6543) ao invés da Direct connection (porta 5432)
- Adicione `?pgbouncer=true` na URL

---

## 🎯 Checklist

- [ ] Limpar banco antigo (se necessário)
- [ ] Copiar DATABASE_URL do Supabase
- [ ] Configurar `backend/.env`
- [ ] Executar `npm run db:push`
- [ ] Executar `npm run dev`
- [ ] Verificar tabelas no Supabase

---

## 💡 Dica Pro

Use o **Prisma Studio** para visualizar os dados:

```bash
npm run db:studio
```

Isso abrirá uma interface visual no navegador para ver/editar os dados!
