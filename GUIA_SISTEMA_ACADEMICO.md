# Guía Completa del Sistema Académico

## 📚 Estructura del Sistema

El sistema está diseñado para funcionar como una institución educativa real, con relaciones claras y validaciones en cada paso.

### Flujo de Trabajo Principal

```
1. CARRERAS
   └── 2. MATERIAS (asociadas a carrera, año y cuatrimestre)
       └── 3. CURSOS (dentro de cada carrera)
           ├── Asignar Materias
           ├── Gestionar Horarios (con aulas y docentes)
           └── Inscribir Alumnos
```

---

## 🎯 Cómo Cargar el Sistema (Paso a Paso)

### **PASO 1: Crear Carreras**

**Ubicación:** Menú → Carreras

**Qué hacer:**
1. Click en "Nueva Carrera"
2. Completar:
   - Nombre (ej: "Ingeniería en Sistemas")
   - Código (ej: "IS-001")
   - Duración en años (ej: 5)
   - Duración en cuatrimestres (ej: 10)
   - Estado: Activa

**⚠️ IMPORTANTE:** Sin carreras, no puedes crear materias ni cursos.

---

### **PASO 2: Crear Docentes**

**Ubicación:** Menú → Docentes

**Qué hacer:**
1. Click en "Nuevo Docente"
2. Completar datos personales
3. Asignar materias (opcional en este momento)

**⚠️ IMPORTANTE:** Los docentes se asignan a materias, no a cursos directamente.

---

### **PASO 3: Crear Aulas**

**Ubicación:** Menú → Aulas

**Qué hacer:**
1. Click en "Nueva Aula"
2. Completar:
   - Nombre (ej: "Aula 101")
   - Código (ej: "A101")
   - Capacidad
   - Tipo (aula, laboratorio, taller, etc.)
   - Estado: Disponible
   - Recursos disponibles

**⚠️ IMPORTANTE:** Las aulas son necesarias para cursos presenciales y horarios.

---

### **PASO 4: Crear Materias**

**Ubicación:** Menú → Materias

**Qué hacer:**
1. Click en "Nueva Materia"
2. **OBLIGATORIO completar:**
   - Nombre
   - Código
   - **Carrera** (debe seleccionar una carrera existente)
   - **Año** (1ro, 2do, 3ro, etc.)
   - **Cuatrimestre** (1 o 2)
   - **Profesor** (debe seleccionar un docente)
   - Tipo (obligatoria, optativa, electiva)
   - Horas semanales
   - Configuración (notas, asistencia, etc.)

3. **Opcional:**
   - Correlatividades (materias que deben aprobarse antes)
   - Descripción

**⚠️ VALIDACIONES:**
- ❌ No puedes crear materia sin carrera
- ❌ No puedes crear materia sin profesor
- ❌ El año debe ser válido según la duración de la carrera

**✅ Después de crear:** La materia queda disponible para asignarse a cursos.

---

### **PASO 5: Crear Cursos (dentro de Carreras)**

**Ubicación:** Menú → Carreras → Click en "Ver Cursos" de una carrera

**Qué hacer:**
1. Seleccionar una carrera
2. Click en "Ver Cursos"
3. Click en "Nuevo Curso"
4. Completar:
   - Nombre (ej: "Primero A")
   - Código (ej: "1A")
   - **Año** (debe coincidir con las materias que se asignarán)
   - División (A, B, C, etc.)
   - Turno (mañana, tarde, vespertino)
   - Cuatrimestre (1 o 2)
   - Capacidad (máximo de alumnos)
   - Modalidad (presencial, virtual, mixta)
   - **Aula** (obligatorio si es presencial/mixta)

**⚠️ VALIDACIONES:**
- ❌ No puedes crear curso sin carrera
- ❌ El año no puede exceder la duración de la carrera
- ❌ Si es presencial, debe tener aula asignada
- ❌ La capacidad del aula debe ser suficiente

**✅ Después de crear:** El curso queda listo para asignar materias.

---

### **PASO 6: Asignar Materias al Curso**

**Ubicación:** Dentro de "Ver Cursos" → Click en "Asignar Materias"

**Qué hacer:**
1. Seleccionar un curso
2. Click en "Asignar Materias"
3. Verás solo las materias que:
   - Pertenecen a la misma carrera
   - Son del mismo año del curso
   - Son del mismo cuatrimestre
4. Click en cada materia para seleccionarla/deseleccionarla

**⚠️ VALIDACIONES:**
- ❌ No puedes asignar materias si el curso no tiene aula (si es presencial)
- ❌ Solo aparecen materias compatibles con el curso

**✅ Después de asignar:** Las materias quedan disponibles para configurar horarios.

---

### **PASO 7: Gestionar Horarios del Curso**

**Ubicación:** Dentro de "Ver Cursos" → Click en "Horarios"

**Qué hacer:**
1. Seleccionar un curso
2. Click en "Horarios"
3. Para cada materia del curso:
   - Seleccionar día de la semana
   - Hora inicio y fin
   - Materia (de las asignadas al curso)
   - Docente (debe ser el profesor de esa materia)
   - Aula (verifica disponibilidad automáticamente)
4. Click en "Agregar Horario"
5. Repetir para todas las materias
6. Click en "Guardar Horarios"

**⚠️ VALIDACIONES AUTOMÁTICAS:**
- ❌ No permite choque de horarios en el mismo aula
- ❌ No permite que un docente tenga dos clases al mismo tiempo
- ❌ Verifica que el aula esté disponible
- ❌ Verifica que el docente sea el asignado a la materia

**✅ Después de guardar:** Los horarios quedan configurados y el aula queda reservada.

---

### **PASO 8: Inscribir Alumnos al Curso**

**Ubicación:** Dentro de "Ver Cursos" → Click en "Inscribir Alumnos"

**Qué hacer:**
1. Seleccionar un curso
2. Click en "Inscribir Alumnos"
3. Verás solo alumnos que:
   - Pertenecen a la misma carrera
   - No están inscritos en otro curso del mismo año
4. Click en "Inscribir" para cada alumno

**⚠️ VALIDACIONES:**
- ❌ No puedes inscribir alumnos si el curso no tiene materias asignadas
- ❌ No puedes inscribir si el curso está completo (va a lista de espera)
- ❌ Un alumno no puede estar en dos cursos del mismo año

**✅ Automático al inscribir:**
- El alumno se inscribe automáticamente en TODAS las materias del curso
- Se actualiza el cupo del curso
- Se actualiza el curso del alumno

---

## 🔗 Relaciones y Dependencias

### **Jerarquía de Dependencias:**

```
CARRERA (obligatorio primero)
  ├── MATERIAS (necesitan carrera)
  │   └── Requieren: Docente asignado
  │
  └── CURSOS (necesitan carrera)
      ├── Requieren: Aula (si es presencial)
      ├── Requieren: Materias asignadas (para inscribir alumnos)
      └── Requieren: Horarios configurados (para funcionar)
          └── Requieren: Aulas disponibles
              └── Requieren: Docentes disponibles
```

### **Flujo de Validaciones:**

1. **Crear Materia:**
   - ✅ Carrera existe
   - ✅ Docente existe
   - ✅ Año válido para la carrera

2. **Crear Curso:**
   - ✅ Carrera existe
   - ✅ Año válido (≤ duración carrera)
   - ✅ Aula disponible (si presencial)

3. **Asignar Materias:**
   - ✅ Curso tiene aula (si presencial)
   - ✅ Materias compatibles (carrera, año, cuatrimestre)

4. **Gestionar Horarios:**
   - ✅ Curso tiene materias
   - ✅ Aula disponible (sin choques)
   - ✅ Docente disponible (sin choques)
   - ✅ Docente es el asignado a la materia

5. **Inscribir Alumnos:**
   - ✅ Curso tiene materias
   - ✅ Curso tiene cupo disponible
   - ✅ Alumno no está en otro curso del mismo año

---

## 👥 Perspectivas de Usuario

### **👨‍💼 ADMINISTRATIVO / SECRETARIO**

**Puede hacer:**
- ✅ Crear y gestionar carreras
- ✅ Crear y gestionar materias
- ✅ Crear y gestionar cursos
- ✅ Asignar materias a cursos
- ✅ Configurar horarios
- ✅ Inscribir alumnos
- ✅ Gestionar aulas
- ✅ Gestionar docentes
- ✅ Ver todo el sistema

**Flujo típico:**
1. Crear carrera
2. Crear materias para esa carrera
3. Crear cursos
4. Asignar materias a cursos
5. Configurar horarios
6. Inscribir alumnos

---

### **👨‍🏫 PROFESOR**

**Puede hacer:**
- ✅ Ver sus materias asignadas
- ✅ Ver cursos donde se dictan sus materias
- ✅ Ver alumnos de sus materias
- ✅ Cargar asistencias (solo sus materias)
- ✅ Cargar notas (solo sus materias)
- ✅ Ver horarios de sus clases

**No puede:**
- ❌ Crear materias
- ❌ Crear cursos
- ❌ Inscribir alumnos
- ❌ Modificar horarios (a menos que tenga permiso)

---

### **👨‍🎓 ALUMNO**

**Puede hacer:**
- ✅ Ver sus materias (las del curso donde está inscrito)
- ✅ Ver sus asistencias
- ✅ Ver sus notas
- ✅ Ver su horario
- ✅ Enviar solicitudes (justificativos, etc.)

**No puede:**
- ❌ Ver otros alumnos
- ❌ Modificar nada
- ❌ Ver materias de otros cursos

---

## 🎯 Validaciones Implementadas

### **Validaciones de Integridad:**

1. **Carrera:**
   - ✅ No se puede eliminar si tiene cursos activos
   - ✅ No se puede eliminar si tiene materias

2. **Materia:**
   - ✅ Debe tener carrera
   - ✅ Debe tener profesor
   - ✅ Año válido según carrera

3. **Curso:**
   - ✅ Debe tener carrera
   - ✅ Año válido
   - ✅ Aula si es presencial
   - ✅ No se puede inscribir sin materias

4. **Horarios:**
   - ✅ Sin choques de aula
   - ✅ Sin choques de docente
   - ✅ Docente correcto para la materia

5. **Inscripciones:**
   - ✅ Alumno en una sola carrera
   - ✅ Alumno en un solo curso por año
   - ✅ Cupo disponible

---

## 📋 Checklist de Configuración Inicial

Para que el sistema funcione completamente, sigue este orden:

- [ ] 1. Crear al menos 1 Carrera
- [ ] 2. Crear al menos 1 Docente
- [ ] 3. Crear al menos 1 Aula
- [ ] 4. Crear Materias (asociadas a la carrera)
- [ ] 5. Crear Cursos (dentro de la carrera)
- [ ] 6. Asignar Materias a los Cursos
- [ ] 7. Configurar Horarios de los Cursos
- [ ] 8. Crear Alumnos (asociados a la carrera)
- [ ] 9. Inscribir Alumnos a los Cursos

**✅ Una vez completado esto, el sistema está listo para usar.**

---

## 🚨 Mensajes de Error Comunes

### "No hay materias disponibles para este año"
**Solución:** Crea materias para ese año y cuatrimestre desde la sección Materias.

### "Este curso no tiene materias asignadas"
**Solución:** Asigna materias al curso antes de inscribir alumnos.

### "El aula ya está ocupada en este horario"
**Solución:** Selecciona otro horario o otra aula disponible.

### "El docente ya tiene una clase en este horario"
**Solución:** Selecciona otro horario o asigna otro docente a la materia.

### "No hay alumnos disponibles para inscribir"
**Solución:** Crea alumnos desde la sección Alumnos, asegurándote de asignarles la carrera correcta.

---

## 💡 Consejos Profesionales

1. **Planifica antes de crear:**
   - Define todas las carreras primero
   - Define todas las materias por año y cuatrimestre
   - Luego crea los cursos

2. **Usa códigos consistentes:**
   - Carreras: "IS-001", "ADM-001"
   - Materias: "MAT-101", "LEN-101"
   - Cursos: "1A", "2B"

3. **Verifica horarios:**
   - El sistema previene choques automáticamente
   - Revisa que los horarios sean lógicos

4. **Gestiona cupos:**
   - Asigna aulas con capacidad suficiente
   - Controla las inscripciones

---

## 🔄 Flujo Completo de Ejemplo

**Escenario:** Crear el curso "Primero A" de "Ingeniería en Sistemas"

1. ✅ Crear Carrera "Ingeniería en Sistemas" (5 años)
2. ✅ Crear Docente "Prof. García"
3. ✅ Crear Aula "Aula 101" (capacidad 30)
4. ✅ Crear Materia "Matemáticas I" (Carrera: IS, Año: 1, Cuatrimestre: 1, Profesor: García)
5. ✅ Crear Materia "Programación I" (Carrera: IS, Año: 1, Cuatrimestre: 1, Profesor: García)
6. ✅ Ir a Carreras → Ver Cursos de "Ingeniería en Sistemas"
7. ✅ Crear Curso "Primero A" (Año: 1, División: A, Aula: Aula 101)
8. ✅ Asignar Materias: "Matemáticas I" y "Programación I"
9. ✅ Gestionar Horarios:
   - Lunes 8:00-10:00: Matemáticas I (Prof. García, Aula 101)
   - Miércoles 8:00-10:00: Programación I (Prof. García, Aula 101)
10. ✅ Crear Alumnos (asociados a carrera "Ingeniería en Sistemas")
11. ✅ Inscribir Alumnos al curso "Primero A"

**✅ Sistema completo y funcional!**

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que hayas seguido el orden correcto
2. Revisa los mensajes de validación
3. Asegúrate de que todas las dependencias estén creadas

**El sistema te guiará con mensajes claros en cada paso.**

