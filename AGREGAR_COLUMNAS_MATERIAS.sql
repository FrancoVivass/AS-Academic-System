-- ============================================
-- SCRIPT RÁPIDO: Agregar columnas a materias
-- Ejecutar este script en Supabase SQL Editor
-- ============================================
-- Este script agrega las columnas: profesor, curso, horario
-- Si las columnas ya existen, el script no fallará
-- ============================================

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

-- Asegurar que carrera_id sea nullable (por si acaso)
ALTER TABLE materias ALTER COLUMN carrera_id DROP NOT NULL;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Después de ejecutar este script, refresca el schema cache de Supabase
-- o espera unos segundos para que se actualice automáticamente
-- ============================================


