export interface Aula {
  id: string;
  nombre: string;
  codigo: string;
  capacidad: number;
  tipo: 'aula' | 'laboratorio' | 'taller' | 'sala' | 'auditorio';
  recursos: RecursoAula[];
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'fuera_servicio';
  edificio?: string;
  piso?: number;
  observaciones?: string;
}

export interface RecursoAula {
  tipo: 'proyector' | 'pizarra' | 'pc' | 'pantalla' | 'aire_acondicionado' | 'wifi' | 'otros';
  disponible: boolean;
  descripcion?: string;
}

export interface HorarioAula {
  id: string;
  aulaId: string;
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  horaInicio: string;
  horaFin: string;
  cursoId: string;
  materiaId: string;
  estado: 'reservado' | 'ocupado' | 'libre';
}

