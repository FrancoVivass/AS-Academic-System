# 🔍 Verificación de EmailJS

## ✅ Credenciales Configuradas

- **Public Key**: `IPcjBSET9_X2QTrBM`
- **Service ID**: `service_vbg0icf`
- **Template ID**: `template_37vdhg5`
- **Logo URL**: `https://i.imgur.com/YNHMzRs.png`

## 🔧 Pasos para Verificar

### 1. Verificar Template en EmailJS

1. Ve a [EmailJS Dashboard](https://dashboard.emailjs.com/admin/template)
2. Abre el template `template_37vdhg5`
3. **Verifica que el HTML del template sea el correcto** (copia desde `CONFIGURACION_EMAILJS.md`)
4. **Verifica las variables del template:**
   - `{{to_name}}` - Nombre del usuario
   - `{{code}}` - Código de verificación
   - `{{to_email}}` - Email del destinatario (opcional)

### 2. Verificar Service en EmailJS

1. Ve a [Email Services](https://dashboard.emailjs.com/admin/integration)
2. Verifica que `service_vbg0icf` esté **activo** y **conectado**
3. Verifica que el servicio de email (Gmail, Outlook, etc.) esté funcionando

### 3. Probar el Envío

1. Abre la consola del navegador (F12)
2. Ve a `/login` → "Olvidé contraseña"
3. Ingresa un email válido
4. **Revisa la consola** - deberías ver:
   - `✅ EmailJS inicializado correctamente`
   - `📤 Enviando email con EmailJS...`
   - `🔑 Service ID: service_vbg0icf`
   - `🔑 Template ID: template_37vdhg5`
   - `📋 Template Params: {...}`

### 4. Errores Comunes

#### Error: "EmailJS Public Key no configurada"
- **Solución**: Verifica que `publicKey` esté en `environment.ts`

#### Error: "Service ID o Template ID no configurados"
- **Solución**: Verifica que ambos estén en `environment.ts`

#### Error: "EmailJS no está disponible"
- **Solución**: Verifica que `@emailjs/browser` esté instalado:
  ```bash
  npm install @emailjs/browser
  ```

#### Error: "Template not found" o "Service not found"
- **Solución**: 
  1. Verifica que el Service ID y Template ID sean correctos
  2. Verifica que el template esté **publicado** en EmailJS
  3. Verifica que el servicio esté **activo**

#### El email no llega
1. **Revisa la carpeta de spam**
2. **Verifica los logs en EmailJS Dashboard** → [Email Logs](https://dashboard.emailjs.com/admin/log)
3. **Verifica que el email service esté conectado** (Gmail, Outlook, etc.)
4. **Revisa la consola del navegador** para ver errores específicos

### 5. Verificar Variables del Template

En EmailJS, el template debe tener estas variables configuradas:

```
{{to_name}}    → Nombre del usuario
{{code}}       → Código de verificación (6 dígitos)
{{to_email}}   → Email del destinatario (opcional)
```

**Importante**: Las variables deben coincidir exactamente con estos nombres en el template HTML.

### 6. Debug en Consola

Cuando solicites un código, revisa la consola. Deberías ver:

```
✅ EmailJS inicializado correctamente
✅ EmailJS está configurado, intentando enviar...
📤 Enviando email con EmailJS...
📧 Destinatario: tu@email.com
📨 Tipo: verification
🔑 Service ID: service_vbg0icf
🔑 Template ID: template_37vdhg5
🔑 Public Key: Configurada
📋 Template Params: {to_email: "...", to_name: "...", code: "..."}
📬 Respuesta de EmailJS: {status: 200, text: "OK"}
✅ Email enviado exitosamente con EmailJS
```

Si ves errores, cópialos y revísalos.

### 7. Verificar en EmailJS Dashboard

1. Ve a [Email Logs](https://dashboard.emailjs.com/admin/log)
2. Deberías ver los intentos de envío
3. Si hay errores, aparecerán aquí con detalles

---

## 🚨 Si Sigue Sin Funcionar

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Detén el servidor (Ctrl+C)
   npm start
   ```

2. **Limpia la caché del navegador:**
   - Ctrl+Shift+Delete
   - Limpia caché y cookies
   - Recarga la página

3. **Verifica que el template esté publicado:**
   - En EmailJS, el template debe estar en estado "Published"
   - No puede estar en "Draft"

4. **Verifica el límite de emails:**
   - Plan gratuito: 200 emails/mes
   - Verifica que no hayas excedido el límite

5. **Revisa los logs detallados en la consola** y comparte los errores específicos

