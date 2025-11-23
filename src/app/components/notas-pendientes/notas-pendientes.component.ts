import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { AlumnoService } from '../../services/alumno.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { AuthService } from '../../services/auth.service';
import { Nota } from '../../models/alumno.model';

@Component({
  selector: 'app-notas-pendientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './notas-pendientes.component.html',
  styleUrl: './notas-pendientes.component.css'
})
export class NotasPendientesComponent implements OnInit {
  notasPendientes: Nota[] = [];
  displayedColumns: string[] = ['alumno', 'materia', 'calificacion', 'tipo', 'fecha', 'acciones'];

  constructor(
    private alumnoService: AlumnoService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public permissionsService: PermissionsService
  ) {}

  private nombresAlumnos: Map<string, string> = new Map();

  async ngOnInit(): Promise<void> {
    await this.actualizarCacheAlumnos();
    await this.loadNotasPendientes();
  }

  async actualizarCacheAlumnos(): Promise<void> {
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    todosLosAlumnos.forEach(alumno => {
      this.nombresAlumnos.set(alumno.id, `${alumno.nombre} ${alumno.apellido}`);
    });
  }

  async loadNotasPendientes(): Promise<void> {
    const todasLasNotas = await this.alumnoService.getNotas();
    this.notasPendientes = todasLasNotas.filter(
      n => n.estado === 'pendiente_revision' || n.estado === 'cargada'
    );
  }

  async aprobarNota(id: string): Promise<void> {
    const todasLasNotas = await this.alumnoService.getNotas();
    const nota = todasLasNotas.find(n => n.id === id);
    if (nota) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const notaActualizada: Nota = {
          ...nota,
          estado: 'aprobada',
          aprobadaPor: usuario.id,
          fechaAprobacion: new Date().toISOString()
        };
        await this.alumnoService.updateNota(notaActualizada);
        this.notificationService.showSuccess('Nota aprobada');
        await this.loadNotasPendientes();
      }
    }
  }

  async rechazarNota(id: string): Promise<void> {
    const todasLasNotas = await this.alumnoService.getNotas();
    const nota = todasLasNotas.find(n => n.id === id);
    if (nota) {
      const notaActualizada: Nota = {
        ...nota,
        estado: 'rechazada'
      };
      await this.alumnoService.updateNota(notaActualizada);
      this.notificationService.showSuccess('Nota rechazada');
      await this.loadNotasPendientes();
    }
  }

  getAlumnoNombre(alumnoId: string): string {
    return this.nombresAlumnos.get(alumnoId) || 'Desconocido';
  }
}

