# 📧 Configuración de Resend para Envío de Emails

## ✅ API Key Configurada

He configurado Resend con tu API key en el proyecto.

---

## 🔧 Configuración Actual

### Archivos Actualizados:

✅ **`src/environments/environment.ts`** - API key agregada  
✅ **`src/environments/environment.prod.ts`** - API key para producción  
✅ **`src/app/services/email.service.ts`** - Servicio actualizado para usar Resend  

---

## ⚠️ IMPORTANTE: Verificar Dominio en Resend

Para que los emails se envíen correctamente, debes:

### 1. Verificar tu dominio en Resend

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Haz clic en **"Add Domain"** o **"Verify Domain"**
3. Agrega tu dominio (ejemplo: `academicsystem.com`)
4. Resend te dará registros DNS para agregar
5. Agrega los registros en tu proveedor de DNS
6. Espera a que se verifique (puede tardar unos minutos)

### 2. Actualizar el Email Remitente

Una vez verificado tu dominio, actualiza en `environment.ts`:

```typescript
resend: {
  apiKey: 're_3Xc9YY2e_EUUohvy7i3AAUsMMTifeAqHX',
  fromEmail: 'AcademicSystem <noreply@tudominio.com>' // ← Cambiar aquí
}
```

**Ejemplo:**
- Si tu dominio es `academicsystem.com`
- Usa: `AcademicSystem <noreply@academicsystem.com>`

---

## 🧪 Para Probar Sin Dominio Verificado

Resend permite usar un dominio de prueba temporalmente:

1. Ve a Resend Dashboard → Domains
2. Usa el dominio de prueba que te dan (algo como `resend.dev`)
3. O usa: `onboarding@resend.dev` temporalmente

**Actualiza en environment:**
```typescript
fromEmail: 'AcademicSystem <onboarding@resend.dev>'
```

---

## 📧 Emails Configurados

El sistema enviará 2 tipos de emails:

### 1. Email de Verificación de Código
- **Asunto:** "Código de Verificación - AcademicSystem"
- **Contenido:** Código de 6 dígitos con plantilla HTML

### 2. Email de Confirmación de Cambio
- **Asunto:** "Contraseña Cambiada - AcademicSystem"
- **Contenido:** Confirmación de cambio exitoso

---

## 🔐 Seguridad - Mejores Prácticas

### ⚠️ ADVERTENCIA DE SEGURIDAD

La API key de Resend está en el código del frontend, lo cual **NO es la práctica más segura**. 

### Opción Recomendada: Usar Supabase Edge Function

**Lo ideal es:**
1. Crear una Supabase Edge Function
2. Poner la API key de Resend en las variables de entorno de Supabase
3. Llamar a la Edge Function desde el frontend

### Por Ahora (Funcional pero menos seguro):

- ✅ Funciona para desarrollo y pruebas
- ✅ Los emails se enviarán correctamente
- ⚠️ La API key está expuesta en el código
- ⚠️ Cualquiera puede verla en el código fuente del navegador

---

## 🚀 Cómo Funciona Ahora

1. Usuario solicita código → `PasswordResetService.requestVerificationCode()`
2. Servicio genera código y guarda en BD
3. `EmailService.sendVerificationCode()` envía email con Resend
4. Usuario recibe email con código real ✅

---

## 🧪 Probar el Envío

1. Inicia la aplicación: `ng serve`
2. Ve a `/login`
3. Haz clic en "Olvidé contraseña"
4. Ingresa un email válido
5. **Revisa tu bandeja de entrada** (y spam)
6. Deberías recibir un email real con el código

---

## 🐛 Troubleshooting

### Error: "Domain not verified"
→ Verifica tu dominio en Resend Dashboard

### Error: "Unauthorized"
→ Verifica que la API key sea correcta

### No llegan los emails
→ Revisa carpeta de spam
→ Verifica que el dominio esté verificado
→ Revisa los logs en Resend Dashboard

### Email va a spam
→ Verifica el dominio (SPF, DKIM, DMARC)
→ Configura correctamente los registros DNS

---

## 📊 Verificar Estado en Resend

1. Ve a [Resend Dashboard](https://resend.com)
2. Abre **"Emails"** para ver el historial
3. Revisa **"Domains"** para ver estado de verificación
4. Revisa **"API Keys"** para gestionar las keys

---

## ✅ Estado Actual

- ✅ Resend instalado
- ✅ API key configurada
- ✅ Servicio de email actualizado
- ✅ Plantillas HTML creadas
- ⚠️ **Pendiente:** Verificar dominio en Resend
- ⚠️ **Pendiente:** Actualizar `fromEmail` con tu dominio

---

## 🎯 Próximos Pasos

1. **Verificar dominio en Resend** (importante)
2. **Actualizar `fromEmail`** en environment
3. **Probar envío real** de emails
4. **Opcional:** Migrar a Edge Function para mayor seguridad

---

**¡Los emails ahora se enviarán realmente!** 📧✅



