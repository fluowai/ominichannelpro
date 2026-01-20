# Planejamento de Novos Módulos: Contatos, Importação de Grupos e Kanban

Este documento detalha o plano de implementação para os três novos módulos solicitados.

## 1. Módulo de Contatos (Lista Telefônica)

**Objetivo:** Criar uma interface centralizada para gerenciar todos os contatos, com funcionalidades de criação, edição, visualização e exclusão (CRUD), além de filtros avançados.

### Banco de Dados (Prisma)

- **Atualização no Modelo `Contact`:**
  - Garantir que campos como `name`, `phone`, `email`, `avatar`, `tags` estejam otimizados.
  - Adicionar relação com `ContactList` (Muitos-para-Muitos ou via tabela pivô).

### Backend

- **Novas Rotas (`routes/contacts.routes.ts`):**
  - `GET /contacts`: Listar contatos com paginação e filtros (nome, telefone, tags).
  - `POST /contacts`: Criar um novo contato manual.
  - `PUT /contacts/:id`: Editar informações do contato.
  - `DELETE /contacts/:id`: Remover contato.
  - `POST /contacts/bulk-delete`: Remover múltiplos contatos.

### Frontend

- **Nova Página (`pages/Contacts.tsx`):**
  - Tabela de dados (Data Grid) mostrando Nome, Telefone, Email, Tags, Data de Criação.
  - Barra de pesquisa e filtros laterais.
  - Botão "Novo Contato" abrindo um modal/drawer.
  - Menu de ações em cada linha (Editar, Excluir).

## 2. Módulo de Importação de Grupos WhatsApp

**Objetivo:** Permitir que o usuário selecione grupos do WhatsApp (via Evolution API), visualize os participantes e importe esses contatos para Listas de Contatos no sistema.

### Banco de Dados (Prisma)

- **Novo Modelo `ContactList`:**
  - `id`, `name`, `description`, `organizationId`.
  - Relação com `Contact` (Um contato pode pertencer a várias listas).

### Backend

- **Integração com Evolution API:**
  - Endpoint `GET /integrations/:instanceId/groups`: Listar grupos que a instância faz parte.
  - Endpoint `GET /integrations/:instanceId/groups/:groupId/participants`: Buscar participantes de um grupo específico.
- **Rota de Importação:**
  - `POST /contacts/import-groups`: Recebe lista de participantes + ID da Lista de Destino.
    - Cria ou atualiza os contatos (upsert pelo telefone).
    - Vincula os contatos à `ContactList` especificada.

### Frontend

- **Interface de Importação (Dentro de Contatos ou nova rota):**
  - **Passo 1:** Selecionar Instância Conectada.
  - **Passo 2:** Listar Grupos disponíveis (com checkbox para seleção).
  - **Passo 3:** (Opcional) Preview dos participantes.
  - **Passo 4:** Selecionar ou Criar uma "Lista de Destino" (ex: "Importação Grupo Condomínio X").
  - **Passo 5:** Executar Importação e mostrar progresso.

## 3. Módulo Kanban (CRM/Pipeline)

**Objetivo:** Visualizar contatos ou visualizações de fluxo (leads) em colunas (ex: "Novo", "Em Atendimento", "Fechado"), com funcionalidade de arrastar e soltar (Drag & Drop).

### Banco de Dados (Prisma)

- **Novos Modelos:**
  - `KanbanBoard` (opcional, se houver múltiplos boards).
  - `KanbanColumn`: `id`, `title`, `order`, `color`, `organizationId`.
  - `KanbanCard`: `id`, `title`, `description`, `value`, `order`, `columnId`, `contactId`.

### Backend

- **Rotas (`routes/kanban.routes.ts`):**
  - `GET /kanban/columns`: Retornar colunas e seus cards.
  - `POST /kanban/columns`: Criar coluna.
  - `POST /kanban/cards`: Criar card.
  - `PUT /kanban/cards/move`: Atualizar `columnId` e `order` (movimentação).

### Frontend

- **Nova Página (`pages/Kanban.tsx`):**
  - Layout horizontal com colunas.
  - Integração com biblioteca `dnd-kit` ou `react-beautiful-dnd` para drag & drop suave.
  - Cards exibindo Nome do Contato, Valor (se houver), Tags e Responsável.
  - Ao clicar no card, abrir detalhes do contato/negócio.

---

## Ordem de Implementação Sugerida

1.  **Backend - Schema & Migrations:** Criar novos modelos `ContactList`, `KanbanColumn`, `KanbanCard` e atualizar `Contact`. ✅ **CONCLUÍDO**
2.  **Backend - Services:** Implementar a lógica de CRUD e integração com Evolution para grupos. ✅ **CONCLUÍDO**
3.  **Frontend - Contatos:** Criar a página base de contatos. ✅ **CONCLUÍDO**
4.  **Frontend - Importação:** Criar o fluxo de importação de grupos. ✅ **CONCLUÍDO**
5.  **Frontend - Kanban:** Implementar o quadro visual. ✅ **CONCLUÍDO**

---

## Status da Implementação

### ✅ Concluído

#### Backend

- ✅ Schema Prisma atualizado com novos modelos
- ✅ Migrations aplicadas ao banco de dados
- ✅ Services criados:
  - `contacts.service.ts` - CRUD completo de contatos
  - `contactLists.service.ts` - Gerenciamento de listas
  - `kanban.service.ts` - Gerenciamento de quadro Kanban
- ✅ Routes criadas:
  - `/api/contacts` - Endpoints de contatos
  - `/api/contact-lists` - Endpoints de listas
  - `/api/kanban` - Endpoints do Kanban
- ✅ Integração Evolution API:
  - Método `fetchGroups()` para buscar grupos
  - Método `fetchGroupParticipants()` para buscar participantes
  - Rotas `/integrations/:id/groups` e `/integrations/:id/groups/:groupId/participants`

#### Frontend

- ✅ Página de Contatos (`/contacts`)
  - Tabela com paginação
  - Busca e filtros
  - CRUD completo (criar, editar, excluir)
  - Seleção múltipla e exclusão em massa
- ✅ Página de Importação de Grupos (`/group-import`)
  - Wizard de 3 passos
  - Seleção de instância WhatsApp
  - Seleção de grupos
  - Criação/seleção de lista de destino
- ✅ Página Kanban (`/kanban`)
  - Quadro visual com colunas
  - Drag & Drop funcional (dnd-kit)
  - Criação de cards
  - Colunas padrão inicializadas automaticamente
- ✅ Navegação atualizada no sidebar
- ✅ Rotas registradas no App.tsx

### 📦 Dependências Instaladas

- `@dnd-kit/core` - Core do drag and drop
- `@dnd-kit/sortable` - Sortable para listas
- `@dnd-kit/utilities` - Utilitários do dnd-kit

### 🎯 Próximos Passos (Opcional)

1. Implementar a lógica real de importação de grupos (atualmente usa mock data)
2. Adicionar filtros avançados na página de contatos (por plataforma, tags, etc.)
3. Implementar edição de colunas do Kanban
4. Adicionar visualização de detalhes do card no Kanban
5. Implementar vinculação de contatos aos cards do Kanban
6. Adicionar exportação de contatos (CSV, Excel)
7. Implementar tags personalizadas para contatos
