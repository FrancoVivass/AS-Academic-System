# 🔧 Cambiar Dominio Resend - Guía Rápida

## 🎯 Dominio Actual vs Posible

### Actual (en el código):
```
notifications.academic.system.com
```

### Posible (basado en tu mención):
```
academic.system.com
```

---

## 🔄 Opción 1: Cambiar a `academic.system.com`

Si ese es tu dominio verificado, cambia en `environment.ts`:

**ANTES:**
```typescript
fromEmail: 'AcademicSystem <noreply@notifications.academic.system.com>'
```

**DESPUÉS:**
```typescript
fromEmail: 'AcademicSystem <noreply@academic.system.com>'
```

---

## 🔄 Opción 2: Usar Dominio de Prueba (Temporal)

Si tu dominio no está verificado, usa este temporalmente:

```typescript
fromEmail: 'AcademicSystem <onboarding@resend.dev>'
```

Esto funciona inmediatamente sin verificación.

---

## ✅ Cómo Verificar

1. Ve a: https://resend.com/domains
2. Busca el dominio con ✅ "Verified"
3. Ese es el dominio correcto

---

## 🎯 Qué Hacer Ahora

**Dime:**
- ¿Qué dominio ves en Resend Dashboard como "Verified"?
- O si prefieres, puedo cambiar el código a `academic.system.com` para probar



