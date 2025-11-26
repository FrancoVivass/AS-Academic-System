export interface Solicitud {
  id: string;
  tipo: 'inscripcion' | 'equivalencia' | 'cambio_carrera' | 'baja' | 'justificativo' | 'otro';
  solicitanteId: string;
  destinatarioId?: string;
  asunto: string;
  descripcion: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_revision';
  fechaSolicitud: string;
  fechaResolucion?: string;
  resueltaPor?: string;
  observaciones?: string;
  datosAdicionales?: any; // Para datos específicos según el tipo de solicitud
}

