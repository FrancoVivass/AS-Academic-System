import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Tarea, EntregaTarea } from '../models/tarea.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private readonly STORAGE_KEY = 'gestion_academica_tareas';
  private readonly ENTREGAS_KEY = 'gestion_academica_entregas_tareas';
  private useSupabase = true;
  private tareasSubject = new BehaviorSubject<Tarea[]>([]);
  public tareas$ = this.tareasSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService
  ) {
    this.loadTareas();
  }

  private async loadTareas(): Promise<void> {
    if (this.useSupabase) {
      try {
        const tareas = await this.getTareasFromSupabase();
        this.tareasSubject.next(tareas);
      } catch (error) {
        const tareas = this.getTareasFromStorage();
        this.tareasSubject.next(tareas);
      }
    } else {
      const tareas = this.getTareasFromStorage();
      this.tareasSubject.next(tareas);
    }
  }

  private async getTareasFromSupabase(): Promise<Tarea[]> {
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('tareas')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error obteniendo tareas desde Supabase:', error);
      return [];
    }

    return (data || []).map(this.mapTareaFromSupabase);
  }

  private mapTareaFromSupabase(row: any): Tarea {
    return {
      id: row.id,
      materiaId: row.materia_id,
      profesorId: row.profesor_id,
      titulo: row.titulo,
      descripcion: row.descripcion || '',
      fechaCreacion: row.fecha_creacion,
      fechaEntrega: row.fecha_entrega,
      fechaLimite: row.fecha_limite,
      tipo: row.tipo || 'tarea',
      estado: row.estado || 'activa',
      puntos: row.puntos,
      archivosAdjuntos: row.archivos_adjuntos || [],
      cursoId: row.curso_id,
      visibleParaAlumnos: row.visible_para_alumnos !== false
    };
  }

  private getTareasFromStorage(): Tarea[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error leyendo tareas desde localStorage:', error);
      return [];
    }
  }

  async getTareas(): Promise<Tarea[]> {
    if (this.useSupabase) {
      try {
        return await this.getTareasFromSupabase();
      } catch (error) {
        return this.getTareasFromStorage();
      }
    }
    return this.getTareasFromStorage();
  }

  async getTareasByMateria(materiaId: string): Promise<Tarea[]> {
    const tareas = await this.getTareas();
    return tareas.filter(t => t.materiaId === materiaId && t.estado === 'activa');
  }

  async getTareasByProfesor(profesorId: string): Promise<Tarea[]> {
    const tareas = await this.getTareas();
    return tareas.filter(t => t.profesorId === profesorId);
  }

  async addTarea(tarea: Tarea): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.addTareaToSupabase(tarea);
        await this.loadTareas();
        return;
      } catch (error) {
        console.error('Error agregando tarea a Supabase:', error);
      }
    }
    this.addTareaToStorage(tarea);
    await this.loadTareas();
  }

  private async addTareaToSupabase(tarea: Tarea): Promise<void> {
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      throw new Error('No hay institución seleccionada');
    }

    const { error } = await this.supabase.client
      .from('tareas')
      .insert({
        id: tarea.id,
        institucion_id: currentInstitucion.id,
        materia_id: tarea.materiaId,
        profesor_id: tarea.profesorId,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        fecha_creacion: tarea.fechaCreacion,
        fecha_entrega: tarea.fechaEntrega,
        fecha_limite: tarea.fechaLimite,
        tipo: tarea.tipo,
        estado: tarea.estado,
        puntos: tarea.puntos,
        archivos_adjuntos: tarea.archivosAdjuntos || [],
        curso_id: tarea.cursoId,
        visible_para_alumnos: tarea.visibleParaAlumnos
      });

    if (error) {
      throw error;
    }
  }

  private addTareaToStorage(tarea: Tarea): void {
    const tareas = this.getTareasFromStorage();
    tareas.push(tarea);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tareas));
  }

  async updateTarea(tarea: Tarea): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.updateTareaInSupabase(tarea);
        await this.loadTareas();
        return;
      } catch (error) {
        console.error('Error actualizando tarea en Supabase:', error);
      }
    }
    this.updateTareaInStorage(tarea);
    await this.loadTareas();
  }

  private async updateTareaInSupabase(tarea: Tarea): Promise<void> {
    const { error } = await this.supabase.client
      .from('tareas')
      .update({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        fecha_entrega: tarea.fechaEntrega,
        fecha_limite: tarea.fechaLimite,
        tipo: tarea.tipo,
        estado: tarea.estado,
        puntos: tarea.puntos,
        archivos_adjuntos: tarea.archivosAdjuntos || [],
        curso_id: tarea.cursoId,
        visible_para_alumnos: tarea.visibleParaAlumnos
      })
      .eq('id', tarea.id);

    if (error) {
      throw error;
    }
  }

  private updateTareaInStorage(tarea: Tarea): void {
    const tareas = this.getTareasFromStorage();
    const index = tareas.findIndex(t => t.id === tarea.id);
    if (index !== -1) {
      tareas[index] = tarea;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tareas));
    }
  }

  async deleteTarea(tareaId: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.client
          .from('tareas')
          .delete()
          .eq('id', tareaId);
        await this.loadTareas();
        return;
      } catch (error) {
        console.error('Error eliminando tarea de Supabase:', error);
      }
    }
    this.deleteTareaFromStorage(tareaId);
    await this.loadTareas();
  }

  private deleteTareaFromStorage(tareaId: string): void {
    const tareas = this.getTareasFromStorage();
    const filtered = tareas.filter(t => t.id !== tareaId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Métodos para entregas
  async getEntregasByTarea(tareaId: string): Promise<EntregaTarea[]> {
    try {
      if (this.useSupabase) {
        const { data, error } = await this.supabase.client
          .from('entregas_tareas')
          .select('*')
          .eq('tarea_id', tareaId)
          .order('fecha_entrega', { ascending: false });

        if (error) {
          console.error('Error obteniendo entregas desde Supabase:', error);
          return this.getEntregasFromStorage(tareaId);
        }

        return (data || []).map(this.mapEntregaFromSupabase);
      }
      return this.getEntregasFromStorage(tareaId);
    } catch (error) {
      return this.getEntregasFromStorage(tareaId);
    }
  }

  private mapEntregaFromSupabase(row: any): EntregaTarea {
    return {
      id: row.id,
      tareaId: row.tarea_id,
      alumnoId: row.alumno_id,
      fechaEntrega: row.fecha_entrega,
      archivosAdjuntos: row.archivos_adjuntos || [],
      comentario: row.comentario,
      calificacion: row.calificacion,
      observaciones: row.observaciones,
      estado: row.estado || 'pendiente',
      fechaCalificacion: row.fecha_calificacion
    };
  }

  private getEntregasFromStorage(tareaId: string): EntregaTarea[] {
    try {
      const stored = localStorage.getItem(this.ENTREGAS_KEY);
      const entregas: EntregaTarea[] = stored ? JSON.parse(stored) : [];
      return entregas.filter(e => e.tareaId === tareaId);
    } catch (error) {
      console.error('Error leyendo entregas desde localStorage:', error);
      return [];
    }
  }

  async addEntrega(entrega: EntregaTarea): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.addEntregaToSupabase(entrega);
        return;
      } catch (error) {
        console.error('Error agregando entrega a Supabase:', error);
      }
    }
    this.addEntregaToStorage(entrega);
  }

  private async addEntregaToSupabase(entrega: EntregaTarea): Promise<void> {
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      throw new Error('No hay institución seleccionada');
    }

    const { error } = await this.supabase.client
      .from('entregas_tareas')
      .insert({
        id: entrega.id,
        institucion_id: currentInstitucion.id,
        tarea_id: entrega.tareaId,
        alumno_id: entrega.alumnoId,
        fecha_entrega: entrega.fechaEntrega,
        archivos_adjuntos: entrega.archivosAdjuntos || [],
        comentario: entrega.comentario,
        estado: entrega.estado
      });

    if (error) {
      throw error;
    }
  }

  private addEntregaToStorage(entrega: EntregaTarea): void {
    const entregas = this.getEntregasFromStorage(entrega.tareaId);
    entregas.push(entrega);
    const allEntregas = this.getAllEntregasFromStorage();
    allEntregas.push(entrega);
    localStorage.setItem(this.ENTREGAS_KEY, JSON.stringify(allEntregas));
  }

  private getAllEntregasFromStorage(): EntregaTarea[] {
    try {
      const stored = localStorage.getItem(this.ENTREGAS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  async updateEntrega(entrega: EntregaTarea): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.updateEntregaInSupabase(entrega);
        return;
      } catch (error) {
        console.error('Error actualizando entrega en Supabase:', error);
      }
    }
    this.updateEntregaInStorage(entrega);
  }

  private async updateEntregaInSupabase(entrega: EntregaTarea): Promise<void> {
    const { error } = await this.supabase.client
      .from('entregas_tareas')
      .update({
        archivos_adjuntos: entrega.archivosAdjuntos || [],
        comentario: entrega.comentario,
        calificacion: entrega.calificacion,
        observaciones: entrega.observaciones,
        estado: entrega.estado,
        fecha_calificacion: entrega.fechaCalificacion
      })
      .eq('id', entrega.id);

    if (error) {
      throw error;
    }
  }

  private updateEntregaInStorage(entrega: EntregaTarea): void {
    const allEntregas = this.getAllEntregasFromStorage();
    const index = allEntregas.findIndex(e => e.id === entrega.id);
    if (index !== -1) {
      allEntregas[index] = entrega;
      localStorage.setItem(this.ENTREGAS_KEY, JSON.stringify(allEntregas));
    }
  }
}






