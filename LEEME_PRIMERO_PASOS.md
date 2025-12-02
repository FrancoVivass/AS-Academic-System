# 🚀 PASOS PARA ACTIVAR RECUPERACIÓN DE CONTRASEÑA

## ✅ TODO ESTÁ CREADO - SOLO SIGUE ESTOS PASOS

---

## 📋 PASO 1: CREAR TABLA EN SUPABASE (OBLIGATORIO)

### Opción A: Desde Supabase Dashboard (Recomendado)

1. **Abre tu navegador** y ve a: https://supabase.com/dashboard
2. **Inicia sesión** en tu proyecto
3. **Haz clic en "SQL Editor"** (en el menú lateral izquierdo)
4. **Haz clic en "New Query"** (botón verde arriba)
5. **Abre el archivo** `database_password_reset.sql` que está en la raíz del proyecto
6. **Copia TODO** el contenido del archivo (Ctrl+A, Ctrl+C)
7. **Pega** en el editor SQL de Supabase (Ctrl+V)
8. **Haz clic en "Run"** o presiona `Ctrl + Enter`
9. ✅ Deberías ver: "Success" o "No rows returned"

### Opción B: Desde la Terminal (Avanzado)

Si prefieres usar la CLI de Supabase:

```bash
supabase db push database_password_reset.sql
```

---

## 📋 PASO 2: VERIFICAR QUE TODO ESTÉ CONFIGURADO

### ✅ Verificar Environment (Ya está configurado)

El archivo `src/environments/environment.ts` ya tiene:
- ✅ API Key de Resend
- ✅ Email remitente con tu dominio

**No necesitas cambiar nada aquí.**

---

## 📋 PASO 3: INSTALAR DEPENDENCIAS (Si falta algo)

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todo lo necesario, incluyendo Resend.

---

## 📋 PASO 4: INICIAR EL SERVIDOR Y PROBAR

### 4.1. Iniciar el servidor

```bash
ng serve
```

Espera a que compile (verás "✔ Compiled successfully")

### 4.2. Probar el sistema

1. **Abre tu navegador** en: `http://localhost:4200`
2. **Selecciona tu institución** (si te lo pide)
3. **Ve a la página de login**
4. **Haz clic en "Olvidaste tu contraseña?"**
5. **Ingresa un email** de un usuario que exista en tu base de datos
6. **Revisa tu email** (y la carpeta de spam) - Deberías recibir un código de 6 dígitos
7. **Ingresa el código** en la página de verificación
8. **Establece tu nueva contraseña**
9. **Prueba iniciar sesión** con la nueva contraseña

---

## ✅ CHECKLIST RÁPIDO

Marca cada paso cuando lo completes:

- [ ] **PASO 1:** Script SQL ejecutado en Supabase ✅
- [ ] **PASO 2:** Verificado que environment.ts está bien ✅
- [ ] **PASO 3:** Dependencias instaladas (`npm install`) ✅
- [ ] **PASO 4:** Servidor iniciado (`ng serve`) ✅
- [ ] **PASO 4.2:** Probado el flujo completo ✅

---

## 🎯 QUÉ ESPERAR

### ✅ Si todo funciona:

1. **Clic en "Olvidaste tu contraseña?"**
   - → Se abre un diálogo
   - → Ingresas tu email
   - → Aparece mensaje de éxito

2. **Revisas tu email**
   - → Recibes un email de `noreply@notifications.academic.system.com`
   - → Contiene un código de 6 dígitos (ejemplo: `123456`)
   - → El código expira en 15 minutos

3. **Ingresas el código**
   - → Te redirige a la página de verificación
   - → Ingresas el código de 6 dígitos
   - → Si es correcto, te lleva a establecer nueva contraseña

4. **Estableces nueva contraseña**
   - → Ingresas nueva contraseña
   - → Confirmas la contraseña
   - → Aparece mensaje de éxito

5. **Inicias sesión**
   - → Vas a `/login`
   - → Usas tu nueva contraseña
   - → ✅ Inicias sesión exitosamente

---

## ❌ PROBLEMAS COMUNES

### Problema: "No recibo el email"

**Soluciones:**

1. ✅ Revisa la carpeta de **SPAM**
2. ✅ Verifica que el email exista en la tabla `usuarios` de Supabase
3. ✅ Revisa la **consola del navegador** (F12 → Console) para ver errores
4. ✅ Verifica en Resend Dashboard que el dominio esté verificado

### Problema: "Error al ejecutar el script SQL"

**Soluciones:**

1. ✅ Copia el script completo (no dejes nada fuera)
2. ✅ Verifica que estés en el proyecto correcto de Supabase
3. ✅ Si dice "table already exists", está bien, significa que ya está creada

### Problema: "El código no funciona"

**Soluciones:**

1. ✅ Verifica que el código sea exacto (sin espacios)
2. ✅ Verifica que no haya expirado (15 minutos)
3. ✅ Revisa en Supabase → Table Editor → `password_reset_codes` para ver el código

---

## 📊 VERIFICAR EN SUPABASE

Para ver si todo está funcionando:

1. Ve a Supabase Dashboard → **Table Editor**
2. Selecciona la tabla **`password_reset_codes`**
3. Deberías ver los códigos que se han generado
4. Cada fila muestra:
   - `email`: Email del usuario
   - `code`: Código generado
   - `expires_at`: Cuándo expira
   - `verified`: Si fue verificado (true/false)
   - `used`: Si fue usado (true/false)

---

## 🎉 ¡ESO ES TODO!

**Solo necesitas ejecutar el script SQL en Supabase y probar.**

Todos los archivos ya están creados:
- ✅ Componentes (forgot-password, verify-code, reset-password)
- ✅ Servicios (email.service, password-reset.service)
- ✅ Rutas configuradas
- ✅ Login component actualizado
- ✅ Resend configurado

**¿Dudas? Revisa la sección "PROBLEMAS COMUNES" arriba.**

---

## 📞 RESUMEN ULTRA RÁPIDO

1. **Ejecuta** `database_password_reset.sql` en Supabase SQL Editor
2. **Instala** dependencias: `npm install`
3. **Inicia** el servidor: `ng serve`
4. **Prueba** el flujo completo
5. **¡Listo!** ✅



