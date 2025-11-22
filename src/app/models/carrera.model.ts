export interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  duracionAnios: number;
  duracionCuatrimestres: number;
  coordinadorId?: string;
  estado: 'activa' | 'inactiva' | 'suspendida';
  fechaCreacion: string;
  materiasObligatorias: string[]; // IDs de materias
  materiasOptativas: string[]; // IDs de materias
  equivalencias: Equivalencia[];
  cursos?: string[]; // IDs de cursos de esta carrera
}

export interface Equivalencia {
  id: string;
  carreraOrigenId: string;
  carreraDestinoId: string;
  materiaOrigenId: string;
  materiaDestinoId: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
  fechaAprobacion?: string;
  aprobadaPor?: string; // ID del coordinador/admin
}

export interface PlanEstudio {
  id: string;
  carreraId: string;
  año: number;
  cuatrimestre: number;
  materias: string[]; // IDs de materias
  creditosRequeridos: number;
}

