import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Solicitud } from '../models/solicitud.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private useSupabase = true;
  private solicitudesSubject = new BehaviorSubject<Solicitud[]>([]);
  public solicitudes$ = this.solicitudesSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService,
    private authService: AuthService
  ) {
    this.loadSolicitudes();
  }

  private async loadSolicitudes(): Promise<void> {
    if (this.useSupabase) {
      try {
        const solicitudes = await this.getSolicitudesFromSupabase();
        this.solicitudesSubject.next(solicitudes);
      } catch (error) {
        console.error('Error cargando solicitudes:', error);
        this.solicitudesSubject.next([]);
      }
    }
  }

  private async getSolicitudesFromSupabase(): Promise<Solicitud[]> {
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('solicitudes')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .order('fecha_solicitud', { ascending: false });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      tipo: db.tipo,
      solicitanteId: db.solicitante_id,
      destinatarioId: db.destinatario_id,
      asunto: db.asunto,
      descripcion: db.descripcion,
      estado: db.estado || 'pendiente',
      fechaSolicitud: db.fecha_solicitud,
      fechaResolucion: db.fecha_resolucion,
      resueltaPor: db.resuelta_por,
      observaciones: db.observaciones,
      datosAdicionales: db.datos_adicionales
    }));
  }

  async getSolicitudes(): Promise<Solicitud[]> {
    if (this.useSupabase) {
      try {
        return await this.getSolicitudesFromSupabase();
      } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        return [];
      }
    }
    return [];
  }

  async getSolicitudById(id: string): Promise<Solicitud | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('solicitudes')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          tipo: data.tipo,
          solicitanteId: data.solicitante_id,
          destinatarioId: data.destinatario_id,
          asunto: data.asunto,
          descripcion: data.descripcion,
          estado: data.estado || 'pendiente',
          fechaSolicitud: data.fecha_solicitud,
          fechaResolucion: data.fecha_resolucion,
          resueltaPor: data.resuelta_por,
          observaciones: data.observaciones,
          datosAdicionales: data.datos_adicionales
        };
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  }

  async getSolicitudesByEstado(estado: Solicitud['estado']): Promise<Solicitud[]> {
    const solicitudes = await this.getSolicitudes();
    return solicitudes.filter(s => s.estado === estado);
  }

  async getSolicitudesBySolicitante(solicitanteId: string): Promise<Solicitud[]> {
    const solicitudes = await this.getSolicitudes();
    return solicitudes.filter(s => s.solicitanteId === solicitanteId);
  }

  async crearSolicitud(solicitud: Omit<Solicitud, 'id' | 'fechaSolicitud' | 'estado'>): Promise<Solicitud> {
    const nuevaSolicitud: Solicitud = {
      ...solicitud,
      id: crypto.randomUUID(),
      fechaSolicitud: new Date().toISOString(),
      estado: 'pendiente'
    };

    if (this.useSupabase) {
      try {
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('solicitudes', {
          id: nuevaSolicitud.id,
          tipo: nuevaSolicitud.tipo,
          solicitante_id: nuevaSolicitud.solicitanteId,
          destinatario_id: nuevaSolicitud.destinatarioId || null,
          asunto: nuevaSolicitud.asunto,
          descripcion: nuevaSolicitud.descripcion,
          estado: 'pendiente',
          fecha_solicitud: nuevaSolicitud.fechaSolicitud,
          observaciones: nuevaSolicitud.observaciones || null,
          datos_adicionales: nuevaSolicitud.datosAdicionales || null,
          institucion_id: currentInstitucion.id
        });

        await this.loadSolicitudes();
      } catch (error) {
        console.error('Error creando solicitud:', error);
        throw error;
      }
    }

    return nuevaSolicitud;
  }

  async aprobarSolicitud(id: string, observaciones?: string): Promise<void> {
    if (this.useSupabase) {
      try {
        const usuario = this.authService.getCurrentUser();
        if (!usuario) {
          throw new Error('Debe estar autenticado para aprobar solicitudes');
        }

        await this.supabase.update('solicitudes', id, {
          estado: 'aprobada',
          resuelta_por: usuario.id,
          fecha_resolucion: new Date().toISOString(),
          observaciones: observaciones || null
        });

        await this.loadSolicitudes();
      } catch (error) {
        console.error('Error aprobando solicitud:', error);
        throw error;
      }
    }
  }

  async rechazarSolicitud(id: string, observaciones?: string): Promise<void> {
    if (this.useSupabase) {
      try {
        const usuario = this.authService.getCurrentUser();
        if (!usuario) {
          throw new Error('Debe estar autenticado para rechazar solicitudes');
        }

        await this.supabase.update('solicitudes', id, {
          estado: 'rechazada',
          resuelta_por: usuario.id,
          fecha_resolucion: new Date().toISOString(),
          observaciones: observaciones || null
        });

        await this.loadSolicitudes();
      } catch (error) {
        console.error('Error rechazando solicitud:', error);
        throw error;
      }
    }
  }

  async deleteSolicitud(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('solicitudes', id);
        await this.loadSolicitudes();
      } catch (error) {
        console.error('Error eliminando solicitud:', error);
        throw error;
      }
    }
  }
}

