import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Aula, HorarioAula } from '../models/aula.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class AulaService {
  private readonly STORAGE_KEY = 'gestion_academica_aulas';
  private readonly HORARIOS_KEY = 'gestion_academica_horarios_aulas';
  private useSupabase = true;
  private aulasSubject = new BehaviorSubject<Aula[]>([]);
  public aulas$ = this.aulasSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadAulas();
  }

  private async loadAulas(): Promise<void> {
    if (this.useSupabase) {
      try {
        const aulas = await this.getAulasFromSupabase();
        this.aulasSubject.next(aulas);
      } catch (error) {
        const aulas = this.getAulasFromStorage();
        this.aulasSubject.next(aulas);
      }
    } else {
      const aulas = this.getAulasFromStorage();
      this.aulasSubject.next(aulas);
    }
  }

  private async getAulasFromSupabase(): Promise<Aula[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('aulas')
      .select(`
        *,
        recursos:aula_recursos(*)
      `)
      .eq('institucion_id', currentInstitucion.id)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      nombre: db.nombre,
      codigo: db.codigo,
      capacidad: db.capacidad,
      tipo: db.tipo || 'aula',
      recursos: (db.recursos || []).map((r: any) => ({
        tipo: r.tipo,
        disponible: r.disponible !== false,
        descripcion: r.descripcion
      })),
      estado: db.estado || 'disponible',
      edificio: db.edificio,
      piso: db.piso,
      observaciones: db.observaciones
    }));
  }

  private getAulasFromStorage(): Aula[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getAulas(): Promise<Aula[]> {
    if (this.useSupabase) {
      try {
        return await this.getAulasFromSupabase();
      } catch (error) {
        return this.getAulasFromStorage();
      }
    }
    return this.getAulasFromStorage();
  }

  async getAulaById(id: string): Promise<Aula | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('aulas')
          .select(`
            *,
            recursos:aula_recursos(*)
          `)
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          nombre: data.nombre,
          codigo: data.codigo,
          capacidad: data.capacidad,
          tipo: data.tipo || 'aula',
          recursos: (data.recursos || []).map((r: any) => ({
            tipo: r.tipo,
            disponible: r.disponible !== false,
            descripcion: r.descripcion
          })),
          estado: data.estado || 'disponible',
          edificio: data.edificio,
          piso: data.piso,
          observaciones: data.observaciones
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getAulasFromStorage().find(a => a.id === id);
  }

  async addAula(aula: Aula): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('aulas', {
          id: aula.id,
          nombre: aula.nombre,
          codigo: aula.codigo,
          capacidad: aula.capacidad,
          tipo: aula.tipo || 'aula',
          estado: aula.estado || 'disponible',
          edificio: aula.edificio,
          piso: aula.piso,
          observaciones: aula.observaciones,
          institucion_id: currentInstitucion.id // Asignar institución actual
        });

        // Agregar recursos
        if (aula.recursos && aula.recursos.length > 0) {
          for (const recurso of aula.recursos) {
            await this.supabase.create('aula_recursos', {
              aula_id: aula.id,
              tipo: recurso.tipo,
              disponible: recurso.disponible !== false,
              descripcion: recurso.descripcion
            });
          }
        }

        await this.loadAulas();
      } catch (error) {
        console.error('Error agregando aula:', error);
        throw error;
      }
    } else {
      const aulas = this.getAulasFromStorage();
      aulas.push(aula);
      this.saveAulasToStorage(aulas);
      this.aulasSubject.next(aulas);
    }
  }

  async updateAula(aula: Aula): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('aulas', aula.id, {
          nombre: aula.nombre,
          codigo: aula.codigo,
          capacidad: aula.capacidad,
          tipo: aula.tipo,
          estado: aula.estado,
          edificio: aula.edificio,
          piso: aula.piso,
          observaciones: aula.observaciones
        });

        // Actualizar recursos
        if (aula.recursos) {
          // Eliminar recursos existentes
          const { data: existentes } = await this.supabase.client
            .from('aula_recursos')
            .select('id')
            .eq('aula_id', aula.id);

          for (const existente of existentes || []) {
            await this.supabase.delete('aula_recursos', existente.id);
          }

          // Agregar los nuevos
          for (const recurso of aula.recursos) {
            await this.supabase.create('aula_recursos', {
              aula_id: aula.id,
              tipo: recurso.tipo,
              disponible: recurso.disponible !== false,
              descripcion: recurso.descripcion
            });
          }
        }

        await this.loadAulas();
      } catch (error) {
        console.error('Error actualizando aula:', error);
        throw error;
      }
    } else {
      const aulas = this.getAulasFromStorage();
      const index = aulas.findIndex(a => a.id === aula.id);
      if (index !== -1) {
        aulas[index] = aula;
        this.saveAulasToStorage(aulas);
        this.aulasSubject.next(aulas);
      }
    }
  }

  async deleteAula(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('aulas', id);
        await this.loadAulas();
      } catch (error) {
        console.error('Error eliminando aula:', error);
        throw error;
      }
    } else {
      const aulas = this.getAulasFromStorage().filter(a => a.id !== id);
      this.saveAulasToStorage(aulas);
      this.aulasSubject.next(aulas);
    }
  }

  private saveAulasToStorage(aulas: Aula[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(aulas));
  }

  // Horarios de Aulas (se mantiene en localStorage por ahora)
  getHorariosAulas(): HorarioAula[] {
    const stored = localStorage.getItem(this.HORARIOS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getHorariosByAula(aulaId: string): HorarioAula[] {
    return this.getHorariosAulas().filter(h => h.aulaId === aulaId);
  }

  verificarChoqueHorario(aulaId: string, dia: string, horaInicio: string, horaFin: string): boolean {
    const horarios = this.getHorariosByAula(aulaId);
    return horarios.some(h => {
      if (h.dia !== dia) return false;
      return (horaInicio < h.horaFin && horaFin > h.horaInicio);
    });
  }

  addHorarioAula(horario: HorarioAula): void {
    const horarios = this.getHorariosAulas();
    horarios.push(horario);
    localStorage.setItem(this.HORARIOS_KEY, JSON.stringify(horarios));
  }
}
