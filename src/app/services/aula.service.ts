import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Aula, HorarioAula } from '../models/aula.model';

@Injectable({
  providedIn: 'root'
})
export class AulaService {
  private readonly STORAGE_KEY = 'gestion_academica_aulas';
  private readonly HORARIOS_KEY = 'gestion_academica_horarios_aulas';
  private aulasSubject = new BehaviorSubject<Aula[]>(this.getAulas());
  public aulas$ = this.aulasSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const aulas = this.getAulas();
    if (aulas.length === 0) {
      const defaultAulas: Aula[] = [
        {
          id: '1',
          nombre: 'Aula 101',
          codigo: 'A101',
          capacidad: 30,
          tipo: 'aula',
          recursos: [
            { tipo: 'proyector', disponible: true },
            { tipo: 'pizarra', disponible: true },
            { tipo: 'wifi', disponible: true }
          ],
          estado: 'disponible',
          edificio: 'Principal',
          piso: 1
        },
        {
          id: '2',
          nombre: 'Laboratorio de Ciencias',
          codigo: 'LAB-01',
          capacidad: 20,
          tipo: 'laboratorio',
          recursos: [
            { tipo: 'proyector', disponible: true },
            { tipo: 'pc', disponible: true },
            { tipo: 'wifi', disponible: true }
          ],
          estado: 'disponible',
          edificio: 'Principal',
          piso: 2
        }
      ];
      this.saveAulas(defaultAulas);
    }
  }

  getAulas(): Aula[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getAulaById(id: string): Aula | undefined {
    return this.getAulas().find(a => a.id === id);
  }

  addAula(aula: Aula): void {
    const aulas = this.getAulas();
    aulas.push(aula);
    this.saveAulas(aulas);
  }

  updateAula(aula: Aula): void {
    const aulas = this.getAulas();
    const index = aulas.findIndex(a => a.id === aula.id);
    if (index !== -1) {
      aulas[index] = aula;
      this.saveAulas(aulas);
    }
  }

  deleteAula(id: string): void {
    const aulas = this.getAulas().filter(a => a.id !== id);
    this.saveAulas(aulas);
  }

  private saveAulas(aulas: Aula[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(aulas));
    this.aulasSubject.next(aulas);
  }

  // Horarios de Aulas
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
      // Verificar solapamiento de horarios
      return (horaInicio < h.horaFin && horaFin > h.horaInicio);
    });
  }

  addHorarioAula(horario: HorarioAula): void {
    const horarios = this.getHorariosAulas();
    horarios.push(horario);
    localStorage.setItem(this.HORARIOS_KEY, JSON.stringify(horarios));
  }
}

