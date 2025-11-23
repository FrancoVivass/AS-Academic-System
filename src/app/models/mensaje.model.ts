export interface Mensaje {
  id: string;
  remitenteId: string;
  destinatarioId: string;
  asunto: string;
  contenido: string;
  fecha: string;
  leido: boolean;
  importante: boolean;
  fechaLeido?: string;
  tipo?: 'mensaje' | 'notificacion' | 'anuncio';
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
  adjuntos?: string[];
}

export interface Chat {
  id: string;
  participantes: string[];
  mensajes: Mensaje[];
  tipo: 'individual' | 'grupo' | 'materia';
  materiaId?: string;
  ultimoMensaje?: Mensaje;
}

