import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RecursoBiblioteca, CategoriaRecurso } from '../models/biblioteca.model';
import { SupabaseService } from './supabase.service';
import { InstitucionService } from './institucion.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BibliotecaService {
  private readonly STORAGE_KEY = 'gestion_academica_recursos';
  private readonly CATEGORIAS_KEY = 'gestion_academica_categorias';
  private useSupabase = true;
  private recursosSubject = new BehaviorSubject<RecursoBiblioteca[]>([]);
  public recursos$ = this.recursosSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private institucionService: InstitucionService,
    private authService: AuthService
  ) {
    this.loadRecursos();
  }

  private async loadRecursos(): Promise<void> {
    if (this.useSupabase) {
      try {
        const recursos = await this.getRecursosFromSupabase();
        this.recursosSubject.next(recursos);
      } catch (error) {
        const recursos = this.getRecursosFromStorage();
        this.recursosSubject.next(recursos);
      }
    } else {
      const recursos = this.getRecursosFromStorage();
      this.recursosSubject.next(recursos);
    }
  }

  private async getRecursosFromSupabase(): Promise<RecursoBiblioteca[]> {
    const currentInstitucion = this.institucionService.getCurrentInstitucion();
    if (!currentInstitucion) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('biblioteca_recursos')
      .select('*')
      .eq('institucion_id', currentInstitucion.id)
      .eq('visible', true)
      .order('fecha_subida', { ascending: false });

    if (error) throw error;

    return (data || []).map((db: any) => ({
      id: db.id,
      titulo: db.titulo,
      descripcion: db.descripcion || '',
      tipo: db.tipo,
      url: db.url,
      materiaId: db.materia_id,
      cursoId: db.curso_id,
      autorId: db.autor_id,
      fechaSubida: db.fecha_subida,
      tamano: db.tamano,
      etiquetas: db.etiquetas || [],
      descargas: db.descargas || 0,
      visible: db.visible !== false
    }));
  }

  private getRecursosFromStorage(): RecursoBiblioteca[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getRecursos(): Promise<RecursoBiblioteca[]> {
    if (this.useSupabase) {
      try {
        return await this.getRecursosFromSupabase();
      } catch (error) {
        return this.getRecursosFromStorage();
      }
    }
    return this.getRecursosFromStorage();
  }

  async getRecursoById(id: string): Promise<RecursoBiblioteca | undefined> {
    if (this.useSupabase) {
      try {
        const { data, error } = await this.supabase.client
          .from('biblioteca_recursos')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;

        return {
          id: data.id,
          titulo: data.titulo,
          descripcion: data.descripcion || '',
          tipo: data.tipo,
          url: data.url,
          materiaId: data.materia_id,
          cursoId: data.curso_id,
          autorId: data.autor_id,
          fechaSubida: data.fecha_subida,
          tamano: data.tamano,
          etiquetas: data.etiquetas || [],
          descargas: data.descargas || 0,
          visible: data.visible !== false
        };
      } catch (error) {
        return undefined;
      }
    }
    return this.getRecursosFromStorage().find(r => r.id === id);
  }

  async getRecursosByMateria(materiaId: string): Promise<RecursoBiblioteca[]> {
    const recursos = await this.getRecursos();
    return recursos.filter(r => r.materiaId === materiaId && r.visible);
  }

  async buscarRecursos(termino: string): Promise<RecursoBiblioteca[]> {
    const terminoLower = termino.toLowerCase();
    const recursos = await this.getRecursos();
    return recursos.filter(r => 
      r.titulo.toLowerCase().includes(terminoLower) ||
      r.descripcion.toLowerCase().includes(terminoLower) ||
      r.etiquetas.some(t => t.toLowerCase().includes(terminoLower))
    );
  }

  async addRecurso(recurso: RecursoBiblioteca): Promise<void> {
    if (this.useSupabase) {
      try {
        const currentInstitucion = this.institucionService.getCurrentInstitucion();
        if (!currentInstitucion) {
          throw new Error('Debe seleccionar una institución primero');
        }

        const usuario = this.authService.getCurrentUser();
        if (!usuario) {
          throw new Error('Debe estar autenticado para agregar recursos');
        }

        await this.supabase.create('biblioteca_recursos', {
          id: recurso.id,
          titulo: recurso.titulo,
          descripcion: recurso.descripcion || null,
          tipo: recurso.tipo,
          url: recurso.url,
          materia_id: recurso.materiaId || null,
          curso_id: recurso.cursoId || null,
          autor_id: recurso.autorId || usuario.id,
          fecha_subida: recurso.fechaSubida || new Date().toISOString(),
          tamano: recurso.tamano || null,
          etiquetas: recurso.etiquetas || [],
          descargas: recurso.descargas || 0,
          visible: recurso.visible !== false,
          institucion_id: currentInstitucion.id
        });

        await this.loadRecursos();
      } catch (error) {
        console.error('Error agregando recurso:', error);
        throw error;
      }
    } else {
      const recursos = this.getRecursosFromStorage();
      recursos.push(recurso);
      this.saveRecursosToStorage(recursos);
      this.recursosSubject.next(recursos);
    }
  }

  async updateRecurso(recurso: RecursoBiblioteca): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.update('biblioteca_recursos', recurso.id, {
          titulo: recurso.titulo,
          descripcion: recurso.descripcion || null,
          tipo: recurso.tipo,
          url: recurso.url,
          materia_id: recurso.materiaId || null,
          curso_id: recurso.cursoId || null,
          tamano: recurso.tamano || null,
          etiquetas: recurso.etiquetas || [],
          visible: recurso.visible !== false
        });

        await this.loadRecursos();
      } catch (error) {
        console.error('Error actualizando recurso:', error);
        throw error;
      }
    } else {
      const recursos = this.getRecursosFromStorage();
      const index = recursos.findIndex(r => r.id === recurso.id);
      if (index !== -1) {
        recursos[index] = recurso;
        this.saveRecursosToStorage(recursos);
        this.recursosSubject.next(recursos);
      }
    }
  }

  async deleteRecurso(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        await this.supabase.delete('biblioteca_recursos', id);
        await this.loadRecursos();
      } catch (error) {
        console.error('Error eliminando recurso:', error);
        throw error;
      }
    } else {
      const recursos = this.getRecursosFromStorage().filter(r => r.id !== id);
      this.saveRecursosToStorage(recursos);
      this.recursosSubject.next(recursos);
    }
  }

  async incrementarDescargas(id: string): Promise<void> {
    if (this.useSupabase) {
      try {
        const recurso = await this.getRecursoById(id);
        if (recurso) {
          await this.supabase.update('biblioteca_recursos', id, {
            descargas: (recurso.descargas || 0) + 1
          });
          await this.loadRecursos();
        }
      } catch (error) {
        console.error('Error incrementando descargas:', error);
      }
    } else {
      const recursos = this.getRecursosFromStorage();
      const recurso = recursos.find(r => r.id === id);
      if (recurso) {
        recurso.descargas++;
        this.saveRecursosToStorage(recursos);
        this.recursosSubject.next(recursos);
      }
    }
  }

  private saveRecursosToStorage(recursos: RecursoBiblioteca[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recursos));
  }

  getCategorias(): CategoriaRecurso[] {
    const stored = localStorage.getItem(this.CATEGORIAS_KEY);
    if (stored) return JSON.parse(stored);
    
    const defaultCategorias: CategoriaRecurso[] = [
      { id: '1', nombre: 'Materiales de Estudio', descripcion: 'Apuntes y guías', icono: 'book', color: '#246a73' },
      { id: '2', nombre: 'Videos', descripcion: 'Clases grabadas', icono: 'video_library', color: '#368f8b' },
      { id: '3', nombre: 'Presentaciones', descripcion: 'Slides y presentaciones', icono: 'slideshow', color: '#f3dfc1' },
      { id: '4', nombre: 'Enlaces', descripcion: 'Recursos externos', icono: 'link', color: '#ddbea8' }
    ];
    localStorage.setItem(this.CATEGORIAS_KEY, JSON.stringify(defaultCategorias));
    return defaultCategorias;
  }
}

