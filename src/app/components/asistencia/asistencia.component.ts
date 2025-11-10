import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Asistencia } from '../../models/alumno.model';
import { Alumno } from '../../models/alumno.model';
import { Materia } from '../../models/materia.model';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.css'
})
export class AsistenciaComponent implements OnInit {
  alumnos: Alumno[] = [];
  materias: Materia[] = [];
  asistencias: Asistencia[] = [];
  
  materiaSeleccionada: string = '';
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  busqueda: string = '';

  constructor(
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    let alumnos = this.alumnoService.getAlumnos();
    let materias = this.materiaService.getMaterias();
    
    // Si es profesor, filtrar por sus materias
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      materias = materias.filter(m => materiasAsignadas.includes(m.id));
      
      // Alumnos de sus materias
      const inscripciones = this.materiaService.getInscripcionesByMateria(materiasAsignadas[0] || '');
      const idsAlumnos = [...new Set(inscripciones.map(i => i.alumnoId))];
      alumnos = alumnos.filter(a => idsAlumnos.includes(a.id));
    }
    // Si es alumno, solo sus datos
    else if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      alumnos = alumnos.filter(a => a.id === usuarioId);
      const asistencias = this.alumnoService.getAsistenciasByAlumno(usuarioId || '');
      const idsMaterias = [...new Set(asistencias.map(a => a.materiaId))];
      materias = materias.filter(m => idsMaterias.includes(m.id));
    }
    
    this.alumnos = alumnos;
    this.materias = materias;
    this.cargarAsistencias();
  }

  cargarAsistencias(): void {
    if (this.materiaSeleccionada && this.fechaSeleccionada) {
      this.asistencias = this.alumnoService.getAsistenciasByMateria(this.materiaSeleccionada)
        .filter(a => a.fecha.startsWith(this.fechaSeleccionada));
    } else {
      this.asistencias = [];
    }
  }

  onMateriaChange(): void {
    this.cargarAsistencias();
  }

  onFechaChange(): void {
    this.cargarAsistencias();
  }

  getAsistenciaAlumno(alumnoId: string): Asistencia | undefined {
    return this.asistencias.find(a => a.alumnoId === alumnoId);
  }

  toggleAsistencia(alumno: Alumno): void {
    if (!this.permissionsService.puedeVer('editarAsistencias')) {
      this.notificationService.showError('No tiene permisos para modificar asistencia');
      return;
    }
    
    if (!this.materiaSeleccionada || !this.fechaSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una materia y una fecha');
      return;
    }
    
    // Si es profesor, verificar que la materia esté asignada
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      if (!materiasAsignadas.includes(this.materiaSeleccionada)) {
        this.notificationService.showError('No tiene permisos para modificar asistencia de esta materia');
        return;
      }
    }

    const asistenciaExistente = this.getAsistenciaAlumno(alumno.id);

    if (asistenciaExistente) {
      const asistenciaActualizada: Asistencia = {
        ...asistenciaExistente,
        presente: !asistenciaExistente.presente
      };
      this.alumnoService.updateAsistencia(asistenciaActualizada);
    } else {
      const nuevaAsistencia: Asistencia = {
        id: Date.now().toString(),
        alumnoId: alumno.id,
        materiaId: this.materiaSeleccionada,
        fecha: this.fechaSeleccionada,
        presente: true,
        justificada: false
      };
      this.alumnoService.addAsistencia(nuevaAsistencia);
    }

    this.cargarAsistencias();
  }

  getAlumnosFiltrados(): Alumno[] {
    if (!this.materiaSeleccionada) return [];

    const inscripciones = this.materiaService.getInscripcionesByMateria(this.materiaSeleccionada);
    const idsInscritos = inscripciones.map(i => i.alumnoId);
    let alumnosFiltrados = this.alumnos.filter(a => idsInscritos.includes(a.id));

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      alumnosFiltrados = alumnosFiltrados.filter(a =>
        a.nombre.toLowerCase().includes(busquedaLower) ||
        a.apellido.toLowerCase().includes(busquedaLower)
      );
    }

    return alumnosFiltrados;
  }

  getPorcentajeAsistencia(alumnoId: string): number {
    return this.alumnoService.getPorcentajeAsistencia(alumnoId, this.materiaSeleccionada);
  }

  getNombreMateria(materiaId: string): string {
    const materia = this.materias.find(m => m.id === materiaId);
    return materia ? materia.nombre : '';
  }
}

