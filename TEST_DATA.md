# ⚠️ Importante: Criar Dados de Teste

Como o banco de dados está vazio, você não verá conversas no Chat.

Uma forma rápida de testar é criar uma conversa via SQL no Supabase:

1. Vá no **Superbase SQL Editor** e rode:

```sql
-- Criar um contato
INSERT INTO "Contact" ("id", "name", "platform", "platformId", "updatedAt")
VALUES ('contato-test', 'Cliente Teste', 'WHATSAPP', '5511999999999', NOW());

-- Criar uma conversa
INSERT INTO "Conversation" ("id", "contactId", "platform", "status", "updatedAt")
VALUES ('conv-test', 'contato-test', 'WHATSAPP', 'OPEN', NOW());

-- Criar mensagens
INSERT INTO "Message" ("id", "conversationId", "text", "sender", "createdAt")
VALUES ('msg-1', 'conv-test', 'Olá, tudo bem?', 'USER', NOW() - INTERVAL '5 minutes');

INSERT INTO "Message" ("id", "conversationId", "text", "sender", "createdAt")
VALUES ('msg-2', 'conv-test', 'Tudo ótimo! Como posso ajudar?', 'AGENT', NOW());
```

2. Volte para o sistema e recarregue a página de Chat!
