# 📋 Propuesta: Sistema Completo de Asistencias

## 🎯 Estructura Base

### **Horarios por Materia (Ya implementado)**
- Cada curso tiene `horarios: HorarioCurso[]`
- Cada horario vincula: `materiaId`, `dia`, `horaInicio`, `horaFin`, `docenteId`, `aula`
- **Ventaja**: Cada materia tiene su propio horario específico

### **Sistema de Asistencias Propuesto**

#### 1. **Registro de Asistencia**
- **Vínculo**: Materia + Fecha + Alumno + Horario (opcional)
- **Estados**:
  - ✅ Presente
  - ❌ Ausente
  - ⏰ Tardanza (presente pero llegó tarde)
  - 📝 Justificado (ausente pero justificado)

#### 2. **Flujo de Trabajo para Profesor**
```
1. Profesor inicia sesión → Ve sus materias
2. Selecciona una materia → Ve los horarios de esa materia
3. Selecciona fecha → Sistema muestra:
   - Si hay clase ese día (según horario)
   - Lista de alumnos del curso
   - Estado de asistencia (si ya fue registrada)
4. Registra asistencia → Por cada alumno: Presente/Ausente/Tardanza
5. Puede justificar ausencias → Agregar justificativo
```

#### 3. **Flujo de Trabajo para Admin/Secretario**
```
1. Selecciona Curso → Ve todas las materias del curso
2. Selecciona Materia → Ve horarios y fechas
3. Puede registrar/modificar asistencia de cualquier fecha
4. Puede justificar ausencias masivamente
5. Ve estadísticas completas
```

## 📊 Modelo de Datos Mejorado

```typescript
interface Asistencia {
  id: string;
  alumnoId: string;
  materiaId: string;
  cursoId: string; // Para filtrar por curso
  horarioId?: string; // ID del horario específico (opcional, para materias con múltiples horarios)
  fecha: string; // YYYY-MM-DD
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  horaRegistro?: string; // HH:MM (para tardanzas)
  justificativoId?: string;
  observaciones?: string;
  cargadaPor: string; // ID del profesor/admin
  fechaCarga: string; // Timestamp
  puedeEditar: boolean;
  editadaPor?: string;
  fechaEdicion?: string;
}

interface EstadisticasAsistencia {
  alumnoId: string;
  materiaId: string;
  cursoId: string;
  totalClases: number; // Total de clases dictadas
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  porcentajeAsistencia: number;
  porcentajeAsistenciaRequerida: number; // De la configuración de la materia
  estado: 'regular' | 'irregular' | 'libre'; // Según porcentaje
}
```

## 🎨 Interfaz Propuesta

### **Vista Profesor**
1. **Selector de Materia** → Dropdown con sus materias
2. **Calendario de Clases** → Muestra días con clase (según horario)
3. **Vista de Registro**:
   - Fecha seleccionada
   - Lista de alumnos del curso
   - Botones: Presente / Ausente / Tardanza
   - Indicador de porcentaje de asistencia por alumno
4. **Vista de Estadísticas**:
   - Tabla con alumnos y sus porcentajes
   - Alertas de alumnos con bajo porcentaje

### **Vista Admin/Secretario**
1. **Selector de Curso** → Todos los cursos
2. **Selector de Materia** → Todas las materias del curso
3. **Vista de Calendario** → Todos los días con clases
4. **Registro Masivo** → Marcar todos presentes/ausentes
5. **Justificativos** → Panel para justificar ausencias
6. **Reportes** → Exportar estadísticas

## ⚙️ Funcionalidades Clave

### **1. Detección Automática de Días de Clase**
```typescript
// Basado en HorarioCurso de la materia
getDiasDeClase(materiaId: string): string[] {
  const horarios = curso.horarios.filter(h => h.materiaId === materiaId);
  return horarios.map(h => h.dia); // ['lunes', 'miercoles', 'viernes']
}

esDiaDeClase(materiaId: string, fecha: string): boolean {
  const diaSemana = getDiaSemana(fecha); // 'lunes', 'martes', etc.
  return getDiasDeClase(materiaId).includes(diaSemana);
}
```

### **2. Registro Inteligente**
- Si no hay clase ese día → Mostrar mensaje
- Si ya fue registrada → Mostrar estado y permitir editar
- Validar que el profesor sea el asignado a la materia

### **3. Estadísticas en Tiempo Real**
- Calcular porcentaje basado en clases dictadas (no total de días)
- Alertar cuando un alumno está cerca del límite
- Mostrar tendencias (mejora/empeora)

### **4. Justificativos**
- Tipos: Médico, Viaje, Institucional, Personal, Otro
- Requiere aprobación del secretario/admin
- Se descuenta del total de ausentes para el porcentaje

## 🔄 Integración con Sistema Actual

1. **Usar HorarioCurso existente** → Ya está implementado
2. **Extender modelo Asistencia** → Agregar campos nuevos
3. **Mejorar componente Asistencia** → Nueva interfaz
4. **Agregar servicio de estadísticas** → Calcular porcentajes

## 📱 Responsive y UX

- Vista móvil optimizada para registro rápido
- Botones grandes y accesibles
- Registro por voz (futuro)
- Notificaciones de recordatorio

