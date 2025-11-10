# Carpeta Assets

Esta carpeta contiene los archivos estáticos del proyecto (imágenes, logos, iconos, etc.).

## Ubicación del Logo

Para agregar tu logo:

1. Coloca tu archivo de logo aquí (por ejemplo: `logo.png`)
2. En `src/app/components/layout/layout.component.html`, línea 7-16, reemplaza:
   ```html
   <mat-icon class="title-icon">school</mat-icon>
   <span>Gestión Académica</span>
   ```
   
   Por:
   ```html
   <img src="assets/logo.png" alt="Logo" class="logo-image" />
   ```

## Estructura recomendada

```
assets/
  ├── logo.png          (Tu logo principal)
  ├── favicon.ico       (Icono del navegador)
  └── images/           (Otras imágenes si las necesitas)
```

