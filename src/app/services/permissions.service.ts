import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Permisos } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(private authService: AuthService) {}

  getPermisos(): Permisos {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      return this.getPermisosInvitado();
    }

    switch (usuario.rol) {
      case 'admin':
        return this.getPermisosAdmin();
      case 'secretario':
        return this.getPermisosSecretario();
      case 'profesor':
        return this.getPermisosProfesor();
      case 'alumno':
        return this.getPermisosAlumno();
      default:
        return this.getPermisosInvitado();
    }
  }

  private getPermisosAdmin(): Permisos {
    return {
      verAlumnos: true,
      editarAlumnos: true,
      verMaterias: true,
      editarMaterias: true,
      verNotas: true,
      editarNotas: true,
      verAsistencias: true,
      editarAsistencias: true,
      verReportes: true,
      gestionarUsuarios: true
    };
  }

  private getPermisosSecretario(): Permisos {
    return {
      verAlumnos: true,
      editarAlumnos: true, // Puede asociar/desasociar alumnos
      verMaterias: true,
      editarMaterias: true, // Secretario puede crear y editar materias
      verNotas: true,
      editarNotas: true, // Secretario puede editar notas
      verAsistencias: true,
      editarAsistencias: true, // Secretario puede editar asistencias
      verReportes: true,
      gestionarUsuarios: false
    };
  }

  private getPermisosProfesor(): Permisos {
    return {
      verAlumnos: true,
      editarAlumnos: false,
      verMaterias: true,
      editarMaterias: false,
      verNotas: true,
      editarNotas: true, // Puede cargar notas
      verAsistencias: true,
      editarAsistencias: true, // Puede marcar asistencia
      verReportes: true,
      gestionarUsuarios: false
    };
  }

  private getPermisosAlumno(): Permisos {
    return {
      verAlumnos: false,
      editarAlumnos: false,
      verMaterias: true,
      editarMaterias: false,
      verNotas: true, // Solo sus propias notas
      editarNotas: false,
      verAsistencias: true, // Solo sus propias asistencias
      editarAsistencias: false,
      verReportes: false,
      gestionarUsuarios: false
    };
  }

  private getPermisosInvitado(): Permisos {
    return {
      verAlumnos: false,
      editarAlumnos: false,
      verMaterias: false,
      editarMaterias: false,
      verNotas: false,
      editarNotas: false,
      verAsistencias: false,
      editarAsistencias: false,
      verReportes: false,
      gestionarUsuarios: false
    };
  }

  puedeVer(permiso: keyof Permisos): boolean {
    return this.getPermisos()[permiso];
  }

  esAdmin(): boolean {
    return this.authService.getCurrentUser()?.rol === 'admin';
  }

  esSecretario(): boolean {
    return this.authService.getCurrentUser()?.rol === 'secretario';
  }

  esProfesor(): boolean {
    return this.authService.getCurrentUser()?.rol === 'profesor';
  }

  esAlumno(): boolean {
    return this.authService.getCurrentUser()?.rol === 'alumno';
  }
}

