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
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
import { CarreraService } from '../../services/carrera.service';

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
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
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

  // Estadísticas expandidas
  estadisticas: any = {
    totalAlumnos: 0,
    totalMaterias: 0,
    totalCursos: 0,
    totalDocentes: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0,
    alumnosRegulares: 0,
    alumnosIrregulares: 0,
    alumnosLibres: 0,
    promedioPorMateria: new Map(),
    promedioPorCurso: new Map(),
    promedioPorCarrera: new Map(),
    asistenciaPorMateria: new Map(),
    asistenciaPorCurso: new Map(),
    asistenciaPorCarrera: new Map(),
    cantidadNotas: 0,
    cantidadAsistencias: 0,
    notasAprobadas: 0,
    notasDesaprobadas: 0,
    porcentajeAprobados: 0,
    porcentajeDesaprobados: 0,
    materiasMasInscritas: [],
    materiasMenosInscritas: [],
    alumnosMejorPromedio: [],
    alumnosPeorPromedio: [],
    alumnosMejorAsistencia: [],
    alumnosPeorAsistencia: [],
    distribucionNotas: { excelente: 0, bueno: 0, regular: 0, insuficiente: 0 },
    distribucionAsistencia: { excelente: 0, buena: 0, regular: 0, baja: 0 },
    tendenciaPromedios: [],
    tendenciaAsistencias: []
  };

  // Filtros expandidos
  filtroCarrera: string = '';
  filtroMateria: string = '';
  filtroCurso: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroEstado: string = ''; // regular, irregular, libre
  filtroPromedioMin: number = 0;
  filtroPromedioMax: number = 10;
  filtroAsistenciaMin: number = 0;
  filtroAsistenciaMax: number = 100;
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
    private docenteService: DocenteService,
    private carreraService: CarreraService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Cargar todos los datos en paralelo cuando sea posible
      await Promise.all([
        this.loadCarreras(),
        this.loadMateriasFiltradas(),
        this.loadCursos()
      ]);
      
      await this.loadData();
      
      // Cargar reportes y estadísticas en paralelo
      await Promise.all([
        this.loadReportes(),
        this.loadEstadisticasExpandidas()
      ]);
      
      // Cargar gráficos después de tener los datos
      this.loadChartData();
    } catch (error) {
      console.error('Error cargando reportes:', error);
      this.notificationService.showError('Error al cargar los reportes. Por favor, recargue la página.');
    }
  }
  
  async loadCarreras(): Promise<void> {
    this.carreras = await this.carreraService.getCarreras();
  }
  
  async loadCursos(): Promise<void> {
    this.cursosFiltrados = await this.cursoService.getCursos();
  }

  async loadMateriasFiltradas(): Promise<void> {
    if (this.permissionsService.esAdmin() || this.permissionsService.esSecretario()) {
      // Admin/Secretario: todas las materias
      this.materiasFiltradas = await this.materiaService.getMaterias();
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: cargar solo sus materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const docente = await this.docenteService.getDocenteById(usuario.id);
        if (docente && docente.materiasAsignadas) {
          const todasLasMaterias = await this.materiaService.getMaterias();
          this.materiasFiltradas = todasLasMaterias.filter(m => 
            docente.materiasAsignadas!.includes(m.id)
          );
        }
      }
    } else {
      this.materiasFiltradas = [];
    }
  }

  async loadData(): Promise<void> {
    // Cargar datos base según el rol
    await this.loadMateriasFiltradas();
  }

  async loadReportes(): Promise<void> {
    // No cambiar isLoading aquí, se maneja en ngOnInit
    try {
      let reportesAlumnos = await this.reportService.generarReporteAlumnos();
      let reportesMaterias = await this.reportService.generarReporteMaterias();
      const alumnos = await this.alumnoService.getAlumnos();

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
        const docente = await this.docenteService.getDocenteById(usuario.id);
        if (docente && docente.materiasAsignadas) {
          // Filtrar materias
          reportesMaterias = reportesMaterias.filter(r => 
            docente.materiasAsignadas!.includes(r.materia.id)
          );
          
          // Filtrar alumnos: solo los que están en cursos con sus materias
          const cursos = await this.cursoService.getCursos();
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
          const cursos = await this.cursoService.getCursos();
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
      // Filtrar reportes de alumnos: verificar si el alumno tiene notas o asistencias en esa materia
      // o si está en un curso que tiene esa materia
      const cursos = await this.cursoService.getCursos();
      const cursosConMateria = cursos.filter(c => c.materias && c.materias.includes(this.filtroMateria));
      const idsAlumnosEnMateria = new Set<string>();
      
      // Obtener alumnos de cursos que tienen la materia
      cursosConMateria.forEach(curso => {
        if (curso.alumnos && Array.isArray(curso.alumnos)) {
          curso.alumnos.forEach((alumnoId: string) => idsAlumnosEnMateria.add(alumnoId));
        }
      });
      
      // También verificar alumnos que tienen cursoId o cursoIds que coinciden
      const todosLosAlumnos = await this.alumnoService.getAlumnos();
      todosLosAlumnos.forEach(alumno => {
        if (alumno.cursoId && cursosConMateria.some(c => c.id === alumno.cursoId)) {
          idsAlumnosEnMateria.add(alumno.id);
        }
        if (alumno.cursoIds && Array.isArray(alumno.cursoIds)) {
          alumno.cursoIds.forEach(cursoId => {
            if (cursosConMateria.some(c => c.id === cursoId)) {
              idsAlumnosEnMateria.add(alumno.id);
            }
          });
        }
      });
      
      // Verificar también por notas y asistencias de la materia
      const notas = await this.alumnoService.getNotas();
      const asistencias = await this.alumnoService.getAsistencias();
      notas.filter(n => n.materiaId === this.filtroMateria).forEach(n => idsAlumnosEnMateria.add(n.alumnoId));
      asistencias.filter(a => a.materiaId === this.filtroMateria).forEach(a => idsAlumnosEnMateria.add(a.alumnoId));
      
      // Aplicar filtro a reportes de alumnos
      reportesAlumnos = reportesAlumnos.filter(r => idsAlumnosEnMateria.has(r.alumno.id));
      
      // Filtrar reportes de materias
      reportesMaterias = reportesMaterias.filter(r => r.materia.id === this.filtroMateria);
    }

    if (this.filtroCurso) {
      reportesAlumnos = reportesAlumnos.filter(r => r.alumno.curso === this.filtroCurso);
    }
    
    if (this.filtroCarrera) {
      reportesAlumnos = reportesAlumnos.filter(r => {
        const alumno = alumnos.find(a => a.id === r.alumno.id);
        return alumno?.carreraId === this.filtroCarrera;
      });
    }
    
    if (this.filtroEstado) {
      reportesAlumnos = reportesAlumnos.filter(r => {
        const alumno = alumnos.find(a => a.id === r.alumno.id);
        return alumno?.estado === this.filtroEstado;
      });
    }
    
    if (this.filtroPromedioMin > 0 || this.filtroPromedioMax < 10) {
      reportesAlumnos = reportesAlumnos.filter(r => 
        r.promedio >= this.filtroPromedioMin && r.promedio <= this.filtroPromedioMax
      );
    }
    
    if (this.filtroAsistenciaMin > 0 || this.filtroAsistenciaMax < 100) {
      reportesAlumnos = reportesAlumnos.filter(r => 
        r.porcentajeAsistencia >= this.filtroAsistenciaMin && 
        r.porcentajeAsistencia <= this.filtroAsistenciaMax
      );
    }

      this.reportesAlumnos = reportesAlumnos;
      this.reportesMaterias = reportesMaterias;
    } catch (error) {
      console.error('Error cargando reportes:', error);
      this.notificationService.showError('Error al cargar los reportes');
    }
  }
  
  async limpiarFiltros(): Promise<void> {
    this.filtroCarrera = '';
    this.filtroMateria = '';
    this.filtroCurso = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroEstado = '';
    this.filtroPromedioMin = 0;
    this.filtroPromedioMax = 10;
    this.filtroAsistenciaMin = 0;
    this.filtroAsistenciaMax = 100;
    await Promise.all([
      this.loadReportes(),
      this.loadEstadisticasExpandidas()
    ]);
    this.loadChartData();
  }
  
  getCursosUnicos(): string[] {
    const cursos = [...new Set(this.reportesAlumnos.map(r => r.alumno.curso))].filter(c => c);
    return cursos.sort();
  }
  
  getCursoDisplayValue(curso: any): string {
    const año = curso.año || curso['año'] || 0;
    return `${año}° ${curso.division}`;
  }
  
  async onFiltroChange(): Promise<void> {
    // Recargar materias filtradas cuando cambia el filtro de carrera
    await this.loadMateriasFiltradas();
    await Promise.all([
      this.loadReportes(),
      this.loadEstadisticasExpandidas()
    ]);
    this.loadChartData();
  }

  async loadEstadisticas(): Promise<void> {
    await this.loadEstadisticasExpandidas();
  }
  
  async loadEstadisticasExpandidas(): Promise<void> {
    // No cambiar isLoading aquí, se maneja en ngOnInit
    try {
      // Cargar datos según el rol
      let alumnos = await this.alumnoService.getAlumnos();
      let materias = await this.materiaService.getMaterias();
      let cursos = await this.cursoService.getCursos();
      let docentes = await this.docenteService.getDocentes();
      let notas = await this.alumnoService.getNotas();
      let asistencias = await this.alumnoService.getAsistencias();

      // Aplicar filtros por rol
      if (this.permissionsService.esAlumno()) {
        const usuarioId = this.authService.getCurrentUser()?.id;
        alumnos = alumnos.filter(a => a.id === usuarioId);
        const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId || '');
        const materiasIds = inscripciones.map(i => i.materiaId);
        materias = materias.filter(m => materiasIds.includes(m.id));
      } else if (this.permissionsService.esProfesor()) {
        const usuario = this.authService.getCurrentUser();
        if (usuario) {
          const docente = await this.docenteService.getDocenteById(usuario.id);
          if (docente && docente.materiasAsignadas) {
            materias = materias.filter(m => docente.materiasAsignadas!.includes(m.id));
            const cursosConMaterias = cursos.filter(c => 
              c.materias.some(mId => docente.materiasAsignadas!.includes(mId))
            );
            const idsAlumnos = [...new Set(cursosConMaterias.flatMap(c => c.alumnos || []))];
            alumnos = alumnos.filter(a => idsAlumnos.includes(a.id));
            cursos = cursosConMaterias;
          }
        }
      }
      
      // Aplicar filtros adicionales
      if (this.filtroCarrera) {
        alumnos = alumnos.filter(a => a.carreraId === this.filtroCarrera);
        cursos = cursos.filter(c => c.carreraId === this.filtroCarrera);
      }
      
      if (this.filtroMateria) {
        notas = notas.filter(n => n.materiaId === this.filtroMateria);
        asistencias = asistencias.filter(a => a.materiaId === this.filtroMateria);
      }
      
      if (this.filtroCurso) {
        const cursoEncontrado = cursos.find(c => {
          const año = c.año || (c as any)['año'] || 0;
          return `${año}° ${c.division}` === this.filtroCurso;
        });
        if (cursoEncontrado) {
          const idsAlumnos = cursoEncontrado.alumnos || [];
          alumnos = alumnos.filter(a => idsAlumnos.includes(a.id));
        }
      }
      
      // Estadísticas básicas
      this.estadisticas.totalAlumnos = alumnos.length;
      this.estadisticas.totalMaterias = materias.length;
      this.estadisticas.totalCursos = cursos.length;
      this.estadisticas.totalDocentes = docentes.length;
      this.estadisticas.cantidadNotas = notas.length;
      this.estadisticas.cantidadAsistencias = asistencias.length;

      // Calcular promedios y asistencias
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

        this.estadisticas.alumnosIrregulares = this.reportesAlumnos.filter(r => 
          r.promedio < 6 || r.porcentajeAsistencia < 75
        ).length;
        
        this.estadisticas.alumnosLibres = alumnos.filter(a => a.estado === 'libre').length;
      }
      
      // Estadísticas de notas
      this.estadisticas.notasAprobadas = notas.filter(n => n.calificacion >= 6).length;
      this.estadisticas.notasDesaprobadas = notas.filter(n => n.calificacion < 6).length;
      this.estadisticas.porcentajeAprobados = notas.length > 0
        ? Math.round((this.estadisticas.notasAprobadas / notas.length) * 100)
        : 0;
      this.estadisticas.porcentajeDesaprobados = notas.length > 0
        ? Math.round((this.estadisticas.notasDesaprobadas / notas.length) * 100)
        : 0;
      
      // Distribución de notas
      this.estadisticas.distribucionNotas = {
        excelente: notas.filter(n => n.calificacion >= 9).length,
        bueno: notas.filter(n => n.calificacion >= 7 && n.calificacion < 9).length,
        regular: notas.filter(n => n.calificacion >= 6 && n.calificacion < 7).length,
        insuficiente: notas.filter(n => n.calificacion < 6).length
      };
      
      // Distribución de asistencia
      const porcentajesAsistencia = this.reportesAlumnos.map(r => r.porcentajeAsistencia);
      this.estadisticas.distribucionAsistencia = {
        excelente: porcentajesAsistencia.filter(a => a >= 90).length,
        buena: porcentajesAsistencia.filter(a => a >= 75 && a < 90).length,
        regular: porcentajesAsistencia.filter(a => a >= 60 && a < 75).length,
        baja: porcentajesAsistencia.filter(a => a < 60).length
      };
      
      // Top alumnos
      this.estadisticas.alumnosMejorPromedio = [...this.reportesAlumnos]
        .sort((a, b) => b.promedio - a.promedio)
        .slice(0, 10)
        .map(r => ({ nombre: `${r.alumno.nombre} ${r.alumno.apellido}`, promedio: r.promedio }));
      
      this.estadisticas.alumnosPeorPromedio = [...this.reportesAlumnos]
        .sort((a, b) => a.promedio - b.promedio)
        .slice(0, 10)
        .map(r => ({ nombre: `${r.alumno.nombre} ${r.alumno.apellido}`, promedio: r.promedio }));
      
      this.estadisticas.alumnosMejorAsistencia = [...this.reportesAlumnos]
        .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia)
        .slice(0, 10)
        .map(r => ({ nombre: `${r.alumno.nombre} ${r.alumno.apellido}`, asistencia: r.porcentajeAsistencia }));
      
      this.estadisticas.alumnosPeorAsistencia = [...this.reportesAlumnos]
        .sort((a, b) => a.porcentajeAsistencia - b.porcentajeAsistencia)
        .slice(0, 10)
        .map(r => ({ nombre: `${r.alumno.nombre} ${r.alumno.apellido}`, asistencia: r.porcentajeAsistencia }));
      
      // Top materias
      this.estadisticas.materiasMasInscritas = [...this.reportesMaterias]
        .sort((a, b) => b.cantidadInscritos - a.cantidadInscritos)
        .slice(0, 10)
        .map(r => ({ nombre: r.materia.nombre, inscritos: r.cantidadInscritos }));
      
      this.estadisticas.materiasMenosInscritas = [...this.reportesMaterias]
        .sort((a, b) => a.cantidadInscritos - b.cantidadInscritos)
        .slice(0, 10)
        .map(r => ({ nombre: r.materia.nombre, inscritos: r.cantidadInscritos }));
      
      // Promedios por materia, curso y carrera
      for (const materia of materias) {
        const notasMateria = notas.filter(n => n.materiaId === materia.id);
        if (notasMateria.length > 0) {
          const promedio = notasMateria.reduce((sum, n) => sum + n.calificacion, 0) / notasMateria.length;
          this.estadisticas.promedioPorMateria.set(materia.id, Math.round(promedio * 100) / 100);
        }
        
        const asistenciasMateria = asistencias.filter(a => a.materiaId === materia.id);
        if (asistenciasMateria.length > 0) {
          const presentes = asistenciasMateria.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length;
          const porcentaje = (presentes / asistenciasMateria.length) * 100;
          this.estadisticas.asistenciaPorMateria.set(materia.id, Math.round(porcentaje * 100) / 100);
        }
      }
      
      for (const curso of cursos) {
        const alumnosCurso = alumnos.filter(a => 
          a.cursoId === curso.id || 
          (a.cursoIds && a.cursoIds.includes(curso.id)) ||
          curso.alumnos.includes(a.id)
        );
        if (alumnosCurso.length > 0) {
          const promedios = await Promise.all(
            alumnosCurso.map(a => this.alumnoService.getPromedioAlumno(a.id))
          );
          const promedio = promedios.reduce((sum, p) => sum + p, 0) / promedios.length;
          this.estadisticas.promedioPorCurso.set(curso.id, Math.round(promedio * 100) / 100);
        }
      }
      
      for (const carrera of this.carreras) {
        const alumnosCarrera = alumnos.filter(a => a.carreraId === carrera.id);
        if (alumnosCarrera.length > 0) {
          const promedios = await Promise.all(
            alumnosCarrera.slice(0, 50).map(a => this.alumnoService.getPromedioAlumno(a.id))
          );
          const promedio = promedios.reduce((sum, p) => sum + p, 0) / promedios.length;
          this.estadisticas.promedioPorCarrera.set(carrera.id, Math.round(promedio * 100) / 100);
        }
      }
    } catch (error) {
      console.error('Error cargando estadísticas expandidas:', error);
      this.notificationService.showError('Error al cargar las estadísticas');
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

  async exportarReporte(): Promise<void> {
    const csv = await this.reportService.exportarReporteCompleto();
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
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'Nombre,Apellido,DNI,Curso,Promedio,Asistencia%,Notas,Asistencias,Materias\n';
    const rows = this.reportesAlumnos.map(r => 
      `${escapeCSV(r.alumno.nombre)},${escapeCSV(r.alumno.apellido)},${escapeCSV(r.alumno.dni)},${escapeCSV(r.alumno.curso)},${escapeCSV(r.promedio)},${escapeCSV(r.porcentajeAsistencia)},${escapeCSV(r.cantidadNotas)},${escapeCSV(r.cantidadAsistencias)},${escapeCSV(r.materiasInscritas)}`
    ).join('\n');
    const csv = header + rows;
    this.downloadCSV(csv, 'reporte_alumnos');
  }

  exportarReporteMaterias(): void {
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'Nombre,Código,Profesor,Inscritos,Promedio General,Asistencia%\n';
    const rows = this.reportesMaterias.map(r => 
      `${escapeCSV(r.materia.nombre)},${escapeCSV(r.materia.codigo)},${escapeCSV(r.materia.profesor)},${escapeCSV(r.cantidadInscritos)},${escapeCSV(r.promedioGeneral)},${escapeCSV(r.porcentajeAsistencia)}`
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
