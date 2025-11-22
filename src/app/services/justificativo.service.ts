import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Justificativo } from '../models/justificativo.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class JustificativoService {
  private readonly STORAGE_KEY = 'gestion_academica_justificativos';
  private justificativosSubject = new BehaviorSubject<Justificativo[]>(this.getJustificativos());
  public justificativos$ = this.justificativosSubject.asObservable();

  constructor(private authService: AuthService) {}

  getJustificativos(): Justificativo[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getJustificativoById(id: string): Justificativo | undefined {
    return this.getJustificativos().find(j => j.id === id);
  }

  getJustificativosByAlumno(alumnoId: string): Justificativo[] {
    return this.getJustificativos().filter(j => j.alumnoId === alumnoId);
  }

  getJustificativosPendientes(): Justificativo[] {
    return this.getJustificativos().filter(j => j.estado === 'pendiente');
  }

  crearJustificativo(justificativo: Omit<Justificativo, 'id' | 'fechaSolicitud' | 'estado'>): Justificativo {
    const nuevoJustificativo: Justificativo = {
      ...justificativo,
      id: Date.now().toString(),
      fechaSolicitud: new Date().toISOString(),
      estado: 'pendiente'
    };

    const justificativos = this.getJustificativos();
    justificativos.push(nuevoJustificativo);
    this.saveJustificativos(justificativos);

    return nuevoJustificativo;
  }

  aprobarJustificativo(id: string): void {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    const justificativos = this.getJustificativos();
    const justificativo = justificativos.find(j => j.id === id);
    if (justificativo) {
      justificativo.estado = 'aprobado';
      justificativo.aprobadoPor = usuario.id;
      justificativo.fechaAprobacion = new Date().toISOString();
      this.saveJustificativos(justificativos);
    }
  }

  rechazarJustificativo(id: string, motivo?: string): void {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    const justificativos = this.getJustificativos();
    const justificativo = justificativos.find(j => j.id === id);
    if (justificativo) {
      justificativo.estado = 'rechazado';
      justificativo.aprobadoPor = usuario.id;
      justificativo.fechaAprobacion = new Date().toISOString();
      if (motivo) {
        justificativo.observaciones = motivo;
      }
      this.saveJustificativos(justificativos);
    }
  }

  private saveJustificativos(justificativos: Justificativo[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(justificativos));
    this.justificativosSubject.next(justificativos);
  }
}

