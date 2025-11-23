import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Mensaje, Chat } from '../models/mensaje.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  private readonly STORAGE_KEY = 'gestion_academica_mensajes';
  private readonly CHATS_KEY = 'gestion_academica_chats';
  private useSupabase = true;
  private mensajesSubject = new BehaviorSubject<Mensaje[]>([]);
  public mensajes$ = this.mensajesSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadMensajes();
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

    const { data, error } = await this.supabase.client
      .from('mensajes')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
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
}
