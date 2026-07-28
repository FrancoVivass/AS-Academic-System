# Configuración de email para restablecimiento de contraseña

Esta guía explica cómo configurar el envío de emails cuando un usuario restablece su contraseña. El sistema usa **EmailJS** (gratuito hasta cierto límite de envíos).

---

## Flujo del restablecimiento de contraseña

1. **Olvidé mi contraseña** → El usuario ingresa su email.
2. **Código de verificación** → Se envía un email con un código de 6 dígitos.
3. **Verificar código** → El usuario ingresa el código.
4. **Nueva contraseña** → El usuario define una nueva contraseña.
5. **Email de confirmación** → Se envía un email con la nueva contraseña y credenciales.

---

## Paso 1: Crear cuenta en EmailJS

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Regístrate o inicia sesión.
3. En el dashboard, anota tu **Public Key** (clave pública).

---

## Paso 2: Crear un servicio de email en EmailJS

1. En el panel de EmailJS: **Email Services** → **Add New Service**
2. Elige tu proveedor (Gmail, Outlook, etc.) y conéctalo con tu cuenta.
3. Una vez creado, copia el **Service ID** (ej: `service_xxxxxxx`).

---

## Paso 3: Crear plantillas (templates)

### Plantilla 1: Código de verificación

1. **Email Templates** → **Create New Template**
2. Nombre sugerido: `Código de Verificación - Password Reset`
3. **Subject:** `Código de verificación - AcademicSystem`
4. **Content (HTML):** Puedes usar este ejemplo:

```html
Hola {{to_name}},

Has solicitado restablecer tu contraseña en AcademicSystem.

Tu código de verificación es: {{code}}

Este código expira en 15 minutos.

Si no solicitaste este cambio, ignora este email.
```

5. **Variables que debe tener el template:**
   - `{{to_name}}` – Nombre del usuario
   - `{{to_email}}` – Email del destinatario
   - `{{code}}` – Código de 6 dígitos

6. Guarda y copia el **Template ID** (ej: `template_xxxxxxx`).

---

### Plantilla 2: Nueva contraseña (después del reset)

1. **Email Templates** → **Create New Template**
2. Nombre sugerido: `Nueva contraseña - Password Reset`
3. **Subject:** `Tu nueva contraseña - AcademicSystem`
4. **Content (HTML):** Ejemplo:

```html
Hola {{to_name}},

Tu contraseña ha sido restablecida exitosamente.

Tus credenciales de acceso:
- Usuario: {{username}}
- Email: {{user_email}}
- Nueva contraseña: {{password}}

Guarda esta información en un lugar seguro. Puedes cambiarla desde tu perfil después de iniciar sesión.

Si no solicitaste este cambio, contacta al administrador.
```

5. **Variables que debe tener el template:**
   - `{{to_name}}` – Nombre del usuario
   - `{{to_email}}` – Email del destinatario
   - `{{username}}` – Usuario (username)
   - `{{user_email}}` – Email del usuario
   - `{{password}}` – Nueva contraseña generada

6. Guarda y copia el **Template ID** (ej: `template_xxxxxxx`).

---

## Paso 4: Configurar el proyecto

Edita `src/environments/environment.ts` (desarrollo) y `src/environments/environment.prod.ts` (producción):

```typescript
export const environment = {
  production: false,  // true en environment.prod.ts
  appUrl: 'http://localhost:4200',  // Tu URL en producción
  supabase: {
    url: 'TU_SUPABASE_URL',
    anonKey: 'TU_SUPABASE_ANON_KEY'
  },
  emailjs: {
    publicKey: 'TU_PUBLIC_KEY',           // De EmailJS Dashboard
    serviceId: 'service_xxxxxxx',         // ID del servicio de email
    templateId: 'template_xxxxxxx',       // Template del CÓDIGO de verificación
    templateIdPassword: 'template_yyyyyyy', // Template de NUEVA CONTRASEÑA
    logoUrl: 'https://url-de-tu-logo.png' // Opcional
  }
};
```

| Campo | Descripción |
|-------|-------------|
| `publicKey` | Public Key de EmailJS (Dashboard) |
| `serviceId` | ID del servicio de email conectado (Gmail, Outlook, etc.) |
| `templateId` | Template para el **código de verificación** (paso 1 del reset) |
| `templateIdPassword` | Template para el email con la **nueva contraseña** (paso final) |
| `logoUrl` | Opcional – URL del logo de tu institución |

---

## Paso 5: Verificar que la tabla exista en Supabase

El flujo de restablecimiento usa la tabla `password_reset_codes`. Ejecuta en el SQL Editor de Supabase:

```sql
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_usuario ON password_reset_codes(usuario_id);
```

---

## Solución de problemas

### "Error al enviar el código de verificación"
- Comprueba que `publicKey`, `serviceId` y `templateId` estén correctos en `environment.ts`.
- Abre la consola del navegador (F12) para ver el error detallado.
- Verifica que las variables del template coincidan con las que envía el código: `to_name`, `to_email`, `code`.

### "El email no llega"
- Revisa la carpeta de spam.
- Confirma que el servicio de EmailJS esté conectado correctamente (Gmail, Outlook, etc.).
- Revisa los límites de tu plan en EmailJS.

### Modo desarrollo (sin EmailJS configurado)
Si no configuras EmailJS, el código se mostrará en la consola del navegador (F12) para que puedas probar el flujo sin enviar emails reales.

---

## Rutas del flujo

- `/forgot-password` – Solicitar código
- `/verify-code` – Ingresar código
- `/reset-password` – Definir nueva contraseña

---

¿Necesitas cambiar el proveedor de email o usar otro servicio (Resend, SendGrid, etc.)? Indica qué quieres usar y se puede adaptar el código.
