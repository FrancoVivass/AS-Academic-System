import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Auditoria, AccionAuditoria, EntidadAuditoria } from '../models/auditoria.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly STORAGE_KEY = 'gestion_academica_auditoria';
  private auditoriaSubject = new BehaviorSubject<Auditoria[]>(this.getAuditoria());
  public auditoria$ = this.auditoriaSubject.asObservable();

  constructor(private authService: AuthService) {}

  getAuditoria(): Auditoria[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getAuditoriaByUsuario(usuarioId: string): Auditoria[] {
    return this.getAuditoria().filter(a => a.usuarioId === usuarioId);
  }

  getAuditoriaByEntidad(entidad: EntidadAuditoria, entidadId: string): Auditoria[] {
    return this.getAuditoria().filter(
      a => a.entidad === entidad && a.entidadId === entidadId
    );
  }

  registrarAccion(
    accion: AccionAuditoria,
    entidad: EntidadAuditoria,
    entidadId: string,
    tablaAfectada: string,
    datosAntes?: any,
    datosDespues?: any,
    observaciones?: string
  ): void {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    const registro: Auditoria = {
      id: Date.now().toString(),
      usuarioId: usuario.id,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
      accion,
      entidad,
      entidadId,
      tablaAfectada,
      datosAntes,
      datosDespues,
      fecha: new Date().toISOString(),
      observaciones
    };

    const auditoria = this.getAuditoria();
    auditoria.push(registro);
    
    // Mantener solo los últimos 1000 registros
    if (auditoria.length > 1000) {
      auditoria.shift();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(auditoria));
    this.auditoriaSubject.next(auditoria);
  }

  getAuditoriaReciente(limite: number = 50): Auditoria[] {
    return this.getAuditoria()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
  }
}

