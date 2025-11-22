import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ReportService, ReporteAlumno, ReporteMateria } from '../../services/report.service';
import { NotificationService } from '../../services/notification.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { CursoService } from '../../services/curso.service';
import { DocenteService } from '../../services/docente.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatGridListModule,
    MatSelectModule,
    MatFormFieldModule,
    NgChartsModule
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {

  reportesAlumnos: ReporteAlumno[] = [];
  reportesMaterias: ReporteMateria[] = [];

  displayedColumnsAlumnos: string[] = ['alumno', 'curso', 'promedio', 'asistencia', 'notas', 'materias'];
  displayedColumnsMaterias: string[] = ['materia', 'profesor', 'inscritos', 'promedio', 'asistencia'];

  // Gráfico de Barras - Promedios por Curso
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 500
          },
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Promedio General por Curso',
        font: {
          size: 16,
          weight: 600
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 600
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Promedio',
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Promedio',
      data: [],
      backgroundColor: 'rgba(25, 118, 210, 0.8)',
      borderColor: 'rgba(25, 118, 210, 1)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  // Gráfico de Pastel - Distribución de Regularidad
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          font: {
            size: 12,
            weight: 500
          },
          padding: 15,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Distribución de Regularidad',
        font: {
          size: 16,
          weight: 600
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: ['Alumnos Regulares', 'Alumnos Irregulares'],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(76, 175, 80, 0.8)',
        'rgba(244, 67, 54, 0.8)'
      ],
      borderColor: [
        'rgba(76, 175, 80, 1)',
        'rgba(244, 67, 54, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  // Gráfico de Línea - Top 5 Materias
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 500
          },
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Top 5 Materias por Cantidad de Inscritos',
        font: {
          size: 16,
          weight: 600
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Cantidad de Inscritos',
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Alumnos Inscritos',
      data: [],
      borderColor: 'rgba(156, 39, 176, 1)',
      backgroundColor: 'rgba(156, 39, 176, 0.2)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgba(156, 39, 176, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  // Gráfico de Dona - Distribución de Asistencia
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          font: {
            size: 12,
            weight: 500
          },
          padding: 15,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Distribución de Asistencia',
        font: {
          size: 16,
          weight: 600
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    }
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Excelente (90-100%)', 'Buena (75-89%)', 'Regular (60-74%)', 'Baja (<60%)'],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(76, 175, 80, 0.8)',
        'rgba(33, 150, 243, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(244, 67, 54, 0.8)'
      ],
      borderColor: [
        'rgba(76, 175, 80, 1)',
        'rgba(33, 150, 243, 1)',
        'rgba(255, 152, 0, 1)',
        'rgba(244, 67, 54, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 8
    }]
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

  // Filtros
  filtroCarrera: string = '';
  filtroMateria: string = '';
  filtroCurso: string = '';
  carreras: any[] = [];
  materiasFiltradas: any[] = [];
  cursosFiltrados: any[] = [];

  constructor(
    private reportService: ReportService,
    private notificationService: NotificationService,
    private alumnoService: AlumnoService,
    public materiaService: MateriaService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private cursoService: CursoService,
    private docenteService: DocenteService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadReportes();
    this.loadEstadisticas();
    this.loadChartData();
  }

  loadData(): void {
    // Cargar datos base según el rol
    if (this.permissionsService.esAdmin() || this.permissionsService.esSecretario()) {
      // Admin/Secretario: cargar todas las carreras, materias y cursos para filtros
      // Esto se puede hacer si hay un servicio de carreras
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: cargar solo sus materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const docente = this.docenteService.getDocenteById(usuario.id);
        if (docente && docente.materiasAsignadas) {
          const todasLasMaterias = this.materiaService.getMaterias();
          this.materiasFiltradas = todasLasMaterias.filter(m => 
            docente.materiasAsignadas!.includes(m.id)
          );
        }
      }
    }
  }

  loadReportes(): void {
    let reportesAlumnos = this.reportService.generarReporteAlumnos();
    let reportesMaterias = this.reportService.generarReporteMaterias();

    // Filtrar según el rol del usuario
    if (this.permissionsService.esAlumno()) {
      // Alumno: solo sus propios datos
      const usuarioId = this.authService.getCurrentUser()?.id;
      reportesAlumnos = reportesAlumnos.filter(r => r.alumno.id === usuarioId);
      // Para materias, solo las que está inscrito
      const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId || '');
      const materiasIds = inscripciones.map(i => i.materiaId);
      reportesMaterias = reportesMaterias.filter(r => materiasIds.includes(r.materia.id));
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: solo sus materias y alumnos de esas materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const docente = this.docenteService.getDocenteById(usuario.id);
        if (docente && docente.materiasAsignadas) {
          // Filtrar materias
          reportesMaterias = reportesMaterias.filter(r => 
            docente.materiasAsignadas!.includes(r.materia.id)
          );
          
          // Filtrar alumnos: solo los que están en cursos con sus materias
          const cursos = this.cursoService.getCursos();
          const cursosConMaterias = cursos.filter(c => 
            c.materias.some(mId => docente.materiasAsignadas!.includes(mId))
          );
          const idsAlumnos = [...new Set(cursosConMaterias.flatMap(c => c.alumnos || []))];
          reportesAlumnos = reportesAlumnos.filter(r => idsAlumnos.includes(r.alumno.id));
        } else {
          // Fallback: buscar por nombre del profesor
          const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
          reportesMaterias = reportesMaterias.filter(r => 
            r.materia.profesor === nombreProfesor || r.materia.profesor?.includes(usuario.nombre)
          );
          const materiasIds = reportesMaterias.map(r => r.materia.id);
          const cursos = this.cursoService.getCursos();
          const cursosConMaterias = cursos.filter(c => 
            c.materias.some(mId => materiasIds.includes(mId))
          );
          const idsAlumnos = [...new Set(cursosConMaterias.flatMap(c => c.alumnos || []))];
          reportesAlumnos = reportesAlumnos.filter(r => idsAlumnos.includes(r.alumno.id));
        }
      }
    }
    // Admin/Secretario: todos los datos (sin filtrar)

    // Aplicar filtros adicionales si existen
    if (this.filtroMateria) {
      reportesAlumnos = reportesAlumnos.filter(r => {
        const inscripciones = this.materiaService.getInscripcionesByAlumno(r.alumno.id);
        return inscripciones.some(i => i.materiaId === this.filtroMateria);
      });
      reportesMaterias = reportesMaterias.filter(r => r.materia.id === this.filtroMateria);
    }

    if (this.filtroCurso) {
      reportesAlumnos = reportesAlumnos.filter(r => r.alumno.curso === this.filtroCurso);
    }

    this.reportesAlumnos = reportesAlumnos;
    this.reportesMaterias = reportesMaterias;
  }

  loadEstadisticas(): void {
    // Cargar datos según el rol
    let alumnos = this.alumnoService.getAlumnos();
    let materias = this.materiaService.getMaterias();

    if (this.permissionsService.esAlumno()) {
      // Alumno: solo sus datos
      const usuarioId = this.authService.getCurrentUser()?.id;
      alumnos = alumnos.filter(a => a.id === usuarioId);
      const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId || '');
      const materiasIds = inscripciones.map(i => i.materiaId);
      materias = materias.filter(m => materiasIds.includes(m.id));
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: solo sus materias y alumnos de esas materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const docente = this.docenteService.getDocenteById(usuario.id);
        if (docente && docente.materiasAsignadas) {
          materias = materias.filter(m => docente.materiasAsignadas!.includes(m.id));
          const cursos = this.cursoService.getCursos();
          const cursosConMaterias = cursos.filter(c => 
            c.materias.some(mId => docente.materiasAsignadas!.includes(mId))
          );
          const idsAlumnos = [...new Set(cursosConMaterias.flatMap(c => c.alumnos || []))];
          alumnos = alumnos.filter(a => idsAlumnos.includes(a.id));
        } else {
          // Fallback: buscar por nombre
          const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
          materias = materias.filter(m => 
            m.profesor === nombreProfesor || m.profesor?.includes(usuario.nombre)
          );
        }
      }
    }
    // Admin/Secretario: todos los datos
    
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
        ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100
        : 0;
    });

    this.barChartData = {
      labels: cursos.length > 0 ? cursos : ['Sin datos'],
      datasets: [{
        label: 'Promedio',
        data: promediosPorCurso.length > 0 ? promediosPorCurso : [0],
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    };

    // Gráfico de pastel - Distribución de regularidad
    this.pieChartData = {
      labels: ['Alumnos Regulares', 'Alumnos Irregulares'],
      datasets: [{
        data: [
          this.estadisticas.alumnosRegulares || 0,
          this.estadisticas.alumnosIrregulares || 0
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(244, 67, 54, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    };

    // Gráfico de línea - Top 5 materias por inscritos
    const topMaterias = [...this.reportesMaterias]
      .sort((a, b) => b.cantidadInscritos - a.cantidadInscritos)
      .slice(0, 5);

    this.lineChartData = {
      labels: topMaterias.length > 0 
        ? topMaterias.map(m => m.materia.nombre.length > 20 ? m.materia.nombre.substring(0, 20) + '...' : m.materia.nombre)
        : ['Sin datos'],
      datasets: [{
        label: 'Alumnos Inscritos',
        data: topMaterias.length > 0 ? topMaterias.map(m => m.cantidadInscritos) : [0],
        borderColor: 'rgba(156, 39, 176, 1)',
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(156, 39, 176, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    };

    // Gráfico de dona - Distribución de asistencia
    const asistencias = this.reportesAlumnos.map(r => r.porcentajeAsistencia).filter(a => a > 0);
    const excelente = asistencias.filter(a => a >= 90).length;
    const buena = asistencias.filter(a => a >= 75 && a < 90).length;
    const regular = asistencias.filter(a => a >= 60 && a < 75).length;
    const baja = asistencias.filter(a => a < 60).length;

    this.doughnutChartData = {
      labels: ['Excelente (90-100%)', 'Buena (75-89%)', 'Regular (60-74%)', 'Baja (<60%)'],
      datasets: [{
        data: [excelente, buena, regular, baja],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(244, 67, 54, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(255, 152, 0, 1)',
          'rgba(244, 67, 54, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    };

  }

  getCursosUnicos(): string[] {
    return [...new Set(this.reportesAlumnos.map(r => r.alumno.curso))].sort();
  }

  limpiarFiltros(): void {
    this.filtroMateria = '';
    this.filtroCurso = '';
    this.filtroCarrera = '';
    this.loadReportes();
    this.loadEstadisticas();
    this.loadChartData();
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
