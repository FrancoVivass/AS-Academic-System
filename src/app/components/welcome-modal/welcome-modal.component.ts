import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './welcome-modal.component.html',
  styleUrl: './welcome-modal.component.css'
})
export class WelcomeModalComponent {
  user: Usuario | null = null;

  constructor(
    private dialogRef: MatDialogRef<WelcomeModalComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { user: Usuario | null }
  ) {
    this.user = data?.user || null;
  }

  getWelcomeMessage(): string {
    if (!this.user) return '';
    
    switch (this.user.rol) {
      case 'admin':
      case 'secretario':
        return 'Bienvenido al sistema de gestión académica. Como administrador, puedes gestionar carreras, docentes, alumnos, materias y mucho más.';
      case 'profesor':
        return 'Bienvenido al sistema. Como profesor, puedes gestionar tus materias, registrar asistencias, cargar notas y comunicarte con alumnos.';
      case 'alumno':
        return 'Bienvenido al sistema. Como alumno, puedes ver tus materias, calificaciones, asistencias y comunicarte con profesores.';
      default:
        return 'Bienvenido al sistema de gestión académica.';
    }
  }

  getHelpRoute(): string {
    if (!this.user) return '/app/como-funciona';
    
    switch (this.user.rol) {
      case 'admin':
      case 'secretario':
        return '/app/como-funciona/admin';
      case 'profesor':
        return '/app/como-funciona/profesor';
      case 'alumno':
        return '/app/como-funciona/alumno';
      default:
        return '/app/como-funciona';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onGoToHelp(): void {
    const route = this.getHelpRoute();
    this.dialogRef.close();
    this.router.navigate([route]);
  }
}

