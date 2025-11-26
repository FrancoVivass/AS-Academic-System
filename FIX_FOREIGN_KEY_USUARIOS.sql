-- ============================================
-- SCRIPT DE CORRECCIÓN: Foreign Key en usuarios
-- ============================================
-- Este script corrige el problema de foreign key constraint
-- cuando se intenta insertar usuarios con institucion_id inválido
-- ============================================

-- ============================================
-- SOLUCIÓN 1: Hacer que institucion_id sea nullable por defecto
-- ============================================
-- Asegurar que institucion_id pueda ser NULL
ALTER TABLE usuarios ALTER COLUMN institucion_id DROP NOT NULL;

-- ============================================
-- SOLUCIÓN 2: Crear función para validar institucion_id antes de insertar
-- ============================================
CREATE OR REPLACE FUNCTION validate_institucion_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se proporciona un institucion_id, verificar que exista
  IF NEW.institucion_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM instituciones WHERE id = NEW.institucion_id) THEN
      RAISE EXCEPTION 'El institucion_id % no existe en la tabla instituciones', NEW.institucion_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_validate_institucion_id ON usuarios;

-- Crear trigger para validar antes de insertar/actualizar
CREATE TRIGGER trigger_validate_institucion_id
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id();

-- ============================================
-- SOLUCIÓN 3: Función helper para obtener o crear institución por defecto
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_default_institucion()
RETURNS UUID AS $$
DECLARE
  v_institucion_id UUID;
BEGIN
  -- Intentar obtener la primera institución activa
  SELECT id INTO v_institucion_id
  FROM instituciones
  WHERE activa = true
  ORDER BY fecha_creacion ASC
  LIMIT 1;

  -- Si no hay instituciones, retornar NULL
  RETURN v_institucion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SOLUCIÓN 4: Actualizar usuarios existentes con institucion_id inválido
-- ============================================
-- Establecer institucion_id a NULL para usuarios con institucion_id inválido
UPDATE usuarios
SET institucion_id = NULL
WHERE institucion_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM instituciones WHERE id = usuarios.institucion_id
  );

-- ============================================
-- FIN DEL SCRIPT DE CORRECCIÓN
-- ============================================
-- Después de ejecutar este script:
-- 1. Los usuarios pueden crearse sin institucion_id (NULL)
-- 2. Si se proporciona institucion_id, se valida que exista
-- 3. Los usuarios existentes con institucion_id inválido se actualizan a NULL
-- ============================================


