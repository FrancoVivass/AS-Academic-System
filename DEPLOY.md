# 🚀 Guía de Deployment - AsistentStudent

Esta guía te ayudará a desplegar el proyecto en **Vercel** o **Cloudflare Pages**.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en GitHub
- Cuenta en Vercel o Cloudflare Pages
- Git instalado

## 🔧 Configuración Inicial

### 1. Preparar el Repositorio

```bash
# Navegar al directorio del proyecto
cd gestion-academica

# Inicializar git (si no está inicializado)
git init

# Agregar el remoto de GitHub
git remote add origin https://github.com/FrancoVivass/AS-Academic-System.git

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: Sistema de Gestión Académica"

# Subir a GitHub
git branch -M main
git push -u origin main
```

## 🌐 Opción 1: Desplegar en Vercel

### Método 1: Desde la Interfaz de Vercel (Recomendado)

1. **Crear cuenta en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Regístrate con tu cuenta de GitHub

2. **Importar el proyecto**
   - Haz clic en "New Project"
   - Selecciona el repositorio `AS-Academic-System`
   - Vercel detectará automáticamente que es un proyecto Angular

3. **Configuración del proyecto**
   - **Framework Preset:** Angular
   - **Root Directory:** `gestion-academica`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/gestion-academica/browser`
   - **Install Command:** `npm install`

4. **Variables de entorno** (si las necesitas en el futuro)
   - No se requieren por ahora (el proyecto usa LocalStorage)

5. **Desplegar**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente

### Método 2: Desde la CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Navegar al proyecto
cd gestion-academica

# Desplegar
vercel

# Para producción
vercel --prod
```

### Configuración de Vercel

El archivo `vercel.json` ya está configurado con:
- Build command: `npm run build`
- Output directory: `dist/gestion-academica/browser`
- Rewrites para SPA (Single Page Application)
- Headers de caché para assets

## ☁️ Opción 2: Desplegar en Cloudflare Pages

### Método 1: Desde la Interfaz de Cloudflare (Recomendado)

1. **Crear cuenta en Cloudflare**
   - Ve a [cloudflare.com](https://cloudflare.com)
   - Crea una cuenta o inicia sesión

2. **Ir a Cloudflare Pages**
   - En el dashboard, selecciona "Workers & Pages"
   - Haz clic en "Create application" > "Pages" > "Connect to Git"

3. **Conectar con GitHub**
   - Autoriza Cloudflare Pages para acceder a tu repositorio
   - Selecciona el repositorio `AS-Academic-System`

4. **Configuración del proyecto**
   - **Project name:** `as-academic-system`
   - **Production branch:** `main`
   - **Build command:** `cd gestion-academica && npm run build`
   - **Build output directory:** `gestion-academica/dist/gestion-academica/browser`
   - **Root directory:** `gestion-academica`

5. **Variables de entorno** (si las necesitas)
   - No se requieren por ahora

6. **Desplegar**
   - Haz clic en "Save and Deploy"
   - Cloudflare construirá y desplegará automáticamente

### Método 2: Usando Wrangler CLI

```bash
# Instalar Wrangler CLI
npm i -g wrangler

# Navegar al proyecto
cd gestion-academica

# Login en Cloudflare
wrangler login

# Desplegar
npm run build
wrangler pages deploy dist/gestion-academica/browser --project-name=as-academic-system
```

### Configuración de Cloudflare Pages

El archivo `wrangler.toml` ya está configurado. También puedes usar GitHub Actions (ver `.github/workflows/deploy.yml`).

### Configuración de GitHub Actions (Opcional)

Si quieres usar GitHub Actions para deploy automático:

1. **Obtener tokens de Cloudflare**
   - Ve a Cloudflare Dashboard > My Profile > API Tokens
   - Crea un token con permisos de "Cloudflare Pages:Edit"
   - También necesitas el Account ID (visible en el dashboard)

2. **Configurar secrets en GitHub**
   - Ve a tu repositorio en GitHub
   - Settings > Secrets and variables > Actions
   - Agrega los siguientes secrets:
     - `CLOUDFLARE_API_TOKEN`: Tu token de API
     - `CLOUDFLARE_ACCOUNT_ID`: Tu Account ID

3. **El workflow se ejecutará automáticamente**
   - Cada push a `main` o `master` desplegará automáticamente
   - También puedes ejecutarlo manualmente desde la pestaña "Actions"

## 🔄 Actualizaciones y Re-deployment

### Vercel
- Los cambios se despliegan automáticamente cuando haces push a la rama principal
- También puedes hacer redeploy manual desde el dashboard

### Cloudflare Pages
- Los cambios se despliegan automáticamente si usas GitHub Actions
- O manualmente desde el dashboard o usando Wrangler CLI

## 📝 Notas Importantes

### Build de Producción

El comando `npm run build` genera los archivos optimizados en:
```
dist/gestion-academica/browser/
```

### SPA Routing

Tanto Vercel como Cloudflare Pages están configurados para manejar el routing de Angular (SPA). Todas las rutas redirigen a `index.html`.

### Assets

Los assets (imágenes, logos, etc.) están en `src/assets/` y se copian automáticamente al build.

### LocalStorage

El proyecto usa LocalStorage del navegador para almacenar datos. Esto significa que:
- Los datos son específicos del navegador
- Los datos se mantienen entre sesiones
- Los datos se comparten entre pestañas del mismo dominio

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Build failed"
```bash
# Verificar que el build funciona localmente
npm run build

# Si hay errores, revisar los logs
npm run build --verbose
```

### Error: "404 en rutas"
- Verificar que el archivo `vercel.json` o `_redirects` está configurado correctamente
- Verificar que el output directory es correcto

### Error: "Assets no se cargan"
- Verificar que los assets están en `src/assets/`
- Verificar que el build incluye los assets en `dist/gestion-academica/browser/assets/`

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentación de Angular](https://angular.io/docs)

## 🎉 ¡Listo!

Una vez desplegado, tu aplicación estará disponible en:
- **Vercel:** `https://tu-proyecto.vercel.app`
- **Cloudflare Pages:** `https://as-academic-system.pages.dev`

¡Felicitaciones! Tu sistema de gestión académica está en producción. 🚀

