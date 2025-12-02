import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { InstitucionService } from '../../services/institucion.service';
import { MensajeService } from '../../services/mensaje.service';
import { Usuario } from '../../models/usuario.model';
import { Institucion } from '../../models/institucion.model';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './encabezado.component.html',
  styleUrl: './encabezado.component.css'
})
export class EncabezadoComponent implements OnInit {
  mobileMenuOpen = false;
  isInApp = false; // Indica si estamos en la sección de gestión (/app/*)
  mensajesNoLeidos: number = 0;

  constructor(
    public authService: AuthService,
    public institucionService: InstitucionService,
    private mensajeService: MensajeService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Detectar si estamos en la ruta /app/*
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isInApp = event.url.startsWith('/app');
      if (this.isInApp) {
        this.cargarMensajesNoLeidos();
      }
    });
    
    // Verificar la ruta actual al cargar
    this.isInApp = this.router.url.startsWith('/app');
    if (this.isInApp) {
      await this.cargarMensajesNoLeidos();
    }
  }

  async cargarMensajesNoLeidos(): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      this.mensajesNoLeidos = 0;
      return;
    }
    
    try {
      const mensajes = await this.mensajeService.getMensajesNoLeidos(usuario.id);
      this.mensajesNoLeidos = mensajes.length;
    } catch (error) {
      console.error('Error cargando mensajes no leídos:', error);
      this.mensajesNoLeidos = 0;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  getCurrentUser(): Usuario | null {
    return this.authService.getCurrentUser();
  }

  getCurrentInstitucion(): Institucion | null {
    return this.institucionService.getCurrentInstitucion();
  }

  getRolClass(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return `role-${user.rol}`;
  }

  getRolDisplayName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'secretario': 'Secretario',
      'profesor': 'Profesor',
      'alumno': 'Alumno'
    };
    
    return roles[user.rol] || user.rol;
  }

  logout(): void {
    this.authService.logout();
    // Mantener la institución seleccionada para que pueda volver a loguearse
    this.router.navigate(['/login']);
  }
}

