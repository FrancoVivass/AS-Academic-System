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
      case 'coordinador':
        return this.getPermisosCoordinador();
      default:
        return this.getPermisosInvitado();
    }
  }

  // ADMINISTRADOR GENERAL - Permisos FULL CRUD en TODO
  private getPermisosAdmin(): Permisos {
    return {
      // Alumnos
      verAlumnos: true,
      editarAlumnos: true,
      crearAlumnos: true,
      eliminarAlumnos: true,
      importarAlumnos: true,
      cambiarEstadoAlumnos: true,
      
      // Materias
      verMaterias: true,
      editarMaterias: true,
      crearMaterias: true,
      eliminarMaterias: true,
      gestionarCorrelatividades: true,
      configurarMaterias: true,
      
      // Cursos
      verCursos: true,
      editarCursos: true,
      crearCursos: true,
      eliminarCursos: true,
      asignarProfesores: true,
      gestionarInscripciones: true,
      gestionarListaEspera: true,
      configurarAutoinscripcion: true,
      
      // Carreras
      verCarreras: true,
      editarCarreras: true,
      crearCarreras: true,
      eliminarCarreras: true,
      importarPlanesEstudio: true,
      gestionarEquivalencias: true,
      
      // Notas
      verNotas: true,
      editarNotas: true,
      crearNotas: true,
      eliminarNotas: true,
      gestionarRecuperatorios: true,
      aprobarNotasFinales: true,
      forzarCambioNota: true,
      generarActas: true,
      
      // Asistencias
      verAsistencias: true,
      editarAsistencias: true,
      crearAsistencias: true,
      eliminarAsistencias: true,
      cargarAsistenciaRetroactiva: true,
      gestionarJustificativos: true,
      cambiarEstadoMasivo: true,
      
      // Horarios y Aulas
      verHorarios: true,
      editarHorarios: true,
      crearHorarios: true,
      eliminarHorarios: true,
      gestionarAulas: true,
      verificarChoquesHorarios: true,
      
      // Usuarios
      verUsuarios: true,
      editarUsuarios: true,
      crearUsuarios: true,
      eliminarUsuarios: true,
      gestionarUsuarios: true,
      verHistorialUsuarios: true,
      
      // Reportes
      verReportes: true,
      exportarReportes: true,
      verEstadisticas: true,
      analizarRendimiento: true,
      verRendimientoPorMateria: true,
      verRendimientoPorProfesor: true,
      
      // Notificaciones
      enviarNotificaciones: true,
      gestionarAnuncios: true,
      crearTemplatesMensajes: true,
      
      // Auditoría
      verAuditoria: true,
      
      // Solicitudes
      verSolicitudes: true,
      aprobarSolicitudes: true,
      revisarSolicitudes: true,
      
      // Materiales
      verMateriales: true,
      subirMateriales: true,
      editarMateriales: true,
      eliminarMateriales: true,
      corregirTareas: true
    };
  }

  // SECRETARIO ACADÉMICO / PRECEPTOR - Puede hacer TODA ACCIÓN
  private getPermisosSecretario(): Permisos {
    return {
      // Alumnos
      verAlumnos: true,
      editarAlumnos: true,
      crearAlumnos: true,
      eliminarAlumnos: false,
      importarAlumnos: true,
      cambiarEstadoAlumnos: true,
      
      // Materias
      verMaterias: true,
      editarMaterias: true,
      crearMaterias: true,
      eliminarMaterias: false,
      gestionarCorrelatividades: false,
      configurarMaterias: false,
      
      // Cursos
      verCursos: true,
      editarCursos: true,
      crearCursos: true,
      eliminarCursos: false,
      asignarProfesores: false,
      gestionarInscripciones: true,
      gestionarListaEspera: true,
      configurarAutoinscripcion: false,
      
      // Carreras
      verCarreras: true,
      editarCarreras: false,
      crearCarreras: false,
      eliminarCarreras: false,
      importarPlanesEstudio: false,
      gestionarEquivalencias: false,
      
      // Notas
      verNotas: true,
      editarNotas: true,
      crearNotas: true,
      eliminarNotas: false,
      gestionarRecuperatorios: true,
      aprobarNotasFinales: false,
      forzarCambioNota: false,
      generarActas: true,
      
      // Asistencias
      verAsistencias: true,
      editarAsistencias: true,
      crearAsistencias: true,
      eliminarAsistencias: true,
      cargarAsistenciaRetroactiva: true,
      gestionarJustificativos: true,
      cambiarEstadoMasivo: true,
      
      // Horarios y Aulas
      verHorarios: true,
      editarHorarios: false,
      crearHorarios: false,
      eliminarHorarios: false,
      gestionarAulas: false,
      verificarChoquesHorarios: false,
      
      // Usuarios
      verUsuarios: true,
      editarUsuarios: false,
      crearUsuarios: false,
      eliminarUsuarios: false,
      gestionarUsuarios: false,
      verHistorialUsuarios: true,
      
      // Reportes
      verReportes: true,
      exportarReportes: true,
      verEstadisticas: true,
      analizarRendimiento: false,
      verRendimientoPorMateria: true,
      verRendimientoPorProfesor: false,
      
      // Notificaciones
      enviarNotificaciones: true,
      gestionarAnuncios: true,
      crearTemplatesMensajes: false,
      
      // Auditoría
      verAuditoria: false,
      
      // Solicitudes
      verSolicitudes: true,
      aprobarSolicitudes: true,
      revisarSolicitudes: true,
      
      // Materiales
      verMateriales: true,
      subirMateriales: false,
      editarMateriales: false,
      eliminarMateriales: false,
      corregirTareas: false
    };
  }

  // PROFESOR / DOCENTE - Gestión de curso, asistencia y notas
  private getPermisosProfesor(): Permisos {
    return {
      // Alumnos
      verAlumnos: true,
      editarAlumnos: false,
      crearAlumnos: false,
      eliminarAlumnos: false,
      importarAlumnos: false,
      cambiarEstadoAlumnos: false,
      
      // Materias
      verMaterias: true,
      editarMaterias: false,
      crearMaterias: false,
      eliminarMaterias: false,
      gestionarCorrelatividades: false,
      configurarMaterias: false,
      
      // Cursos
      verCursos: true,
      editarCursos: false,
      crearCursos: false,
      eliminarCursos: false,
      asignarProfesores: false,
      gestionarInscripciones: false,
      gestionarListaEspera: false,
      configurarAutoinscripcion: false,
      
      // Carreras
      verCarreras: true,
      editarCarreras: false,
      crearCarreras: false,
      eliminarCarreras: false,
      importarPlanesEstudio: false,
      gestionarEquivalencias: false,
      
      // Notas
      verNotas: true,
      editarNotas: true,
      crearNotas: true,
      eliminarNotas: false,
      gestionarRecuperatorios: true,
      aprobarNotasFinales: false,
      forzarCambioNota: false,
      generarActas: false,
      
      // Asistencias
      verAsistencias: true,
      editarAsistencias: true,
      crearAsistencias: true,
      eliminarAsistencias: false,
      cargarAsistenciaRetroactiva: true,
      gestionarJustificativos: false,
      cambiarEstadoMasivo: false,
      
      // Horarios y Aulas
      verHorarios: true,
      editarHorarios: false, // Puede editar si está configurado
      crearHorarios: false,
      eliminarHorarios: false,
      gestionarAulas: false,
      verificarChoquesHorarios: false,
      
      // Usuarios
      verUsuarios: false,
      editarUsuarios: false,
      crearUsuarios: false,
      eliminarUsuarios: false,
      gestionarUsuarios: false,
      verHistorialUsuarios: false,
      
      // Reportes
      verReportes: true,
      exportarReportes: false,
      verEstadisticas: true,
      analizarRendimiento: false,
      verRendimientoPorMateria: true,
      verRendimientoPorProfesor: false,
      
      // Notificaciones
      enviarNotificaciones: true,
      gestionarAnuncios: true,
      crearTemplatesMensajes: false,
      
      // Auditoría
      verAuditoria: false,
      
      // Solicitudes
      verSolicitudes: false,
      aprobarSolicitudes: false,
      revisarSolicitudes: true, // Puede revisar solicitudes de sus alumnos
      
      // Materiales
      verMateriales: true,
      subirMateriales: true,
      editarMateriales: true,
      eliminarMateriales: true,
      corregirTareas: true
    };
  }

  // ALUMNO - Solo lectura
  private getPermisosAlumno(): Permisos {
    return {
      // Alumnos
      verAlumnos: false,
      editarAlumnos: false,
      crearAlumnos: false,
      eliminarAlumnos: false,
      importarAlumnos: false,
      cambiarEstadoAlumnos: false,
      
      // Materias
      verMaterias: true,
      editarMaterias: false,
      crearMaterias: false,
      eliminarMaterias: false,
      gestionarCorrelatividades: false,
      configurarMaterias: false,
      
      // Cursos
      verCursos: true,
      editarCursos: false,
      crearCursos: false,
      eliminarCursos: false,
      asignarProfesores: false,
      gestionarInscripciones: false,
      gestionarListaEspera: false,
      configurarAutoinscripcion: false,
      
      // Carreras
      verCarreras: true,
      editarCarreras: false,
      crearCarreras: false,
      eliminarCarreras: false,
      importarPlanesEstudio: false,
      gestionarEquivalencias: false,
      
      // Notas
      verNotas: true, // Solo sus propias notas
      editarNotas: false,
      crearNotas: false,
      eliminarNotas: false,
      gestionarRecuperatorios: false,
      aprobarNotasFinales: false,
      forzarCambioNota: false,
      generarActas: false,
      
      // Asistencias
      verAsistencias: true, // Solo sus propias asistencias
      editarAsistencias: false,
      crearAsistencias: false,
      eliminarAsistencias: false,
      cargarAsistenciaRetroactiva: false,
      gestionarJustificativos: false,
      cambiarEstadoMasivo: false,
      
      // Horarios y Aulas
      verHorarios: true,
      editarHorarios: false,
      crearHorarios: false,
      eliminarHorarios: false,
      gestionarAulas: false,
      verificarChoquesHorarios: false,
      
      // Usuarios
      verUsuarios: false,
      editarUsuarios: false,
      crearUsuarios: false,
      eliminarUsuarios: false,
      gestionarUsuarios: false,
      verHistorialUsuarios: false,
      
      // Reportes
      verReportes: false,
      exportarReportes: false,
      verEstadisticas: true, // Solo sus propias estadísticas
      analizarRendimiento: false,
      verRendimientoPorMateria: false,
      verRendimientoPorProfesor: false,
      
      // Notificaciones
      enviarNotificaciones: false,
      gestionarAnuncios: false,
      crearTemplatesMensajes: false,
      
      // Auditoría
      verAuditoria: false,
      
      // Solicitudes
      verSolicitudes: true, // Solo sus propias solicitudes
      aprobarSolicitudes: false,
      revisarSolicitudes: false,
      
      // Materiales
      verMateriales: true,
      subirMateriales: false,
      editarMateriales: false,
      eliminarMateriales: false,
      corregirTareas: false
    };
  }

  // COORDINADOR / JEFE DE CARRERA
  private getPermisosCoordinador(): Permisos {
    return {
      // Alumnos
      verAlumnos: true,
      editarAlumnos: false,
      crearAlumnos: false,
      eliminarAlumnos: false,
      importarAlumnos: false,
      cambiarEstadoAlumnos: false,
      
      // Materias
      verMaterias: true,
      editarMaterias: true,
      crearMaterias: false,
      eliminarMaterias: false,
      gestionarCorrelatividades: true,
      configurarMaterias: true,
      
      // Cursos
      verCursos: true,
      editarCursos: false,
      crearCursos: false,
      eliminarCursos: false,
      asignarProfesores: false,
      gestionarInscripciones: true,
      gestionarListaEspera: false,
      configurarAutoinscripcion: false,
      
      // Carreras
      verCarreras: true,
      editarCarreras: true,
      crearCarreras: false,
      eliminarCarreras: false,
      importarPlanesEstudio: false,
      gestionarEquivalencias: true,
      
      // Notas
      verNotas: true,
      editarNotas: false,
      crearNotas: false,
      eliminarNotas: false,
      gestionarRecuperatorios: false,
      aprobarNotasFinales: true,
      forzarCambioNota: false,
      generarActas: false,
      
      // Asistencias
      verAsistencias: true,
      editarAsistencias: false,
      crearAsistencias: false,
      eliminarAsistencias: false,
      cargarAsistenciaRetroactiva: false,
      gestionarJustificativos: false,
      cambiarEstadoMasivo: false,
      
      // Horarios y Aulas
      verHorarios: true,
      editarHorarios: false,
      crearHorarios: false,
      eliminarHorarios: false,
      gestionarAulas: false,
      verificarChoquesHorarios: false,
      
      // Usuarios
      verUsuarios: true,
      editarUsuarios: false,
      crearUsuarios: false,
      eliminarUsuarios: false,
      gestionarUsuarios: false,
      verHistorialUsuarios: false,
      
      // Reportes
      verReportes: true,
      exportarReportes: true,
      verEstadisticas: true,
      analizarRendimiento: true,
      verRendimientoPorMateria: true,
      verRendimientoPorProfesor: true,
      
      // Notificaciones
      enviarNotificaciones: true,
      gestionarAnuncios: true,
      crearTemplatesMensajes: false,
      
      // Auditoría
      verAuditoria: false,
      
      // Solicitudes
      verSolicitudes: true,
      aprobarSolicitudes: true,
      revisarSolicitudes: true,
      
      // Materiales
      verMateriales: true,
      subirMateriales: false,
      editarMateriales: false,
      eliminarMateriales: false,
      corregirTareas: false
    };
  }

  private getPermisosInvitado(): Permisos {
    return {
      verAlumnos: false,
      editarAlumnos: false,
      crearAlumnos: false,
      eliminarAlumnos: false,
      importarAlumnos: false,
      cambiarEstadoAlumnos: false,
      verMaterias: false,
      editarMaterias: false,
      crearMaterias: false,
      eliminarMaterias: false,
      gestionarCorrelatividades: false,
      configurarMaterias: false,
      verCursos: false,
      editarCursos: false,
      crearCursos: false,
      eliminarCursos: false,
      asignarProfesores: false,
      gestionarInscripciones: false,
      gestionarListaEspera: false,
      configurarAutoinscripcion: false,
      verCarreras: false,
      editarCarreras: false,
      crearCarreras: false,
      eliminarCarreras: false,
      importarPlanesEstudio: false,
      gestionarEquivalencias: false,
      verNotas: false,
      editarNotas: false,
      crearNotas: false,
      eliminarNotas: false,
      gestionarRecuperatorios: false,
      aprobarNotasFinales: false,
      forzarCambioNota: false,
      generarActas: false,
      verAsistencias: false,
      editarAsistencias: false,
      crearAsistencias: false,
      eliminarAsistencias: false,
      cargarAsistenciaRetroactiva: false,
      gestionarJustificativos: false,
      cambiarEstadoMasivo: false,
      verHorarios: false,
      editarHorarios: false,
      crearHorarios: false,
      eliminarHorarios: false,
      gestionarAulas: false,
      verificarChoquesHorarios: false,
      verUsuarios: false,
      editarUsuarios: false,
      crearUsuarios: false,
      eliminarUsuarios: false,
      gestionarUsuarios: false,
      verHistorialUsuarios: false,
      verReportes: false,
      exportarReportes: false,
      verEstadisticas: false,
      analizarRendimiento: false,
      verRendimientoPorMateria: false,
      verRendimientoPorProfesor: false,
      enviarNotificaciones: false,
      gestionarAnuncios: false,
      crearTemplatesMensajes: false,
      verAuditoria: false,
      verSolicitudes: false,
      aprobarSolicitudes: false,
      revisarSolicitudes: false,
      verMateriales: false,
      subirMateriales: false,
      editarMateriales: false,
      eliminarMateriales: false,
      corregirTareas: false
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

  esCoordinador(): boolean {
    return this.authService.getCurrentUser()?.rol === 'coordinador';
  }

  esAdminOSecretario(): boolean {
    const rol = this.authService.getCurrentUser()?.rol;
    return rol === 'admin' || rol === 'secretario';
  }

  puedeGestionarCarreras(): boolean {
    return this.esAdmin();
  }

  puedeGestionarMaterias(): boolean {
    return this.esAdmin() || this.esCoordinador();
  }

  puedeGestionarCursos(): boolean {
    return this.esAdmin();
  }

  puedeGestionarUsuarios(): boolean {
    return this.esAdmin();
  }

  puedeAprobarNotas(): boolean {
    return this.esAdmin() || this.esCoordinador();
  }

  puedeGestionarJustificativos(): boolean {
    return this.esAdmin() || this.esSecretario();
  }
}
