import bcrypt from 'bcryptjs';

async function generateSql() {
  const password = 'Argo@1507';
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = 'fluowai@gmail.com';
  const name = 'Super Admin';
  const orgName = 'Fluow AI';
  const orgSlug = 'fluow-ai';

  console.log('-- COPIE E COLE ESTE SQL NO SUPABASE SQL EDITOR --');
  console.log(`
-- 1. Limpar dados existentes para evitar conflitos
DELETE FROM "User" WHERE email = '${email}';
DELETE FROM "Organization" WHERE slug = '${orgSlug}';

-- 2. Criar a Organização vinculada
INSERT INTO "Organization" (id, name, slug, plan, "updatedAt") 
VALUES ('org_admin_001', '${orgName}', '${orgSlug}', 'ENTERPRISE', now());

-- 3. Criar o Usuário Super Admin
INSERT INTO "User" (id, email, name, password, role, "organizationId", "updatedAt") 
VALUES ('user_admin_001', '${email}', '${name}', '${hashedPassword}', 'SUPER_ADMIN', 'org_admin_001', now());

-- 4. Verificar se foi criado
SELECT * FROM "User" WHERE email = '${email}';
  `);
}

generateSql();
