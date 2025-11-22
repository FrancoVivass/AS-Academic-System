export interface Curso {
  id: string;
  carreraId: string; // Carrera a la que pertenece el curso
  nombre: string;
  codigo: string;
  año: number; // Año de la carrera (1ro, 2do, 3ro, etc.)
  division: string; // División del curso (A, B, C, etc.)
  turno: 'mañana' | 'tarde' | 'vespertino';
  capacidad: number;
  cupoMaximo?: number;
  cupoActual?: number;
  tutorId?: string; // Tutor/preceptor del curso
  horarios: HorarioCurso[];
  materias: string[]; // IDs de materias asignadas al curso
  alumnos: string[]; // IDs de alumnos inscritos
  listaEspera?: string[]; // IDs de alumnos en lista de espera
  estado: 'activo' | 'inactivo' | 'completo' | 'cancelado';
  modalidad?: 'presencial' | 'virtual' | 'mixta';
  aulaId?: string;
  configuracion?: ConfiguracionCurso;
  cuatrimestre?: number; // Cuatrimestre actual (1 o 2)
  fechaInicio?: string;
  fechaFin?: string;
  fechaCreacion?: string;
}

export interface ConfiguracionCurso {
  permiteAutoinscripcion: boolean;
  permiteEdicionHorariosProfesor: boolean;
  requiereAprobacionInscripcion: boolean;
  activaListaEspera: boolean;
}

export interface HorarioCurso {
  id: string;
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  horaInicio: string;
  horaFin: string;
  materiaId: string;
  docenteId: string;
  aula?: string;
}

