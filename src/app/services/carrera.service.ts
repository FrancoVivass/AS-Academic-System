import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Carrera, Equivalencia, PlanEstudio } from '../models/carrera.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {
  private readonly STORAGE_KEY = 'gestion_academica_carreras';
  private readonly EQUIVALENCIAS_KEY = 'gestion_academica_equivalencias';
  private readonly PLANES_KEY = 'gestion_academica_planes_estudio';
  private useSupabase = true;
  private carrerasSubject = new BehaviorSubject<Carrera[]>([]);
  public carreras$ = this.carrerasSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadCarreras();
  }

  private async loadCarreras(): Promise<void> {
    if (this.useSupabase) {
      try {
        const carreras = await this.getCarrerasFromSupabase();
        this.carrerasSubject.next(carreras);
      } catch (error) {
        const carreras = this.getCarrerasFromStorage();
        this.carrerasSubject.next(carreras);
      }
    } else {
      const carreras = this.getCarrerasFromStorage();
      this.carrerasSubject.next(carreras);
    }
  }

  private async getCarrerasFromSupabase(): Promise<Carrera[]> {
    // Obtener la institución actual para filtrar
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('carreras')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .order('nombre', { ascending: true });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      nombre: db.nombre,
      codigo: db.codigo,
      descripcion: db.descripcion,
      duracionAnios: db.duracion_anios,
      duracionCuatrimestres: db.duracion_cuatrimestres,
      coordinadorId: db.coordinador_id,
      estado: db.estado || 'activa',
      fechaCreacion: db.fecha_creacion,
      materiasObligatorias: [], // Se obtiene de materias
      materiasOptativas: [], // Se obtiene de materias
      equivalencias: [], // Se obtiene de equivalencias
      cursos: [] // Se obtiene de cursos
    }));
  }

  private getCarrerasFromStorage(): Carrera[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getCarreras(): Promise<Carrera[]> {
    if (this.useSupabase) {
      try {
        return await this.getCarrerasFromSupabase();
      } catch (error) {
        return this.getCarrerasFromStorage();
      }
    }
    return this.getCarrerasFromStorage();
  }

  async getCarreraById(id: string): Promise<Carrera | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('carreras')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          nombre: data.nombre,
          codigo: data.codigo,
          descripcion: data.descripcion,
          duracionAnios: data.duracion_anios,
          duracionCuatrimestres: data.duracion_cuatrimestres,
          coordinadorId: data.coordinador_id,
          estado: data.estado || 'activa',
          fechaCreacion: data.fecha_creacion,
          materiasObligatorias: [],
          materiasOptativas: [],
          equivalencias: [],
          cursos: []
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getCarrerasFromStorage().find(c => c.id === id);
  }

  async addCarrera(carrera: Carrera): Promise<void> {
    if (this.useSupabase) {
      try {
        // Obtener la institución actual
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        await this.supabase.create('carreras', {
          id: carrera.id,
          nombre: carrera.nombre,
          codigo: carrera.codigo,
          descripcion: carrera.descripcion,
          duracion_anios: carrera.duracionAnios,
          duracion_cuatrimestres: carrera.duracionCuatrimestres,
          coordinador_id: carrera.coordinadorId,
          estado: carrera.estado || 'activa',
          institucion_id: currentInstitucion.id, // Asignar institución actual
          fecha_creacion: carrera.fechaCreacion || new Date().toISOString()
        });
        await this.loadCarreras();
      } catch (error) {
        console.error('Error agregando carrera:', error);
        throw error;
      }
    } else {
      const carreras = this.getCarrerasFromStorage();
      carreras.push(carrera);
      this.saveCarrerasToStorage(carreras);
      this.carrerasSubject.next(carreras);
    }
  }

  async updateCarrera(carrera: Carrera): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('carreras', carrera.id, {
          nombre: carrera.nombre,
          codigo: carrera.codigo,
          descripcion: carrera.descripcion,
          duracion_anios: carrera.duracionAnios,
          duracion_cuatrimestres: carrera.duracionCuatrimestres,
          coordinador_id: carrera.coordinadorId,
          estado: carrera.estado
        });
        await this.loadCarreras();
      } catch (error) {
        console.error('Error actualizando carrera:', error);
        throw error;
      }
    } else {
      const carreras = this.getCarrerasFromStorage();
      const index = carreras.findIndex(c => c.id === carrera.id);
      if (index !== -1) {
        carreras[index] = carrera;
        this.saveCarrerasToStorage(carreras);
        this.carrerasSubject.next(carreras);
      }
    }
  }

  async deleteCarrera(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('carreras', id);
        await this.loadCarreras();
      } catch (error) {
        console.error('Error eliminando carrera:', error);
        throw error;
      }
    } else {
      const carreras = this.getCarrerasFromStorage().filter(c => c.id !== id);
      this.saveCarrerasToStorage(carreras);
      this.carrerasSubject.next(carreras);
    }
  }

  private saveCarrerasToStorage(carreras: Carrera[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(carreras));
  }

  // Equivalencias
  async getEquivalencias(): Promise<Equivalencia[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('equivalencias')
          .select('*');

        if (error) throw error;
        return (data || []).map((db: any) => ({
          id: db.id,
          carreraOrigenId: db.carrera_origen_id,
          carreraDestinoId: db.carrera_destino_id,
          materiaOrigenId: db.materia_origen_id,
          materiaDestinoId: db.materia_destino_id,
          estado: db.estado || 'pendiente',
          fechaSolicitud: db.fecha_solicitud,
          fechaAprobacion: db.fecha_aprobacion,
          aprobadaPor: db.aprobada_por
        }));
      } catch (error) {
        return this.getEquivalenciasFromStorage();
      }
    }
    return this.getEquivalenciasFromStorage();
  }

  private getEquivalenciasFromStorage(): Equivalencia[] {
    const stored = localStorage.getItem(this.EQUIVALENCIAS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getEquivalenciasByCarrera(carreraId: string): Promise<Equivalencia[]> {
    const equivalencias = await this.getEquivalencias();
    return equivalencias.filter(
      e => e.carreraOrigenId === carreraId || e.carreraDestinoId === carreraId
    );
  }

  async addEquivalencia(equivalencia: Equivalencia): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.create('equivalencias', {
          id: equivalencia.id,
          carrera_origen_id: equivalencia.carreraOrigenId,
          carrera_destino_id: equivalencia.carreraDestinoId,
          materia_origen_id: equivalencia.materiaOrigenId,
          materia_destino_id: equivalencia.materiaDestinoId,
          estado: equivalencia.estado || 'pendiente',
          fecha_solicitud: equivalencia.fechaSolicitud || new Date().toISOString()
        });
      } catch (error) {
        console.error('Error agregando equivalencia:', error);
        throw error;
      }
    } else {
      const equivalencias = this.getEquivalenciasFromStorage();
      equivalencias.push(equivalencia);
      localStorage.setItem(this.EQUIVALENCIAS_KEY, JSON.stringify(equivalencias));
    }
  }

  async aprobarEquivalencia(id: string, aprobadaPor: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('equivalencias', id, {
          estado: 'aprobada',
          aprobada_por: aprobadaPor,
          fecha_aprobacion: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error aprobando equivalencia:', error);
        throw error;
      }
    } else {
      const equivalencias = this.getEquivalenciasFromStorage();
      const equivalencia = equivalencias.find(e => e.id === id);
      if (equivalencia) {
        equivalencia.estado = 'aprobada';
        equivalencia.aprobadaPor = aprobadaPor;
        equivalencia.fechaAprobacion = new Date().toISOString();
        localStorage.setItem(this.EQUIVALENCIAS_KEY, JSON.stringify(equivalencias));
      }
    }
  }

  // Planes de Estudio (se guardan en localStorage por ahora, no hay tabla específica)
  getPlanesEstudio(): PlanEstudio[] {
    const stored = localStorage.getItem(this.PLANES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getPlanEstudioByCarrera(carreraId: string): PlanEstudio[] {
    return this.getPlanesEstudio().filter(p => p.carreraId === carreraId);
  }

  addPlanEstudio(plan: PlanEstudio): void {
    const planes = this.getPlanesEstudio();
    planes.push(plan);
    localStorage.setItem(this.PLANES_KEY, JSON.stringify(planes));
  }
}
