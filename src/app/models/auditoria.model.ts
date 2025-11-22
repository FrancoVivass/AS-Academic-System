export interface Auditoria {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: string; // 'crear', 'editar', 'eliminar', 'aprobar', etc.
  entidad: string; // 'alumno', 'materia', 'curso', etc.
  entidadId: string;
  tablaAfectada: string;
  datosAntes?: any;
  datosDespues?: any;
  fecha: string;
  ip?: string;
  observaciones?: string;
}

export type AccionAuditoria = 
  | 'crear' 
  | 'editar' 
  | 'eliminar' 
  | 'aprobar' 
  | 'rechazar' 
  | 'asignar' 
  | 'desasignar' 
  | 'cambiar_estado'
  | 'importar'
  | 'exportar';

export type EntidadAuditoria = 
  | 'alumno' 
  | 'profesor' 
  | 'materia' 
  | 'curso' 
  | 'carrera' 
  | 'nota' 
  | 'asistencia' 
  | 'usuario' 
  | 'aula' 
  | 'horario';

