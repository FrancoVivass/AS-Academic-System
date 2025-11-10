# ☁️ Configuración de Cloudflare Pages

## 📋 Configuración Paso a Paso

### 1. Project name
```
academic-system
```
✅ Ya está correcto

### 2. Production branch
```
main
```
✅ Ya está correcto

### 3. Framework preset
```
None
```
✅ Correcto (Angular no está en la lista de presets)

### 4. Build command
```
cd gestion-academica && npm run build
```
✅ Correcto

### 5. Build output directory
```
gestion-academica/dist/gestion-academica/browser
```
⚠️ **IMPORTANTE:** Asegúrate de que NO tenga `/` al inicio. Debe ser:
```
gestion-academica/dist/gestion-academica/browser
```
NO:
```
/gestion-academica/dist/gestion-academica/browser  ❌
```

### 6. Root directory (advanced)
```
/
```
✅ Deja el valor por defecto (raíz del repositorio)

O si Cloudflare te permite especificarlo, puedes usar:
```
gestion-academica
```
Pero si usas `gestion-academica` como root directory, entonces:
- Build command: `npm run build` (sin el `cd gestion-academica &&`)
- Build output directory: `dist/gestion-academica/browser`

### 7. Environment variables
**No se requieren variables de entorno** por ahora, ya que el proyecto usa LocalStorage.

## ✅ Resumen de Configuración Recomendada

```
Project name: academic-system
Production branch: main
Framework preset: None
Build command: cd gestion-academica && npm run build
Build output directory: gestion-academica/dist/gestion-academica/browser
Root directory: / (o dejar vacío)
Environment variables: (ninguna)
```

## 🚀 Después de Configurar

1. Haz clic en **"Save and Deploy"**
2. Cloudflare comenzará a construir tu proyecto
3. Una vez completado, tu aplicación estará disponible en:
   - **Producción:** `https://academic-system-72a.pages.dev`
   - O el dominio personalizado que configures

## 🔄 Actualizaciones Automáticas

Cada vez que hagas push a la rama `main` en GitHub, Cloudflare Pages:
1. Detectará automáticamente el cambio
2. Ejecutará el build
3. Desplegará la nueva versión

## 🐛 Solución de Problemas

### Error: "Build failed"
- Verifica que el `Build command` es correcto
- Verifica que el `Build output directory` existe después del build
- Revisa los logs de build en Cloudflare Pages

### Error: "Cannot find module"
- Verifica que `package.json` está en `gestion-academica/`
- Verifica que todas las dependencias están instaladas

### Error: "404 en rutas"
- Verifica que el archivo `public/_redirects` está presente
- Verifica que el build incluye todos los archivos necesarios

## 📝 Notas Adicionales

- El proyecto usa Angular 20+ con el nuevo builder
- El output directory puede variar según la versión de Angular
- Si el build falla, verifica los logs en Cloudflare Pages para más detalles


