# 📋 Variables para Template de EmailJS - Nueva Contraseña

## ✅ Variables que se envían automáticamente

Para el template `template_lgd3pxf` (Nueva Contraseña), el sistema envía **SOLO** estas variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{to_name}}` | Nombre del usuario | `Juan Pérez` |
| `{{to_email}}` | Email del destinatario | `usuario@example.com` |
| `{{password}}` | Nueva contraseña | `nuevaPass123` |
| `{{username}}` | Usuario (username) | `jperez` |
| `{{user_email}}` | Email del usuario | `usuario@example.com` |
| `{{code}}` | También contiene la contraseña (por compatibilidad) | `nuevaPass123` |

## ⚠️ IMPORTANTE

1. **NO uses condicionales `{{#if}}`** - EmailJS no los soporta por defecto
2. **NO agregues variables que no estén en la lista** - EmailJS las marcará como corruptas
3. **Usa las variables exactamente como están escritas** (mayúsculas/minúsculas importan)

## 📝 Template HTML Simplificado (sin condicionales)

Si tu template tiene condicionales `{{#if}}`, reemplázalos con esta versión:

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

<div class="password-container">
  <div class="password-label">Tu Nueva Contraseña</div>
  <div class="password-box">{{password}}</div>
</div>
```

## 🔍 Verificar en EmailJS

1. Ve a tu template `template_lgd3pxf`
2. Busca todas las variables `{{variable}}`
3. Asegúrate de que **TODAS** estén en la lista de arriba
4. Elimina cualquier variable que no esté en la lista
5. Elimina todos los condicionales `{{#if}}` y `{{/if}}`

## ✅ Checklist

- [ ] Template solo usa las 6 variables listadas arriba
- [ ] No hay condicionales `{{#if}}` en el template
- [ ] Todas las variables están escritas correctamente
- [ ] El template está publicado (no en Draft)
- [ ] Has probado enviar un email de prueba

