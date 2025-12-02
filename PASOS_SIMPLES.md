# 📝 PASOS SIMPLES - Recuperación de Contraseña

## 🎯 LO ÚNICO QUE DEBES HACER

---

## 1️⃣ EJECUTAR SQL EN SUPABASE (5 MINUTOS)

### Paso 1: Ir a Supabase
👉 https://supabase.com/dashboard → Inicia sesión → Selecciona tu proyecto

### Paso 2: Abrir SQL Editor
👉 Menú lateral → Click en **"SQL Editor"**

### Paso 3: Crear nueva consulta
👉 Click en **"New Query"** (botón verde arriba)

### Paso 4: Copiar el script
👉 Abre el archivo **`database_password_reset.sql`** (en la raíz del proyecto)
👉 Selecciona TODO (Ctrl+A)
👉 Copia (Ctrl+C)

### Paso 5: Pegar y ejecutar
👉 Pega en el editor SQL (Ctrl+V)
👉 Click en **"Run"** o presiona `Ctrl + Enter`
👉 ✅ Deberías ver "Success" o "No rows returned"

**¡Listo! La tabla está creada.**

---

## 2️⃣ VERIFICAR EN SUPABASE (1 MINUTO)

👉 Supabase Dashboard → **"Table Editor"** → Busca la tabla **`password_reset_codes`**

Si la ves, ✅ **está bien configurado.**

---

## 3️⃣ PROBAR EL SISTEMA (5 MINUTOS)

### Paso 1: Iniciar servidor
```bash
ng serve
```

### Paso 2: Abrir navegador
👉 http://localhost:4200

### Paso 3: Probar el flujo
1. Selecciona institución
2. Ve a login
3. Click en **"Olvidaste tu contraseña?"**
4. Ingresa un email de un usuario que exista
5. Revisa tu email (y spam) → Deberías recibir un código
6. Ingresa el código de 6 dígitos
7. Establece nueva contraseña
8. Prueba iniciar sesión con la nueva contraseña

**¡Eso es todo!** 🎉

---

## ✅ CHECKLIST RÁPIDO

- [ ] SQL ejecutado en Supabase
- [ ] Tabla `password_reset_codes` existe
- [ ] Servidor iniciado (`ng serve`)
- [ ] Probado el flujo completo

---

## ❌ ¿PROBLEMAS?

### No recibo el email
→ Revisa SPAM
→ Verifica que el email exista en la tabla `usuarios`

### Error al ejecutar SQL
→ Copia TODO el contenido
→ Verifica que estés en el proyecto correcto

### El código no funciona
→ Verifica que sea exacto (sin espacios)
→ Verifica que no haya expirado (15 minutos)

---

**¿Dudas?** Lee `PASOS_COMPLETOS_IMPLEMENTACION.md` para más detalles.



