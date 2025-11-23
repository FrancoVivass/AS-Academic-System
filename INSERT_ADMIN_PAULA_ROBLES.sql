-- ============================================
-- SCRIPT: Crear Administrador para Instituto Paula Robles
-- ============================================
-- Ejecutar este script después de DATABASE_FINAL.sql
-- ============================================

-- Crear usuario administrador para Instituto Paula Robles
INSERT INTO usuarios (
  username,
  password,
  nombre,
  apellido,
  email,
  telefono,
  dni,
  rol,
  institucion_id,
  activo,
  fecha_registro
) 
SELECT 
  'admin',                    -- Username
  'admin123',                 -- Password (cambiar en producción)
  'Administrador',            -- Nombre
  'Paula Robles',             -- Apellido
  'admin@paulrobles.edu.ar',  -- Email
  NULL,                       -- Teléfono
  NULL,                       -- DNI
  'admin',                    -- Rol
  id,                         -- ID de la institución
  true,                       -- Activo
  NOW()                       -- Fecha de registro
FROM instituciones
WHERE nombre = 'Instituto Paula Robles'
ON CONFLICT (username) DO UPDATE SET
  institucion_id = EXCLUDED.institucion_id,
  activo = true;

-- Verificar que se creó correctamente
SELECT 
  u.id,
  u.username,
  u.nombre,
  u.apellido,
  u.email,
  u.rol,
  u.activo,
  i.nombre as institucion
FROM usuarios u
JOIN instituciones i ON u.institucion_id = i.id
WHERE u.username = 'admin' 
  AND i.nombre = 'Instituto Paula Robles';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Credenciales de acceso:
-- Username: admin
-- Password: admin123
-- IMPORTANTE: Cambiar la contraseña después del primer acceso
-- ============================================

