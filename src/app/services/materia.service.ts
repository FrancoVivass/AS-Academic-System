import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Materia, AlumnoMateria } from '../models/materia.model';

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private readonly STORAGE_KEY = 'gestion_academica_materias';
  private readonly INSCRIPCIONES_KEY = 'gestion_academica_inscripciones';
  private materiasSubject = new BehaviorSubject<Materia[]>(this.getMaterias());
  public materias$ = this.materiasSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const materias = this.getMaterias();
    if (materias.length === 0) {
      const defaultMaterias: Materia[] = [
        {
          id: '1',
          nombre: 'Matemáticas',
          codigo: 'MAT-101',
          descripcion: 'Álgebra y geometría básica',
          profesor: 'Dr. García',
          curso: '1ro A',
          horario: 'Lunes y Miércoles 8:00-10:00',
          creditos: 4,
          horasSemanales: 4,
          correlatividades: [],
          tipo: 'obligatoria',
          estado: 'activa',
          fechaCreacion: new Date().toISOString(),
          configuracion: {
            tieneNota: true,
            tieneAsistencia: true,
            requiereAprobacion: false,
            notaMinimaAprobacion: 6,
            porcentajeAsistenciaMinimo: 75
          }
        },
        {
          id: '2',
          nombre: 'Lengua y Literatura',
          codigo: 'LEN-101',
          descripcion: 'Gramática y análisis literario',
          profesor: 'Prof. Martínez',
          curso: '1ro A',
          horario: 'Martes y Jueves 8:00-10:00',
          creditos: 3,
          horasSemanales: 3,
          correlatividades: [],
          tipo: 'obligatoria',
          estado: 'activa',
          fechaCreacion: new Date().toISOString(),
          configuracion: {
            tieneNota: true,
            tieneAsistencia: true,
            requiereAprobacion: false,
            notaMinimaAprobacion: 6,
            porcentajeAsistenciaMinimo: 75
          }
        },
        {
          id: '3',
          nombre: 'Ciencias Naturales',
          codigo: 'CIE-101',
          descripcion: 'Biología y química básica',
          profesor: 'Dra. López',
          curso: '2do B',
          horario: 'Lunes y Viernes 10:00-12:00',
          creditos: 4,
          horasSemanales: 4,
          correlatividades: [],
          tipo: 'obligatoria',
          estado: 'activa',
          fechaCreacion: new Date().toISOString(),
          configuracion: {
            tieneNota: true,
            tieneAsistencia: true,
            requiereAprobacion: false,
            notaMinimaAprobacion: 6,
            porcentajeAsistenciaMinimo: 75
          }
        },
        {
          id: '4',
          nombre: 'Historia',
          codigo: 'HIS-101',
          descripcion: 'Historia universal y nacional',
          profesor: 'Prof. Fernández',
          curso: '2do B',
          horario: 'Miércoles 10:00-12:00',
          creditos: 2,
          horasSemanales: 2,
          correlatividades: [],
          tipo: 'obligatoria',
          estado: 'activa',
          fechaCreacion: new Date().toISOString(),
          configuracion: {
            tieneNota: true,
            tieneAsistencia: true,
            requiereAprobacion: false,
            notaMinimaAprobacion: 6,
            porcentajeAsistenciaMinimo: 75
          }
        }
      ];
      this.saveMaterias(defaultMaterias);
    }
  }

  getMaterias(): Materia[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getMateriaById(id: string): Materia | undefined {
    return this.getMaterias().find(m => m.id === id);
  }

  addMateria(materia: Materia): void {
    const materias = this.getMaterias();
    materias.push(materia);
    this.saveMaterias(materias);
  }

  updateMateria(materia: Materia): void {
    const materias = this.getMaterias();
    const index = materias.findIndex(m => m.id === materia.id);
    if (index !== -1) {
      materias[index] = materia;
      this.saveMaterias(materias);
    }
  }

  deleteMateria(id: string): void {
    const materias = this.getMaterias().filter(m => m.id !== id);
    this.saveMaterias(materias);
    
    // Eliminar inscripciones relacionadas
    const inscripciones = this.getInscripciones().filter(i => i.materiaId !== id);
    localStorage.setItem(this.INSCRIPCIONES_KEY, JSON.stringify(inscripciones));
  }

  private saveMaterias(materias: Materia[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(materias));
    this.materiasSubject.next(materias);
  }

  // Inscripciones
  getInscripciones(): AlumnoMateria[] {
    const stored = localStorage.getItem(this.INSCRIPCIONES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getInscripcionesByMateria(materiaId: string): AlumnoMateria[] {
    return this.getInscripciones().filter(i => i.materiaId === materiaId);
  }

  getInscripcionesByAlumno(alumnoId: string): AlumnoMateria[] {
    return this.getInscripciones().filter(i => i.alumnoId === alumnoId);
  }

  inscribirAlumno(inscripcion: AlumnoMateria): void {
    const inscripciones = this.getInscripciones();
    // Verificar si ya está inscrito
    const existe = inscripciones.some(
      i => i.alumnoId === inscripcion.alumnoId && i.materiaId === inscripcion.materiaId
    );
    if (!existe) {
      inscripciones.push(inscripcion);
      localStorage.setItem(this.INSCRIPCIONES_KEY, JSON.stringify(inscripciones));
    }
  }

  desinscribirAlumno(alumnoId: string, materiaId: string): void {
    const inscripciones = this.getInscripciones().filter(
      i => !(i.alumnoId === alumnoId && i.materiaId === materiaId)
    );
    localStorage.setItem(this.INSCRIPCIONES_KEY, JSON.stringify(inscripciones));
  }
}

