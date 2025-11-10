import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { ReportService } from '../../services/report.service';
import { Alumno, Nota, Asistencia } from '../../models/alumno.model';
import { Materia } from '../../models/materia.model';

interface Advertencia {
  tipo: 'warning' | 'error' | 'info' | 'success';
  titulo: string;
  mensaje: string;
  icono: string;
}

interface MateriaResumen {
  id: string;
  nombre: string;
  promedio: number;
  asistencia: number;
  ultimaNota?: Nota;
  estado: 'regular' | 'irregular' | 'libre';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatGridListModule,
    MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Datos generales
  totalAlumnos: number = 0;
  totalMaterias: number = 0;
  promedioGeneral: number = 0;
  porcentajeAsistencia: number = 0;
  alumnos: Alumno[] = [];
  materias: Materia[] = [];
  topAlumnos: any[] = [];
  materiasPopulares: any[] = [];

  // Datos específicos por rol
  advertencias: Advertencia[] = [];
  materiasResumen: MateriaResumen[] = [];
  alumnosPorMateria: any[] = [];
  proximosEventos: any[] = [];

  displayedColumns: string[] = ['nombre', 'curso', 'promedio', 'asistencia'];

  constructor(
    public alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    if (this.permissionsService.esAlumno()) {
      this.loadDashboardAlumno();
    } else if (this.permissionsService.esProfesor()) {
      this.loadDashboardProfesor();
    } else if (this.permissionsService.esSecretario() || this.permissionsService.esAdmin()) {
      this.loadDashboardAdmin();
    }
  }

  // Dashboard para Alumno
  loadDashboardAlumno(): void {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) return;

    const alumno = this.alumnoService.getAlumnoById(usuarioId);
    if (!alumno) return;

    // Obtener materias inscritas
    const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId);
    this.materias = this.materiaService.getMaterias().filter(m => 
      inscripciones.some(i => i.materiaId === m.id)
    );

    // Calcular resumen por materia
    this.materiasResumen = this.materias.map(materia => {
      const notas = this.alumnoService.getNotasByAlumno(usuarioId)
        .filter(n => n.materiaId === materia.id);
      const asistencias = this.alumnoService.getAsistenciasByAlumno(usuarioId)
        .filter(a => a.materiaId === materia.id);
      
      const promedio = notas.length > 0 
        ? notas.reduce((sum, n) => sum + n.calificacion, 0) / notas.length 
        : 0;
      
      const asistencia = asistencias.length > 0
        ? (asistencias.filter(a => a.presente).length / asistencias.length) * 100
        : 0;

      const ultimaNota = notas.length > 0 
        ? notas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
        : undefined;

      let estado: 'regular' | 'irregular' | 'libre' = 'regular';
      if (asistencia < 75) estado = 'irregular';
      if (promedio < 4) estado = 'libre';

      return {
        id: materia.id,
        nombre: materia.nombre,
        promedio: Math.round(promedio * 100) / 100,
        asistencia: Math.round(asistencia),
        ultimaNota,
        estado
      };
    });

    // Calcular promedios generales
    const todasLasNotas = this.alumnoService.getNotasByAlumno(usuarioId);
    this.promedioGeneral = todasLasNotas.length > 0
      ? Math.round((todasLasNotas.reduce((sum, n) => sum + n.calificacion, 0) / todasLasNotas.length) * 100) / 100
      : 0;

    const todasLasAsistencias = this.alumnoService.getAsistenciasByAlumno(usuarioId);
    this.porcentajeAsistencia = todasLasAsistencias.length > 0
      ? Math.round((todasLasAsistencias.filter(a => a.presente).length / todasLasAsistencias.length) * 100)
      : 0;

    // Generar advertencias
    this.advertencias = [];
    
    if (this.porcentajeAsistencia < 75) {
      this.advertencias.push({
        tipo: 'error',
        titulo: 'Asistencia Baja',
        mensaje: `Tu asistencia es del ${this.porcentajeAsistencia}%. Debes mantener al menos 75% para estar regular.`,
        icono: 'warning'
      });
    }

    if (this.promedioGeneral < 6) {
      this.advertencias.push({
        tipo: 'warning',
        titulo: 'Promedio Bajo',
        mensaje: `Tu promedio general es ${this.promedioGeneral}. Es recomendable mejorar tus calificaciones.`,
        icono: 'trending_down'
      });
    }

    this.materiasResumen.forEach(m => {
      if (m.asistencia < 75) {
        this.advertencias.push({
          tipo: 'error',
          titulo: `Asistencia baja en ${m.nombre}`,
          mensaje: `Tu asistencia en ${m.nombre} es del ${m.asistencia}%.`,
          icono: 'event_busy'
        });
      }
      if (m.promedio < 4) {
        this.advertencias.push({
          tipo: 'error',
          titulo: `Promedio bajo en ${m.nombre}`,
          mensaje: `Tu promedio en ${m.nombre} es ${m.promedio}.`,
          icono: 'grade'
        });
      }
    });

    if (this.advertencias.length === 0) {
      this.advertencias.push({
        tipo: 'success',
        titulo: 'Todo en orden',
        mensaje: 'Tu rendimiento académico está dentro de los parámetros esperados.',
        icono: 'check_circle'
      });
    }
  }

  // Dashboard para Profesor
  loadDashboardProfesor(): void {
    const usuario = this.authService.getCurrentUser();
    const materiasAsignadas = (usuario as any).materiasAsignadas || [];
    
    this.materias = this.materiaService.getMaterias().filter(m => 
      materiasAsignadas.includes(m.id)
    );

    // Alumnos por materia
    this.alumnosPorMateria = this.materias.map(materia => {
      const inscripciones = this.materiaService.getInscripcionesByMateria(materia.id);
      const alumnos = inscripciones.map(i => 
        this.alumnoService.getAlumnoById(i.alumnoId)
      ).filter(a => a !== undefined) as Alumno[];

      return {
        materia: materia.nombre,
        cantidad: alumnos.length,
        alumnos: alumnos.map(a => ({
          nombre: `${a.nombre} ${a.apellido}`,
          promedio: this.alumnoService.getPromedioAlumno(a.id),
          asistencia: this.alumnoService.getPorcentajeAsistencia(a.id, materia.id)
        }))
      };
    });

    // Calcular totales
    const todosLosAlumnos = new Set<string>();
    this.materias.forEach(m => {
      const inscripciones = this.materiaService.getInscripcionesByMateria(m.id);
      inscripciones.forEach(i => todosLosAlumnos.add(i.alumnoId));
    });
    this.totalAlumnos = todosLosAlumnos.size;
    this.totalMaterias = this.materias.length;

    // Advertencias para profesor
    this.advertencias = [];
    
    this.materias.forEach(materia => {
      const inscripciones = this.materiaService.getInscripcionesByMateria(materia.id);
      const alumnos = inscripciones.map(i => 
        this.alumnoService.getAlumnoById(i.alumnoId)
      ).filter(a => a !== undefined) as Alumno[];

      alumnos.forEach(alumno => {
        const asistencia = this.alumnoService.getPorcentajeAsistencia(alumno.id, materia.id);
        if (asistencia < 75) {
          this.advertencias.push({
            tipo: 'warning',
            titulo: `Asistencia baja: ${alumno.nombre} ${alumno.apellido}`,
            mensaje: `En ${materia.nombre} tiene ${asistencia}% de asistencia.`,
            icono: 'person_off'
          });
        }
      });
    });

    if (this.advertencias.length === 0) {
      this.advertencias.push({
        tipo: 'info',
        titulo: 'Todo al día',
        mensaje: 'No hay alertas pendientes para tus materias.',
        icono: 'info'
      });
    }
  }

  // Dashboard para Admin/Secretario
  loadDashboardAdmin(): void {
    let alumnos = this.alumnoService.getAlumnos();
    let materias = this.materiaService.getMaterias();
    
    this.alumnos = alumnos;
    this.materias = materias;
    
    this.totalAlumnos = alumnos.length;
    this.totalMaterias = materias.length;
    
    // Calcular promedio general
    if (this.alumnos.length > 0) {
      const promedios = this.alumnos.map(alumno => 
        this.alumnoService.getPromedioAlumno(alumno.id)
      ).filter(p => p > 0);
      
      if (promedios.length > 0) {
        this.promedioGeneral = Math.round(
          (promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100
        ) / 100;
      }
    }

    // Calcular porcentaje de asistencia general
    if (this.alumnos.length > 0) {
      const porcentajes = this.alumnos.map(alumno =>
        this.alumnoService.getPorcentajeAsistencia(alumno.id)
      ).filter(p => p > 0);
      
      if (porcentajes.length > 0) {
        this.porcentajeAsistencia = Math.round(
          (porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length) * 100
        ) / 100;
      }
    }

    this.loadTopAlumnos();
    this.loadMateriasPopulares();
  }

  loadTopAlumnos(): void {
    const reportes = this.reportService.generarReporteAlumnos();
    this.topAlumnos = reportes
      .filter((r: any) => r.promedio > 0)
      .sort((a: any, b: any) => b.promedio - a.promedio)
      .slice(0, 5)
      .map((r: any) => ({
        nombre: `${r.alumno.nombre} ${r.alumno.apellido}`,
        curso: r.alumno.curso,
        promedio: r.promedio,
        asistencia: r.porcentajeAsistencia
      }));
  }

  loadMateriasPopulares(): void {
    const reportes = this.reportService.generarReporteMaterias();
    this.materiasPopulares = reportes
      .sort((a: any, b: any) => b.cantidadInscritos - a.cantidadInscritos)
      .slice(0, 5)
      .map((r: any) => ({
        nombre: r.materia.nombre,
        inscritos: r.cantidadInscritos,
        promedio: r.promedioGeneral
      }));
  }

  getPromedioAlumno(id: string): number {
    return this.alumnoService.getPromedioAlumno(id);
  }

  getPorcentajeAsistencia(id: string): number {
    return this.alumnoService.getPorcentajeAsistencia(id);
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'regular': return 'primary';
      case 'irregular': return 'warn';
      case 'libre': return 'accent';
      default: return '';
    }
  }

  getIconoAdvertencia(tipo: string): string {
    switch (tipo) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }
}
