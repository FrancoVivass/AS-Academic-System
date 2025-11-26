import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  usuario: Usuario | null = null;
  formData: Partial<Usuario> = {};
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  } = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showPasswordForm: boolean = false;
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getCurrentUser();
    if (this.usuario) {
      this.formData = { ...this.usuario };
    }
  }

  guardarPerfil(): void {
    if (!this.usuario || !this.formData.nombre || !this.formData.email) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const usuarioActualizado: Usuario = {
      ...this.usuario,
      ...this.formData
    } as Usuario;

    this.authService.updateUser(usuarioActualizado);
    alert('Perfil actualizado correctamente');
  }

  exportarDatos(): void {
    // Simulación de exportación a CSV
    const alumnos = JSON.parse(localStorage.getItem('gestion_academica_alumnos') || '[]');
    const materias = JSON.parse(localStorage.getItem('gestion_academica_materias') || '[]');
    const notas = JSON.parse(localStorage.getItem('gestion_academica_notas') || '[]');
    const asistencias = JSON.parse(localStorage.getItem('gestion_academica_asistencias') || '[]');

    let csv = 'Datos del Sistema de Gestión Académica\n\n';
    csv += 'ALUMNOS\n';
    csv += 'Nombre,Apellido,DNI,Email,Curso\n';
    alumnos.forEach((a: any) => {
      csv += `${a.nombre},${a.apellido},${a.dni},${a.email},${a.curso}\n`;
    });

    csv += '\nMATERIAS\n';
    csv += 'Nombre,Código,Profesor,Curso\n';
    materias.forEach((m: any) => {
      csv += `${m.nombre},${m.codigo},${m.profesor},${m.curso}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestion_academica_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  limpiarDatos(): void {
    if (confirm('¿Está seguro de limpiar todos los datos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('gestion_academica_alumnos');
      localStorage.removeItem('gestion_academica_materias');
      localStorage.removeItem('gestion_academica_notas');
      localStorage.removeItem('gestion_academica_asistencias');
      localStorage.removeItem('gestion_academica_inscripciones');
      alert('Datos limpiados. Por favor recargue la página.');
      window.location.reload();
    }
  }

  async cambiarContrasena(): Promise<void> {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.notificationService.showError('Por favor complete todos los campos');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.notificationService.showError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (this.passwordForm.newPassword.length < 4) {
      this.notificationService.showError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    try {
      // Verificar contraseña actual
      const usuarioCompleto = await this.authService.getUsuarioById(this.usuario?.id || '');
      if (!usuarioCompleto) {
        this.notificationService.showError('No se pudo verificar su identidad');
        return;
      }

      if (usuarioCompleto.password !== this.passwordForm.currentPassword) {
        this.notificationService.showError('La contraseña actual es incorrecta');
        return;
      }

      // Actualizar contraseña
      const usuarioActualizado: Usuario = {
        ...usuarioCompleto,
        password: this.passwordForm.newPassword
      };

      await this.authService.updateUser(usuarioActualizado);
      
      // Limpiar formulario
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.showPasswordForm = false;

      this.notificationService.showSuccess('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      this.notificationService.showError('Error al cambiar la contraseña. Por favor, intente nuevamente.');
    }
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }
}

