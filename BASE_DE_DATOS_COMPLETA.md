# 📊 Base de Datos Completa - Sistema de Recuperación de Contraseña

## 🗄️ Estructura de la Tabla

### Tabla: `password_reset_codes`

Esta tabla almacena los códigos de verificación de 6 dígitos para la recuperación de contraseña.

#### Columnas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (auto-generado) |
| `usuario_id` | UUID | ID del usuario (Foreign Key → usuarios.id) |
| `email` | VARCHAR(255) | Email del usuario |
| `code` | VARCHAR(6) | Código de 6 dígitos |
| `expires_at` | TIMESTAMP | Fecha de expiración (15 minutos) |
| `verified` | BOOLEAN | Si el código fue verificado |
| `used` | BOOLEAN | Si el código fue usado para cambiar contraseña |
| `attempts` | INTEGER | Intentos fallidos de verificación (máx. 5) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `verified_at` | TIMESTAMP | Fecha de verificación |

#### Índices Creados:

1. `idx_password_reset_code` - Búsqueda rápida por código
2. `idx_password_reset_email` - Búsqueda rápida por email
3. `idx_password_reset_expires` - Búsqueda por fecha de expiración
4. `idx_password_reset_user` - Búsqueda por usuario
5. `idx_password_reset_verified` - Búsqueda por estado de verificación

#### Funciones Creadas:

1. **`cleanup_expired_codes()`** - Limpia códigos expirados automáticamente
2. **`is_code_valid()`** - Valida si un código es válido

---

## 📝 Script SQL Completo

El archivo **`database_password_reset.sql`** contiene:

```sql
-- Tabla principal
CREATE TABLE password_reset_codes (...);

-- Índices (5 índices)
CREATE INDEX idx_password_reset_code ON ...;
CREATE INDEX idx_password_reset_email ON ...;
CREATE INDEX idx_password_reset_expires ON ...;
CREATE INDEX idx_password_reset_user ON ...;
CREATE INDEX idx_password_reset_verified ON ...;

-- Funciones (2 funciones)
CREATE FUNCTION cleanup_expired_codes() ...
CREATE FUNCTION is_code_valid(...) ...

-- Comentarios y documentación
COMMENT ON TABLE ...
COMMENT ON COLUMN ...
```

---

## 🔗 Relaciones

```
usuarios (tabla existente)
  └── password_reset_codes.usuario_id → usuarios.id (ON DELETE CASCADE)
```

- Si se elimina un usuario, se eliminan sus códigos automáticamente
- Un usuario puede tener múltiples códigos (pero solo uno activo)

---

## 🔐 Reglas de Negocio

1. **Código único:** Cada código es único por usuario y fecha
2. **Expiración:** 15 minutos desde creación
3. **Intentos máximos:** 5 intentos de verificación
4. **Uso único:** Un código solo puede usarse una vez
5. **Verificación requerida:** Debe verificar antes de restablecer

---

## 📊 Flujo de Datos

```
1. Usuario solicita código
   → INSERT INTO password_reset_codes (code, email, ...)
   
2. Usuario verifica código
   → UPDATE password_reset_codes SET verified = true WHERE code = ...
   
3. Usuario restablece contraseña
   → UPDATE usuarios SET password = ...
   → UPDATE password_reset_codes SET used = true WHERE ...
```

---

## 🗑️ Limpieza Automática

La función `cleanup_expired_codes()` elimina:
- Códigos expirados
- Códigos ya usados (más de 1 día)

**Para ejecutar manualmente:**
```sql
SELECT cleanup_expired_codes();
```

**Para automatizar (cron job):**
- Configurar en Supabase para ejecutar diariamente

---

## ✅ Listo para Usar

El script está completo y listo para ejecutar en Supabase.

**Archivo:** `database_password_reset.sql`



