import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import { SolicitudService } from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Solicitud } from '../../models/solicitud.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent implements OnInit {
  solicitudes: Solicitud[] = [];
  solicitudesPendientes: Solicitud[] = [];
  solicitudesAprobadas: Solicitud[] = [];
  solicitudesRechazadas: Solicitud[] = [];
  displayedColumns: string[] = ['tipo', 'solicitante', 'asunto', 'fecha', 'estado', 'acciones'];
  usuariosCache: Map<string, Usuario> = new Map();
  observaciones: string = '';
  solicitudSeleccionada: Solicitud | null = null;
  mostrarDialogoObservaciones: boolean = false;
  esAprobacion: boolean = false;

  constructor(
    public permissionsService: PermissionsService,
    private solicitudService: SolicitudService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadSolicitudes();
    await this.cargarUsuarios();
  }

  async loadSolicitudes(): Promise<void> {
    try {
      const usuario = this.authService.getCurrentUser();
      if (this.permissionsService.esAdmin() || this.permissionsService.esSecretario()) {
        // Admin/Secretario ve todas las solicitudes
        this.solicitudes = await this.solicitudService.getSolicitudes();
      } else {
        // Usuario normal ve solo sus solicitudes
        if (usuario) {
          this.solicitudes = await this.solicitudService.getSolicitudesBySolicitante(usuario.id);
        }
      }

      this.solicitudesPendientes = this.solicitudes.filter(s => s.estado === 'pendiente');
      this.solicitudesAprobadas = this.solicitudes.filter(s => s.estado === 'aprobada');
      this.solicitudesRechazadas = this.solicitudes.filter(s => s.estado === 'rechazada');
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      this.notificationService.showError('Error al cargar las solicitudes');
    }
  }

  async cargarUsuarios(): Promise<void> {
    try {
      const usuarios = await this.authService.getUsuarios();
      usuarios.forEach(usuario => {
        this.usuariosCache.set(usuario.id, usuario);
      });
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  getNombreSolicitante(solicitanteId: string): string {
    const usuario = this.usuariosCache.get(solicitanteId);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido';
  }

  getTipoLabel(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'inscripcion': 'Inscripción',
      'equivalencia': 'Equivalencia',
      'cambio_carrera': 'Cambio de Carrera',
      'baja': 'Baja',
      'justificativo': 'Justificativo',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'aprobada': return 'primary';
      case 'rechazada': return 'warn';
      case 'en_revision': return 'accent';
      default: return '';
    }
  }

  abrirDialogoAprobar(solicitud: Solicitud): void {
    this.solicitudSeleccionada = solicitud;
    this.esAprobacion = true;
    this.observaciones = '';
    this.mostrarDialogoObservaciones = true;
  }

  abrirDialogoRechazar(solicitud: Solicitud): void {
    this.solicitudSeleccionada = solicitud;
    this.esAprobacion = false;
    this.observaciones = '';
    this.mostrarDialogoObservaciones = true;
  }

  cerrarDialogo(): void {
    this.mostrarDialogoObservaciones = false;
    this.solicitudSeleccionada = null;
    this.observaciones = '';
  }

  async confirmarAccion(): Promise<void> {
    if (!this.solicitudSeleccionada) return;

    try {
      if (this.esAprobacion) {
        await this.solicitudService.aprobarSolicitud(
          this.solicitudSeleccionada.id,
          this.observaciones || undefined
        );
        this.notificationService.showSuccess('Solicitud aprobada correctamente');
      } else {
        await this.solicitudService.rechazarSolicitud(
          this.solicitudSeleccionada.id,
          this.observaciones || undefined
        );
        this.notificationService.showSuccess('Solicitud rechazada');
      }

      this.cerrarDialogo();
      await this.loadSolicitudes();
    } catch (error) {
      console.error('Error procesando solicitud:', error);
      this.notificationService.showError('Error al procesar la solicitud');
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

