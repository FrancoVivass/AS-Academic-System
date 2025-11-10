export interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  año: number;
  division: string;
  turno: 'mañana' | 'tarde' | 'vespertino';
  capacidad: number;
  tutorId?: string;
  horarios: HorarioCurso[];
  materias: string[];
  alumnos: string[];
  estado: 'activo' | 'inactivo' | 'completo';
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

