import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Auditoria, AccionAuditoria, EntidadAuditoria } from '../models/auditoria.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly STORAGE_KEY = 'gestion_academica_auditoria';
  private useSupabase = true;
  private auditoriaSubject = new BehaviorSubject<Auditoria[]>([]);
  public auditoria$ = this.auditoriaSubject.asObservable();

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadAuditoria();
  }

  private async loadAuditoria(): Promise<void> {
    if (this.useSupabase) {
      try {
        const auditoria = await this.getAuditoriaFromSupabase();
        this.auditoriaSubject.next(auditoria);
      } catch (error) {
        const auditoria = this.getAuditoriaFromStorage();
        this.auditoriaSubject.next(auditoria);
      }
    } else {
      const auditoria = this.getAuditoriaFromStorage();
      this.auditoriaSubject.next(auditoria);
    }
  }

  private async getAuditoriaFromSupabase(): Promise<Auditoria[]> {
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('auditoria')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .order('fecha', { ascending: false })
      .limit(1000);

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      usuarioId: db.usuario_id,
      usuarioNombre: db.usuario_nombre,
      accion: db.accion,
      entidad: db.entidad,
      entidadId: db.entidad_id,
      tablaAfectada: db.tabla_afectada,
      datosAntes: db.datos_antes,
      datosDespues: db.datos_despues,
      fecha: db.fecha,
      ip: db.ip,
      observaciones: db.observaciones
    }));
  }

  private getAuditoriaFromStorage(): Auditoria[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getAuditoria(): Promise<Auditoria[]> {
    if (this.useSupabase) {
      try {
        return await this.getAuditoriaFromSupabase();
      } catch (error) {
        return this.getAuditoriaFromStorage();
      }
    }
    return this.getAuditoriaFromStorage();
  }

  async getAuditoriaByUsuario(usuarioId: string): Promise<Auditoria[]> {
    const auditoria = await this.getAuditoria();
    return auditoria.filter(a => a.usuarioId === usuarioId);
  }

  async getAuditoriaByEntidad(entidad: EntidadAuditoria, entidadId: string): Promise<Auditoria[]> {
    const auditoria = await this.getAuditoria();
    return auditoria.filter(
      a => a.entidad === entidad && a.entidadId === entidadId
    );
  }

  async registrarAccion(
    accion: AccionAuditoria,
    entidad: EntidadAuditoria,
    entidadId: string,
    tablaAfectada: string,
    datosAntes?: any,
    datosDespues?: any,
    observaciones?: string
  ): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    const registro: Auditoria = {
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
      accion,
      entidad,
      entidadId,
      tablaAfectada,
      datosAntes,
      datosDespues,
      fecha: new Date().toISOString(),
      observaciones
    };

    if (this.useSupabase) {
      try {
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          // Fallback a localStorage si no hay institución
          this.registrarAccionEnStorage(registro);
          return;
        }

        await this.supabase.create('auditoria', {
          id: registro.id,
          usuario_id: registro.usuarioId,
          usuario_nombre: registro.usuarioNombre,
          accion: registro.accion,
          entidad: registro.entidad,
          entidad_id: registro.entidadId,
          tabla_afectada: registro.tablaAfectada,
          datos_antes: registro.datosAntes || null,
          datos_despues: registro.datosDespues || null,
          fecha: registro.fecha,
          ip: registro.ip || null,
          observaciones: registro.observaciones || null,
          institucion_id: currentInstitucion.id
        });

        await this.loadAuditoria();
      } catch (error) {
        console.error('Error registrando acción en auditoría:', error);
        // Fallback a localStorage
        this.registrarAccionEnStorage(registro);
      }
    } else {
      this.registrarAccionEnStorage(registro);
    }
  }

  private registrarAccionEnStorage(registro: Auditoria): void {
    const auditoria = this.getAuditoriaFromStorage();
    auditoria.push(registro);
    
    // Mantener solo los últimos 1000 registros
    if (auditoria.length > 1000) {
      auditoria.shift();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(auditoria));
    this.auditoriaSubject.next(auditoria);
  }

  async getAuditoriaReciente(limite: number = 50): Promise<Auditoria[]> {
    const auditoria = await this.getAuditoria();
    return auditoria
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
  }
}

