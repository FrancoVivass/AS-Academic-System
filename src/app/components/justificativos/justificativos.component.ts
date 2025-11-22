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

  ngOnInit(): void {
    this.loadJustificativos();
  }

  loadJustificativos(): void {
    this.justificativos = this.justificativoService.getJustificativos();
    this.justificativosPendientes = this.justificativoService.getJustificativosPendientes();
  }

  aprobarJustificativo(id: string): void {
    this.justificativoService.aprobarJustificativo(id);
    this.notificationService.showSuccess('Justificativo aprobado');
    this.loadJustificativos();
  }

  rechazarJustificativo(id: string): void {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      this.justificativoService.rechazarJustificativo(id, motivo);
      this.notificationService.showSuccess('Justificativo rechazado');
      this.loadJustificativos();
    }
  }

  getAlumnoNombre(alumnoId: string): string {
    const alumno = this.alumnoService.getAlumnoById(alumnoId);
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido';
  }

  verComprobante(url: string): void {
    window.open(url, '_blank');
  }
}

