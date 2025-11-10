import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ReportService, ReporteAlumno, ReporteMateria } from '../../services/report.service';
import { NotificationService } from '../../services/notification.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatGridListModule
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  reportesAlumnos: ReporteAlumno[] = [];
  reportesMaterias: ReporteMateria[] = [];

  displayedColumnsAlumnos: string[] = ['alumno', 'curso', 'promedio', 'asistencia', 'notas', 'materias'];
  displayedColumnsMaterias: string[] = ['materia', 'profesor', 'inscritos', 'promedio', 'asistencia'];

  // Gráficos
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  // Estadísticas
  estadisticas: any = {
    totalAlumnos: 0,
    totalMaterias: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0,
    alumnosRegulares: 0,
    alumnosIrregulares: 0
  };

  constructor(
    private reportService: ReportService,
    private notificationService: NotificationService,
    private alumnoService: AlumnoService,
    private materiaService: MateriaService
  ) {}

  ngOnInit(): void {
    this.loadReportes();
    this.loadEstadisticas();
    this.loadChartData();
  }

  loadReportes(): void {
    this.reportesAlumnos = this.reportService.generarReporteAlumnos();
    this.reportesMaterias = this.reportService.generarReporteMaterias();
  }

  loadEstadisticas(): void {
    const alumnos = this.alumnoService.getAlumnos();
    const materias = this.materiaService.getMaterias();
    
    this.estadisticas.totalAlumnos = alumnos.length;
    this.estadisticas.totalMaterias = materias.length;

    if (this.reportesAlumnos.length > 0) {
      const promedios = this.reportesAlumnos.map(r => r.promedio).filter(p => p > 0);
      const asistencias = this.reportesAlumnos.map(r => r.porcentajeAsistencia).filter(a => a > 0);
      
      this.estadisticas.promedioGeneral = promedios.length > 0
        ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100
        : 0;
      
      this.estadisticas.asistenciaPromedio = asistencias.length > 0
        ? Math.round((asistencias.reduce((a, b) => a + b, 0) / asistencias.length) * 100) / 100
        : 0;

      this.estadisticas.alumnosRegulares = this.reportesAlumnos.filter(r => 
        r.promedio >= 6 && r.porcentajeAsistencia >= 75
      ).length;

      this.estadisticas.alumnosIrregulares = this.reportesAlumnos.length - this.estadisticas.alumnosRegulares;
    }
  }

  loadChartData(): void {
    // Gráfico de barras - Promedios por curso
    const cursos = [...new Set(this.reportesAlumnos.map(r => r.alumno.curso))].sort();
    const promediosPorCurso = cursos.map(curso => {
      const alumnosCurso = this.reportesAlumnos.filter(r => r.alumno.curso === curso);
      const promedios = alumnosCurso.map(r => r.promedio).filter(p => p > 0);
      return promedios.length > 0
        ? promedios.reduce((a, b) => a + b, 0) / promedios.length
        : 0;
    });

    this.barChartData = {
      labels: cursos,
      datasets: [{
        label: 'Promedio por Curso',
        data: promediosPorCurso,
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1
      }]
    };

    // Gráfico de pastel - Distribución de regularidad
    this.pieChartData = {
      labels: ['Alumnos Regulares', 'Alumnos Irregulares'],
      datasets: [{
        data: [this.estadisticas.alumnosRegulares, this.estadisticas.alumnosIrregulares],
        backgroundColor: ['rgba(76, 175, 80, 0.8)', 'rgba(244, 67, 54, 0.8)']
      }]
    };

    // Gráfico de línea - Top 5 materias por inscritos
    const topMaterias = [...this.reportesMaterias]
      .sort((a, b) => b.cantidadInscritos - a.cantidadInscritos)
      .slice(0, 5);

    this.lineChartData = {
      labels: topMaterias.map(m => m.materia.nombre),
      datasets: [{
        label: 'Alumnos Inscritos',
        data: topMaterias.map(m => m.cantidadInscritos),
        borderColor: 'rgba(156, 39, 176, 1)',
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        tension: 0.4
      }]
    };
  }

  exportarReporte(): void {
    const csv = this.reportService.exportarReporteCompleto();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_completo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.showSuccess('Reporte exportado correctamente');
  }

  exportarReporteAlumnos(): void {
    const header = 'Nombre,Apellido,DNI,Curso,Promedio,Asistencia%,Notas,Asistencias,Materias\n';
    const rows = this.reportesAlumnos.map(r => 
      `${r.alumno.nombre},${r.alumno.apellido},${r.alumno.dni},${r.alumno.curso},${r.promedio},${r.porcentajeAsistencia},${r.cantidadNotas},${r.cantidadAsistencias},${r.materiasInscritas}`
    ).join('\n');
    const csv = header + rows;
    this.downloadCSV(csv, 'reporte_alumnos');
  }

  exportarReporteMaterias(): void {
    const header = 'Nombre,Código,Profesor,Inscritos,Promedio General,Asistencia%\n';
    const rows = this.reportesMaterias.map(r => 
      `${r.materia.nombre},${r.materia.codigo},${r.materia.profesor},${r.cantidadInscritos},${r.promedioGeneral},${r.porcentajeAsistencia}`
    ).join('\n');
    const csv = header + rows;
    this.downloadCSV(csv, 'reporte_materias');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.showSuccess('Reporte exportado correctamente');
  }
}
