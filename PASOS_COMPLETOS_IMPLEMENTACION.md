# 🚀 GUÍA COMPLETA - Sistema de Recuperación de Contraseña

## ✅ PASOS A SEGUIR (EN ORDEN)

---

## 📋 PASO 1: Base de Datos (SUPABASE)

### 1.1. Ir a Supabase Dashboard
1. Abre tu navegador
2. Ve a [https://supabase.com](https://supabase.com)
3. Inicia sesión en tu proyecto

### 1.2. Ejecutar Script SQL
1. En el Dashboard de Supabase, haz clic en **"SQL Editor"** (menú lateral izquierdo)
2. Haz clic en **"New Query"** o **"Nueva Consulta"**
3. Abre el archivo **`database_password_reset.sql`** en tu proyecto
4. **Copia TODO el contenido** del archivo
5. **Pega** el contenido en el SQL Editor de Supabase
6. Haz clic en **"Run"** o presiona `Ctrl + Enter`
7. ✅ Deberías ver: "Success. No rows returned" o similar

### 1.3. Verificar que se creó la tabla
1. En Supabase Dashboard, ve a **"Table Editor"** (menú lateral)
2. Deberías ver una nueva tabla llamada **`password_reset_codes`**
3. Si la ves, ¡perfecto! ✅

---

## 📋 PASO 2: Verificar Archivos del Proyecto

### 2.1. Servicios (deben existir)

Verifica que estos archivos existan:
- ✅ `src/app/services/email.service.ts` (debe existir)
- ✅ `src/app/services/password-reset.service.ts` (debe existir)

### 2.2. Componentes (deben existir)

Verifica que estas carpetas existan:
- ✅ `src/app/components/forgot-password/` (3 archivos: .ts, .html, .css)
- ✅ `src/app/components/verify-code/` (3 archivos: .ts, .html, .css)
- ✅ `src/app/components/reset-password/` (3 archivos: .ts, .html, .css)

### 2.3. Rutas (deben estar configuradas)

Verifica que en `src/app/app.routes.ts` existan estas rutas:
- ✅ `/forgot-password`
- ✅ `/verify-code`
- ✅ `/reset-password`

---

## 📋 PASO 3: Verificar Configuración de Resend

### 3.1. Verificar Environment

Abre `src/environments/environment.ts` y verifica:

```typescript
resend: {
  apiKey: 're_3Xc9YY2e_EUUohvy7i3AAUsMMTifeAqHX',
  fromEmail: 'AcademicSystem <noreply@notifications.academic.system.com>'
}
```

✅ Si ya está así, perfecto. Si no, actualízalo.

### 3.2. Verificar que Resend esté instalado

Abre una terminal y ejecuta:

```bash
npm list resend
```

✅ Deberías ver `resend@x.x.x` en la lista

Si no está instalado:
```bash
npm install resend
```

---

## 📋 PASO 4: Verificar Login Component

### 4.1. Verificar que el método `onForgotPassword` existe

Abre `src/app/components/login/login.component.ts` y verifica que tenga:

```typescript
onForgotPassword(event: Event): void {
  event.preventDefault();
  
  const dialogRef = this.dialog.open(ForgotPasswordComponent, {
    width: '500px',
    maxWidth: '90vw',
    disableClose: false,
    panelClass: 'forgot-password-dialog-container'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.step === 'verify') {
      this.router.navigate(['/verify-code'], { 
        queryParams: { email: result.email } 
      });
    }
  });
}
```

✅ Si ya está, perfecto. Si no, deberás agregarlo (pero debería estar).

---

## 📋 PASO 5: Probar el Sistema

### 5.1. Iniciar el servidor de desarrollo

```bash
ng serve
```

Espera a que compile (verás "✔ Compiled successfully")

### 5.2. Probar el flujo completo

1. **Abrir el navegador**
   - Ve a: `http://localhost:4200`
   - Selecciona tu institución
   - Ve a la página de login

2. **Hacer clic en "Olvidaste tu contraseña?"**
   - Debería abrirse un diálogo
   - Ingresa un email de un usuario que exista en tu base de datos

3. **Revisar el email**
   - Abre la bandeja de entrada del email que ingresaste
   - Deberías recibir un email con un código de 6 dígitos
   - Si no llega, revisa la carpeta de spam

4. **Ingresar el código**
   - Después de enviar el email, deberías ser redirigido a `/verify-code`
   - Ingresa el código de 6 dígitos que recibiste

5. **Restablecer la contraseña**
   - Después de verificar el código, deberías ir a `/reset-password`
   - Ingresa tu nueva contraseña
   - Confirma la contraseña

6. **Iniciar sesión con la nueva contraseña**
   - Ve de nuevo a `/login`
   - Ingresa tu usuario y la nueva contraseña
   - Deberías poder iniciar sesión ✅

---

## 📋 PASO 6: Verificar en Supabase

### 6.1. Ver los códigos generados

1. En Supabase Dashboard, ve a **"Table Editor"**
2. Selecciona la tabla **`password_reset_codes`**
3. Deberías ver los códigos que se han generado
4. Cada código tiene:
   - `email`: El email del usuario
   - `code`: El código de 6 dígitos
   - `expires_at`: Cuando expira
   - `verified`: Si fue verificado
   - `used`: Si fue usado

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Error: "Table password_reset_codes does not exist"
**Solución:** Ejecuta el script SQL del PASO 1 de nuevo

### ❌ No recibo el email
**Soluciones:**
1. Revisa la carpeta de spam
2. Verifica que el email exista en la tabla `usuarios` de Supabase
3. Revisa la consola del navegador (F12) para ver errores
4. Verifica que el dominio esté verificado en Resend Dashboard
5. Revisa el email `fromEmail` en `environment.ts`

### ❌ El código no funciona
**Soluciones:**
1. Verifica que el código no haya expirado (15 minutos)
2. Revisa que el código sea exactamente como te llegó (sin espacios)
3. Verifica en Supabase que el código exista y no esté usado

### ❌ Error al cambiar la contraseña
**Soluciones:**
1. Verifica que el código esté verificado (`verified = true` en la BD)
2. Revisa la consola del navegador para ver el error específico
3. Verifica que la nueva contraseña cumpla los requisitos mínimos

---

## ✅ CHECKLIST FINAL

Marca cada paso cuando lo completes:

- [ ] ✅ Paso 1: Script SQL ejecutado en Supabase
- [ ] ✅ Paso 2: Todos los archivos verificados
- [ ] ✅ Paso 3: Resend configurado
- [ ] ✅ Paso 4: Login component verificado
- [ ] ✅ Paso 5: Sistema probado completamente
- [ ] ✅ Paso 6: Verificado en Supabase

---

## 🎉 ¡LISTO!

Si todos los pasos están completos, el sistema de recuperación de contraseña debería estar funcionando perfectamente.

**¿Algún problema?** Revisa la sección "PROBLEMAS COMUNES" arriba.

---

## 📞 VERIFICACIÓN RÁPIDA

### ¿Qué debería funcionar?

1. ✅ Clic en "Olvidaste tu contraseña?" → Abre diálogo
2. ✅ Ingresar email → Envía email con código
3. ✅ Recibir email → Código de 6 dígitos
4. ✅ Ingresar código → Verifica y va a reset password
5. ✅ Nueva contraseña → Cambia contraseña exitosamente
6. ✅ Login con nueva contraseña → Funciona

**Si todo esto funciona, ¡está completo!** 🎉



