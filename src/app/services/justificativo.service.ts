import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Justificativo } from '../models/justificativo.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class JustificativoService {
  private readonly STORAGE_KEY = 'gestion_academica_justificativos';
  private useSupabase = true;
  private justificativosSubject = new BehaviorSubject<Justificativo[]>([]);
  public justificativos$ = this.justificativosSubject.asObservable();

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService
  ) {
    this.loadJustificativos();
  }

  private async loadJustificativos(): Promise<void> {
    if (this.useSupabase) {
      try {
        const justificativos = await this.getJustificativosFromSupabase();
        this.justificativosSubject.next(justificativos);
      } catch (error) {
        const justificativos = this.getJustificativosFromStorage();
        this.justificativosSubject.next(justificativos);
      }
    } else {
      const justificativos = this.getJustificativosFromStorage();
      this.justificativosSubject.next(justificativos);
    }
  }

  private async getJustificativosFromSupabase(): Promise<Justificativo[]> {
    const { data, error } = await this.supabase.client
      .from('justificativos')
      .select('*')
      .order('fecha_inicio', { ascending: false });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      alumnoId: db.alumno_id,
      tipo: db.tipo,
      fecha: db.fecha_inicio || db.created_at, // Para compatibilidad
      fechaInicio: db.fecha_inicio,
      fechaFin: db.fecha_fin,
      motivo: db.motivo,
      documento: db.documento,
      estado: db.estado || 'pendiente',
      aprobadoPor: db.aprobado_por,
      fechaAprobacion: db.fecha_aprobacion,
      fechaSolicitud: db.created_at,
      observaciones: db.observaciones
    }));
  }

  private getJustificativosFromStorage(): Justificativo[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getJustificativos(): Promise<Justificativo[]> {
    if (this.useSupabase) {
      try {
        return await this.getJustificativosFromSupabase();
      } catch (error) {
        return this.getJustificativosFromStorage();
      }
    }
    return this.getJustificativosFromStorage();
  }

  async getJustificativoById(id: string): Promise<Justificativo | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('justificativos')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          alumnoId: data.alumno_id,
          tipo: data.tipo,
          fecha: data.fecha_inicio || data.created_at, // Para compatibilidad
          fechaInicio: data.fecha_inicio,
          fechaFin: data.fecha_fin,
          motivo: data.motivo,
          documento: data.documento,
          estado: data.estado || 'pendiente',
          aprobadoPor: data.aprobado_por,
          fechaAprobacion: data.fecha_aprobacion,
          fechaSolicitud: data.created_at,
          observaciones: data.observaciones
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getJustificativosFromStorage().find(j => j.id === id);
  }

  async getJustificativosByAlumno(alumnoId: string): Promise<Justificativo[]> {
    const justificativos = await this.getJustificativos();
    return justificativos.filter(j => j.alumnoId === alumnoId);
  }

  async getJustificativosPendientes(): Promise<Justificativo[]> {
    const justificativos = await this.getJustificativos();
    return justificativos.filter(j => j.estado === 'pendiente');
  }

  async crearJustificativo(justificativo: Omit<Justificativo, 'id' | 'fechaSolicitud' | 'estado'>): Promise<Justificativo> {
    const nuevoJustificativo: Justificativo = {
      ...justificativo,
      id: Date.now().toString(),
      fechaSolicitud: new Date().toISOString(),
      estado: 'pendiente'
    };

    if (this.useSupabase) {
      try {
        const usuario = this.authService.getCurrentUser();
        await this.supabase.create('justificativos', {
          id: nuevoJustificativo.id,
          alumno_id: nuevoJustificativo.alumnoId,
          tipo: nuevoJustificativo.tipo,
          fecha_inicio: nuevoJustificativo.fechaInicio,
          fecha_fin: nuevoJustificativo.fechaFin,
          motivo: nuevoJustificativo.motivo,
          documento: nuevoJustificativo.documento,
          estado: 'pendiente',
          creado_por: usuario?.id || nuevoJustificativo.alumnoId
        });
        await this.loadJustificativos();
      } catch (error) {
        console.error('Error creando justificativo:', error);
        throw error;
      }
    } else {
      const justificativos = this.getJustificativosFromStorage();
      justificativos.push(nuevoJustificativo);
      this.saveJustificativosToStorage(justificativos);
      this.justificativosSubject.next(justificativos);
    }

    return nuevoJustificativo;
  }

  async aprobarJustificativo(id: string): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    if (this.useSupabase) {
      try {
        await this.supabase.update('justificativos', id, {
          estado: 'aprobado',
          aprobado_por: usuario.id,
          fecha_aprobacion: new Date().toISOString()
        });
        await this.loadJustificativos();
      } catch (error) {
        console.error('Error aprobando justificativo:', error);
        throw error;
      }
    } else {
      const justificativos = this.getJustificativosFromStorage();
      const justificativo = justificativos.find(j => j.id === id);
      if (justificativo) {
        justificativo.estado = 'aprobado';
        justificativo.aprobadoPor = usuario.id;
        justificativo.fechaAprobacion = new Date().toISOString();
        this.saveJustificativosToStorage(justificativos);
        this.justificativosSubject.next(justificativos);
      }
    }
  }

  async rechazarJustificativo(id: string, motivo?: string): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    if (this.useSupabase) {
      try {
        await this.supabase.update('justificativos', id, {
          estado: 'rechazado',
          aprobado_por: usuario.id,
          fecha_aprobacion: new Date().toISOString(),
          observaciones: motivo
        });
        await this.loadJustificativos();
      } catch (error) {
        console.error('Error rechazando justificativo:', error);
        throw error;
      }
    } else {
      const justificativos = this.getJustificativosFromStorage();
      const justificativo = justificativos.find(j => j.id === id);
      if (justificativo) {
        justificativo.estado = 'rechazado';
        justificativo.aprobadoPor = usuario.id;
        justificativo.fechaAprobacion = new Date().toISOString();
        if (motivo) {
          justificativo.observaciones = motivo;
        }
        this.saveJustificativosToStorage(justificativos);
        this.justificativosSubject.next(justificativos);
      }
    }
  }

  private saveJustificativosToStorage(justificativos: Justificativo[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(justificativos));
  }
}
