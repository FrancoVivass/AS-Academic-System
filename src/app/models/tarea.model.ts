export interface Tarea {
  id: string;
  materiaId: string;
  profesorId: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaEntrega: string;
  fechaLimite?: string; // Fecha límite para entregar (opcional)
  tipo: 'trabajo_practico' | 'examen' | 'proyecto' | 'tarea' | 'otro';
  estado: 'activa' | 'cerrada' | 'cancelada';
  puntos?: number; // Puntos totales de la tarea
  archivosAdjuntos?: string[]; // URLs o IDs de archivos adjuntos
  cursoId?: string; // Curso específico (opcional, si es null es para todos los cursos de la materia)
  visibleParaAlumnos: boolean;
}

export interface EntregaTarea {
  id: string;
  tareaId: string;
  alumnoId: string;
  fechaEntrega: string;
  archivosAdjuntos?: string[]; // URLs o IDs de archivos subidos por el alumno
  comentario?: string; // Comentario del alumno al entregar
  calificacion?: number; // Calificación del profesor
  observaciones?: string; // Observaciones del profesor
  estado: 'pendiente' | 'revisada' | 'calificada' | 'devuelta';
  fechaCalificacion?: string;
}






