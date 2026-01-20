-- ============================================
-- SCRIPT PARA LIMPAR COMPLETAMENTE O BANCO SUPABASE
-- ============================================
-- ATENÇÃO: Este script irá DELETAR TODAS as tabelas e dados
-- Execute com cuidado!

-- Desabilitar verificação de foreign keys temporariamente
SET session_replication_role = 'replica';

-- Dropar todas as tabelas na ordem correta (por causa das foreign keys)
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Contact" CASCADE;
DROP TABLE IF EXISTS "Campaign" CASCADE;
DROP TABLE IF EXISTS "Template" CASCADE;
DROP TABLE IF EXISTS "QuickReply" CASCADE;
DROP TABLE IF EXISTS "Integration" CASCADE;
DROP TABLE IF EXISTS "Agent" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Dropar enums se existirem
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "AgentProvider" CASCADE;
DROP TYPE IF EXISTS "AgentStatus" CASCADE;
DROP TYPE IF EXISTS "Platform" CASCADE;
DROP TYPE IF EXISTS "ConversationStatus" CASCADE;
DROP TYPE IF EXISTS "MessageSender" CASCADE;
DROP TYPE IF EXISTS "IntegrationType" CASCADE;
DROP TYPE IF EXISTS "IntegrationStatus" CASCADE;
DROP TYPE IF EXISTS "CampaignStatus" CASCADE;

-- Reabilitar verificação de foreign keys
SET session_replication_role = 'origin';

-- Verificar se todas as tabelas foram removidas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%';

-- Resultado deve estar vazio (sem tabelas)
