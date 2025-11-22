export interface Justificativo {
  id: string;
  alumnoId: string;
  asistenciaId?: string; // Si es para una asistencia específica
  fecha: string;
  tipo: 'medico' | 'viaje' | 'institucional' | 'personal' | 'otro';
  motivo: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaSolicitud: string;
  fechaAprobacion?: string;
  aprobadoPor?: string; // ID del secretario/admin
  comprobanteUrl?: string;
  observaciones?: string;
}

