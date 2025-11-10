# 📚 Sistema de Gestión Académica - AsistentStudent

Sistema completo de gestión académica desarrollado en **Angular 20+**, totalmente frontend con simulación de datos mediante LocalStorage. Diseño profesional, moderno y responsive con soporte multi-institución.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/FrancoVivass/AS-Academic-System)
[![Deploy with Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://pages.cloudflare.com)

## ⚡ Inicio Rápido

### 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/FrancoVivass/AS-Academic-System.git
cd AS-Academic-System/gestion-academica

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# La aplicación estará disponible en http://localhost:4200
```

### 🚀 Deployment Rápido

**Para Vercel:**
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Importa el repositorio `AS-Academic-System`
3. Configura:
   - **Root Directory:** `gestion-academica`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/gestion-academica/browser`
4. Click en "Deploy"

**Para Cloudflare Pages:**
1. Ve a [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build command:** `cd gestion-academica && npm run build`
   - **Build output directory:** `gestion-academica/dist/gestion-academica/browser`
4. Click en "Save and Deploy"

📖 **Ver [QUICK_START.md](./QUICK_START.md) para más detalles**

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

1. **Sistema Multi-Instituciones**
   - Selección de institución educativa
   - Credenciales por institución
   - Personalización de colores por institución
   - Gestión independiente de datos por institución

2. **Sistema de Autenticación**
   - Login simulado con validación
   - Guard de rutas protegidas
   - Gestión de sesión con LocalStorage
   - Roles de usuario: Admin, Secretario, Profesor, Alumno

3. **Gestión de Alumnos**
   - Listado completo de alumnos
   - Alta, edición y eliminación (CRUD completo)
   - Búsqueda por nombre, apellido o DNI
   - Filtrado por curso
   - Visualización de promedios

4. **Gestión de Materias**
   - Listado de materias con información detallada
   - CRUD completo de materias
   - Sistema de inscripciones de alumnos a materias
   - Búsqueda y filtrado avanzado
   - Visualización de cantidad de alumnos inscritos

5. **Control de Asistencia**
   - Registro de asistencia por materia y fecha
   - Toggle rápido de presente/ausente
   - Visualización de porcentaje de asistencia por alumno
   - Filtrado por materia y fecha

6. **Sistema de Notas**
   - Carga de notas por materia
   - Diferentes tipos de evaluación
   - Cálculo automático de promedios
   - Historial de calificaciones

7. **Dashboard**
   - Estadísticas generales del sistema
   - Total de alumnos y materias
   - Promedio general calculado
   - Gráficos y visualizaciones

8. **Gestión de Cursos**
   - Creación y gestión de cursos
   - Asignación de alumnos a cursos
   - Gestión de horarios y turnos

9. **Gestión de Docentes**
   - Listado de docentes
   - Asignación de materias a docentes
   - Perfiles de docentes

10. **Centro de Ayuda**
    - Tutoriales y guías
    - Preguntas frecuentes (FAQ)
    - Soporte al usuario

11. **Formulario de Contacto**
    - Formulario completo de contacto
    - Información de la institución
    - Múltiples tipos de consulta

## 🏗️ Arquitectura del Proyecto

```
gestion-academica/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes de la aplicación
│   │   ├── services/            # Servicios (lógica de negocio)
│   │   ├── models/              # Modelos de datos
│   │   ├── guards/              # Guards de rutas
│   │   └── shared/              # Componentes compartidos
│   ├── assets/                  # Recursos estáticos
│   └── styles.css               # Estilos globales
├── public/                      # Archivos públicos
├── angular.json                 # Configuración de Angular
├── package.json                 # Dependencias
├── vercel.json                  # Configuración de Vercel
├── wrangler.toml                # Configuración de Cloudflare
└── README.md                    # Este archivo
```

## 🛠️ Tecnologías Utilizadas

- **Angular 20+** - Framework principal
- **Angular Material** - Componentes UI
- **TypeScript** - Lenguaje de programación
- **RxJS** - Programación reactiva
- **Chart.js** - Gráficos y visualizaciones
- **LocalStorage** - Persistencia de datos
- **CSS3** - Estilos y diseño responsive

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm start                    # Inicia servidor de desarrollo
npm run build                # Build de producción
npm run build:dev            # Build de desarrollo
npm run watch                # Build en modo watch

# Deployment
npm run deploy:vercel        # Build para Vercel
npm run deploy:cloudflare    # Build para Cloudflare

# Testing
npm test                     # Ejecutar tests
```

## 🏫 Instituciones Disponibles

El sistema incluye tres instituciones pre-configuradas:

### 1. Instituto Paula Robles (IPR)
- **ID:** `1`
- **Nombre Corto:** `IPR`
- **Credencial de Acceso:** `EDI2025`
- **Descripción:** Instituto Superior Paula Robles
- **Email:** contacto@paulorobles.edu
- **Teléfono:** +54 11 1234-5678
- **Dirección:** Av. Principal 123, Buenos Aires
- **Colores:**
  - Primario: `#800020` (Bordo)
  - Secundario: `#722F37` (Bordo oscuro)
  - Acento: `#FFFFFF` (Blanco)
- **Logo:** Colocar el logo en `src/assets/instituciones/paula-robles-logo.png`

### 2. Colegio San Patricio (CSP)
- **ID:** `2`
- **Nombre Corto:** `CSP`
- **Credencial de Acceso:** `CSP2024`
- **Descripción:** Colegio privado con educación integral
- **Email:** info@sanpatricio.edu
- **Teléfono:** +54 11 2345-6789
- **Dirección:** Calle Educación 456, Córdoba
- **Colores:**
  - Primario: `#2e7d32` (Verde)
  - Secundario: `#1b5e20` (Verde oscuro)
  - Acento: `#4caf50` (Verde claro)

### 3. Academia de Ciencias (AC)
- **ID:** `3`
- **Nombre Corto:** `AC`
- **Credencial de Acceso:** `AC2024`
- **Descripción:** Academia especializada en ciencias exactas
- **Email:** contacto@academiadeciencias.edu
- **Teléfono:** +54 11 3456-7890
- **Dirección:** Boulevard Científico 789, Rosario
- **Colores:**
  - Primario: `#7b1fa2` (Púrpura)
  - Secundario: `#6a1b9a` (Púrpura oscuro)
  - Acento: `#9c27b0` (Púrpura claro)

## 🔐 Credenciales de Prueba

### Instituciones
| Institución | Credencial |
|------------|------------|
| Instituto Paula Robles (IPR) | `EDI2025` |
| Colegio San Patricio (CSP) | `CSP2024` |
| Academia de Ciencias (AC) | `AC2024` |

### Usuarios
| Username | Contraseña | Rol |
|----------|------------|-----|
| `admin` | `1234` | Administrador |
| `secretario` | `1234` | Secretario |
| `profesor` | `1234` | Profesor |
| `alumno` | `1234` | Alumno |

## 🚀 Deployment

### Opciones de Deployment

El proyecto está configurado para desplegarse en **Vercel** o **Cloudflare Pages**.

#### Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com) y conéctate con GitHub
2. Importa el repositorio `AS-Academic-System`
3. Configura:
   - **Root Directory:** `gestion-academica`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/gestion-academica/browser`
4. Haz clic en "Deploy"

#### Desplegar en Cloudflare Pages
1. Ve a [Cloudflare Pages](https://pages.cloudflare.com)
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build command:** `cd gestion-academica && npm run build`
   - **Build output directory:** `gestion-academica/dist/gestion-academica/browser`
   - **Root directory:** `gestion-academica`
4. Haz clic en "Save and Deploy"

📖 **Para más detalles, consulta [DEPLOY.md](./DEPLOY.md)**

## 📸 Agregar Logo de Institución

Para que el logo del **Instituto Paula Robles** aparezca en el sistema:

1. **Coloca el archivo del logo en:**
   ```
   src/assets/instituciones/paula-robles-logo.png
   ```

2. **Especificaciones recomendadas:**
   - Formato: PNG (preferido) o JPG
   - Tamaño: 200x200px o más grande
   - Fondo: Preferiblemente transparente o blanco
   - Resolución: Mínimo 300 DPI

3. **Diseño:**
   - El logo se mostrará con fondo blanco y borde redondeado
   - Los colores deben combinar con los colores bordo (#800020, #722F37)
   - El logo aparecerá automáticamente en login, registro y header

4. **Verificación:**
   - El logo aparecerá en las páginas de login y registro
   - También en el header cuando estés logueado
   - Si no se encuentra, se mostrará un ícono de fallback

## 📚 Documentación Adicional

- 📖 [QUICK_START.md](./QUICK_START.md) - Guía rápida de inicio
- 📖 [GIT_SETUP.md](./GIT_SETUP.md) - Configuración de Git y GitHub
- 📖 [DEPLOY.md](./DEPLOY.md) - Guía completa de deployment

## 🐛 Solución de Problemas

### Error: "Port 4200 is already in use"
```bash
# Windows PowerShell
tasklist /fi "imagename eq node.exe"
taskkill /PID <PID> /F
ng serve --port 4201
```

### Actualizar datos de instituciones
Si ves datos antiguos de instituciones (como "Instituto Tecnológico Superior" en lugar de "Instituto Paula Robles"):

**Opción 1: Recargar la página**
- Simplemente recarga la página (F5 o Ctrl+R)
- El sistema actualizará automáticamente los datos

**Opción 2: Limpiar localStorage manualmente**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Application" (o "Aplicación")
3. En el menú lateral, expande "Local Storage"
4. Selecciona tu dominio (localhost:4200)
5. Elimina las claves:
   - `gestion_academica_instituciones`
   - `gestion_academica_institucion_actual`
6. Recarga la página

**Opción 3: Desde la consola del navegador**
```javascript
localStorage.removeItem('gestion_academica_instituciones');
localStorage.removeItem('gestion_academica_institucion_actual');
location.reload();
```

### Error de compilación
Si encuentras errores de compilación, verifica que:
1. Todos los archivos de componentes existan
2. Las rutas en `app.routes.ts` sean correctas
3. Las importaciones estén correctas

## 📄 Licencia

Este proyecto es privado y propiedad de AsistentStudent.

## 👥 Autor

**Franco Vivass**
- GitHub: [@FrancoVivass](https://github.com/FrancoVivass)
- Repositorio: [AS-Academic-System](https://github.com/FrancoVivass/AS-Academic-System)

## 🙏 Agradecimientos

- Angular Team por el excelente framework
- Angular Material por los componentes UI
- Comunidad de desarrolladores por el apoyo

---

**¡Gracias por usar AsistentStudent!** 🚀
