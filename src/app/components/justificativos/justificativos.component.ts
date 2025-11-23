import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { JustificativoService } from '../../services/justificativo.service';
import { AlumnoService } from '../../services/alumno.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { Justificativo } from '../../models/justificativo.model';

@Component({
  selector: 'app-justificativos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './justificativos.component.html',
  styleUrl: './justificativos.component.css'
})
export class JustificativosComponent implements OnInit {
  justificativos: Justificativo[] = [];
  justificativosPendientes: Justificativo[] = [];
  displayedColumns: string[] = ['alumno', 'fecha', 'tipo', 'motivo', 'estado', 'acciones'];

  constructor(
    private justificativoService: JustificativoService,
    private alumnoService: AlumnoService,
    private notificationService: NotificationService,
    public permissionsService: PermissionsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadJustificativos();
  }

  private nombresAlumnos: Map<string, string> = new Map();

  async loadJustificativos(): Promise<void> {
    this.justificativos = await this.justificativoService.getJustificativos();
    this.justificativosPendientes = await this.justificativoService.getJustificativosPendientes();
    await this.actualizarCacheAlumnos();
  }

  async actualizarCacheAlumnos(): Promise<void> {
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    todosLosAlumnos.forEach(alumno => {
      this.nombresAlumnos.set(alumno.id, `${alumno.nombre} ${alumno.apellido}`);
    });
  }

  async aprobarJustificativo(id: string): Promise<void> {
    await this.justificativoService.aprobarJustificativo(id);
    this.notificationService.showSuccess('Justificativo aprobado');
    await this.loadJustificativos();
  }

  async rechazarJustificativo(id: string): Promise<void> {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      await this.justificativoService.rechazarJustificativo(id, motivo);
      this.notificationService.showSuccess('Justificativo rechazado');
      await this.loadJustificativos();
    }
  }

  getAlumnoNombre(alumnoId: string): string {
    return this.nombresAlumnos.get(alumnoId) || 'Desconocido';
  }

  verComprobante(url: string): void {
    window.open(url, '_blank');
  }
}

