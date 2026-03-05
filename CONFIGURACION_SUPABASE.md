# 📊 Base de Datos Completa - Configuración Supabase

## 🔗 Conexión a Supabase

**URL Base de Datos:** `https://iujfqxfkpyeluqgtzdbd.supabase.co`

### Credenciales
- **Clave Pública:** `sb_publishable_vDB6DWBczNLrLI2Hf2GwSQ_GYGIQAFV`
- **Token JWT:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amZxeGZrcHllbHVxZ3R6ZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDAwMDAsImV4cCI6MjA1Mjk3NjAwMH0.BFY0BTVl3dZugeRYD4aontyVuWeNw3kTI34yOmGz7Wo`

## 📁 Archivos de Configuración

### 1. `BASEdedatos.sql`
Archivo SQL completo con toda la estructura de la base de datos:
- 16 tablas principales
- Índices optimizados
- Triggers automáticos
- Row Level Security (RLS)
- Datos iniciales

**Ubicación:** `/AS-Academic-System/BASEdedatos.sql`

### 2. `environment.ts`
Configuración del entorno Angular con credenciales de Supabase

**Ubicación:** `/AS-Academic-System/src/environments/environment.ts`

### 3. `supabase.config.ts`
Configuración centralizada de todas las tablas y parámetros

**Ubicación:** `/AS-Academic-System/src/app/config/supabase.config.ts`

---

## 🚀 Pasos para Implementar

### Paso 1: Crear la Base de Datos en Supabase

1. Accede a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona el proyecto `AS-Academic-System`
3. Ve a **SQL Editor**
4. Crea una nueva consulta
5. Copia el contenido completo de `BASEdedatos.sql`
6. Pégalo en el editor
7. Haz clic en **Run** para ejecutar

✅ **El script es idempotente** (puedes ejecutarlo múltiples veces sin errores)

### Paso 2: Verificar las Tablas

Ejecuta esta consulta en SQL Editor para verificar:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver estas tablas:
- aulas
- alumnos
- asistencias
- auditoria
- biblioteca_recursos
- calendarios_academicos
- carreras
- cursos
- curso_horarios
- curso_materias
- docentes
- docente_materias
- equivalencias
- estadisticas_asistencia
- eventos
- instituciones
- justificativos
- materias
- materia_correlatividades
- mensajes
- notas
- solicitudes
- usuarios

### Paso 3: Verificar los Datos Iniciales

**Instituciones creadas:**
1. Instituto Paula Robles (IPR)
2. Centro Universitario Dolores (CUD)

**Usuarios administrador:**
1. `admin` (Instituto Paula Robles)
2. `admin_cud` (Centro Universitario Dolores)

Contraseña inicial: `admin123`

⚠️ **IMPORTANTE:** Cambiar contraseña en producción

---

## 📊 Estructura de la Base de Datos

### Tablas Principales

#### Administración
| Tabla | Descripción |
|-------|-------------|
| `instituciones` | Datos de instituciones educativas |
| `usuarios` | Usuarios del sistema (admin, profesor, alumno, etc.) |

#### Académico
| Tabla | Descripción |
|-------|-------------|
| `carreras` | Programas académicos |
| `materias` | Asignaturas con profesor, curso y horario |
| `docentes` | Información de profesores |
| `alumnos` | Datos de estudiantes |
| `cursos` | Agrupaciones de estudiantes por año y división |

#### Evaluación
| Tabla | Descripción |
|-------|-------------|
| `notas` | Calificaciones (parcial, final, trabajo, etc.) |
| `asistencias` | Control de asistencia |
| `justificativos` | Justificantes de ausencia |

#### Recursos
| Tabla | Descripción |
|-------|-------------|
| `aulas` | Espacios de enseñanza |
| `eventos` | Calendario académico y exámenes |
| `biblioteca_recursos` | Materiales digitales |

#### Comunicación
| Tabla | Descripción |
|-------|-------------|
| `mensajes` | Sistema de notificaciones |
| `solicitudes` | Trámites administrativos |

#### Otros
| Tabla | Descripción |
|-------|-------------|
| `auditoria` | Registro de cambios y acciones |
| `equivalencias` | Convalidación entre carreras |

---

## 🔐 Características de Seguridad

### Row Level Security (RLS)
- ✅ Habilitado en todas las tablas
- ✅ Políticas básicas para desarrollo (ajustar en producción)

### Validaciones
- ✅ Foreign keys en todas las referencias
- ✅ Triggers para validación de `institucion_id`
- ✅ Constraints de negocio (calificaciones 0-10, intentos máximos, etc.)

### Auditoría
- ✅ Tabla de auditoría completa
- ✅ Registro automático de cambios
- ✅ Timestamps en todas las tablas

---

## 🛠️ Configuración en Angular

### Importar la configuración:
```typescript
import { SUPABASE_CONFIG } from './config/supabase.config';
```

### Usar en servicios:
```typescript
export class MateriaService {
  private tableName = SUPABASE_CONFIG.tables.materias;
  
  getMaterias() {
    return this.supabase
      .from(this.tableName)
      .select('*');
  }
}
```

---

## 📝 Datos para Conexión

### Archivo: `environment.ts`
```typescript
export const environment = {
  supabase: {
    url: 'https://wvxvefwilbnjzpanaopl.supabase.co',
    anonKey: 'sb_publishable_uRE-ybQJF2HUDpatHim_Ug_JDIJCgfw',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
}
```

### Acceso inicial:
```
Usuario: admin
Contraseña: admin123
Institución: Instituto Paula Robles
```

---

## ✅ Checklist de Implementación

- [ ] Crear proyecto en Supabase
- [ ] Ejecutar `BASEdedatos.sql` en SQL Editor
- [ ] Verificar tablas creadas
- [ ] Verificar usuarios admin creados
- [ ] Configurar `environment.ts` (ya está hecho)
- [ ] Configurar credenciales en variables de entorno
- [ ] Ejecutar `npm install @supabase/supabase-js`
- [ ] Probar conexión desde Angular
- [ ] Cambiar contraseñas de admin
- [ ] Configurar políticas RLS para producción

---

## 🆘 Resolución de Problemas

### Error: "Base de datos vacía"
**Solución:** Ejecuta `BASEdedatos.sql` en Supabase SQL Editor

### Error: "Tabla no encontrada"
**Solución:** Verifica que el schema se ejecutó correctamente

### Error: "Permiso denegado"
**Solución:** Revisa las políticas RLS en la tabla específica

### Error: "Foreign key constraint"
**Solución:** Asegúrate de que los IDs de institución existen

---

## 📚 Documentación Adicional

- **SQL Schema:** `BASEdedatos.sql`
- **Configuración:** `src/app/config/supabase.config.ts`
- **Servicios:** `src/app/services/supabase.service.ts`
- **Modelos:** `src/app/models/`

---

## 🎓 Institución Paula Robles

**Instituto Paula Robles**
- Código: IPR
- Color Primario: #8b0000 (Rojo Oscuro)
- Color Secundario: #d3d3d3 (Gris)
- Color Acento: #ffffff (Blanco)
- Email: contacto@paulrobles.edu.ar

**Usuario Admin:**
- Usuario: `admin`
- Contraseña: `admin123` (CAMBIAR)
- Email: admin@paulrobles.edu.ar

---

## 🎓 Centro Universitario Dolores

**Centro Universitario Dolores**
- Código: CUD
- Color Primario: #C8AD7F (Beige/Dorado)
- Color Secundario: #d3d3d3 (Gris)
- Color Acento: #000000 (Negro)
- Email: contacto@cud.edu.ar

**Usuario Admin:**
- Usuario: `admin_cud`
- Contraseña: `admin123` (CAMBIAR)
- Email: admin@cud.edu.ar

---

**Base de datos lista para usar ✅**

Versión: Final - 2025
Base de datos: PostgreSQL (Supabase)
Sistema: AS-Academic-System
