#!/bin/bash

# Script de preparación para deployment
echo "🚀 Preparando proyecto para deployment..."

# Verificar que estamos en el directorio correcto
if [ ! -f "angular.json" ]; then
    echo "❌ Error: No se encontró angular.json. Asegúrate de ejecutar este script desde el directorio raíz del proyecto."
    exit 1
fi

# Limpiar build anterior
echo "🧹 Limpiando builds anteriores..."
rm -rf dist

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Build de producción
echo "🔨 Construyendo proyecto para producción..."
npm run build

# Verificar que el build fue exitoso
if [ -d "dist/gestion-academica/browser" ]; then
    echo "✅ Build exitoso! Los archivos están en dist/gestion-academica/browser"
    echo "📊 Tamaño del build:"
    du -sh dist/gestion-academica/browser
else
    echo "❌ Error: El build no se completó correctamente"
    exit 1
fi

echo "✨ Proyecto listo para deployment!"

