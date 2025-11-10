import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RecursoBiblioteca, CategoriaRecurso } from '../models/biblioteca.model';

@Injectable({
  providedIn: 'root'
})
export class BibliotecaService {
  private readonly STORAGE_KEY = 'gestion_academica_recursos';
  private readonly CATEGORIAS_KEY = 'gestion_academica_categorias';
  private recursosSubject = new BehaviorSubject<RecursoBiblioteca[]>(this.getRecursos());
  public recursos$ = this.recursosSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const recursos = this.getRecursos();
    if (recursos.length === 0) {
      const defaultRecursos: RecursoBiblioteca[] = [
        {
          id: '1',
          titulo: 'Guía de Álgebra Básica',
          descripcion: 'Material de estudio para el primer parcial',
          tipo: 'pdf',
          url: '#',
          materiaId: '1',
          autorId: '1',
          fechaSubida: new Date().toISOString(),
          tamano: '2.5 MB',
          etiquetas: ['álgebra', 'matemáticas', 'parcial'],
          descargas: 0,
          visible: true
        },
        {
          id: '2',
          titulo: 'Video: Introducción a la Literatura',
          descripcion: 'Clase grabada sobre análisis literario',
          tipo: 'video',
          url: '#',
          materiaId: '2',
          autorId: '2',
          fechaSubida: new Date().toISOString(),
          tamano: '150 MB',
          etiquetas: ['literatura', 'video', 'clase'],
          descargas: 0,
          visible: true
        }
      ];
      this.saveRecursos(defaultRecursos);
    }
  }

  getRecursos(): RecursoBiblioteca[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getRecursoById(id: string): RecursoBiblioteca | undefined {
    return this.getRecursos().find(r => r.id === id);
  }

  getRecursosByMateria(materiaId: string): RecursoBiblioteca[] {
    return this.getRecursos().filter(r => r.materiaId === materiaId && r.visible);
  }

  buscarRecursos(termino: string): RecursoBiblioteca[] {
    const terminoLower = termino.toLowerCase();
    return this.getRecursos().filter(r => 
      r.titulo.toLowerCase().includes(terminoLower) ||
      r.descripcion.toLowerCase().includes(terminoLower) ||
      r.etiquetas.some(t => t.toLowerCase().includes(terminoLower))
    );
  }

  addRecurso(recurso: RecursoBiblioteca): void {
    const recursos = this.getRecursos();
    recursos.push(recurso);
    this.saveRecursos(recursos);
  }

  updateRecurso(recurso: RecursoBiblioteca): void {
    const recursos = this.getRecursos();
    const index = recursos.findIndex(r => r.id === recurso.id);
    if (index !== -1) {
      recursos[index] = recurso;
      this.saveRecursos(recursos);
    }
  }

  deleteRecurso(id: string): void {
    const recursos = this.getRecursos().filter(r => r.id !== id);
    this.saveRecursos(recursos);
  }

  incrementarDescargas(id: string): void {
    const recursos = this.getRecursos();
    const recurso = recursos.find(r => r.id === id);
    if (recurso) {
      recurso.descargas++;
      this.saveRecursos(recursos);
    }
  }

  private saveRecursos(recursos: RecursoBiblioteca[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recursos));
    this.recursosSubject.next(recursos);
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

