# Análise de Erros na Integração Wuzapi

Realizei uma análise profunda do código de integração da Wuzapi (`wuzapi.service.ts`, `integration.routes.ts`, `webhook.routes.ts`) e identifiquei os prováveis motivos para os erros que você está enfrentando.

## 🔍 Principais Problemas Identificados

### 1. Conectividade e Webhooks (Erro Mais Provável)

O sistema configura automaticamente o Webhook usando a seguinte lógica:

```typescript
const backendUrl = process.env.BACKEND_PUBLIC_URL || "http://localhost:3333";
const webhookUrl = `${backendUrl}/webhook/wuzapi/${sessionId}`;
```

**O Problema**: Se a sua Wuzapi estiver rodando em um container Docker (ou em outro servidor) e o backend estiver rodando localmente (Windows), a Wuzapi **não consegue acessar** `http://localhost:3333`.

- Para a Wuzapi, `localhost` refere-se ao próprio container dela, não ao seu computador onde o backend está.
- Isso causa falha no envio de mensagens e recebimento de respostas (Webhook Error).

**Solução**:

- Você precisa usar um túnel público (como Ngrok) e configurar a URL pública no painel de configurações.
- Ou, se estiver tudo em Docker na mesma rede, usar o nome do serviço (ex: `http://backend:3333`).

### 2. Endpoints "Adivinhados" no Serviço

No arquivo `backend/src/services/wuzapi.service.ts`, notei comentários indicando que alguns endpoints foram "adivinhados":

```typescript
// Line 120
endpoint = "/chat/send/video"; // Guessed endpoint
```

Se a versão da sua Wuzapi não seguir exatamente esse padrão (ex: usar `/message/send` em vez de `/chat/send`), o envio de mídia falhará com erro 404.

### 3. Autenticação e Headers

O serviço está enviando o token no header `token`:

```typescript
headers: {
  'Content-Type': 'application/json',
  'token': userToken
}
```

Algumas versões da API podem exigir `Authorization: Bearer <token>` ou `apikey`. É fundamental verificar se a sua instalação da Wuzapi aceita o header `token`.

### 4. Rota de Criação de Sessão

O código tenta criar uma sessão via POST `/session/connect`.
Se a sessão já existir ou estiver "pendurada" na Wuzapi, esse endpoint pode retornar erro. O ideal seria verificar o status antes de tentar conectar.

## 🛠️ Plano de Correção Recomendado

1.  **Verifique a URL do Webhook**:
    - Vá em **Configurações > Evolution API (Global)** (sim, a URL pública é compartilhada lá).
    - Certifique-se de que a "URL Pública do Backend" é uma URL acessível externamente (ex: `https://xxxx.ngrok-free.app`).

2.  **Teste a Conexão Manualmente**:
    - Acesse **Configurações > WUZAPI** e use o botão "Testar Conexão".
    - Se falhar, verifique se a URL da API está correta (sem barra no final, ex: `http://localhost:8080/api`).

3.  **Logs Detalhados**:
    - O sistema tenta escrever logs em `evolution_debug.log` na raiz do backend. Verifique esse arquivo para ver erros exatos de resposta HTTP (404, 401, 500).

Se você puder me fornecer o **erro específico** que aparece (print ou texto do erro), posso aplicar a correção exata no código.
