-- ============================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS
-- Para AS-Academic-System
-- Ejecutar después de DATABASE_FINAL.sql
-- ============================================

-- ============================================
-- ACTUALIZACIÓN 1: Agregar campos a tabla materias
-- ============================================
-- Agregar campos profesor, curso y horario a la tabla materias
-- Estos campos son opcionales y permiten crear materias sin profesor inicialmente

-- Agregar campo profesor si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'materias' 
    AND column_name = 'profesor'
  ) THEN
    ALTER TABLE materias ADD COLUMN profesor VARCHAR(255);
    RAISE NOTICE 'Columna profesor agregada';
  ELSE
    RAISE NOTICE 'Columna profesor ya existe';
  END IF;
END $$;

-- Agregar campo curso si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'materias' 
    AND column_name = 'curso'
  ) THEN
    ALTER TABLE materias ADD COLUMN curso VARCHAR(100);
    RAISE NOTICE 'Columna curso agregada';
  ELSE
    RAISE NOTICE 'Columna curso ya existe';
  END IF;
END $$;

-- Agregar campo horario si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'materias' 
    AND column_name = 'horario'
  ) THEN
    ALTER TABLE materias ADD COLUMN horario TEXT;
    RAISE NOTICE 'Columna horario agregada';
  ELSE
    RAISE NOTICE 'Columna horario ya existe';
  END IF;
END $$;

-- ============================================
-- ACTUALIZACIÓN 2: Modificar restricción UNIQUE de materias
-- ============================================
-- Permitir crear materias sin carrera_id inicialmente
-- Eliminar la restricción UNIQUE antigua si existe
DO $$ 
BEGIN
  -- Eliminar constraint UNIQUE antigua si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'materias_carrera_id_codigo_key'
  ) THEN
    ALTER TABLE materias DROP CONSTRAINT materias_carrera_id_codigo_key;
  END IF;
END $$;

-- Crear índices únicos parciales (solo cuando carrera_id no es NULL)
-- Esto permite crear materias sin carrera inicialmente
DROP INDEX IF EXISTS idx_materias_carrera_codigo_unique;
CREATE UNIQUE INDEX idx_materias_carrera_codigo_unique 
ON materias(carrera_id, codigo) 
WHERE carrera_id IS NOT NULL;

-- Índice único para código cuando no hay carrera_id
DROP INDEX IF EXISTS idx_materias_codigo_unique;
CREATE UNIQUE INDEX idx_materias_codigo_unique 
ON materias(codigo) 
WHERE carrera_id IS NULL;

-- ============================================
-- ACTUALIZACIÓN 3: Asegurar que carrera_id sea nullable
-- ============================================
-- Permitir que carrera_id sea NULL en materias
DO $$ 
BEGIN
  -- Intentar hacer nullable carrera_id (puede fallar si ya es nullable)
  BEGIN
    ALTER TABLE materias ALTER COLUMN carrera_id DROP NOT NULL;
    RAISE NOTICE 'carrera_id ahora es nullable';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'carrera_id ya es nullable o no existe la columna';
  END;
END $$;

-- ============================================
-- ACTUALIZACIÓN 4: Verificar que docente_materias tenga la foreign key correcta
-- ============================================
-- Asegurar que la foreign key de materia_id en docente_materias esté correcta
DO $$ 
BEGIN
  -- Eliminar constraint antigua si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_docente_materias_materia'
  ) THEN
    ALTER TABLE docente_materias DROP CONSTRAINT fk_docente_materias_materia;
  END IF;
END $$;

-- Agregar la foreign key si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_docente_materias_materia'
  ) THEN
    ALTER TABLE docente_materias 
    ADD CONSTRAINT fk_docente_materias_materia 
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- ACTUALIZACIÓN 5: Comentarios en las tablas
-- ============================================
COMMENT ON COLUMN materias.profesor IS 'Nombre del profesor asignado (opcional, se puede asignar después)';
COMMENT ON COLUMN materias.curso IS 'Nombre del curso donde se dicta (opcional)';
COMMENT ON COLUMN materias.horario IS 'Horario de la materia (opcional)';
COMMENT ON COLUMN materias.carrera_id IS 'ID de la carrera (opcional, se puede asignar después desde el wizard de carreras)';

-- ============================================
-- FIN DE ACTUALIZACIONES
-- ============================================
-- Nota: Estas actualizaciones permiten:
-- 1. Crear materias sin profesor (profesor opcional)
-- 2. Crear materias sin carrera_id (se asigna después)
-- 3. Los campos profesor, curso y horario son opcionales
-- ============================================

