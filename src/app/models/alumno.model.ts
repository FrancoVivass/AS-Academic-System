export interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  curso: string;
  carreraId?: string; // Nueva: asociación a carrera
  fechaNacimiento: string;
  direccion: string;
  activo?: boolean;
  fechaRegistro?: string;
  estado?: 'regular' | 'irregular' | 'egresado' | 'expulsado' | 'suspendido' | 'libre';
  documentacion?: DocumentacionAlumno;
  historialEstados?: HistorialEstado[];
}

export interface DocumentacionAlumno {
  dniCompleto: boolean;
  analiticoCompleto: boolean;
  aptoMedicoCompleto: boolean;
  fotocopiaDni?: string; // URL del documento
  analitico?: string; // URL del documento
  aptoMedico?: string; // URL del documento
  fechaValidacion?: string;
  validadoPor?: string; // ID del secretario/admin
}

export interface HistorialEstado {
  estado: 'regular' | 'irregular' | 'egresado' | 'expulsado' | 'suspendido' | 'libre';
  fecha: string;
  motivo?: string;
  cambiadoPor?: string; // ID del usuario que hizo el cambio
}

export interface Nota {
  id: string;
  alumnoId: string;
  materiaId: string;
  cursoId?: string; // ID del curso (opcional)
  calificacion: number;
  fecha: string;
  tipo: 'parcial' | 'final' | 'trabajo' | 'practico' | 'recuperatorio';
  observaciones?: string;
  estado?: 'cargada' | 'aprobada' | 'rechazada' | 'pendiente_revision';
  aprobadaPor?: string; // ID del coordinador/admin que aprobó
  fechaAprobacion?: string;
  esRecuperatorio?: boolean;
  notaOriginalId?: string; // Si es recuperatorio, referencia a la nota original
  cargadaPor?: string; // ID del profesor/secretario que cargó la nota
}

export interface Asistencia {
  id: string;
  alumnoId: string;
  materiaId: string;
  cursoId?: string;
  horarioId?: string; // ID del horario específico (opcional, para materias con múltiples horarios)
  fecha: string; // YYYY-MM-DD
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado'; // Nuevo: estados más específicos
  presente: boolean; // Mantener para compatibilidad
  horaRegistro?: string; // HH:MM (para tardanzas)
  justificada?: boolean; // Deprecated: usar estado 'justificado'
  justificativoId?: string; // ID del justificativo asociado
  tipoJustificacion?: 'medico' | 'viaje' | 'institucional' | 'personal' | 'otro';
  observaciones?: string;
  cargadaPor?: string; // ID del profesor/secretario que cargó
  fechaCarga?: string;
  puedeEditar?: boolean; // Si puede ser editada
  editadaPor?: string; // ID de quien editó
  fechaEdicion?: string; // Timestamp de edición
}

export interface EstadisticasAsistencia {
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

