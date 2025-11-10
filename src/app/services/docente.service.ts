import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Docente } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private readonly STORAGE_KEY = 'gestion_academica_docentes';
  private docentesSubject = new BehaviorSubject<Docente[]>(this.getDocentes());
  public docentes$ = this.docentesSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const docentes = this.getDocentes();
    if (docentes.length === 0) {
      const defaultDocentes: Docente[] = [
        {
          id: '1',
          username: 'docente1',
          password: '1234',
          nombre: 'María',
          apellido: 'García',
          email: 'maria.garcia@academia.edu',
          telefono: '1234567890',
          dni: '12345678',
          rol: 'profesor',
          especialidad: 'Matemáticas',
          materiasAsignadas: ['1', '2'],
          fechaRegistro: new Date().toISOString(),
          activo: true
        },
        {
          id: '2',
          username: 'docente2',
          password: '1234',
          nombre: 'Carlos',
          apellido: 'López',
          email: 'carlos.lopez@academia.edu',
          telefono: '2345678901',
          dni: '23456789',
          rol: 'profesor',
          especialidad: 'Lengua y Literatura',
          materiasAsignadas: ['2'],
          fechaRegistro: new Date().toISOString(),
          activo: true
        }
      ];
      this.saveDocentes(defaultDocentes);
    }
  }

  getDocentes(): Docente[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getDocenteById(id: string): Docente | undefined {
    return this.getDocentes().find(d => d.id === id);
  }

  addDocente(docente: Docente): void {
    const docentes = this.getDocentes();
    docentes.push(docente);
    this.saveDocentes(docentes);
  }

  updateDocente(docente: Docente): void {
    const docentes = this.getDocentes();
    const index = docentes.findIndex(d => d.id === docente.id);
    if (index !== -1) {
      docentes[index] = docente;
      this.saveDocentes(docentes);
    }
  }

  deleteDocente(id: string): void {
    const docentes = this.getDocentes().filter(d => d.id !== id);
    this.saveDocentes(docentes);
  }

  private saveDocentes(docentes: Docente[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(docentes));
    this.docentesSubject.next(docentes);
  }

  getDocentesByMateria(materiaId: string): Docente[] {
    return this.getDocentes().filter(d => 
      d.materiasAsignadas?.includes(materiaId)
    );
  }
}

