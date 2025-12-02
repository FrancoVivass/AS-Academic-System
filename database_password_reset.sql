-- =====================================================
-- SCRIPT COMPLETO: Sistema de Recuperación de Contraseña
-- Base de datos para códigos de verificación
-- =====================================================

-- Tabla para almacenar códigos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL, -- Código de 6 dígitos
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0, -- Intentos de verificación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT code_unique_per_user UNIQUE (usuario_id, code, created_at)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_password_reset_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_codes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_verified ON password_reset_codes(verified, used);

-- Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() OR (used = TRUE AND verified_at < NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- Función para verificar que un código no haya sido usado
CREATE OR REPLACE FUNCTION is_code_valid(p_code VARCHAR(6), p_email VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM password_reset_codes
  WHERE code = p_code
    AND email = p_email
    AND used = FALSE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF code_record IS NULL THEN
    RETURN FALSE;
  END IF;

  IF code_record.attempts >= 5 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar códigos antiguos automáticamente (opcional)
-- Se puede ejecutar manualmente o mediante un cron job

-- Comentarios descriptivos
COMMENT ON TABLE password_reset_codes IS 'Almacena códigos de verificación de 6 dígitos para recuperación de contraseña';
COMMENT ON COLUMN password_reset_codes.code IS 'Código numérico de 6 dígitos';
COMMENT ON COLUMN password_reset_codes.expires_at IS 'Fecha de expiración del código (típicamente 15 minutos desde creación)';
COMMENT ON COLUMN password_reset_codes.verified IS 'Indica si el código fue verificado correctamente';
COMMENT ON COLUMN password_reset_codes.used IS 'Indica si el código fue usado para restablecer la contraseña';
COMMENT ON COLUMN password_reset_codes.attempts IS 'Número de intentos fallidos de verificación (máximo 5)';
COMMENT ON COLUMN password_reset_codes.verified_at IS 'Fecha y hora en que el código fue verificado';

-- Políticas de seguridad (RLS - Row Level Security)
-- Si tienes RLS habilitado en otras tablas, puedes agregar esto:

-- ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own reset codes"
-- ON password_reset_codes FOR SELECT
-- USING (true); -- O la lógica que necesites
--
-- CREATE POLICY "Service can insert reset codes"
-- ON password_reset_codes FOR INSERT
-- WITH CHECK (true); -- O la lógica que necesites

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Para ejecutar:
-- 1. Ve a Supabase Dashboard
-- 2. Abre SQL Editor
-- 3. Copia y pega todo este contenido
-- 4. Haz clic en "Run"
-- =====================================================



