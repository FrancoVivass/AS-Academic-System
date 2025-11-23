# 🗄️ Guía Simple: Crear Base de Datos Online para AS-Academic-System

## 🎯 Opción Recomendada: Supabase

Supabase es una plataforma que te da PostgreSQL (base de datos profesional) + backend automático, todo gratis para empezar.

---

## 📝 PASO 1: Crear Cuenta

1. Ve a: **https://supabase.com**
2. Busca un botón que diga algo como:
   - "Start your project"
   - "Get Started"
   - "Sign Up"
   - "Sign In" (si ya tienes cuenta)
3. Regístrate con:
   - GitHub (más fácil)
   - O con email y contraseña

---

## 📝 PASO 2: Crear Proyecto

Una vez dentro de Supabase:

1. Busca un botón que diga:
   - "New Project"
   - "Create Project"
   - "Add Project"
   - O un botón grande con "+" o "New"

2. Cuando lo encuentres, haz clic y completa:
   - **Nombre del proyecto**: `as-academic-system` (o el que quieras)
   - **Contraseña de base de datos**: ⚠️ **ANÓTALA BIEN**, la necesitarás
   - **Región**: Elige la más cercana a ti
   - **Plan**: Free (gratis)

3. Espera 2-3 minutos mientras se crea

---

## 📝 PASO 3: Encontrar las Credenciales

Una vez que tu proyecto esté listo:

1. Busca en el menú lateral (izquierda) algo que diga:
   - **"Settings"** o **"Configuración"**
   - O un ícono de engranaje ⚙️

2. Dentro de Settings, busca:
   - **"API"** o **"Project API keys"**
   - O **"Database"** o **"Connection string"**

3. Copia estos valores (los necesitarás después):
   - **URL del proyecto**: algo como `https://xxxxx.supabase.co`
   - **anon key** o **public key**: una clave larga que empieza con `eyJ...`
   - **service_role key**: otra clave larga (⚠️ esta es secreta, no la compartas)

4. Si encuentras **"Database"**, copia también:
   - **Connection string** o **Connection URI**

---

## 📝 PASO 4: Crear las Tablas (2 Opciones)

### ⚡ OPCIÓN A: Usando SQL (Más Rápido - Recomendado)

1. En el menú lateral, busca:
   - **"SQL Editor"**
   - O **"Query"**
   - O un ícono que parezca código `</>`

2. Haz clic en **"New query"** o **"New"** o un botón **"+"**

3. Abre el archivo `database-scripts.sql` que está en tu proyecto

4. **Copia TODO el contenido** del archivo

5. Pégalo en el editor SQL de Supabase

6. Haz clic en **"Run"** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

7. Espera a que termine (puede tardar 1-2 minutos)

8. ✅ Si ves mensajes de éxito, ¡listo!

---

### 🖱️ OPCIÓN B: Crear Tablas Manualmente (Si prefieres ver cada paso)

Si prefieres crear las tablas una por una:

1. Busca en el menú lateral:
   - **"Table Editor"**
   - O **"Tables"**
   - O **"Database"** → **"Tables"**

2. Haz clic en **"New table"** o **"Create table"** o un botón **"+"**

3. Crea cada tabla con sus columnas. Te doy un ejemplo:

**Ejemplo: Tabla "instituciones"**
- Nombre de tabla: `instituciones`
- Columnas:
  - `id` → Tipo: `uuid`, Primary Key, Default: `gen_random_uuid()`
  - `nombre` → Tipo: `text`, Not null
  - `nombre_corto` → Tipo: `text`, Not null
  - `email` → Tipo: `text`, Not null
  - `activa` → Tipo: `boolean`, Default: `true`
  - `credencial_secreta` → Tipo: `text`, Not null
  - `fecha_creacion` → Tipo: `timestamptz`, Default: `now()`
  - `fecha_actualizacion` → Tipo: `timestamptz`, Default: `now()`

4. Repite para todas las tablas (hay muchas, por eso recomiendo la Opción A)

---

## 📝 PASO 5: Verificar que Funcionó

1. Ve a **"Table Editor"** o **"Tables"**
2. Deberías ver todas las tablas que creaste:
   - `instituciones`
   - `usuarios`
   - `carreras`
   - `materias`
   - `cursos`
   - `alumnos`
   - `notas`
   - `asistencias`
   - etc.

Si las ves, ✅ **¡Todo está bien!**

---

## 📝 PASO 6: Guardar Credenciales en tu Proyecto

1. En tu proyecto Angular, crea un archivo `.env` en la raíz (si no existe)

2. Agrega estas líneas (reemplaza con tus valores reales):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-aqui
```

3. ⚠️ **IMPORTANTE**: Agrega `.env` a tu `.gitignore` para no subirlo a Git

---

## 📝 PASO 7: Instalar Supabase en tu Proyecto

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
npm install @supabase/supabase-js
```

---

## ✅ ¡Listo!

Ya tienes:
- ✅ Base de datos online creada
- ✅ Todas las tablas configuradas
- ✅ Credenciales guardadas
- ✅ Cliente instalado

---

## 🆘 Si Algo No Funciona

### No encuentro el botón "New Project"
- Asegúrate de estar logueado
- Busca en la parte superior de la pantalla
- Puede que diga "Create" o tenga un ícono "+"

### No encuentro "SQL Editor"
- Busca en el menú de la izquierda
- Puede estar dentro de "Database" o "Tools"
- También puede decir "Query Editor" o "SQL"

### No encuentro "Settings"
- Busca un ícono de engranaje ⚙️
- O busca "Project Settings" o "Configuración"
- Puede estar en la parte superior derecha

### Los scripts SQL dan error
- Asegúrate de copiar TODO el contenido
- Ejecuta los scripts uno por uno si es necesario
- Revisa que no haya errores de sintaxis

### No sé qué hacer
- Toma capturas de pantalla de lo que ves
- O describe qué ves en la pantalla
- Y te ayudo a encontrar lo que necesitas

---

## 📚 Archivos que Necesitas

1. **`database-scripts.sql`** - Todos los scripts SQL listos para copiar
2. Este archivo (`DATABASE_SETUP.md`) - La guía que estás leyendo

---

## 🚀 Próximos Pasos (Después de crear la BD)

1. Crear el servicio de conexión en Angular
2. Migrar los datos de localStorage a la base de datos
3. Implementar autenticación
4. Probar que todo funcione

---

## 💡 Tips

- **Guarda las credenciales** en un lugar seguro
- **No compartas** la `service_role_key` públicamente
- El plan **Free** es suficiente para empezar
- Puedes ver tus datos en **Table Editor** en cualquier momento

---

¿Necesitas ayuda con algún paso específico? Dime qué ves en tu pantalla y te guío mejor. 😊
