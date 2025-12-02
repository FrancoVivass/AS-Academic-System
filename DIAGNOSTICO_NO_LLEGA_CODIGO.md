# 🔍 DIAGNÓSTICO: No Llega el Código de Verificación

## ✅ Pasos para Diagnosticar

### 1. Verificar en la Consola del Navegador

1. **Abre las herramientas de desarrollador** (F12)
2. **Ve a la pestaña "Console"**
3. **Intenta solicitar el código nuevamente**
4. **Busca estos mensajes:**

#### ✅ Mensajes que deberías ver:

```
✅ Email enviado exitosamente con Resend: [ID]
```

O si falla:

```
❌ Error enviando email con Resend: [error]
================================
📧 EMAIL DE VERIFICACIÓN (FALLBACK)
================================
Código: [código de 6 dígitos]
================================
```

---

### 2. Verificar en Supabase - Tabla `password_reset_codes`

1. **Ve a Supabase Dashboard** → [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Selecciona tu proyecto**
3. **Ve a "Table Editor"**
4. **Busca la tabla `password_reset_codes`**
5. **Verifica:**

   - ✅ ¿Se creó un registro con tu email?
   - ✅ ¿Tiene un código de 6 dígitos?
   - ✅ ¿La fecha `expires_at` es futura?
   - ✅ ¿El campo `used` es `false`?

**Si NO hay registros:**
   - El email puede no existir en la tabla `usuarios`
   - O hay un error al guardar el código

**Si HAY registros:**
   - El código se generó correctamente
   - El problema está en el envío del email

---

### 3. Verificar que el Email Existe en la Base de Datos

1. **En Supabase Dashboard** → **Table Editor**
2. **Selecciona la tabla `usuarios`**
3. **Busca tu email**
4. **Verifica que exista un usuario con ese email**

**Si NO existe:**
   - El sistema no enviará el código (por seguridad)
   - Crea un usuario de prueba con ese email

---

### 4. Verificar Resend Dashboard

1. **Ve a [Resend Dashboard](https://resend.com/emails)**
2. **Inicia sesión**
3. **Revisa la sección "Emails"**
4. **Verifica:**

   - ✅ ¿Se intentó enviar un email?
   - ✅ ¿Cuál es el estado? (Enviado, Fallido, etc.)
   - ✅ ¿Hay algún error?

**Si ves errores:**
   - Revisa el mensaje de error
   - Puede ser que el dominio no esté verificado
   - Puede ser que la API key sea incorrecta

---

### 5. Verificar Dominio en Resend

1. **Ve a [Resend Domains](https://resend.com/domains)**
2. **Verifica:**

   - ✅ ¿Está verificado `notifications.academic.system.com`?
   - ✅ ¿Está el estado en "Verified"?

**Si NO está verificado:**
   - Los emails no se enviarán
   - Debes verificar el dominio primero

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: El email no existe en la base de datos

**Síntoma:**
- No se crea ningún registro en `password_reset_codes`
- Aparece mensaje: "Si el email existe, recibirás un código"

**Solución:**
1. Verifica que el email exista en la tabla `usuarios`
2. Si no existe, crea un usuario de prueba:

```sql
INSERT INTO usuarios (email, username, password, nombre, activo, institucion_id)
VALUES (
  'tu-email@ejemplo.com',
  'testuser',
  'password123',
  'Usuario Test',
  true,
  'tu-institucion-id'
);
```

---

### Problema 2: Error CORS al llamar a Resend API

**Síntoma:**
- En la consola aparece: "CORS policy" o "Network error"
- El email nunca se envía

**Solución:**
- Resend API puede tener restricciones CORS desde el navegador
- **Opciones:**
  1. Usar el código del fallback (consola) temporalmente
  2. Crear una Supabase Edge Function (recomendado)
  3. Revisar si Resend permite llamadas desde el navegador

---

### Problema 3: Dominio no verificado en Resend

**Síntoma:**
- Resend rechaza el envío
- Error: "Domain not verified"

**Solución:**
1. Ve a Resend Dashboard → Domains
2. Verifica tu dominio
3. O usa un dominio de prueba temporal: `onboarding@resend.dev`

---

### Problema 4: API Key Incorrecta

**Síntoma:**
- Error 401 Unauthorized
- Resend rechaza la solicitud

**Solución:**
1. Verifica la API key en `environment.ts`
2. Verifica que la key sea correcta en Resend Dashboard
3. Regenera la key si es necesario

---

## 🔧 SOLUCIÓN TEMPORAL: Ver el Código en Consola

Si el email no llega, siempre puedes ver el código en la consola del navegador:

1. **Abre la consola** (F12)
2. **Solicita el código**
3. **Busca el mensaje:**

```
================================
📧 EMAIL DE VERIFICACIÓN (FALLBACK)
================================
Para: tu-email@ejemplo.com
Usuario: [nombre]
Código: 123456
================================
```

4. **Copia el código de 6 dígitos**
5. **Úsalo en la página de verificación**

---

## 📋 Checklist de Diagnóstico

- [ ] ¿Aparece un registro en `password_reset_codes`?
- [ ] ¿El email existe en la tabla `usuarios`?
- [ ] ¿Hay errores en la consola del navegador?
- [ ] ¿El dominio está verificado en Resend?
- [ ] ¿Se ve algún intento de envío en Resend Dashboard?
- [ ] ¿La API key es correcta?
- [ ] ¿Puedes ver el código en la consola (fallback)?

---

## ✅ Si Nada Funciona

1. **Abre la consola del navegador** (F12)
2. **Copia TODOS los mensajes de error**
3. **Revisa en Supabase** si el código se guardó
4. **Revisa en Resend** si hay intentos de envío
5. **Comparte esa información** para más ayuda

---

## 🎯 Próximos Pasos Recomendados

1. **Para Desarrollo:** Usar el fallback de consola (funciona perfectamente)
2. **Para Producción:** Crear una Supabase Edge Function para mayor seguridad
3. **Verificar Dominio:** Asegurarse de que el dominio esté verificado en Resend

---

**¿Necesitas ayuda?** Comparte los mensajes de la consola y podemos diagnosticar mejor el problema.



