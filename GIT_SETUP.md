# 🔧 Configuración de Git y GitHub

Esta guía te ayudará a subir tu proyecto a GitHub y prepararlo para deployment.

## 📋 Paso 1: Inicializar Git

```bash
# Navegar al directorio del proyecto
cd gestion-academica

# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: Sistema de Gestión Académica AsistentStudent"
```

## 📋 Paso 2: Conectar con GitHub

```bash
# Agregar el remoto de GitHub
git remote add origin https://github.com/FrancoVivass/AS-Academic-System.git

# Verificar que el remoto se agregó correctamente
git remote -v
```

## 📋 Paso 3: Subir a GitHub

```bash
# Cambiar a la rama main (si es necesario)
git branch -M main

# Subir el código a GitHub
git push -u origin main
```

## 📋 Paso 4: Verificar en GitHub

1. Ve a https://github.com/FrancoVivass/AS-Academic-System
2. Verifica que todos los archivos estén presentes
3. Verifica que el README.md se muestre correctamente

## 🔄 Actualizaciones Futuras

Cuando hagas cambios en el proyecto:

```bash
# Ver el estado de los archivos
git status

# Agregar los archivos modificados
git add .

# Hacer commit con un mensaje descriptivo
git commit -m "Descripción de los cambios"

# Subir los cambios a GitHub
git push
```

## 📝 Estructura del Repositorio

El repositorio debe contener:

```
AS-Academic-System/
├── gestion-academica/
│   ├── src/                    # Código fuente
│   ├── public/                 # Archivos públicos
│   ├── angular.json            # Configuración de Angular
│   ├── package.json            # Dependencias
│   ├── vercel.json             # Configuración de Vercel
│   ├── wrangler.toml           # Configuración de Cloudflare
│   ├── DEPLOY.md               # Guía de deployment
│   └── README.md               # Documentación principal
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Actions para deployment
```

## 🚫 Archivos que NO se suben a GitHub

El archivo `.gitignore` ya está configurado para excluir:
- `node_modules/` - Dependencias de Node.js
- `dist/` - Archivos compilados
- `.angular/` - Cache de Angular
- Archivos de configuración del IDE
- Archivos temporales

## ✅ Verificación Final

Antes de hacer push, verifica:

1. ✅ Todos los archivos fuente están presentes
2. ✅ El `.gitignore` está configurado correctamente
3. ✅ No hay archivos sensibles (API keys, tokens, etc.)
4. ✅ El README.md está actualizado
5. ✅ Los archivos de configuración de deployment están presentes

## 🎉 ¡Listo!

Una vez que hayas subido el código a GitHub, puedes proceder con el deployment en Vercel o Cloudflare Pages siguiendo las instrucciones en [DEPLOY.md](./DEPLOY.md).

