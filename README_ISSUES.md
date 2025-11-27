# Cómo crear Issues en GitHub

## Opción 1: Usar el script de PowerShell (Recomendado)

1. **Obtener un token de GitHub:**
   - Ve a: https://github.com/settings/tokens
   - Click en "Generate new token (classic)"
   - Dale un nombre (ej: "Create Issues")
   - Selecciona el scope `repo` (permisos completos del repositorio)
   - Genera el token y cópialo

2. **Ejecutar el script:**
   ```powershell
   .\create-issues.ps1 -Token "tu_token_aqui"
   ```

## Opción 2: Crear issues manualmente en GitHub

1. Ve a: https://github.com/FrancoVivass/AS-Academic-System/issues
2. Click en "New issue"
3. Usa el archivo `ISSUES.md` como referencia para copiar el título y descripción de cada issue

## Opción 3: Usar GitHub CLI (si lo instalas)

1. Instalar GitHub CLI: https://cli.github.com/
2. Autenticarse: `gh auth login`
3. Ejecutar el script que crea los issues automáticamente

## Issues a crear

Ver el archivo `ISSUES.md` para la lista completa de 24 issues.

