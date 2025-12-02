# Issues Corregidos

## Issues Completados ✅

### 1. Modo oscuro en credencial
- **Estado**: ✅ Corregido
- **Cambios**: Agregado soporte de modo oscuro en `.credencial-card` y `.credencial-header`

### 2. Modo oscuro en login
- **Estado**: ✅ Corregido
- **Cambios**: Agregado soporte de modo oscuro en `.login-right-panel`, `.welcome-title` y `.welcome-subtitle`

### 3. Color de pestaña redes sociales
- **Estado**: ✅ Corregido
- **Cambios**: Cambiado color de fondo del widget de redes sociales a `#2b7bcc` (azul primario)

### 4. Eliminar tiempo en registro
- **Estado**: ✅ Corregido
- **Cambios**: Ocultados los widgets flotantes (modo oscuro, WhatsApp, scroll to top) en la página de registro para que no tapen los campos

### 5. Botón "olvidé mi contraseña"
- **Estado**: ✅ Corregido
- **Cambios**: Agregado método `onForgotPassword()` que muestra un mensaje informativo en lugar de redirigir a inicio

### 6. Búsqueda de alumnos no funciona
- **Estado**: ✅ Corregido
- **Cambios**: Removido el atributo `[disabled]` del campo de búsqueda que impedía buscar cuando es profesor sin carrera seleccionada

### 7. Filtro por materia no funciona en reportes
- **Estado**: ✅ Corregido
- **Cambios**: Agregado `loadMateriasFiltradas()` en `onFiltroChange()` para recargar las materias cuando cambia el filtro de carrera

### 8. Formato de fechas en calendario
- **Estado**: ✅ Corregido
- **Cambios**: Separado fecha y hora, agregado "Hs." al final en `calendario.component.html`.

### 9. Eventos no marcados en calendario
- **Estado**: ✅ Corregido
- **Cambios**: Corregida la lógica de carga y filtrado de eventos en `calendario.component.ts` para asegurar que todos los eventos se muestren correctamente en el calendario mensual y en la lista de próximos eventos.

### 10. Eventos borrados en calendario
- **Estado**: ✅ Corregido
- **Cambios**: Se aseguró que el mapa `eventosPorFecha` se limpie y recargue correctamente después de eliminar un evento en `calendario.component.ts`.

### 11. Números de estadísticas en alumnos
- **Estado**: ✅ Corregido
- **Cambios**: Reducido el tamaño de fuente de los valores de las estadísticas en `shared-gestion-styles.css` de `1.875rem` a `1.5rem` para una mejor visualización.

### 12. Espaciado entre opciones en filtros de alumnos
- **Estado**: ✅ Corregido
- **Cambios**: Ajustado el espaciado de los campos de filtro en `alumnos.component.css` para mejorar la alineación y la estética.

### 13. Estadísticas de materia en alumnos
- **Estado**: ✅ Corregido
- **Cambios**: Agregados estilos específicos para las cards de estadísticas por materia en `alumnos.component.css`.

### 14. Abrir mensajes en mensajería
- **Estado**: ✅ Corregido
- **Cambios**: Implementada la funcionalidad para que al hacer clic en un mensaje en la bandeja de entrada, se muestre el detalle del mensaje en un panel lateral o modal, y se marque como leído.

### 15. Bandejas separadas en mensajería
- **Estado**: ✅ Corregido
- **Cambios**: Se refactorizó el componente `mensajes.component.html` y `mensajes.component.ts` para tener una vista de "Bandeja de Entrada" y una de "Nuevo Mensaje" claramente separadas.

### 16. Campos en rojo en mensajería
- **Estado**: ✅ Corregido
- **Cambios**: Corregido el problema de que los campos del formulario de nuevo mensaje se quedaban en rojo después de enviar un mensaje. Se aseguró que el formulario se resetee correctamente después de un envío exitoso.

### 17. Modo oscuro más oscuro en configuración
- **Estado**: ✅ Corregido
- **Cambios**: Ajustado el color de fondo del modo oscuro en `styles.css` y `configuracion.component.css` a `#0a0a0a` para un contraste más profundo.

### 18. Centrar opciones en configuración
- **Estado**: ✅ Corregido
- **Cambios**: Se aplicó `max-width` y `margin: auto` al contenedor principal de las opciones de configuración en `configuracion.component.css` para centrar el contenido.

### 19. Iconos cortados en asistencias
- **Estado**: ✅ Corregido
- **Cambios**: Se ajustaron los estilos en `asistencia.component.css` para asegurar que los iconos dentro de los elementos de la lista de asistencia no se corten.

### 20. Botón marcar todos en asistencias
- **Estado**: ✅ Corregido
- **Cambios**: Se agregaron botones "Marcar todos presentes" y "Marcar todos ausentes" en `asistencia.component.html` y se implementó la lógica correspondiente en `asistencia.component.ts`.

### 21. Número de clase en asistencias
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó un método `getNumeroClase()` en `asistencia.component.ts` y se mostró en `asistencia.component.html` para indicar el número de clase del día.

### 22. Cards clickeables en dashboard administrativo
- **Estado**: ✅ Corregido
- **Cambios**: Se hizo que las tarjetas de resumen (Alumnos, Profesores, Materias, Asistencias) en el dashboard administrativo fueran clickeables y redirigieran a la sección correspondiente.

### 23. Atajos rápidos en dashboard administrativo
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó el texto "Reportes y Estadísticas" debajo del icono correspondiente en la sección de atajos rápidos del dashboard administrativo.

### 24. Campo localidad en crear alumno
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó un campo "Localidad" al formulario de creación/edición de alumnos en `alumnos.component.html` y se incluyó en el `FormGroup` en `alumnos.component.ts`.

### 25. Numeración de pasos en gestión de materias
- **Estado**: ✅ Corregido
- **Cambios**: Se corrigió la numeración de los pasos en el wizard de creación de materias en `materias.component.html`, cambiando "Paso 4: Configuración Final" a "Paso 3: Configuración Final".

### 26. Botón asistencia al cliente en ayuda
- **Estado**: ✅ Corregido
- **Cambios**: Se modificó la función `irAContacto()` en `ayuda.component.ts` para que el botón "Asistencia al Cliente" navegue a la sección de contacto de la landing page en lugar de cerrar la sesión.

### 27. En "mis materias" cuando toco la opcion " todos los cursos" en vez de aparecerme el curso "Marica" me aparece una opcion en blanco
- **Estado**: ✅ Corregido
- **Cambios**: Se ajustó la lógica en `materias.component.ts` para que el filtro "Todos los cursos" muestre correctamente todas las materias sin filtrar por un curso específico, y se aseguró que los nombres de los cursos se muestren correctamente.

### 28. En "Gestion de notas" a la hora de editar la nota debería guardarse la opción "Seleccione una carrera"
- **Estado**: ✅ Corregido
- **Cambios**: Se modificó `notas.component.ts` para que al editar una nota, el campo de selección de carrera en el modal se precargue con la carrera del alumno asociado a la nota, y se mantenga seleccionada.

### 29. En gestión de usuarios poder filtrar alumnos por carreras
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó un filtro por carrera en la pestaña de alumnos del componente `usuarios.component.html` y se implementó la lógica de filtrado en `usuarios.component.ts`.

### 30. En gestión de usuarios contraseñas con **** y el ojito para revelarla
- **Estado**: ✅ Corregido
- **Cambios**: Se implementó la visualización de contraseñas con `****` y un botón de "ojo" para revelarlas en `usuarios.component.html` y se añadió la lógica para manejar esto en `usuarios.component.ts`.

### 31. Agregar globito de notificaciones en el header
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó un botón de notificaciones con badge en `encabezado.component.html` y se añadieron estilos para el botón en `encabezado.component.css`. El botón muestra un menú desplegable con notificaciones.

### 32. Corregir botón configuración y perfil
- **Estado**: ✅ Corregido
- **Cambios**: Se corrigió el `routerLink` del botón de configuración en el menú del usuario en `encabezado.component.html` y `layout.component.html` para que navegue correctamente a `/app/configuracion`.

### 33. Dashboard Profesor - Agregar mensajes a alumnos
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó una sección de "Mensajería" en el dashboard del profesor en `dashboard.component.html` con botones para ver mensajes y enviar nuevos mensajes, que redirigen a `/app/mensajes`.

### 34. Corregir 'Estados de mis curso' y 'mis materias' - mostrar alumnos
- **Estado**: ✅ Corregido
- **Cambios**: Se corrigió el método `getCantidadInscritos()` en `materias.component.ts` para que busque alumnos en los cursos que tienen la materia, en lugar de buscar inscripciones directas. Esto asegura que los alumnos se muestren correctamente en "mis materias" y en el dashboard del profesor.

### 35. Agregar RouterModule a materias para que funcionen los routerLink
- **Estado**: ✅ Corregido
- **Cambios**: Se agregó `RouterModule` a los imports de `materias.component.ts` para que los botones de navegación (Ver Curso, Ver Alumnos, Mensajes) funcionen correctamente.

## Issues Pendientes

### Funcionalidades Nuevas (Media/Baja Prioridad)
- [ ] Mejorar "mis materias" con más funcionalidades y atajos (issue #13)
- [ ] Sistema de tareas para profesores y alumnos (issue #18)
- [ ] Mensajería de soporte en ayuda (issue #21)
