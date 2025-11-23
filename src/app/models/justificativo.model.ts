export interface Justificativo {
  id: string;
  alumnoId: string;
  asistenciaId?: string; // Si es para una asistencia específica
  fecha: string; // Fecha única (para compatibilidad)
  fechaInicio: string; // Fecha de inicio del justificativo
  fechaFin: string; // Fecha de fin del justificativo
  tipo: 'medico' | 'viaje' | 'institucional' | 'personal' | 'otro';
  motivo: string;
  documento?: string; // URL o texto del documento
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaSolicitud: string;
  fechaAprobacion?: string;
  aprobadoPor?: string; // ID del secretario/admin
  comprobanteUrl?: string;
  observaciones?: string;
}

