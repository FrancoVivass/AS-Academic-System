import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  usuario: Usuario | null = null;
  formData: Partial<Usuario> = {};

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
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
}

