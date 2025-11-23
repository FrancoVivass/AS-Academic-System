import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { DocenteService } from '../../services/docente.service';
import { CursoService } from '../../services/curso.service';
import { CarreraService } from '../../services/carrera.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { ReportService } from '../../services/report.service';
import { Alumno, Nota, Asistencia } from '../../models/alumno.model';
import { Materia } from '../../models/materia.model';
import { Docente } from '../../models/usuario.model';
import { Curso } from '../../models/curso.model';

interface Advertencia {
  tipo: 'warning' | 'error' | 'info' | 'success';
  titulo: string;
  mensaje: string;
  icono: string;
  accion?: string;
  ruta?: string;
}

interface MateriaResumen {
  id: string;
  nombre: string;
  promedio: number;
  asistencia: number;
  ultimaNota?: Nota;
  estado: 'regular' | 'irregular' | 'libre';
}

interface ActividadReciente {
  tipo: 'alumno' | 'profesor' | 'materia' | 'asistencia';
  titulo: string;
  descripcion: string;
  fecha: Date;
  icono: string;
}

interface ClaseDelDia {
  materia: string;
  hora: string;
  aula?: string;
  docente?: string;
  curso?: string;
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
    MatBadgeModule,
    MatTabsModule,
    MatListModule,
    MatTooltipModule,
    NgChartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Datos generales
  totalAlumnos: number = 0;
  totalProfesores: number = 0;
  totalMaterias: number = 0;
  asistenciasHoy: number = 0;
  notasHoy: number = 0;
  promedioGeneral: number = 0;
  porcentajeAsistencia: number = 0;
  faltasAcumuladas: number = 0;
  
  alumnos: Alumno[] = [];
  profesores: Docente[] = [];
  materias: Materia[] = [];
  cursos: Curso[] = [];
  
  // Datos específicos por rol
  advertencias: Advertencia[] = [];
  materiasResumen: MateriaResumen[] = [];
  alumnosPorMateria: any[] = [];
  proximosEventos: any[] = [];
  actividadReciente: ActividadReciente[] = [];
  clasesDelDia: ClaseDelDia[] = [];
  topAlumnos: any[] = [];
  materiasPopulares: any[] = [];
  
  // Gráficos
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Asistencia Mensual'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
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
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Alumnos'
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
        position: 'top',
      },
      title: {
        display: true,
        text: 'Rendimiento por Mes'
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

  displayedColumns: string[] = ['nombre', 'curso', 'promedio', 'asistencia'];

  constructor(
    public alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private docenteService: DocenteService,
    private cursoService: CursoService,
    private carreraService: CarreraService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    if (this.permissionsService.esAlumno()) {
      await this.loadDashboardAlumno();
    } else if (this.permissionsService.esProfesor()) {
      await this.loadDashboardProfesor();
    } else if (this.permissionsService.esSecretario() || this.permissionsService.esAdmin()) {
      await this.loadDashboardAdmin();
    }
  }

  // Dashboard para Alumno
  async loadDashboardAlumno(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) return;

    const alumno = await this.alumnoService.getAlumnoById(usuarioId);
    if (!alumno) return;

    // Obtener materias inscritas
    const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId);
    const todasLasMaterias = await this.materiaService.getMaterias();
    this.materias = todasLasMaterias.filter(m => 
      inscripciones.some(i => i.materiaId === m.id)
    );

    // Calcular resumen por materia
    const notasAlumno = await this.alumnoService.getNotasByAlumno(usuarioId);
    const asistenciasAlumno = await this.alumnoService.getAsistenciasByAlumno(usuarioId);
    
    this.materiasResumen = this.materias.map(materia => {
      const notas = notasAlumno
        .filter(n => n.materiaId === materia.id);
      const asistencias = asistenciasAlumno
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
    this.promedioGeneral = notasAlumno.length > 0
      ? Math.round((notasAlumno.reduce((sum, n) => sum + n.calificacion, 0) / notasAlumno.length) * 100) / 100
      : 0;

    const todasLasAsistencias = asistenciasAlumno;
    this.porcentajeAsistencia = todasLasAsistencias.length > 0
      ? Math.round((todasLasAsistencias.filter(a => a.presente).length / todasLasAsistencias.length) * 100)
      : 0;

    // Calcular faltas
    this.faltasAcumuladas = todasLasAsistencias.filter(a => !a.presente).length;
    const faltasPermitidas = Math.ceil(todasLasAsistencias.length * 0.25); // 25% faltas permitidas
    const faltasRestantes = Math.max(0, faltasPermitidas - this.faltasAcumuladas);

    // Cargar clases del día
    this.loadClasesDelDia(usuarioId);

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

    if (faltasRestantes <= 3 && faltasRestantes > 0) {
      this.advertencias.push({
        tipo: 'warning',
        titulo: 'Atención: Faltas Restantes',
        mensaje: `Te quedan ${faltasRestantes} faltas permitidas.`,
        icono: 'event_busy'
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

    this.totalMaterias = this.materias.length;
  }

  // Dashboard para Profesor
  async loadDashboardProfesor(): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    // Obtener docente completo
    const docente = await this.docenteService.getDocenteById(usuario.id);
    const materiasAsignadas = docente?.materiasAsignadas || [];
    
    // Obtener todas las materias del profesor
    let todasLasMaterias = await this.materiaService.getMaterias();
    if (materiasAsignadas.length > 0) {
      todasLasMaterias = todasLasMaterias.filter(m => materiasAsignadas.includes(m.id));
    } else {
      // Fallback: buscar por nombre del profesor
      const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
      todasLasMaterias = todasLasMaterias.filter(m => 
        m.profesor === nombreProfesor || m.profesor?.includes(usuario.nombre)
      );
    }
    
    this.materias = todasLasMaterias;

    // Obtener carreras donde el profesor tiene materias
    const carreras = await this.carreraService.getCarreras();
    const cursos = await this.cursoService.getCursos();
    const carrerasDelProfesor = new Set<string>();
    
    todasLasMaterias.forEach(materia => {
      if (materia.carreraId) {
        carrerasDelProfesor.add(materia.carreraId);
      }
      // También buscar en cursos
      cursos.forEach(curso => {
        if (curso.materias.includes(materia.id) && curso.carreraId) {
          carrerasDelProfesor.add(curso.carreraId);
        }
      });
    });

    // Obtener todos los alumnos de las carreras del profesor
    const todosLosAlumnosIds = new Set<string>();
    const alumnosPorCarrera: { [carreraId: string]: Alumno[] } = {};
    
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    carrerasDelProfesor.forEach(carreraId => {
      const alumnosCarrera = todosLosAlumnos.filter(a => 
        a.carreraId === carreraId || !a.carreraId
      );
      alumnosPorCarrera[carreraId] = alumnosCarrera;
      alumnosCarrera.forEach(a => todosLosAlumnosIds.add(a.id));
    });

    // También obtener alumnos de cursos que tienen las materias del profesor
    cursos.forEach(curso => {
      if (curso.materias.some(mId => todasLasMaterias.some(m => m.id === mId))) {
        curso.alumnos?.forEach(alumnoId => todosLosAlumnosIds.add(alumnoId));
      }
    });

    this.totalAlumnos = todosLosAlumnosIds.size;
    this.totalMaterias = this.materias.length;

    // Alumnos por materia (usando cursos y carreras)
    const alumnosPorMateriaPromises = todasLasMaterias.map(async (materia) => {
      // Buscar alumnos en cursos que tienen esta materia
      const cursosConMateria = cursos.filter(c => c.materias.includes(materia.id));
      const idsAlumnos = [...new Set(cursosConMateria.flatMap(c => c.alumnos || []))];
      
      // También incluir alumnos de la carrera si la materia tiene carreraId
      if (materia.carreraId && alumnosPorCarrera[materia.carreraId]) {
        alumnosPorCarrera[materia.carreraId].forEach(a => idsAlumnos.push(a.id));
      }
      
      const alumnosPromises = [...new Set(idsAlumnos)]
        .map(id => this.alumnoService.getAlumnoById(id));
      const alumnos = (await Promise.all(alumnosPromises))
        .filter(a => a !== undefined) as Alumno[];

      const alumnosDetallePromises = alumnos.map(async (a) => ({
        nombre: `${a.nombre} ${a.apellido}`,
        promedio: await this.alumnoService.getPromedioAlumno(a.id),
        asistencia: await this.alumnoService.getPorcentajeAsistencia(a.id, materia.id)
      }));
      const alumnosDetalle = await Promise.all(alumnosDetallePromises);

      return {
        materia: materia.nombre,
        cantidad: alumnos.length,
        alumnos: alumnosDetalle
      };
    });
    this.alumnosPorMateria = await Promise.all(alumnosPorMateriaPromises);

    // Calcular notas cargadas hoy
    const hoy = new Date().toISOString().split('T')[0];
    const todasLasNotas = await this.alumnoService.getNotas();
    const materiasIds = todasLasMaterias.map(m => m.id);
    this.notasHoy = todasLasNotas.filter(n => 
      n.fecha.startsWith(hoy) && 
      materiasIds.includes(n.materiaId)
    ).length;

    // Asistencias cargadas hoy
    const todasLasAsistencias = await this.alumnoService.getAsistencias();
    this.asistenciasHoy = todasLasAsistencias.filter(a => 
      a.fecha.startsWith(hoy) && 
      materiasIds.includes(a.materiaId) &&
      Array.from(todosLosAlumnosIds).includes(a.alumnoId)
    ).length;

    // Cargar clases del día para profesor
    this.loadClasesDelDiaProfesor(usuario.id);

    // Advertencias para profesor
    this.advertencias = [];
    
    for (const materia of todasLasMaterias) {
      const cursosConMateria = cursos.filter(c => c.materias.includes(materia.id));
      const idsAlumnos = [...new Set(cursosConMateria.flatMap(c => c.alumnos || []))];
      const alumnosPromises = idsAlumnos.map(id => this.alumnoService.getAlumnoById(id));
      const alumnos = (await Promise.all(alumnosPromises))
        .filter(a => a !== undefined) as Alumno[];

      for (const alumno of alumnos) {
        const asistencia = await this.alumnoService.getPorcentajeAsistencia(alumno.id, materia.id);
        if (asistencia < 75) {
          this.advertencias.push({
            tipo: 'warning',
            titulo: `Asistencia baja: ${alumno.nombre} ${alumno.apellido}`,
            mensaje: `En ${materia.nombre} tiene ${asistencia}% de asistencia.`,
            icono: 'person_off'
          });
        }
      }
    }

    // Verificar asistencias pendientes
    const asistenciasPendientes = await this.getAsistenciasPendientes();
    if (asistenciasPendientes > 0) {
      this.advertencias.push({
        tipo: 'info',
        titulo: 'Asistencias Pendientes',
        mensaje: `Tienes ${asistenciasPendientes} clases sin cargar asistencia hoy.`,
        icono: 'pending_actions',
        accion: 'Cargar Asistencia',
        ruta: '/app/asistencia'
      });
    }

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
  async loadDashboardAdmin(): Promise<void> {
    this.alumnos = await this.alumnoService.getAlumnos();
    this.profesores = await this.docenteService.getDocentes();
    this.materias = await this.materiaService.getMaterias();
    this.cursos = await this.cursoService.getCursos();
    
    this.totalAlumnos = this.alumnos.filter(a => a.activo !== false).length;
    this.totalProfesores = this.profesores.filter(p => p.activo !== false).length;
    this.totalMaterias = this.materias.length;

    // Asistencias cargadas hoy
    const hoy = new Date().toISOString().split('T')[0];
    const todasLasAsistenciasAdmin = await this.alumnoService.getAsistencias();
    this.asistenciasHoy = todasLasAsistenciasAdmin.filter(a => a.fecha.startsWith(hoy)).length;

    // Calcular promedio general
    if (this.alumnos.length > 0) {
      const promediosPromises = this.alumnos.map(alumno => 
        this.alumnoService.getPromedioAlumno(alumno.id)
      );
      const promedios = (await Promise.all(promediosPromises)).filter(p => p > 0);
      
      if (promedios.length > 0) {
        this.promedioGeneral = Math.round(
          (promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100
        ) / 100;
      }
    }

    // Calcular porcentaje de asistencia general
    if (this.alumnos.length > 0) {
      const porcentajesPromises = this.alumnos.map(alumno =>
        this.alumnoService.getPorcentajeAsistencia(alumno.id)
      );
      const porcentajes = (await Promise.all(porcentajesPromises)).filter(p => p > 0);
      
      if (porcentajes.length > 0) {
        this.porcentajeAsistencia = Math.round(
          (porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length) * 100
        ) / 100;
      }
    }

    // Calcular faltas acumuladas (promedio)
    const todasLasAsistenciasFaltas = await this.alumnoService.getAsistencias();
    const totalFaltas = todasLasAsistenciasFaltas.filter(a => !a.presente).length;
    this.faltasAcumuladas = totalFaltas;

    // Cargar actividad reciente
    this.loadActividadReciente();

    // Cargar alertas
    this.loadAlertasAdmin();

    // Cargar gráficos
    this.loadGraficos();

    await this.loadTopAlumnos();
    await this.loadMateriasPopulares();
  }

  async loadActividadReciente(): Promise<void> {
    this.actividadReciente = [];

    // Últimos alumnos registrados
    const alumnosRecientes = [...this.alumnos]
      .sort((a, b) => new Date(b.fechaRegistro || '').getTime() - new Date(a.fechaRegistro || '').getTime())
      .slice(0, 5);
    
    alumnosRecientes.forEach(alumno => {
      this.actividadReciente.push({
        tipo: 'alumno',
        titulo: `Nuevo alumno: ${alumno.nombre} ${alumno.apellido}`,
        descripcion: `Registrado en ${alumno.curso || 'Sin curso'}`,
        fecha: new Date(alumno.fechaRegistro || ''),
        icono: 'person_add'
      });
    });

    // Últimos profesores agregados
    const profesoresRecientes = [...this.profesores]
      .sort((a, b) => new Date(b.fechaRegistro || '').getTime() - new Date(a.fechaRegistro || '').getTime())
      .slice(0, 3);
    
    profesoresRecientes.forEach(profesor => {
      this.actividadReciente.push({
        tipo: 'profesor',
        titulo: `Nuevo profesor: ${profesor.nombre} ${profesor.apellido}`,
        descripcion: profesor.especialidad || 'Sin especialidad',
        fecha: new Date(profesor.fechaRegistro || ''),
        icono: 'school'
      });
    });

    // Últimas asistencias cargadas
    const todasLasAsistencias = await this.alumnoService.getAsistencias();
    const asistenciasRecientes = todasLasAsistencias
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
    
    for (const asistencia of asistenciasRecientes) {
      const alumno = await this.alumnoService.getAlumnoById(asistencia.alumnoId);
      const materia = await this.materiaService.getMateriaById(asistencia.materiaId);
      if (alumno && materia) {
        this.actividadReciente.push({
          tipo: 'asistencia',
          titulo: `Asistencia: ${alumno.nombre} ${alumno.apellido}`,
          descripcion: `${materia.nombre} - ${asistencia.presente ? 'Presente' : 'Ausente'}`,
          fecha: new Date(asistencia.fecha),
          icono: asistencia.presente ? 'check_circle' : 'cancel'
        });
      }
    }

    // Ordenar por fecha
    this.actividadReciente.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    this.actividadReciente = this.actividadReciente.slice(0, 10);
  }

  async loadAlertasAdmin(): Promise<void> {
    this.advertencias = [];

    // Alumnos con faltas al límite
    for (const alumno of this.alumnos) {
      const asistencias = await this.alumnoService.getAsistenciasByAlumno(alumno.id);
      if (asistencias.length > 0) {
        const porcentaje = await this.alumnoService.getPorcentajeAsistencia(alumno.id);
        if (porcentaje < 75) {
          this.advertencias.push({
            tipo: 'error',
            titulo: `Alumno con faltas al límite: ${alumno.nombre} ${alumno.apellido}`,
            mensaje: `Asistencia: ${porcentaje}%`,
            icono: 'warning',
            accion: 'Ver Detalle',
            ruta: `/app/alumnos`
          });
        }
      }
    }

    // Profesores atrasados en carga de asistencia
    const hoy = new Date().toISOString().split('T')[0];
    for (const profesor of this.profesores) {
      const materiasAsignadas = profesor.materiasAsignadas || [];
      let tieneAsistenciasHoy = false;
      
      for (const materiaId of materiasAsignadas) {
        const asistencias = await this.alumnoService.getAsistenciasByMateria(materiaId);
        const asistenciasHoy = asistencias.filter(a => a.fecha.startsWith(hoy));
        if (asistenciasHoy.length > 0) {
          tieneAsistenciasHoy = true;
        }
      }

      if (materiasAsignadas.length > 0 && !tieneAsistenciasHoy) {
        this.advertencias.push({
          tipo: 'warning',
          titulo: `Profesor atrasado: ${profesor.nombre} ${profesor.apellido}`,
          mensaje: 'No ha cargado asistencia hoy',
          icono: 'schedule',
          accion: 'Ver',
          ruta: `/app/docentes`
        });
      }
    }

    // Materias sin profesores asignados
    for (const materia of this.materias) {
      const profesoresAsignados = await this.docenteService.getDocentesByMateria(materia.id);
      if (profesoresAsignados.length === 0) {
        this.advertencias.push({
          tipo: 'warning',
          titulo: `Materia sin profesor: ${materia.nombre}`,
          mensaje: 'No tiene profesor asignado',
          icono: 'person_off',
          accion: 'Asignar',
          ruta: `/app/materias`
        });
      }
    }

    if (this.advertencias.length === 0) {
      this.advertencias.push({
        tipo: 'success',
        titulo: 'Todo en orden',
        mensaje: 'No hay alertas pendientes en el sistema.',
        icono: 'check_circle'
      });
    }
  }

  loadGraficos(): void {
    // Gráfico de asistencia mensual
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const asistenciasPorMes = meses.map(mes => {
      // Simulación de datos - en producción vendría de la base de datos
      return Math.floor(Math.random() * 30) + 70;
    });

    this.barChartData = {
      labels: meses,
      datasets: [{
        data: asistenciasPorMes,
        label: 'Asistencia %',
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2
      }]
    };

    // Gráfico de distribución de alumnos por curso
    const cursosMap = new Map<string, number>();
    this.alumnos.forEach(alumno => {
      const curso = alumno.curso || 'Sin curso';
      cursosMap.set(curso, (cursosMap.get(curso) || 0) + 1);
    });

    this.pieChartData = {
      labels: Array.from(cursosMap.keys()),
      datasets: [{
        data: Array.from(cursosMap.values()),
        backgroundColor: [
          'rgba(25, 118, 210, 0.6)',
          'rgba(76, 175, 80, 0.6)',
          'rgba(255, 152, 0, 0.6)',
          'rgba(156, 39, 176, 0.6)',
          'rgba(244, 67, 54, 0.6)'
        ]
      }]
    };

    // Gráfico de rendimiento
    this.lineChartData = {
      labels: meses,
      datasets: [{
        data: [7.5, 7.8, 8.0, 7.9, 8.2, 8.1],
        label: 'Promedio General',
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }

  async loadClasesDelDia(alumnoId: string): Promise<void> {
    const alumno = await this.alumnoService.getAlumnoById(alumnoId);
    if (!alumno) return;

    const hoy = new Date();
    const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][hoy.getDay()];
    
    // Obtener cursos del alumno
    const cursosDelAlumno = this.cursos.filter(c => c.alumnos.includes(alumnoId));
    
    this.clasesDelDia = [];
    for (const curso of cursosDelAlumno) {
      for (const horario of curso.horarios) {
        if (horario.dia === diaSemana) {
          const materia = await this.materiaService.getMateriaById(horario.materiaId);
          const docente = await this.docenteService.getDocenteById(horario.docenteId);
          this.clasesDelDia.push({
            materia: materia?.nombre || 'Sin nombre',
            hora: `${horario.horaInicio} - ${horario.horaFin}`,
            aula: horario.aula,
            docente: docente ? `${docente.nombre} ${docente.apellido}` : undefined,
            curso: curso.nombre
          });
        }
      }
    }

    // Ordenar por hora
    this.clasesDelDia.sort((a, b) => a.hora.localeCompare(b.hora));
  }

  async loadClasesDelDiaProfesor(profesorId: string): Promise<void> {
    const profesor = await this.docenteService.getDocenteById(profesorId);
    if (!profesor) return;

    const hoy = new Date();
    const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][hoy.getDay()];
    
    this.clasesDelDia = [];
    for (const curso of this.cursos) {
      for (const horario of curso.horarios) {
        if (horario.dia === diaSemana && horario.docenteId === profesorId) {
          const materia = await this.materiaService.getMateriaById(horario.materiaId);
          this.clasesDelDia.push({
            materia: materia?.nombre || 'Sin nombre',
            hora: `${horario.horaInicio} - ${horario.horaFin}`,
            aula: horario.aula,
            curso: curso.nombre
          });
        }
      }
    }

    // Ordenar por hora
    this.clasesDelDia.sort((a, b) => a.hora.localeCompare(b.hora));
  }

  async getAsistenciasPendientes(): Promise<number> {
    const hoy = new Date().toISOString().split('T')[0];
    const usuario = this.authService.getCurrentUser();
    const materiasAsignadas = (usuario as any).materiasAsignadas || [];
    
    let pendientes = 0;
    for (const materiaId of materiasAsignadas) {
      const inscripciones = this.materiaService.getInscripcionesByMateria(materiaId);
      for (const inscripcion of inscripciones) {
        const asistencias = await this.alumnoService.getAsistenciasByAlumno(inscripcion.alumnoId);
        const asistenciasHoy = asistencias.filter(a => a.materiaId === materiaId && a.fecha.startsWith(hoy));
        if (asistenciasHoy.length === 0) {
          pendientes++;
        }
      }
    }
    
    return pendientes;
  }

  async loadTopAlumnos(): Promise<void> {
    const reportes = await this.reportService.generarReporteAlumnos();
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

  async loadMateriasPopulares(): Promise<void> {
    const reportes = await this.reportService.generarReporteMaterias();
    this.materiasPopulares = reportes
      .sort((a: any, b: any) => b.cantidadInscritos - a.cantidadInscritos)
      .slice(0, 5)
      .map((r: any) => ({
        nombre: r.materia.nombre,
        inscritos: r.cantidadInscritos,
        promedio: r.promedioGeneral
      }));
  }

  async getPromedioAlumno(id: string): Promise<number> {
    return await this.alumnoService.getPromedioAlumno(id);
  }

  async getPorcentajeAsistencia(id: string): Promise<number> {
    return await this.alumnoService.getPorcentajeAsistencia(id);
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

  formatFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
