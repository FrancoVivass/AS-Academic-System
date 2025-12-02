# 📧 Configuración de EmailJS para Envío de Emails

## ✅ EmailJS Instalado

He migrado el sistema de Resend a **EmailJS** para el envío de emails. EmailJS funciona directamente desde el frontend sin problemas de CORS.

---

## 🚀 Pasos para Configurar EmailJS

### 1. Crear Cuenta en EmailJS

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Crea una cuenta gratuita (plan gratuito: 200 emails/mes)
3. Confirma tu email

### 2. Crear un Email Service

1. En el dashboard de EmailJS, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Elige un proveedor de email:
   - **Gmail** (recomendado para pruebas)
   - **Outlook**
   - **Yahoo**
   - **Otro** (SMTP personalizado)
4. Conecta tu cuenta de email
5. **Guarda el Service ID** (ej: `service_xxxxxxxx`)

### 3. Crear Template de Email

1. Ve a **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Configura el template:

#### Template para Código de Verificación:

**Asunto:**
```
Código de Verificación - AcademicSystem
```

**Contenido HTML:**

Copia y pega este template profesional en EmailJS (ya incluye los colores azules del sistema y el logo):

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Código de Verificación - AcademicSystem</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333333; 
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-color: #f5f7fa;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      padding: 40px 20px;
      min-height: 100vh;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #2b7bcc 0%, #1565c0 100%);
      color: white; 
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 3s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .logo-container {
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      margin: 0 auto 15px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      backdrop-filter: blur(10px);
      border: 3px solid rgba(255, 255, 255, 0.3);
      object-fit: cover;
    }
    .logo-placeholder img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 400;
      opacity: 0.95;
      position: relative;
      z-index: 1;
    }
    .content { 
      padding: 50px 40px;
      background: #ffffff;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 25px;
      font-weight: 500;
    }
    .greeting strong {
      color: #2b7bcc;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #555555;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .code-container {
      margin: 40px 0;
      text-align: center;
    }
    .code-label {
      font-size: 14px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .code-box { 
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 3px solid #2b7bcc;
      border-radius: 12px;
      padding: 30px 25px;
      text-align: center;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 12px;
      margin: 0 auto;
      font-family: 'Courier New', 'Monaco', monospace;
      color: #1565c0;
      box-shadow: 0 4px 15px rgba(43, 123, 204, 0.2);
      display: inline-block;
      min-width: 280px;
      position: relative;
      overflow: hidden;
    }
    .code-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shine 3s infinite;
    }
    @keyframes shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    .warning-box { 
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-left: 4px solid #ff9800;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .warning-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .warning-content {
      flex: 1;
    }
    .warning-title {
      color: #e65100;
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 16px;
    }
    .warning-text {
      color: #bf360c;
      font-size: 14px;
      line-height: 1.6;
    }
    .info-box {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-left: 4px solid #2196f3;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .info-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .info-content {
      flex: 1;
    }
    .info-title {
      color: #1565c0;
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 16px;
    }
    .info-text {
      color: #0d47a1;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer { 
      text-align: center; 
      padding: 40px 30px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-top: 1px solid #dee2e6;
    }
    .footer-logo {
      font-size: 20px;
      font-weight: 700;
      color: #2b7bcc;
      margin-bottom: 15px;
    }
    .footer-text {
      font-size: 13px;
      color: #6c757d;
      line-height: 1.8;
      margin-bottom: 10px;
    }
    .footer-copyright {
      font-size: 12px;
      color: #adb5bd;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #dee2e6, transparent);
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .content {
        padding: 30px 25px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 26px;
      }
      .code-box {
        font-size: 32px;
        letter-spacing: 8px;
        padding: 25px 20px;
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <div class="logo-container">
          <img src="https://i.imgur.com/YNHMzRs.png" alt="Logo AcademicSystem" class="logo-placeholder" />
        </div>
        <h1>AcademicSystem</h1>
        <h2>Código de Verificación</h2>
      </div>
      
      <div class="content">
        <div class="greeting">
          Hola <strong>{{to_name}}</strong>,
        </div>
        
        <div class="message">
          Has solicitado restablecer tu contraseña. Para continuar, utiliza el siguiente código de verificación de 6 dígitos:
        </div>
        
        <div class="code-container">
          <div class="code-label">Tu Código de Verificación</div>
          <div class="code-box">{{code}}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="warning-box">
          <div class="warning-icon">⏰</div>
          <div class="warning-content">
            <div class="warning-title">Código con Tiempo Limitado</div>
            <div class="warning-text">Este código expira en 15 minutos. Si no lo usas a tiempo, deberás solicitar uno nuevo.</div>
          </div>
        </div>
        
        <div class="info-box">
          <div class="info-icon">🔒</div>
          <div class="info-content">
            <div class="info-title">Seguridad de tu Cuenta</div>
            <div class="info-text">Si no solicitaste este cambio de contraseña, puedes ignorar este email de forma segura. Tu cuenta permanecerá protegida y no se realizará ningún cambio.</div>
          </div>
        </div>
        
        <div class="message" style="margin-top: 30px;">
          Ingresa este código en la página de verificación para continuar con el proceso de restablecimiento de contraseña.
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-logo">AcademicSystem</div>
        <div class="footer-text">
          Sistema de Gestión Académica<br>
          Plataforma educativa integral
        </div>
        <div class="footer-copyright">
          © 2024 AcademicSystem. Todos los derechos reservados.<br>
          Este es un email automático, por favor no respondas.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

**💡 Logo Configurado:**

El logo de AcademicSystem ya está configurado en `environment.ts`:
- **URL del Logo**: `https://i.imgur.com/YNHMzRs.png`

Si quieres usar un logo diferente en EmailJS, puedes:

1. **Usar la URL directamente en el template:**
```html
<img src="https://i.imgur.com/YNHMzRs.png" alt="Logo AcademicSystem" class="logo-placeholder" />
```

2. **O usar una variable de EmailJS:**
```html
<img src="{{logo_url}}" alt="Logo AcademicSystem" class="logo-placeholder" />
```

3. **O cambiar la URL en `environment.ts`:**
```typescript
logoUrl: 'https://tu-nueva-url-del-logo.png'
```

**📋 Variables de EmailJS a usar:**

**Para Código de Verificación:**
- `{{to_name}}` - Nombre del usuario
- `{{code}}` - Código de verificación (6 dígitos)
- `{{to_email}}` - Email del destinatario

**Para Nueva Contraseña:**
- `{{to_name}}` - Nombre del usuario
- `{{password}}` o `{{code}}` - Nueva contraseña
- `{{username}}` - Usuario (username)
- `{{user_email}}` - Email del usuario
- `{{to_email}}` - Email del destinatario

> **💡 Nota:** Si necesitas un template separado para nueva contraseña, crea uno nuevo y actualiza `templateIdPassword` en `environment.ts`. Ver `TEMPLATE_EMAIL_NUEVA_CONTRASEÑA.md` para el template completo.

**Variables del Template:**
- `{{to_email}}` - Email del destinatario
- `{{to_name}}` - Nombre del usuario
- `{{code}}` - Código de verificación
- `{{subject}}` - Asunto del email
- `{{message}}` - Mensaje de texto
- `{{html_content}}` - Contenido HTML (si prefieres usar este)

4. **Guarda el Template ID** (ej: `template_xxxxxxxx`)

### 4. Obtener Public Key

1. Ve a **"Account"** → **"General"**
2. Copia tu **"Public Key"** (ej: `xxxxxxxxxxxxx`)

### 5. Configurar en el Proyecto

Abre `src/environments/environment.ts` y completa la configuración:

```typescript
emailjs: {
  publicKey: 'TU_PUBLIC_KEY_AQUI', // Ej: 'AbCdEf123456'
  serviceId: 'TU_SERVICE_ID_AQUI', // Ej: 'service_abc123'
  templateId: 'TU_TEMPLATE_ID_AQUI', // Ej: 'template_xyz789'
  templateIdPassword: 'TU_TEMPLATE_ID_AQUI' // Puede ser el mismo templateId
}
```

**Ejemplo completo:**
```typescript
emailjs: {
  publicKey: 'AbCdEf123456GhIjKl',
  serviceId: 'service_abc123',
  templateId: 'template_xyz789',
  templateIdPassword: 'template_xyz789'
}
```

### 6. (Opcional) Crear Template para Nueva Contraseña

Si quieres un template diferente para emails de nueva contraseña:

1. Crea otro template similar
2. Usa las variables: `{{to_name}}`, `{{code}}` (que será la contraseña)
3. Agrega el Template ID en `templateIdPassword`

---

## 🧪 Probar el Sistema

1. **Inicia el servidor:**
   ```bash
   npm start
   ```

2. **Prueba el flujo:**
   - Ve a `/login`
   - Haz clic en "Olvidé contraseña"
   - Ingresa un email válido
   - Deberías recibir el email con el código

3. **Revisa la consola:**
   - Si hay errores, aparecerán en la consola del navegador
   - Si EmailJS no está configurado, verás el código en consola (modo fallback)

---

## 📋 Variables Disponibles en Templates

El sistema envía estas variables a EmailJS:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `to_email` | Email del destinatario | `usuario@example.com` |
| `to_name` | Nombre del usuario | `Juan Pérez` |
| `code` | Código de verificación o contraseña | `123456` |
| `subject` | Asunto del email | `Código de Verificación` |
| `message` | Mensaje de texto plano | `Tu código es: 123456` |
| `html_content` | Contenido HTML completo | `<html>...</html>` |

**🎨 Diseño Profesional Incluido:**

Las plantillas ya incluyen:
- ✅ Diseño moderno con gradientes
- ✅ Animaciones sutiles
- ✅ Responsive (se adapta a móviles)
- ✅ Espacio para logo (actualmente usa emoji 🎓 como placeholder)
- ✅ Cajas de información con iconos
- ✅ Estilos profesionales y modernos
- ✅ Compatible con todos los clientes de email

---

## ⚠️ Notas Importantes

1. **Plan Gratuito:**
   - 200 emails/mes
   - Suficiente para desarrollo y pruebas
   - Para producción, considera el plan pago

2. **Seguridad:**
   - La Public Key es segura de exponer en el frontend
   - No expone credenciales sensibles
   - EmailJS maneja la autenticación del servicio

3. **Límites:**
   - Rate limiting: 50 emails/hora en plan gratuito
   - Si excedes, los emails se encolarán

4. **Fallback:**
   - Si EmailJS no está configurado o falla, el sistema mostrará el código en consola
   - También mostrará un alert visual con el código

---

## 🔧 Solución de Problemas

### Error: "EmailJS is not initialized"
- Verifica que `publicKey` esté configurado en `environment.ts`

### Error: "Service ID not found"
- Verifica que `serviceId` sea correcto
- Asegúrate de que el servicio esté activo en EmailJS

### Error: "Template ID not found"
- Verifica que `templateId` sea correcto
- Asegúrate de que el template esté publicado

### No llegan los emails
1. Revisa la carpeta de spam
2. Verifica que el email service esté conectado correctamente
3. Revisa la consola del navegador para errores
4. Verifica los logs en el dashboard de EmailJS

### Emails van a spam
- Configura SPF/DKIM en tu dominio (si usas dominio personalizado)
- Usa un email service confiable (Gmail, Outlook)
- Evita palabras spam en el contenido

---

## ✅ Estado Actual

- ✅ EmailJS instalado (`@emailjs/browser`)
- ✅ Servicio de email actualizado
- ✅ Plantillas HTML incluidas
- ✅ Modo fallback implementado
- ⚠️ Pendiente: Configurar credenciales en `environment.ts`

---

## 📚 Recursos

- [Documentación de EmailJS](https://www.emailjs.com/docs/)
- [Ejemplos de Templates](https://www.emailjs.com/docs/examples/)
- [Dashboard de EmailJS](https://dashboard.emailjs.com/)

---

**¡Listo!** Una vez que configures las credenciales en `environment.ts`, el sistema enviará emails reales usando EmailJS.

