import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MensajeService } from '../../services/mensaje.service';
import { AuthService } from '../../services/auth.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { NotificationService } from '../../services/notification.service';
import { Mensaje } from '../../models/mensaje.model';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatSelectModule
  ],
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.css'
})
export class MensajesComponent implements OnInit {
  mensajes: Mensaje[] = [];
  mensajesNoLeidos: Mensaje[] = [];
  nuevoMensaje: Partial<Mensaje> = {
    asunto: '',
    contenido: ''
  };
  destinatarioSeleccionado: string = '';

  constructor(
    private mensajeService: MensajeService,
    private authService: AuthService,
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.actualizarCache();
    await this.loadMensajes();
  }

  async loadMensajes(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (usuarioId) {
      this.mensajes = await this.mensajeService.getMensajesByUsuario(usuarioId);
      this.mensajesNoLeidos = await this.mensajeService.getMensajesNoLeidos(usuarioId);
    }
  }

  async enviarMensaje(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId || !this.destinatarioSeleccionado || !this.nuevoMensaje.asunto || !this.nuevoMensaje.contenido) {
      this.notificationService.showWarning('Por favor complete todos los campos');
      return;
    }

    const mensaje: Mensaje = {
      id: Date.now().toString(),
      remitenteId: usuarioId,
      destinatarioId: this.destinatarioSeleccionado,
      asunto: this.nuevoMensaje.asunto!,
      contenido: this.nuevoMensaje.contenido!,
      fecha: new Date().toISOString(),
      leido: false,
      importante: false
    };

    await this.mensajeService.addMensaje(mensaje);
    this.notificationService.showSuccess('Mensaje enviado correctamente');
    this.nuevoMensaje = { asunto: '', contenido: '' };
    this.destinatarioSeleccionado = '';
    await this.loadMensajes();
  }

  async marcarComoLeido(mensajeId: string): Promise<void> {
    await this.mensajeService.marcarComoLeido(mensajeId);
    await this.loadMensajes();
  }

  // Cache para nombres de usuarios
  private nombresUsuarios: Map<string, string> = new Map();
  private alumnosCache: any[] = [];

  async actualizarCache(): Promise<void> {
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    this.alumnosCache = todosLosAlumnos;
    todosLosAlumnos.forEach(alumno => {
      this.nombresUsuarios.set(alumno.id, `${alumno.nombre} ${alumno.apellido}`);
    });
  }

  getNombreUsuario(usuarioId: string): string {
    return this.nombresUsuarios.get(usuarioId) || 'Usuario';
  }

  getAlumnos() {
    return this.alumnosCache;
  }

  esRemitente(mensaje: Mensaje): boolean {
    return mensaje.remitenteId === this.authService.getCurrentUser()?.id;
  }
}

