-- Criar organização
INSERT INTO "Organization" (id, name, slug, domain, "createdAt", "updatedAt")
VALUES ('default-org', 'Organização Principal', 'principal', 'fluowai.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Criar usuário admin (senha: admin123)
-- Hash bcrypt de 'admin123': $2a$10$YourHashHere
INSERT INTO "User" (id, email, name, password, role, "organizationId", "createdAt", "updatedAt")
VALUES (
  'admin-user-001',
  'fluowai@gmail.com', 
  'Admin',
  '$2a$10$rOJ3LQKvP5wVKFJQGqF2k.YZ0PQ.QvPxJZ5xvPZ5xvPZ5xvPZ5xvP',
  'SUPER_ADMIN',
  'default-org',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
