# 🔧 Soluciones Rápidas para Error 503

## 📊 Resumen de Errores Encontrados

1. **Error 503 (Service Unavailable)**: Tabla no existe
2. **NavigatorLockAcquireTimeoutError**: Problema con token de auth
3. **Errores de wallet**: Extensiones que no están bien inicializadas

## ✅ Solución Paso a Paso

### Fase 1: Crear la Base de Datos (2 minutos)

#### Opción A: Ejecución Manual del Script (Recomendado)
```
1. Abre Supabase Dashboard
2. Proyecto: AS-Academic-System
3. SQL Editor → New Query
4. Abre archivo: BASEdedatos.sql (completo)
5. Copia TODO y pégalo en el editor
6. Click en RUN (botón azul)
7. Espera hasta ver ✅ Success
```

#### Opción B: Si hay errores en el script
```
1. Copia SOLO esto en SQL Editor:
```

```sql
-- Crear tabla instituciones (mínimo requerido)
CREATE TABLE IF NOT EXISTS instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  nombre_corto VARCHAR(100) NOT NULL UNIQUE,
  logo TEXT,
  descripcion TEXT,
  color_primario VARCHAR(7) DEFAULT '#1976d2',
  color_secundario VARCHAR(7) DEFAULT '#dc004e',
  color_acento VARCHAR(7) DEFAULT '#ff9800',
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  activa BOOLEAN DEFAULT true,
  credencial_secreta VARCHAR(255),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(50),
  dni VARCHAR(20),
  fecha_nacimiento DATE,
  direccion TEXT,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'profesor', 'alumno', 'secretario', 'coordinador')),
  avatar TEXT,
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (importante)
ALTER TABLE instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Crear políticas de desarrollo (permitir TODO)
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true);
CREATE POLICY "dev_all_usuarios" ON usuarios FOR ALL USING (true);

-- Insertar datos iniciales
INSERT INTO instituciones (nombre, nombre_corto, email, credencial_secreta, color_primario, color_secundario, color_acento)
VALUES 
  ('Instituto Paula Robles', 'IPR', 'contacto@paulrobles.edu.ar', 'EDI2025', '#8b0000', '#d3d3d3', '#ffffff'),
  ('Centro Universitario Dolores', 'CUD', 'contacto@cud.edu.ar', 'EDI2025', '#C8AD7F', '#d3d3d3', '#000000')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar usuarios admin
INSERT INTO usuarios (username, password, nombre, apellido, email, rol, institucion_id, activo)
SELECT 'admin', 'admin123', 'Administrador', 'Paula Robles', 'admin@paulrobles.edu.ar', 'admin', id, true
FROM instituciones WHERE nombre = 'Instituto Paula Robles'
ON CONFLICT (username) DO NOTHING;

INSERT INTO usuarios (username, password, nombre, apellido, email, rol, institucion_id, activo)
SELECT 'admin_cud', 'admin123', 'Administrador', 'CUD', 'admin@cud.edu.ar', 'admin', id, true
FROM instituciones WHERE nombre = 'Centro Universitario Dolores'
ON CONFLICT (username) DO NOTHING;
```

```
8. Click RUN
9. Deberías ver ✅ Completed
```

### Fase 2: Verificar que Funcionó

En Supabase SQL Editor, ejecuta:
```sql
SELECT COUNT(*) as instituciones FROM instituciones;
SELECT COUNT(*) as usuarios FROM usuarios;
```

**Deberías ver:**
- instituciones: 2
- usuarios: 2

### Fase 3: Probar en Angular

1. Recarga la página: **Ctrl+Shift+R** (limpia caché)
2. Abre la consola: **F12**
3. Deberías ver:
```
✅ 2 instituciones cargadas desde Supabase
```

---

## 🔍 Si Aún Hay Error 503

### Verificación Rápida
1. Ve a **Supabase Dashboard → Database → Tables**
2. ¿Ves la tabla `instituciones`? 
   - ✅ SÍ → Pasa a "Fase 4"
   - ❌ NO → El script NO se ejecutó

### Si NO están las tablas:

**Opción 1: Intenta de nuevo**
```sql
-- En SQL Editor, ejecuta:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Si ves muchas tablas, el problema es RLS. Ejecuta:
```sql
DROP POLICY IF EXISTS "dev_all_instituciones" ON instituciones;
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true);
```

**Opción 2: Borra y recrea**
1. Ve a **Database → Tables**
2. Selecciona cada tabla
3. Click derecho → **Delete all** (⚠️ Perderás TODO)
4. Ejecuta de nuevo el script completo

---

## ⚠️ Errores Específicos y Soluciones

### Error: "relation instituciones does not exist"
**Significa:** No existe la tabla
**Solución:** Ejecuta el script SQL mínimo (arriba)

### Error: "new row violates row-level security policy"
**Significa:** Problema con RLS
**Solución:**
```sql
DROP POLICY IF EXISTS "dev_all_instituciones" ON instituciones;
DROP POLICY IF EXISTS "dev_all_usuarios" ON usuarios;
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
```

### Error: "duplicate key value violates unique constraint"
**Significa:** Ya existen los datos
**Solución:** Normal en ejecuciones repetidas, es seguro ignorarlo

### Error: NavigatorLockAcquireTimeoutError
**Significa:** Problema temporal de Supabase con tokens
**Solución:** Recarga la página (F5), suele resolverse solo

---

## 🚨 Solución Nuclear (Si nada funciona)

### Paso 1: Borrar TODO
1. Ve a **Database → Tables**
2. Selecciona TODAS las tablas (Ctrl+A)
3. Click derecho → **Delete all**
4. Confirma

### Paso 2: Ejecutar Script Completo
1. SQL Editor → New Query
2. Abre `BASEdedatos.sql`
3. Copia y pega TODO
4. Ejecuta

### Paso 3: Si aún hay error
1. Abre otro navegador (incógnito)
2. Intenta de nuevo
3. Si persiste, contacta a Supabase Support

---

## 📋 Checklist Final

- [ ] Ejecutaste el script en Supabase
- [ ] Viste ✅ Success en la salida
- [ ] Ve a Database → Tables y ves `instituciones`
- [ ] Ejecutaste verificación: `SELECT COUNT(*) FROM instituciones;`
- [ ] Resultado: 2 (o más)
- [ ] Recargaste Angular (Ctrl+Shift+R)
- [ ] Ves "✅ 2 instituciones cargadas desde Supabase" en consola
- [ ] Se cargan las instituciones en la UI

---

## 💬 Mensajes de Éxito Esperados

**En la consola (F12 → Console):**
```
✅ 2 instituciones cargadas desde Supabase
```

**En la aplicación:**
- Se cargan las opciones de institución
- Puedes seleccionar "Instituto Paula Robles" o "Centro Universitario Dolores"
- Los colores de la UI cambian según la institución

---

## 🆘 Si Aún No Funciona

1. **Toma una captura** del error en la consola
2. **Verifica:**
   - URL correcta: `https://wvxvefwilbnjzpanaopl.supabase.co`
   - Key correcta: `sb_publishable_uRE-ybQJF2HUDpatHim_Ug_JDIJCgfw`
3. **Revisa** `environment.ts` está actualizado
4. **Ejecuta** `SCRIPT_VERIFICACION.sql` en Supabase para diagnosticar

---

**¿Preguntas?** Revisa los archivos de documentación:
- `CONFIGURACION_SUPABASE.md` - Información general
- `BASEdedatos.sql` - Script SQL completo
- `GUIA_ERROR_503.md` - Guía de error 503
