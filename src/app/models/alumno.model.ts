export interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  curso: string;
  fechaNacimiento: string;
  direccion: string;
}

export interface Nota {
  id: string;
  alumnoId: string;
  materiaId: string;
  calificacion: number;
  fecha: string;
  tipo: 'parcial' | 'final' | 'trabajo' | 'practico';
  observaciones?: string;
}

export interface Asistencia {
  id: string;
  alumnoId: string;
  materiaId: string;
  fecha: string;
  presente: boolean;
  justificada?: boolean;
  observaciones?: string;
}

