# ⚡ Guía Rápida de Deployment

## 🚀 Subir a GitHub (Pasos Rápidos)

```bash
# 1. Navegar al proyecto
cd gestion-academica

# 2. Inicializar Git (si no está inicializado)
git init

# 3. Agregar todos los archivos
git add .

# 4. Hacer commit
git commit -m "Initial commit: Sistema de Gestión Académica"

# 5. Agregar remoto de GitHub
git remote add origin https://github.com/FrancoVivass/AS-Academic-System.git

# 6. Cambiar a rama main
git branch -M main

# 7. Subir a GitHub
git push -u origin main
```

## 🌐 Desplegar en Vercel (2 minutos)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Click en "New Project"
3. Selecciona el repositorio `AS-Academic-System`
4. Configura:
   - **Root Directory:** `gestion-academica`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/gestion-academica/browser`
5. Click en "Deploy"

✅ **¡Listo!** Tu app estará en `https://tu-proyecto.vercel.app`

## ☁️ Desplegar en Cloudflare Pages (2 minutos)

1. Ve a [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click en "Create a project" > "Connect to Git"
3. Selecciona el repositorio `AS-Academic-System`
4. Configura:
   - **Project name:** `as-academic-system`
   - **Build command:** `cd gestion-academica && npm run build`
   - **Build output directory:** `gestion-academica/dist/gestion-academica/browser`
   - **Root directory:** `gestion-academica`
5. Click en "Save and Deploy"

✅ **¡Listo!** Tu app estará en `https://as-academic-system.pages.dev`

## 📝 Notas Importantes

- ✅ El proyecto ya tiene todos los archivos de configuración necesarios
- ✅ El routing de Angular está configurado para SPA
- ✅ Los assets se copian automáticamente al build
- ✅ No se requieren variables de entorno (usa LocalStorage)

## 🔄 Actualizaciones

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel y Cloudflare Pages desplegarán automáticamente los cambios.

## 📚 Documentación Completa

- 📖 [GIT_SETUP.md](./GIT_SETUP.md) - Configuración detallada de Git
- 📖 [DEPLOY.md](./DEPLOY.md) - Guía completa de deployment
- 📖 [README.md](./README.md) - Documentación del proyecto


