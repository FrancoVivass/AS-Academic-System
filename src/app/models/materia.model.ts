export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  profesor: string;
  curso: string;
  horario: string;
  creditos: number;
}

export interface AlumnoMateria {
  id: string;
  alumnoId: string;
  materiaId: string;
  fechaInscripcion: string;
}

