import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Evento, CalendarioAcademico } from '../models/evento.model';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private readonly STORAGE_KEY = 'gestion_academica_eventos';
  private readonly CALENDARIO_KEY = 'gestion_academica_calendario';
  private eventosSubject = new BehaviorSubject<Evento[]>(this.getEventos());
  public eventos$ = this.eventosSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const eventos = this.getEventos();
    if (eventos.length === 0) {
      const hoy = new Date();
      const defaultEventos: Evento[] = [
        {
          id: '1',
          titulo: 'Examen Parcial - Matemáticas',
          descripcion: 'Primer parcial del año',
          fecha: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          hora: '14:00',
          tipo: 'examen',
          materiaId: '1',
          creadorId: '1',
          color: '#f44336',
          recordatorio: true
        },
        {
          id: '2',
          titulo: 'Reunión de Padres',
          descripcion: 'Reunión informativa',
          fecha: new Date(hoy.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          hora: '18:00',
          tipo: 'reunion',
          creadorId: '1',
          color: '#2196f3',
          recordatorio: true
        }
      ];
      this.saveEventos(defaultEventos);
    }
  }

  getEventos(): Evento[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getEventoById(id: string): Evento | undefined {
    return this.getEventos().find(e => e.id === id);
  }

  getEventosByFecha(fecha: string): Evento[] {
    return this.getEventos().filter(e => e.fecha === fecha);
  }

  getEventosByMateria(materiaId: string): Evento[] {
    return this.getEventos().filter(e => e.materiaId === materiaId);
  }

  getEventosProximos(dias: number = 7): Evento[] {
    const hoy = new Date();
    const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);
    return this.getEventos().filter(e => {
      const fechaEvento = new Date(e.fecha);
      return fechaEvento >= hoy && fechaEvento <= limite;
    }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  addEvento(evento: Evento): void {
    const eventos = this.getEventos();
    eventos.push(evento);
    this.saveEventos(eventos);
  }

  updateEvento(evento: Evento): void {
    const eventos = this.getEventos();
    const index = eventos.findIndex(e => e.id === evento.id);
    if (index !== -1) {
      eventos[index] = evento;
      this.saveEventos(eventos);
    }
  }

  deleteEvento(id: string): void {
    const eventos = this.getEventos().filter(e => e.id !== id);
    this.saveEventos(eventos);
  }

  private saveEventos(eventos: Evento[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventos));
    this.eventosSubject.next(eventos);
  }

  getCalendarioAcademico(): CalendarioAcademico | null {
    const stored = localStorage.getItem(this.CALENDARIO_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  saveCalendarioAcademico(calendario: CalendarioAcademico): void {
    localStorage.setItem(this.CALENDARIO_KEY, JSON.stringify(calendario));
  }
}

