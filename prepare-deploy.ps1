# Script de preparación para deployment (PowerShell)
Write-Host "🚀 Preparando proyecto para deployment..." -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "angular.json")) {
    Write-Host "❌ Error: No se encontró angular.json. Asegúrate de ejecutar este script desde el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Limpiar build anterior
Write-Host "🧹 Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install

# Build de producción
Write-Host "🔨 Construyendo proyecto para producción..." -ForegroundColor Yellow
npm run build

# Verificar que el build fue exitoso
if (Test-Path "dist/gestion-academica/browser") {
    Write-Host "✅ Build exitoso! Los archivos están en dist/gestion-academica/browser" -ForegroundColor Green
    Write-Host "📊 Tamaño del build:" -ForegroundColor Cyan
    $size = (Get-ChildItem -Path "dist/gestion-academica/browser" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   $([math]::Round($size, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "❌ Error: El build no se completó correctamente" -ForegroundColor Red
    exit 1
}

Write-Host "✨ Proyecto listo para deployment!" -ForegroundColor Green

