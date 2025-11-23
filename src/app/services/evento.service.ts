import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Evento, CalendarioAcademico } from '../models/evento.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private readonly STORAGE_KEY = 'gestion_academica_eventos';
  private readonly CALENDARIO_KEY = 'gestion_academica_calendario';
  private useSupabase = true;
  private eventosSubject = new BehaviorSubject<Evento[]>([]);
  public eventos$ = this.eventosSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadEventos();
  }

  private async loadEventos(): Promise<void> {
    if (this.useSupabase) {
      try {
        const eventos = await this.getEventosFromSupabase();
        this.eventosSubject.next(eventos);
      } catch (error) {
        const eventos = this.getEventosFromStorage();
        this.eventosSubject.next(eventos);
      }
    } else {
      const eventos = this.getEventosFromStorage();
      this.eventosSubject.next(eventos);
    }
  }

  private async getEventosFromSupabase(): Promise<Evento[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('eventos')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .order('fecha', { ascending: true });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      titulo: db.titulo,
      descripcion: db.descripcion,
      fecha: db.fecha,
      hora: db.hora,
      tipo: db.tipo,
      materiaId: db.materia_id,
      cursoId: db.curso_id,
      creadorId: db.creador_id,
      color: db.color,
      recordatorio: db.recordatorio || false
    }));
  }

  private getEventosFromStorage(): Evento[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getEventos(): Promise<Evento[]> {
    if (this.useSupabase) {
      try {
        return await this.getEventosFromSupabase();
      } catch (error) {
        return this.getEventosFromStorage();
      }
    }
    return this.getEventosFromStorage();
  }

  async getEventoById(id: string): Promise<Evento | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('eventos')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          titulo: data.titulo,
          descripcion: data.descripcion,
          fecha: data.fecha,
          hora: data.hora,
          tipo: data.tipo,
          materiaId: data.materia_id,
          cursoId: data.curso_id,
          creadorId: data.creador_id,
          color: data.color,
          recordatorio: data.recordatorio || false
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getEventosFromStorage().find(e => e.id === id);
  }

  async getEventosByFecha(fecha: string): Promise<Evento[]> {
    const eventos = await this.getEventos();
    return eventos.filter(e => e.fecha === fecha);
  }

  async getEventosByMateria(materiaId: string): Promise<Evento[]> {
    const eventos = await this.getEventos();
    return eventos.filter(e => e.materiaId === materiaId);
  }

  async getEventosProximos(dias: number = 7): Promise<Evento[]> {
    const hoy = new Date();
    const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);
    const eventos = await this.getEventos();
    return eventos.filter(e => {
      const fechaEvento = new Date(e.fecha);
      return fechaEvento >= hoy && fechaEvento <= limite;
    }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  async addEvento(evento: Evento): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('eventos', {
          id: evento.id,
          titulo: evento.titulo,
          descripcion: evento.descripcion,
          fecha: evento.fecha,
          hora: evento.hora,
          tipo: evento.tipo,
          materia_id: evento.materiaId,
          curso_id: evento.cursoId,
          creador_id: evento.creadorId,
          color: evento.color,
          recordatorio: evento.recordatorio || false,
          institucion_id: currentInstitucion.id // Asignar institución actual
        });
        await this.loadEventos();
      } catch (error) {
        console.error('Error agregando evento:', error);
        throw error;
      }
    } else {
      const eventos = this.getEventosFromStorage();
      eventos.push(evento);
      this.saveEventosToStorage(eventos);
      this.eventosSubject.next(eventos);
    }
  }

  async updateEvento(evento: Evento): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('eventos', evento.id, {
          titulo: evento.titulo,
          descripcion: evento.descripcion,
          fecha: evento.fecha,
          hora: evento.hora,
          tipo: evento.tipo,
          materia_id: evento.materiaId,
          curso_id: evento.cursoId,
          color: evento.color,
          recordatorio: evento.recordatorio
        });
        await this.loadEventos();
      } catch (error) {
        console.error('Error actualizando evento:', error);
        throw error;
      }
    } else {
      const eventos = this.getEventosFromStorage();
      const index = eventos.findIndex(e => e.id === evento.id);
      if (index !== -1) {
        eventos[index] = evento;
        this.saveEventosToStorage(eventos);
        this.eventosSubject.next(eventos);
      }
    }
  }

  async deleteEvento(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('eventos', id);
        await this.loadEventos();
      } catch (error) {
        console.error('Error eliminando evento:', error);
        throw error;
      }
    } else {
      const eventos = this.getEventosFromStorage().filter(e => e.id !== id);
      this.saveEventosToStorage(eventos);
      this.eventosSubject.next(eventos);
    }
  }

  private saveEventosToStorage(eventos: Evento[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventos));
  }

  // Calendario Académico
  async getCalendarioAcademico(): Promise<CalendarioAcademico | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('calendarios_academicos')
          .select('*')
          .order('año', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return null;

        return {
          id: data.id,
          nombre: data.nombre,
          año: data.año,
          eventos: [], // Se obtienen de eventos
          inicioClases: data.inicio_clases,
          finClases: data.fin_clases,
          recesoInvernal: data.receso_invernal_inicio ? {
            inicio: data.receso_invernal_inicio,
            fin: data.receso_invernal_fin
          } : undefined,
          recesoVerano: data.receso_verano_inicio ? {
            inicio: data.receso_verano_inicio,
            fin: data.receso_verano_fin
          } : undefined
        };
      } catch (error) {
        return this.getCalendarioFromStorage();
      }
    }
    return this.getCalendarioFromStorage();
  }

  private getCalendarioFromStorage(): CalendarioAcademico | null {
    const stored = localStorage.getItem(this.CALENDARIO_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  async saveCalendarioAcademico(calendario: CalendarioAcademico): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('calendarios_academicos', {
          id: calendario.id,
          nombre: calendario.nombre,
          año: calendario.año,
          inicio_clases: calendario.inicioClases,
          fin_clases: calendario.finClases,
          receso_invernal_inicio: calendario.recesoInvernal?.inicio,
          receso_invernal_fin: calendario.recesoInvernal?.fin,
          receso_verano_inicio: calendario.recesoVerano?.inicio,
          receso_verano_fin: calendario.recesoVerano?.fin,
          institucion_id: currentInstitucion.id // Asignar institución actual
        });
      } catch (error) {
        console.error('Error guardando calendario:', error);
        throw error;
      }
    } else {
      localStorage.setItem(this.CALENDARIO_KEY, JSON.stringify(calendario));
    }
  }
}
