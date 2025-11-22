import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Curso, HorarioCurso } from '../models/curso.model';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private readonly STORAGE_KEY = 'gestion_academica_cursos';
  private cursosSubject = new BehaviorSubject<Curso[]>(this.getCursos());
  public cursos$ = this.cursosSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const cursos = this.getCursos();
    if (cursos.length === 0) {
      const defaultCursos: Curso[] = [
        // Los cursos se crearán desde las carreras
      ];
      this.saveCursos(defaultCursos);
    }
  }

  getCursos(): Curso[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getCursoById(id: string): Curso | undefined {
    return this.getCursos().find(c => c.id === id);
  }

  getCursosByAño(año: number): Curso[] {
    return this.getCursos().filter(c => c.año === año);
  }

  getCursosByTurno(turno: string): Curso[] {
    return this.getCursos().filter(c => c.turno === turno);
  }

  getCursosByCarrera(carreraId: string): Curso[] {
    return this.getCursos().filter(c => c.carreraId === carreraId);
  }

  addCurso(curso: Curso): void {
    const cursos = this.getCursos();
    cursos.push(curso);
    this.saveCursos(cursos);
  }

  updateCurso(curso: Curso): void {
    const cursos = this.getCursos();
    const index = cursos.findIndex(c => c.id === curso.id);
    if (index !== -1) {
      cursos[index] = curso;
      this.saveCursos(cursos);
    }
  }

  deleteCurso(id: string): void {
    const cursos = this.getCursos().filter(c => c.id !== id);
    this.saveCursos(cursos);
  }

  agregarAlumnoACurso(cursoId: string, alumnoId: string): void {
    const curso = this.getCursoById(cursoId);
    if (curso && !curso.alumnos.includes(alumnoId)) {
      curso.alumnos.push(alumnoId);
      this.updateCurso(curso);
    }
  }

  removerAlumnoDeCurso(cursoId: string, alumnoId: string): void {
    const curso = this.getCursoById(cursoId);
    if (curso) {
      curso.alumnos = curso.alumnos.filter(id => id !== alumnoId);
      this.updateCurso(curso);
    }
  }

  agregarHorario(cursoId: string, horario: HorarioCurso): void {
    const curso = this.getCursoById(cursoId);
    if (curso) {
      curso.horarios.push(horario);
      this.updateCurso(curso);
    }
  }

  private saveCursos(cursos: Curso[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cursos));
    this.cursosSubject.next(cursos);
  }
}

