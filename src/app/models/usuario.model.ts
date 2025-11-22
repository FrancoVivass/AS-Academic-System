export interface Usuario {
  id: string;
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  dni?: string;
  fechaNacimiento?: string;
  direccion?: string;
  rol: 'admin' | 'profesor' | 'alumno' | 'secretario' | 'coordinador';
  avatar?: string;
  fechaRegistro: string;
  activo: boolean;
  ultimoAcceso?: string;
}

export interface Docente extends Usuario {
  especialidad?: string;
  materiasAsignadas?: string[];
  horarios?: string;
}

export interface Permisos {
  // Gestión de Alumnos
  verAlumnos: boolean;
  editarAlumnos: boolean;
  crearAlumnos: boolean;
  eliminarAlumnos: boolean;
  importarAlumnos: boolean;
  cambiarEstadoAlumnos: boolean;
  
  // Gestión de Materias
  verMaterias: boolean;
  editarMaterias: boolean;
  crearMaterias: boolean;
  eliminarMaterias: boolean;
  gestionarCorrelatividades: boolean;
  configurarMaterias: boolean;
  
  // Gestión de Cursos
  verCursos: boolean;
  editarCursos: boolean;
  crearCursos: boolean;
  eliminarCursos: boolean;
  asignarProfesores: boolean;
  gestionarInscripciones: boolean;
  gestionarListaEspera: boolean;
  configurarAutoinscripcion: boolean;
  
  // Gestión de Carreras
  verCarreras: boolean;
  editarCarreras: boolean;
  crearCarreras: boolean;
  eliminarCarreras: boolean;
  importarPlanesEstudio: boolean;
  gestionarEquivalencias: boolean;
  
  // Gestión de Notas
  verNotas: boolean;
  editarNotas: boolean;
  crearNotas: boolean;
  eliminarNotas: boolean;
  gestionarRecuperatorios: boolean;
  aprobarNotasFinales: boolean;
  forzarCambioNota: boolean;
  generarActas: boolean;
  
  // Gestión de Asistencias
  verAsistencias: boolean;
  editarAsistencias: boolean;
  crearAsistencias: boolean;
  eliminarAsistencias: boolean;
  cargarAsistenciaRetroactiva: boolean;
  gestionarJustificativos: boolean;
  cambiarEstadoMasivo: boolean;
  
  // Gestión de Horarios y Aulas
  verHorarios: boolean;
  editarHorarios: boolean;
  crearHorarios: boolean;
  eliminarHorarios: boolean;
  gestionarAulas: boolean;
  verificarChoquesHorarios: boolean;
  
  // Gestión de Usuarios
  verUsuarios: boolean;
  editarUsuarios: boolean;
  crearUsuarios: boolean;
  eliminarUsuarios: boolean;
  gestionarUsuarios: boolean;
  verHistorialUsuarios: boolean;
  
  // Reportes y Análisis
  verReportes: boolean;
  exportarReportes: boolean;
  verEstadisticas: boolean;
  analizarRendimiento: boolean;
  verRendimientoPorMateria: boolean;
  verRendimientoPorProfesor: boolean;
  
  // Notificaciones
  enviarNotificaciones: boolean;
  gestionarAnuncios: boolean;
  crearTemplatesMensajes: boolean;
  
  // Auditoría
  verAuditoria: boolean;
  
  // Solicitudes
  verSolicitudes: boolean;
  aprobarSolicitudes: boolean;
  revisarSolicitudes: boolean;
  
  // Materiales
  verMateriales: boolean;
  subirMateriales: boolean;
  editarMateriales: boolean;
  eliminarMateriales: boolean;
  corregirTareas: boolean;
}

