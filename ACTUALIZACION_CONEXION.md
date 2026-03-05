# ✅ Actualización de Conexión - Nueva Data API

## 📊 Cambio de Proyecto Supabase

Se ha actualizado la conexión a un nuevo proyecto Supabase con credenciales de producción.

---

## 🔐 Nuevas Credenciales

### Project URL
```
https://iujfqxfkpyeluqgtzdbd.supabase.co
```

### Publishable Key (anon key)
```
sb_publishable_vDB6DWBczNLrLI2Hf2GwSQ_GYGIQAFV
```

### JWT Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amZxeGZrcHllbHVxZ3R6ZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDAwMDAsImV4cCI6MjA1Mjk3NjAwMH0.BFY0BTVl3dZugeRYD4aontyVuWeNw3kTI34yOmGz7Wo
```

### Database Connection
```
postgresql://postgres:[YOUR-PASSWORD]@db.iujfqxfkpyeluqgtzdbd.supabase.co:5432/postgres
```

---

## 📝 Archivos Actualizados

✅ `src/environments/environment.ts`
- URL actualizada
- Clave pública actualizada
- Token JWT actualizado

✅ `src/app/config/supabase.config.ts`
- Todas las referencias actualizadas
- Configuración centralizada

✅ `CONFIGURACION_SUPABASE.md`
- Documentación actualizada

---

## 🚀 Próximas Acciones

### 1. Recarga la Aplicación
```bash
# En el navegador
Ctrl+Shift+R (limpia caché)
o
F5 (recarga normal)
```

### 2. Ejecutar el Script SQL
La nueva base de datos **está vacía**, necesitas:

1. Ve a Supabase Dashboard
2. Proyecto: **iujfqxfkpyeluqgtzdbd**
3. **SQL Editor → New Query**
4. Abre: `/AS-Academic-System/BASEdedatos.sql`
5. Copia TODO y pégalo
6. Click en **RUN**
7. Espera ✅ Success

### 3. Verifica la Conexión
En Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM instituciones;
```

Deberías ver: **2** instituciones

---

## 📊 Comparativa

| Elemento | Anterior | Actual |
|----------|----------|--------|
| **URL** | wvxvefwilbnjzpanaopl | iujfqxfkpyeluqgtzdbd |
| **Proyecto** | AS-Academic-System | AS-Academic-System (nuevo) |
| **Estado** | Con datos | Vacío (necesita SQL) |

---

## ⚠️ Importante

1. **Este proyecto está vacío**
   - Ejecuta `BASEdedatos.sql` para crear tablas y datos

2. **Las credenciales han cambiado**
   - No uses las anteriores
   - Están actualizadas en los archivos

3. **Recarga la aplicación**
   - Limpia caché con Ctrl+Shift+R
   - Los cambios son inmediatos

---

## ✅ Checklist

- [ ] Recargaste la aplicación (Ctrl+Shift+R)
- [ ] Fuiste a Supabase Dashboard
- [ ] Seleccionaste el proyecto correcto
- [ ] Ejecutaste `BASEdedatos.sql` en SQL Editor
- [ ] Viste ✅ Success
- [ ] Verificaste que hay 2 instituciones
- [ ] La aplicación se conecta sin error 503

---

## 🔗 Links Útiles

- **Dashboard:** https://app.supabase.com/
- **Proyecto:** iujfqxfkpyeluqgtzdbd
- **SQL File:** `/AS-Academic-System/BASEdedatos.sql`

---

## 💡 Si Hay Problemas

**Error 503 después de ejecutar:**
- Verifica que las tablas se crearon (Database → Tables)
- Revisa que el script se ejecutó sin errores
- Ejecuta SCRIPT_VERIFICACION.sql para diagnosticar

**Error 401 (Unauthorized):**
- Recarga la página (Ctrl+Shift+R)
- Limpia localStorage: F12 → Application → Clear Storage
- Las credenciales están correctas en los archivos

**Base de datos vacía:**
- Necesitas ejecutar `BASEdedatos.sql` primero
- Es normal que esté vacía, el script la llena

---

**Conexión actualizada correctamente ✅**

Fecha: 2026-03-05
Proyecto: AS-Academic-System
