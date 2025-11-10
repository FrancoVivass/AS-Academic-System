export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora?: string;
  tipo: 'examen' | 'reunion' | 'feriado' | 'evento' | 'entrega';
  materiaId?: string;
  cursoId?: string;
  creadorId: string;
  color?: string;
  recordatorio?: boolean;
}

export interface CalendarioAcademico {
  id: string;
  nombre: string;
  año: number;
  eventos: Evento[];
  inicioClases: string;
  finClases: string;
  recesoInvernal?: { inicio: string; fin: string };
  recesoVerano?: { inicio: string; fin: string };
}

