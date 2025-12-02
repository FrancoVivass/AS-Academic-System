# 📧 Template de EmailJS - Nueva Contraseña

## 🎯 Template para Email con Usuario, Email y Contraseña

Este template se usa cuando el usuario restablece su contraseña. Incluye:
- ✅ Usuario (username)
- ✅ Email del usuario
- ✅ Nueva contraseña

---

## 📋 Pasos para Crear el Template en EmailJS

### 1. Crear Nuevo Template

1. Ve a [EmailJS Dashboard](https://dashboard.emailjs.com/admin/template)
2. Haz clic en **"Create New Template"**
3. Nombre del template: `Nueva Contraseña - AcademicSystem`

### 2. Configurar el Template

**Asunto:**
```
Tu Nueva Contraseña - AcademicSystem
```

**Contenido HTML:**
Copia y pega el siguiente código completo:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Tu Nueva Contraseña - AcademicSystem</title>
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
    .success-icon-container {
      margin: 30px 0 40px;
      text-align: center;
    }
    .success-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto;
      background: linear-gradient(135deg, #2b7bcc 0%, #1565c0 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
      box-shadow: 0 8px 25px rgba(43, 123, 204, 0.3);
      animation: bounce 1s ease-in-out;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .greeting {
      font-size: 24px;
      color: #333333;
      margin-bottom: 20px;
      font-weight: 600;
      text-align: center;
    }
    .greeting strong {
      color: #2b7bcc;
      font-weight: 700;
    }
    .message {
      font-size: 16px;
      color: #555555;
      margin-bottom: 35px;
      line-height: 1.8;
      text-align: center;
    }
    .credentials-box {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border: 2px solid #4caf50;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      text-align: left;
    }
    .credentials-title {
      color: #2e7d32;
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .credential-item {
      margin: 15px 0;
      padding: 12px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 8px;
      border-left: 3px solid #4caf50;
    }
    .credential-label {
      color: #1b5e20;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .credential-value {
      color: #2e7d32;
      font-size: 16px;
      font-weight: 600;
      font-family: 'Courier New', 'Monaco', monospace;
      word-break: break-all;
    }
    .password-container {
      margin: 40px 0;
      text-align: center;
    }
    .password-label {
      font-size: 14px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .password-box { 
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 3px solid #2b7bcc;
      border-radius: 12px;
      padding: 30px 25px;
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      margin: 0 auto;
      font-family: 'Courier New', 'Monaco', monospace;
      color: #1565c0;
      box-shadow: 0 4px 15px rgba(43, 123, 204, 0.2);
      display: inline-block;
      min-width: 200px;
      word-break: break-all;
      position: relative;
      overflow: hidden;
    }
    .password-box::before {
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
      .password-box {
        font-size: 22px;
        padding: 25px 20px;
        min-width: auto;
      }
      .success-icon {
        width: 80px;
        height: 80px;
        font-size: 40px;
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
        <h2>Tu Nueva Contraseña</h2>
      </div>
      
      <div class="content">
        <div class="success-icon-container">
          <div class="success-icon">🔑</div>
        </div>
        
        <div class="greeting">
          ¡Hola <strong>{{to_name}}</strong>!
        </div>
        
        <div class="message">
          Tu contraseña ha sido restablecida exitosamente. Aquí están tus credenciales de acceso:
        </div>
        
        <div class="credentials-box">
          <div class="credentials-title">
            <span>👤</span>
            <span>Tus Credenciales de Acceso</span>
          </div>
          
          {{#if username}}
          <div class="credential-item">
            <div class="credential-label">Usuario</div>
            <div class="credential-value">{{username}}</div>
          </div>
          {{/if}}
          
          {{#if user_email}}
          <div class="credential-item">
            <div class="credential-label">Email</div>
            <div class="credential-value">{{user_email}}</div>
          </div>
          {{/if}}
        </div>
        
        <div class="password-container">
          <div class="password-label">Tu Nueva Contraseña</div>
          <div class="password-box">{{password}}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-box">
          <div class="info-icon">💡</div>
          <div class="info-content">
            <div class="info-title">Guarda tus Credenciales</div>
            <div class="info-text">Por favor, guarda esta información en un lugar seguro. Puedes iniciar sesión con tu {{#if username}}usuario o {{/if}}email y la nueva contraseña. También puedes cambiarla nuevamente desde tu perfil una vez que inicies sesión en AcademicSystem.</div>
          </div>
        </div>
        
        <div class="warning-box">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <div class="warning-title">Seguridad de tu Cuenta</div>
            <div class="warning-text">Si no solicitaste este cambio de contraseña, contacta inmediatamente al administrador de tu institución para proteger tu cuenta.</div>
          </div>
        </div>
        
        <div class="message" style="margin-top: 30px;">
          Ahora puedes iniciar sesión en AcademicSystem con estas credenciales.
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

### 3. Variables del Template

En EmailJS, configura estas variables (van automáticamente desde el código):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{to_name}}` | Nombre del usuario | `Juan Pérez` |
| `{{to_email}}` | Email del destinatario | `usuario@example.com` |
| `{{password}}` | Nueva contraseña | `nuevaPass123` |
| `{{username}}` | Usuario (username) | `jperez` |
| `{{user_email}}` | Email del usuario | `usuario@example.com` |
| `{{code}}` | También contiene la contraseña | `nuevaPass123` |

**Nota:** EmailJS no soporta condicionales `{{#if}}` por defecto. Si no funcionan, usa esta versión simplificada:

```html
<div class="credentials-box">
  <div class="credentials-title">
    <span>👤</span>
    <span>Tus Credenciales de Acceso</span>
  </div>
  
  <div class="credential-item">
    <div class="credential-label">Usuario</div>
    <div class="credential-value">{{username}}</div>
  </div>
  
  <div class="credential-item">
    <div class="credential-label">Email</div>
    <div class="credential-value">{{user_email}}</div>
  </div>
</div>
```

### 4. Guardar el Template

1. Haz clic en **"Save"**
2. **Publica el template** (debe estar en estado "Published", no "Draft")
3. **Copia el Template ID** (ej: `template_xxxxxxxx`)

### 5. Actualizar environment.ts

Si creaste un template diferente para nueva contraseña, actualiza `environment.ts`:

```typescript
emailjs: {
  publicKey: 'IPcjBSET9_X2QTrBM',
  serviceId: 'service_vbg0icf',
  templateId: 'template_37vdhg5', // Para código de verificación
  templateIdPassword: 'template_xxxxxxxx', // ← Tu nuevo template ID para nueva contraseña
  logoUrl: 'https://i.imgur.com/YNHMzRs.png'
}
```

Si usas el mismo template para ambos, deja `templateIdPassword` igual a `templateId`.

---

## ✅ Checklist

- [ ] Template creado en EmailJS
- [ ] HTML copiado correctamente
- [ ] Variables configuradas
- [ ] Template publicado (no en Draft)
- [ ] Template ID copiado
- [ ] `templateIdPassword` actualizado en `environment.ts` (si es diferente)
- [ ] Logo visible (debe cargar desde Imgur)

---

## 🧪 Probar el Template

1. Restablece una contraseña en el sistema
2. Revisa tu email
3. Deberías ver:
   - Logo de AcademicSystem
   - Usuario
   - Email
   - Nueva contraseña destacada
   - Todo con los colores azules del sistema

---

## 📝 Notas

- El logo se carga desde: `https://i.imgur.com/YNHMzRs.png`
- Los colores son los azules del sistema: `#2b7bcc`, `#1565c0`
- El template es responsive (se adapta a móviles)
- Si alguna variable no aparece, verifica que esté en los `templateParams` del código

