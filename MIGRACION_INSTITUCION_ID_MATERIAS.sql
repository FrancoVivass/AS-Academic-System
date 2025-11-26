-- ============================================
-- MIGRACIÓN: Agregar institucion_id a materias
-- ============================================
-- Este script agrega el campo institucion_id a la tabla materias
-- y migra los datos existentes asignándolos a la institución correspondiente
-- ============================================

-- Paso 1: Agregar el campo institucion_id a materias
ALTER TABLE materias 
ADD COLUMN IF NOT EXISTS institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE;

-- Paso 2: Migrar datos existentes
-- Asignar materias a la institución de su carrera (si tienen carrera)
UPDATE materias m
SET institucion_id = c.institucion_id
FROM carreras c
WHERE m.carrera_id = c.id 
  AND m.institucion_id IS NULL;

-- Paso 3: Para materias sin carrera, asignar a la primera institución activa
UPDATE materias
SET institucion_id = (
  SELECT id FROM instituciones WHERE activa = true ORDER BY fecha_creacion ASC LIMIT 1
)
WHERE institucion_id IS NULL;

-- Paso 4: Hacer el campo NOT NULL después de migrar los datos
ALTER TABLE materias 
ALTER COLUMN institucion_id SET NOT NULL;

-- Paso 5: Eliminar índices antiguos y crear nuevos
DROP INDEX IF EXISTS idx_materias_carrera_codigo_unique;
DROP INDEX IF EXISTS idx_materias_codigo_unique;

-- Crear índice único por institución y código
CREATE UNIQUE INDEX IF NOT EXISTS idx_materias_institucion_codigo_unique 
ON materias(institucion_id, codigo);

-- Crear índice para filtrar por institución
CREATE INDEX IF NOT EXISTS idx_materias_institucion ON materias(institucion_id);

-- Paso 6: Agregar trigger para validar institucion_id
DROP TRIGGER IF EXISTS trigger_validate_institucion_id_materias ON materias;
CREATE TRIGGER trigger_validate_institucion_id_materias
BEFORE INSERT OR UPDATE ON materias
FOR EACH ROW
EXECUTE FUNCTION validate_institucion_id_required();

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

