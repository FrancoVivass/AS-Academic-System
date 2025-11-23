# 🚀 Cómo Ejecutar los Scripts SQL en Supabase

## 📋 Pasos para Ejecutar

### 1. Abrir Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto

### 2. Abrir SQL Editor
1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"** o usa el editor existente

### 3. Copiar el Script
1. Abre el archivo `DATABASE_FINAL.sql` en tu editor
2. Selecciona **TODO** el contenido (Ctrl+A / Cmd+A)
3. Copia el contenido (Ctrl+C / Cmd+C)

### 4. Pegar y Ejecutar
1. Pega el contenido en el SQL Editor de Supabase
2. Haz clic en **"Run"** o presiona `Ctrl+Enter` / `Cmd+Enter`
3. Espera a que termine la ejecución

### 5. Verificar Resultado
- ✅ Deberías ver un mensaje de éxito
- ✅ Si hay errores, se mostrarán en rojo
- ✅ Revisa los mensajes de error si aparecen

---

## ⚠️ Si Ocurren Errores

### Error: "relation already exists"
**Solución**: Las tablas ya existen. Puedes:
- Eliminar las tablas existentes primero
- O usar `DROP TABLE IF EXISTS` antes de crear

### Error: "duplicate key value"
**Solución**: Hay datos duplicados. Limpia los datos existentes.

### Error: "foreign key constraint"
**Solución**: Verifica que las tablas referenciadas existan antes de crear las foreign keys.

### Error: "policy already exists"
**Solución**: Las políticas ya existen. Elimínalas primero o usa `DROP POLICY IF EXISTS`.

---

## 🔄 Ejecutar de Nuevo (Resetear Base de Datos)

Si necesitas ejecutar el script de nuevo desde cero:

```sql
-- ⚠️ CUIDADO: Esto eliminará TODOS los datos
-- Ejecuta esto SOLO si quieres empezar de cero

-- Eliminar todas las tablas en orden inverso
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS equivalencias CASCADE;
DROP TABLE IF EXISTS mensajes CASCADE;
DROP TABLE IF EXISTS calendarios_academicos CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS justificativos CASCADE;
DROP TABLE IF EXISTS estadisticas_asistencia CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS notas CASCADE;
DROP TABLE IF EXISTS alumno_cursos CASCADE;
DROP TABLE IF EXISTS alumno_historial_estados CASCADE;
DROP TABLE IF EXISTS alumnos CASCADE;
DROP TABLE IF EXISTS curso_materias CASCADE;
DROP TABLE IF EXISTS curso_horarios CASCADE;
DROP TABLE IF EXISTS cursos CASCADE;
DROP TABLE IF EXISTS aula_recursos CASCADE;
DROP TABLE IF EXISTS aulas CASCADE;
DROP TABLE IF EXISTS materia_correlatividades CASCADE;
DROP TABLE IF EXISTS materias CASCADE;
DROP TABLE IF EXISTS carreras CASCADE;
DROP TABLE IF EXISTS docente_materias CASCADE;
DROP TABLE IF EXISTS docentes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS instituciones CASCADE;

-- Eliminar función de trigger
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

Luego ejecuta `DATABASE_FINAL.sql` de nuevo.

---

## ✅ Verificación Post-Ejecución

Después de ejecutar el script, verifica:

1. **Tablas creadas**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   Deberías ver 24 tablas.

2. **Políticas RLS**:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```
   Deberías ver 15 políticas.

3. **Triggers**:
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```
   Deberías ver 12 triggers.

---

## 📝 Notas Importantes

- ⚠️ **Backup**: Si tienes datos importantes, haz un backup antes de ejecutar
- ⚠️ **Producción**: No ejecutes en producción sin revisar las políticas RLS
- ✅ **Desarrollo**: El script está listo para desarrollo
- ✅ **Errores**: Si hay errores, revisa `VERIFICACION_SQL.md`

---

**✅ Listo para Ejecutar**

