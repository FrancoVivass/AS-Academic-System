# 🚨 Guía de Resolución de Errores - Error 503 en Supabase

## El Problema

```
❌ Error 503: Service Unavailable
El servidor Supabase no encuentra la tabla 'instituciones'
```

**Causa:** No has ejecutado el script SQL en Supabase aún.

---

## ✅ Solución Rápida (5 minutos)

### Paso 1: Accede a Supabase
1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Ingresa con tu email/contraseña
3. Selecciona el proyecto: **AS-Academic-System**

### Paso 2: Abre SQL Editor
1. En el menú izquierdo, click en **SQL Editor**
2. Click en **New Query**
3. Se abrirá un editor de texto

### Paso 3: Ejecuta el Script
1. Abre el archivo: `/AS-Academic-System/BASEdedatos.sql`
2. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)
3. **Pégalo en Supabase SQL Editor** (Ctrl+V)
4. Click en botón azul **Run** o presiona **Ctrl+Enter**

### Paso 4: Espera la ejecución
- Deberías ver: ✅ **Success** al final
- Si ves errores, revisa la sección de "Resolución de Problemas"

### Paso 5: Recarga la página
1. Regresa a tu aplicación Angular
2. Presiona **F5** (Ctrl+Shift+R para limpiar caché)
3. Deberías ver las instituciones cargadas ✅

---

## 🔍 Problemas Comunes

### Error: "Relation instituciones does not exist"
**Solución:**
- Ejecuta PRIMERO la tabla `instituciones` manualmente:
```sql
CREATE TABLE IF NOT EXISTS instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  nombre_corto VARCHAR(100) NOT NULL,
  logo TEXT,
  descripcion TEXT,
  color_primario VARCHAR(7) NOT NULL DEFAULT '#1976d2',
  color_secundario VARCHAR(7) NOT NULL DEFAULT '#dc004e',
  color_acento VARCHAR(7) NOT NULL DEFAULT '#ff9800',
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  activa BOOLEAN DEFAULT true,
  credencial_secreta VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nombre),
  UNIQUE(nombre_corto)
);
```

### Error: "Permission denied"
**Solución:**
- Esto es por Row Level Security (RLS)
- Ve a **Authentication → Policies**
- Verifica que las políticas `dev_all_*` están habilitadas
- O ejecuta estos comandos SQL:
```sql
DROP POLICY IF EXISTS "dev_all_instituciones" ON instituciones;
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true);
```

### Error: "Column XX does not exist"
**Solución:**
- Algunos triggers pueden referenciar columnas que no existen
- Ejecuta primero SOLO las tablas (comentar los triggers)
- O revisa que el script está completo

### Error: 503 persiste después de ejecutar
**Solución:**
1. Ve a **Database → Tables** en Supabase
2. Verifica que ves estas tablas:
   - `instituciones` ✓
   - `usuarios` ✓
   - `carreras` ✓
   - `materias` ✓
   
3. Si NO están, el script no se ejecutó correctamente
4. Intenta de nuevo sin el script de admins al final

---

## 🆘 Si Nada Funciona

### Opción A: Borrar y Recrear
1. Ve a **Database → Tables**
2. Selecciona todas las tablas
3. Click derecho → **Delete** (⚠️ Perderás datos)
4. Ve a **SQL** en Supabase
5. Click en **Clear** y pega el script completo
6. Ejecuta

### Opción B: Usar Fallback a LocalStorage
Si Supabase sigue sin funcionar:

**En `institucion.service.ts` línea 13:**
```typescript
private useSupabase = false; // Cambiar a false para usar localStorage
```

Esto usará LocalStorage en lugar de Supabase temporalmente.

---

## 📋 Checklist de Verificación

- [ ] Accediste a Supabase Dashboard
- [ ] Seleccionaste el proyecto correcto (AS-Academic-System)
- [ ] Abriste SQL Editor
- [ ] Copiaste TODO el contenido de `BASEdatos.sql`
- [ ] Ejecutaste el script (botón Run)
- [ ] Viste ✅ Success al final
- [ ] Recargaste la página (F5)
- [ ] Viste las instituciones en la aplicación

---

## 🔐 Credenciales de Acceso

Después de ejecutar el script, puedes ingresar con:

**Instituto Paula Robles:**
- Usuario: `admin`
- Contraseña: `admin123`

**Centro Universitario Dolores:**
- Usuario: `admin_cud`
- Contraseña: `admin123`

---

## 📊 Verificar Base de Datos

Para comprobar que todo está bien:

1. En Supabase SQL Editor, ejecuta:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver ~23 tablas.

2. Verifica que hay datos:
```sql
SELECT COUNT(*) FROM instituciones;
SELECT COUNT(*) FROM usuarios;
```

Deberías ver:
- 2 instituciones
- 2 usuarios admin

---

## 🚀 Siguiente Paso

Una vez que todo funcione, puedes:

1. Cambiar contraseñas de admin
2. Crear más usuarios
3. Crear carreras y materias
4. Empezar a usar el sistema

---

## 💡 Tips

- **No borre el archivo `BASEdedatos.sql`** - Lo usarás si necesitas resetear la BD
- **Los errores de wallets (solana, btc) son de extensiones** - No afectan el sistema
- **El error de Navigator Lock es normal** - Supabase lo maneja internamente

---

**¿Necesitas ayuda?** Revisa los logs en Supabase Dashboard → **Logs** para más detalles.
