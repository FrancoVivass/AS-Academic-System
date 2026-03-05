# 🎯 ACCIONES INMEDIATAS PARA RESOLVER ERROR 503

## El Problema
```
❌ Supabase devuelve Error 503
❌ Las instituciones no se cargan
❌ Aparecen en consola: NavigatorLockAcquireTimeoutError
```

## La Causa
**La base de datos aún no existe en Supabase**

---

## ✅ SOLUCIÓN (5 MINUTOS)

### 1️⃣ Ve a Supabase
```
https://app.supabase.com/
```

### 2️⃣ Abre SQL Editor
```
Dashboard → SQL Editor → New Query
```

### 3️⃣ Copia el Script
```
Archivo: /AS-Academic-System/BASEdedatos.sql
Selecciona TODO (Ctrl+A)
Copia (Ctrl+C)
```

### 4️⃣ Pégalo en Supabase
```
En SQL Editor
Pega (Ctrl+V)
Click en RUN (botón azul)
```

### 5️⃣ Espera el ✅ Success
```
Toma 30-60 segundos
```

### 6️⃣ Recarga Angular
```
F5 o Ctrl+Shift+R
```

### 7️⃣ Verifica
```
Consola debería mostrar:
✅ 2 instituciones cargadas desde Supabase
```

---

## 🔍 Verificación Rápida

En Supabase SQL Editor, copia esto:
```sql
SELECT COUNT(*) FROM instituciones;
SELECT COUNT(*) FROM usuarios;
```

**Deberías ver:**
- instituciones: 2 ✓
- usuarios: 2 ✓

---

## 🆘 Si Falla

### Error persiste después de ejecutar:
1. Ve a **Database → Tables**
2. ¿Ves la tabla `instituciones`?
   - ✅ SÍ: Es un problema de RLS → Ver "Solución RLS" abajo
   - ❌ NO: El script no se ejecutó → Intenta de nuevo

### Solución RLS:
```sql
DROP POLICY IF EXISTS "dev_all_instituciones" ON instituciones;
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true);
```

### Script Mínimo (si el completo falla):
```sql
CREATE TABLE IF NOT EXISTS instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  nombre_corto VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  color_primario VARCHAR(7) DEFAULT '#8b0000',
  color_secundario VARCHAR(7) DEFAULT '#d3d3d3',
  color_acento VARCHAR(7) DEFAULT '#ffffff',
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE instituciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_all_instituciones" ON instituciones FOR ALL USING (true);

INSERT INTO instituciones VALUES 
  (gen_random_uuid(), 'Instituto Paula Robles', 'IPR', 'admin@paulrobles.edu.ar', '#8b0000', '#d3d3d3', '#ffffff', true, NOW()),
  (gen_random_uuid(), 'Centro Universitario Dolores', 'CUD', 'admin@cud.edu.ar', '#C8AD7F', '#d3d3d3', '#000000', true, NOW())
ON CONFLICT DO NOTHING;
```

---

## 📁 Archivos de Ayuda

| Archivo | Para Qué |
|---------|----------|
| `BASEdedatos.sql` | Script SQL completo (copia aquí) |
| `CONFIGURACION_SUPABASE.md` | Información general de la BD |
| `GUIA_ERROR_503.md` | Detalles del error 503 |
| `SOLUCIONES_RAPIDAS.md` | Soluciones específicas |
| `SCRIPT_VERIFICACION.sql` | Diagnosticar problemas |

---

## 💡 Tips

- **Los errores de wallet (solana, btc)** son de extensiones del navegador, ignóralos
- **El NavigatorLockAcquireTimeoutError** es normal de Supabase, se resuelve solos
- **No necesitas cambiar nada** en el código, solo ejecutar el SQL

---

## ✨ Credenciales Después

```
Usuario: admin
Contraseña: admin123

o

Usuario: admin_cud
Contraseña: admin123
```

---

**¿Funciona ahora?** Si no, revisa los archivos de documentación detallada arriba. 👆
