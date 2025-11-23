# 🚀 Instrucciones para Ejecutar los Scripts SQL

## ✅ Ya tienes configurado:
- ✅ Proyecto creado en Supabase
- ✅ Credenciales guardadas
- ✅ Cliente de Supabase instalado en tu proyecto

## 📝 PASO 1: Ejecutar los Scripts SQL

### Opción A: Ejecutar Todo de Una Vez (Recomendado)

1. **Abre tu proyecto en Supabase**
   - Ve a: https://app.supabase.com
   - Selecciona tu proyecto: `wvxvefwilbnjzpanaopl`

2. **Abre el SQL Editor**
   - En el menú lateral izquierdo, busca y haz clic en **"SQL Editor"**
   - O busca un ícono que parezca código `</>`

3. **Crea una nueva consulta**
   - Haz clic en **"New query"** o **"+"** o **"New"**

4. **Copia el contenido completo**
   - Abre el archivo `database-scripts.sql` que está en la raíz de tu proyecto
   - Selecciona TODO el contenido (Ctrl+A)
   - Copia (Ctrl+C)

5. **Pega en el editor SQL**
   - Pega todo el contenido en el editor de Supabase (Ctrl+V)

6. **Ejecuta**
   - Haz clic en el botón **"Run"** o **"Execute"**
   - O presiona `Ctrl+Enter` (Windows) o `Cmd+Enter` (Mac)

7. **Espera**
   - Puede tardar 1-2 minutos
   - Verás mensajes de éxito para cada tabla creada

8. **Verifica**
   - Ve a **"Table Editor"** en el menú lateral
   - Deberías ver todas las tablas:
     - instituciones
     - usuarios
     - docentes
     - carreras
     - materias
     - aulas
     - cursos
     - alumnos
     - notas
     - asistencias
     - justificativos
     - eventos
     - mensajes
     - equivalencias
     - auditoria

---

### Opción B: Ejecutar Script por Script (Si hay errores)

Si la Opción A da errores, ejecuta los scripts uno por uno:

1. Abre `database-scripts.sql`
2. Cada script está separado por comentarios como `-- ============================================`
3. Copia y ejecuta cada sección por separado
4. Si un script da error, revisa el mensaje y continúa con el siguiente

---

## 📝 PASO 2: Verificar que Todo Funcionó

1. Ve a **"Table Editor"** en Supabase
2. Deberías ver todas las tablas listadas
3. Haz clic en cualquier tabla para ver su estructura
4. Si ves las columnas correctas, ✅ **¡Todo está bien!**

---

## 📝 PASO 3: Obtener el Service Role Key (Opcional)

Si necesitas el `service_role_key` para operaciones administrativas:

1. Ve a **Settings** (⚙️) en el menú lateral
2. Haz clic en **"API"**
3. Busca **"service_role"** o **"service_role key"**
4. ⚠️ **CUIDADO**: Esta clave es muy poderosa, no la compartas ni la uses en el frontend
5. Cópiala y guárdala de forma segura

---

## 🆘 Si Algo Sale Mal

### Error: "relation already exists"
- Algunas tablas ya existen
- Puedes ignorar este error o eliminar las tablas y volver a ejecutar

### Error: "permission denied"
- Verifica que estés usando la cuenta correcta
- Asegúrate de tener permisos en el proyecto

### Error: "syntax error"
- Revisa que copiaste TODO el contenido
- Asegúrate de no haber cortado ninguna línea

### No veo las tablas
- Refresca la página
- Espera unos segundos y vuelve a revisar
- Verifica que los scripts se ejecutaron sin errores

---

## ✅ Siguiente Paso

Una vez que las tablas estén creadas, podrás:
1. Conectar tu aplicación Angular con Supabase
2. Migrar datos de localStorage a la base de datos
3. Implementar las operaciones CRUD

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Toma una captura de pantalla del error
2. O copia el mensaje de error completo
3. Y te ayudo a solucionarlo

