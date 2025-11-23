-- ============================================
-- SCRIPT UPDATE: Colores de Instituciones
-- ============================================
-- Ejecutar este script después de DATABASE_FINAL.sql
-- ============================================

-- Actualizar colores del Instituto Paula Robles
UPDATE instituciones 
SET 
  color_primario = '#8b0000',      -- Rojo oscuro
  color_secundario = '#d3d3d3',   -- Gris claro
  color_acento = '#ffffff'        -- Blanco
WHERE nombre = 'Instituto Paula Robles';

-- Actualizar colores del Centro Universitario Dolores
UPDATE instituciones 
SET 
  color_primario = '#C8AD7F',     -- Beige/Dorado
  color_secundario = '#d3d3d3',   -- Gris claro
  color_acento = '#000000'        -- Negro
WHERE nombre = 'Centro Universitario Dolores';

-- Verificar los cambios
SELECT 
  nombre,
  nombre_corto,
  color_primario,
  color_secundario,
  color_acento
FROM instituciones
WHERE nombre IN ('Instituto Paula Robles', 'Centro Universitario Dolores');

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

