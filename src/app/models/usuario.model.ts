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
  rol: 'admin' | 'profesor' | 'alumno' | 'secretario';
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
  verAlumnos: boolean;
  editarAlumnos: boolean;
  verMaterias: boolean;
  editarMaterias: boolean;
  verNotas: boolean;
  editarNotas: boolean;
  verAsistencias: boolean;
  editarAsistencias: boolean;
  verReportes: boolean;
  gestionarUsuarios: boolean;
}

