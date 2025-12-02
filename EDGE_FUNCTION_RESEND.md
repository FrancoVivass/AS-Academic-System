# 🚀 Crear Supabase Edge Function para Resend (Recomendado)

## 🔐 Por Qué Usar Edge Function

**Problema:** La API key de Resend está expuesta en el código del frontend (inseguro)

**Solución:** Crear una Supabase Edge Function que:
- ✅ Guarda la API key en el servidor (seguro)
- ✅ Envía emails desde el backend
- ✅ No expone credenciales

---

## 📋 Pasos para Crear Edge Function

### Paso 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

O usar npx:
```bash
npx supabase
```

### Paso 2: Login en Supabase

```bash
supabase login
```

### Paso 3: Crear la Edge Function

```bash
supabase functions new send-verification-code
```

Esto crea: `supabase/functions/send-verification-code/index.ts`

### Paso 4: Código de la Edge Function

Reemplaza el contenido con:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'AcademicSystem <noreply@academicsystem.com>'

serve(async (req) => {
  try {
    const { email, code, nombreUsuario } = await req.json()

    if (!email || !code || !nombreUsuario) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const resend = new Resend(RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: 'Código de Verificación - AcademicSystem',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #800020; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .code-box { 
              background: white; 
              border: 2px solid #800020; 
              padding: 20px; 
              text-align: center; 
              font-size: 32px; 
              font-weight: bold; 
              letter-spacing: 5px; 
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { color: #f44336; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AcademicSystem</h1>
              <h2>Código de Verificación</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${nombreUsuario}</strong>,</p>
              <p>Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
              <div class="code-box">${code}</div>
              <p class="warning">⚠️ Este código expira en 15 minutos.</p>
              <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
            </div>
            <div class="footer">
              <p>© 2024 AcademicSystem. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Tu código de verificación es: ${code}. Este código expira en 15 minutos.`
    })

    if (error) {
      console.error('Error enviando email:', error)
      return new Response(
        JSON.stringify({ error: 'Error al enviar email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error en función:', error)
    return new Response(
      JSON.stringify({ error: 'Error inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Paso 5: Configurar Variables de Entorno

En Supabase Dashboard:
1. Ve a **Project Settings** → **Edge Functions**
2. Agrega estas variables:
   - `RESEND_API_KEY` = `re_3Xc9YY2e_EUUohvy7i3AAUsMMTifeAqHX`
   - `RESEND_FROM_EMAIL` = `AcademicSystem <noreply@tudominio.com>`

### Paso 6: Desplegar la Function

```bash
supabase functions deploy send-verification-code
```

---

## ✅ Una Vez Creada la Edge Function

El servicio de email intentará usar la Edge Function primero. Si no existe, usará Resend API directamente como fallback.

---

## 📝 Nota

Por ahora, el servicio usa Resend API directamente (funciona pero menos seguro). Una vez que crees la Edge Function, automáticamente la usará.



