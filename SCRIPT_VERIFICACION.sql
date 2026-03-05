-- ============================================
-- SCRIPT DE VERIFICACIÓN RÁPIDA
-- Ejecuta esto para diagnosticar problemas
-- ============================================

-- 1. Verificar que existen las tablas principales
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Contar registros en instituciones
SELECT 
  COUNT(*) as total_instituciones,
  'instituciones' as tabla
FROM instituciones;

-- 3. Contar registros en usuarios
SELECT 
  COUNT(*) as total_usuarios,
  'usuarios' as tabla
FROM usuarios;

-- 4. Ver todas las instituciones con sus datos
SELECT 
  id,
  nombre,
  nombre_corto,
  email,
  activa,
  color_primario,
  color_secundario,
  color_acento,
  fecha_creacion
FROM instituciones
ORDER BY nombre;

-- 5. Ver todos los usuarios (nombres sin mostrar contraseña)
SELECT 
  id,
  username,
  nombre,
  apellido,
  email,
  rol,
  institucion_id,
  activo,
  fecha_registro
FROM usuarios
ORDER BY fecha_registro DESC;

-- 6. Verificar políticas RLS habilitadas
SELECT 
  tablename,
  rowsecurity
FROM pg_class
JOIN information_schema.tables ON pg_class.relname = information_schema.tables.table_name
WHERE table_schema = 'public' AND rowsecurity = true
ORDER BY tablename;

-- 7. Ver las políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. Diagnosticar - Si esta query falla, no hay tablas
SELECT 1 as status FROM instituciones LIMIT 1;
