# 📧 Aclaración: Dominio Resend para Envío de Emails

## 🔍 Diferencia Importante

### ❌ NO es el dominio:
- `resend._domainkey.notifications.academic` - Este es un **registro DNS** para verificación (DKIM)
- Solo se usa para agregar en tu proveedor DNS
- NO se usa en el código

### ✅ SÍ es el dominio:
El dominio que tienes **verificado** en Resend Dashboard

---

## 🎯 ¿Qué Dominio Tienes Verificado?

Para saber qué dominio usar, verifica en Resend:

1. **Ve a [Resend Dashboard](https://resend.com/domains)**
2. **Inicia sesión**
3. **Busca tu dominio verificado**

Verás algo como:
- `notifications.academic.system.com` ✅
- O solo: `academic.system.com` ✅
- O: `academic.system.com` (con subdominio `notifications`) ✅

---

## 📝 Formato del Email

Una vez que sepas tu dominio verificado, el formato es:

```
AcademicSystem <noreply@[TU-DOMINIO-VERIFICADO]>
```

### Ejemplos:

Si tu dominio verificado es: `notifications.academic.system.com`
```typescript
fromEmail: 'AcademicSystem <noreply@notifications.academic.system.com>'
```

Si tu dominio verificado es: `academic.system.com`
```typescript
fromEmail: 'AcademicSystem <noreply@academic.system.com>'
```

---

## 🔧 Cómo Verificar tu Dominio

1. **Ve a Resend Dashboard → Domains**
2. **Busca el dominio con estado "Verified" (verificado)**
3. **Ese es el dominio que debes usar**

---

## ⚠️ Importante

- El dominio debe estar **verificado** en Resend
- Solo puedes enviar emails desde dominios verificados
- El formato es: `nombre <email@dominio.com>`

---

## 🎯 Pasos para Encontrar tu Dominio Correcto

1. Ve a: https://resend.com/domains
2. Inicia sesión
3. Busca el dominio que dice **"Verified"**
4. Copia ese dominio
5. Úsalo en `fromEmail` como: `noreply@[dominio-copiado]`

---

## 📋 Ejemplo Completo

Si en Resend ves:
```
Domain: academic.system.com
Status: ✅ Verified
```

Entonces usa:
```typescript
fromEmail: 'AcademicSystem <noreply@academic.system.com>'
```

---

## ❓ ¿No Está Verificado?

Si el dominio no está verificado:

1. **Opción 1:** Verifica tu dominio siguiendo las instrucciones de Resend
2. **Opción 2:** Usa el dominio de prueba: `onboarding@resend.dev` (temporal)

---

**Dime qué dominio ves en Resend Dashboard y te ayudo a configurarlo correctamente.**



