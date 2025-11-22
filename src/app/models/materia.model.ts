export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  profesor: string;
  curso: string;
  horario: string;
  creditos: number;
  horasSemanales?: number;
  carreraId?: string; // Nueva: asociación a carrera
  correlatividades?: string[]; // IDs de materias que son correlativas
  tipo?: 'obligatoria' | 'optativa' | 'electiva';
  configuracion?: ConfiguracionMateria;
  estado?: 'activa' | 'inactiva' | 'suspendida';
  fechaCreacion?: string;
  cuatrimestre?: number; // Para generación automática de cursos
  año?: number; // Año de la carrera
}

export interface ConfiguracionMateria {
  tieneNota: boolean;
  tieneAsistencia: boolean;
  requiereAprobacion: boolean; // Si requiere aprobación del coordinador
  notaMinimaAprobacion: number; // Default: 6
  porcentajeAsistenciaMinimo: number; // Default: 75
}

export interface AlumnoMateria {
  id: string;
  alumnoId: string;
  materiaId: string;
  fechaInscripcion: string;
}

