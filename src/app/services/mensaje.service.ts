import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Mensaje, Chat } from '../models/mensaje.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';
import { DocenteService } from './docente.service';
import { AlumnoService } from './alumno.service';
import { MateriaService } from './materia.service';
import { CursoService } from './curso.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  private readonly STORAGE_KEY = 'gestion_academica_mensajes';
  private readonly CHATS_KEY = 'gestion_academica_chats';
  private readonly MESSAGES_RETENTION_DAYS = 15; // Mensajes se borran después de 15 días
  private useSupabase = true;
  private mensajesSubject = new BehaviorSubject<Mensaje[]>([]);
  public mensajes$ = this.mensajesSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService,
    private docenteService: DocenteService,
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private cursoService: CursoService,
    private authService: AuthService
  ) {
    this.loadMensajes();
    // Ejecutar limpieza automática al iniciar
    this.cleanupOldMessages();
    // Ejecutar limpieza cada hora
    setInterval(() => this.cleanupOldMessages(), 60 * 60 * 1000);
  }

  private async loadMensajes(): Promise<void> {
    if (this.useSupabase) {
      try {
        const mensajes = await this.getMensajesFromSupabase();
        this.mensajesSubject.next(mensajes);
      } catch (error) {
        const mensajes = this.getMensajesFromStorage();
        this.mensajesSubject.next(mensajes);
      }
    } else {
      const mensajes = this.getMensajesFromStorage();
      this.mensajesSubject.next(mensajes);
    }
  }

  private async getMensajesFromSupabase(): Promise<Mensaje[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    // Filtrar mensajes que no tengan más de 15 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - this.MESSAGES_RETENTION_DAYS);
    const fechaLimiteISO = fechaLimite.toISOString();

    const { data, error } = await this.supabase.client
      .from('mensajes')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .gte('created_at', fechaLimiteISO) // Solo mensajes creados después de la fecha límite
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      remitenteId: db.remitente_id,
      destinatarioId: db.destinatario_id,
      asunto: db.asunto,
      contenido: db.contenido,
      fecha: db.created_at || new Date().toISOString(),
      leido: db.leido || false,
      importante: db.prioridad === 'alta' || db.prioridad === 'urgente',
      fechaLeido: db.fecha_leido,
      tipo: db.tipo || 'mensaje',
      prioridad: db.prioridad || 'normal'
    }));
  }

  private getMensajesFromStorage(): Mensaje[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getMensajes(): Promise<Mensaje[]> {
    if (this.useSupabase) {
      try {
        return await this.getMensajesFromSupabase();
      } catch (error) {
        return this.getMensajesFromStorage();
      }
    }
    return this.getMensajesFromStorage();
  }

  async getMensajesByUsuario(usuarioId: string): Promise<Mensaje[]> {
    const mensajes = await this.getMensajes();
    return mensajes.filter(m => 
      m.remitenteId === usuarioId || m.destinatarioId === usuarioId
    );
  }

  async getMensajesNoLeidos(usuarioId: string): Promise<Mensaje[]> {
    const mensajes = await this.getMensajes();
    return mensajes.filter(m => 
      m.destinatarioId === usuarioId && !m.leido
    );
  }

  async addMensaje(mensaje: Mensaje): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('mensajes', {
          id: mensaje.id,
          remitente_id: mensaje.remitenteId,
          destinatario_id: mensaje.destinatarioId,
          asunto: mensaje.asunto,
          contenido: mensaje.contenido,
          leido: mensaje.leido || false,
          fecha_leido: mensaje.fechaLeido,
          tipo: mensaje.tipo || 'mensaje',
          prioridad: mensaje.prioridad || 'normal',
          institucion_id: currentInstitucion.id // Asignar institución actual
        });
        await this.loadMensajes();
      } catch (error) {
        console.error('Error agregando mensaje:', error);
        throw error;
      }
    } else {
      const mensajes = this.getMensajesFromStorage();
      mensajes.push(mensaje);
      this.saveMensajesToStorage(mensajes);
      this.mensajesSubject.next(mensajes);
    }
  }

  async marcarComoLeido(mensajeId: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('mensajes', mensajeId, {
          leido: true,
          fecha_leido: new Date().toISOString()
        });
        await this.loadMensajes();
      } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        throw error;
      }
    } else {
      const mensajes = this.getMensajesFromStorage();
      const mensaje = mensajes.find(m => m.id === mensajeId);
      if (mensaje) {
        mensaje.leido = true;
        this.saveMensajesToStorage(mensajes);
        this.mensajesSubject.next(mensajes);
      }
    }
  }

  private saveMensajesToStorage(mensajes: Mensaje[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mensajes));
  }

  // Chats (se mantiene en localStorage por ahora)
  getChats(usuarioId: string): Chat[] {
    const stored = localStorage.getItem(this.CHATS_KEY);
    const chats: Chat[] = stored ? JSON.parse(stored) : [];
    return chats.filter(c => c.participantes.includes(usuarioId));
  }

  crearChat(chat: Chat): void {
    const chats = this.getChats(chat.participantes[0]);
    chats.push(chat);
    localStorage.setItem(this.CHATS_KEY, JSON.stringify([...this.getAllChats(), chat]));
  }

  private getAllChats(): Chat[] {
    const stored = localStorage.getItem(this.CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Limpia mensajes antiguos (más de 15 días) de la base de datos
   */
  async cleanupOldMessages(): Promise<void> {
    if (!this.useSupabase) {
      // Limpiar localStorage
      const mensajes = this.getMensajesFromStorage();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - this.MESSAGES_RETENTION_DAYS);
      
      const mensajesFiltrados = mensajes.filter(m => {
        const fechaMensaje = new Date(m.fecha);
        return fechaMensaje >= fechaLimite;
      });
      
      if (mensajesFiltrados.length !== mensajes.length) {
        this.saveMensajesToStorage(mensajesFiltrados);
        this.mensajesSubject.next(mensajesFiltrados);
      }
      return;
    }

    try {
      const currentInstitucion = this.institucionService.getCurrentInstitucion();
      if (!currentInstitucion) return;

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - this.MESSAGES_RETENTION_DAYS);
      const fechaLimiteISO = fechaLimite.toISOString();

      // Eliminar mensajes antiguos
      const { error } = await this.supabase.client
        .from('mensajes')
        .delete()
        .eq('institucion_id', currentInstitucion.id)
        .lt('created_at', fechaLimiteISO);

      if (error) {
        console.error('Error limpiando mensajes antiguos:', error);
      } else {
        console.log('✅ Mensajes antiguos eliminados automáticamente');
        // Recargar mensajes después de la limpieza
        await this.loadMensajes();
      }
    } catch (error) {
      console.error('Error en cleanupOldMessages:', error);
    }
  }

  /**
   * Obtiene los alumnos que un profesor puede contactar (sus alumnos de sus materias)
   */
  async getAlumnosParaProfesor(profesorId: string): Promise<any[]> {
    try {
      // Obtener docente y sus materias asignadas
      const docente = await this.docenteService.getDocenteById(profesorId);
      const materiasAsignadas = docente?.materiasAsignadas || [];

      // Obtener todas las materias
      let todasLasMaterias = await this.materiaService.getMaterias();
      if (materiasAsignadas.length > 0) {
        todasLasMaterias = todasLasMaterias.filter(m => materiasAsignadas.includes(m.id));
      } else {
        // Fallback: buscar por nombre del profesor
        const usuario = this.authService.getCurrentUser();
        if (usuario) {
          const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
          todasLasMaterias = todasLasMaterias.filter(m => 
            m.profesor === nombreProfesor || m.profesor?.includes(usuario.nombre)
          );
        }
      }

      const materiasIdsProfesor = new Set(todasLasMaterias.map(m => m.id));

      // Obtener cursos donde el profesor tiene materias
      const todosLosCursos = await this.cursoService.getCursos();
      const cursosDelProfesor = todosLosCursos.filter(curso => 
        curso.materias.some(mId => materiasIdsProfesor.has(mId))
      );

      // Obtener IDs de alumnos de esos cursos
      const idsAlumnosCursos = new Set<string>();
      cursosDelProfesor.forEach(curso => {
        curso.alumnos.forEach(alumnoId => idsAlumnosCursos.add(alumnoId));
      });

      // Obtener todos los alumnos y filtrar
      const todosLosAlumnos = await this.alumnoService.getAlumnos();
      const alumnosDelProfesor = todosLosAlumnos.filter(a => {
        const estaEnCurso = idsAlumnosCursos.has(a.id);
        const tieneCursoId = a.cursoId && cursosDelProfesor.some(c => c.id === a.cursoId);
        const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => cursosDelProfesor.some(c => c.id === cId));
        return estaEnCurso || tieneCursoId || tieneCursoIds;
      });

      return alumnosDelProfesor;
    } catch (error) {
      console.error('Error obteniendo alumnos para profesor:', error);
      return [];
    }
  }

  /**
   * Verifica si un usuario es profesor
   */
  async esProfesor(usuarioId: string): Promise<boolean> {
    try {
      const usuario = this.authService.getCurrentUser();
      return usuario?.rol === 'profesor';
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si un usuario es alumno
   */
  async esAlumno(usuarioId: string): Promise<boolean> {
    try {
      const usuario = this.authService.getCurrentUser();
      return usuario?.rol === 'alumno';
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene mensajes recientes para mostrar en el dashboard
   */
  async getMensajesRecientes(usuarioId: string, limite: number = 5): Promise<Mensaje[]> {
    const mensajes = await this.getMensajesByUsuario(usuarioId);
    return mensajes
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
  }
}
