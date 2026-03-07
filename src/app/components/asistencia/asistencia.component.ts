import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { CursoService } from '../../services/curso.service';
import { CarreraService } from '../../services/carrera.service';
import { DocenteService } from '../../services/docente.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { ExcelService } from '../../services/excel.service';
import { Asistencia } from '../../models/alumno.model';
import { Alumno } from '../../models/alumno.model';
import { Materia } from '../../models/materia.model';
import { Curso, HorarioCurso } from '../../models/curso.model';
import { Carrera } from '../../models/carrera.model';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.css'
})
export class AsistenciaComponent implements OnInit {
  alumnos: Alumno[] = [];
  materias: Materia[] = [];
  materiasFiltradas: Materia[] = []; // Materias filtradas por carrera
  carreras: Carrera[] = [];
  asistencias: Asistencia[] = [];
  misAsistencias: Asistencia[] = [];
  cursos: Curso[] = [];
  cursosDeCarrera: Curso[] = []; // Cursos de la carrera seleccionada
  horariosMateria: HorarioCurso[] = [];
  cursoActual: Curso | null = null;
  estadisticasPorMateriaCache: Map<string, { totalClases: number; presentes: number; ausentes: number; tardanzas: number; justificados: number; porcentaje: number }> = new Map();
  estadisticasAlumnoCache: Map<string, { totalClases: number; presentes: number; ausentes: number; tardanzas: number; justificados: number; porcentaje: number }> = new Map();
  
  carreraSeleccionada: string = '';
  cursoSeleccionado: string = ''; // Nuevo filtro por curso
  materiaSeleccionada: string = '';
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  busqueda: string = '';
  mostrarCalendario: boolean = false;
  diasDelMes: Date[] = [];
  mesActual: Date = new Date();
  mostrarDetalleMateria: string = ''; // Para alumnos: ID de la materia cuyo detalle se está mostrando
  numeroClase: number = 1; // Número de clase actual

  // Opciones de exportación
  mostrarModalExportacion: boolean = false;
  opcionesExportacion = {
    tipo: 'materia', // 'materia' o 'carrera'
    incluirAlumno: true,
    incluirDNI: true,
    incluirMateria: true,
    incluirFecha: true,
    incluirEstado: true,
    incluirObservaciones: false,
    incluirEstadisticas: true,
    rango_fecha_inicio: '',
    rango_fecha_fin: ''
  };

  constructor(
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private cursoService: CursoService,
    private carreraService: CarreraService,
    private docenteService: DocenteService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService,
    private excelService: ExcelService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.generarCalendario();
    
    // Si es alumno, cargar sus datos automáticamente
    if (this.permissionsService.esAlumno()) {
      await this.cargarDatosAlumno();
    }
  }

  async loadData(): Promise<void> {
    try {
      this.cursos = await this.cursoService.getCursos();
      this.carreras = await this.carreraService.getCarreras();
      let todosLosAlumnos = await this.alumnoService.getAlumnos();
      
      // Cargar todas las materias disponibles
      let todasLasMaterias = await this.materiaService.getMaterias();
      
      // Si es profesor, filtrar por sus materias y alumnos de sus cursos
      if (this.permissionsService.esProfesor()) {
        const usuario = this.authService.getCurrentUser();
        if (usuario) {
          // Obtener docente y materias asignadas
          let docente = await this.docenteService.getDocenteById(usuario.id);
          if (!docente) {
            const todosLosDocentes = await this.docenteService.getDocentes();
            docente = todosLosDocentes.find(d => 
              d.nombre === usuario.nombre && d.apellido === usuario.apellido
            );
          }

          const materiasAsignadas = docente?.materiasAsignadas || [];
          const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
          
          // Filtrar materias del profesor
          todasLasMaterias = todasLasMaterias.filter(m => {
            if (materiasAsignadas.length > 0) {
              return materiasAsignadas.includes(m.id);
            }
            return m.profesor === nombreProfesor || m.profesor?.includes(usuario.nombre);
          });

          const materiasIdsProfesor = new Set(todasLasMaterias.map(m => m.id));
          
          // Filtrar cursos donde el profesor tiene materias
          const cursosDelProfesor = this.cursos.filter(curso => 
            curso.materias.some(mId => materiasIdsProfesor.has(mId))
          );
          
          // Obtener IDs de alumnos de esos cursos
          const idsAlumnosCursos = new Set<string>();
          cursosDelProfesor.forEach(curso => {
            curso.alumnos.forEach(alumnoId => idsAlumnosCursos.add(alumnoId));
          });

          // Filtrar alumnos que están en cursos del profesor
          todosLosAlumnos = todosLosAlumnos.filter(a => {
            const estaEnCurso = idsAlumnosCursos.has(a.id);
            const tieneCursoId = a.cursoId && cursosDelProfesor.some(c => c.id === a.cursoId);
            const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => cursosDelProfesor.some(c => c.id === cId));
            return estaEnCurso || tieneCursoId || tieneCursoIds;
          });
        }
      }
      // Si es alumno, solo sus materias
      else if (this.permissionsService.esAlumno()) {
        const usuarioId = this.authService.getCurrentUser()?.id;
        const alumno = await this.alumnoService.getAlumnoById(usuarioId || '');
        
        if (alumno && alumno.carreraId) {
          // Obtener materias de la carrera del alumno
          const materiasCarrera = todasLasMaterias.filter(m => m.carreraId === alumno.carreraId);
          
          // También obtener materias de cursos donde está inscrito el alumno
          const cursosAlumno = this.cursos.filter(c => c.alumnos.includes(usuarioId || ''));
          const materiasCursos = cursosAlumno.flatMap(c => c.materias || []);
          const materiasDeCursos = todasLasMaterias.filter(m => materiasCursos.includes(m.id));
          
          // Combinar ambas listas
          const todasMateriasAlumno = [...new Set([...materiasCarrera, ...materiasDeCursos].map(m => m.id))];
          todasLasMaterias = todasLasMaterias.filter(m => todasMateriasAlumno.includes(m.id));
        } else {
          // Si no tiene carrera, usar asistencias existentes
          const asistencias = await this.alumnoService.getAsistenciasByAlumno(usuarioId || '');
          const idsMaterias = [...new Set(asistencias.map(a => a.materiaId))];
          todasLasMaterias = todasLasMaterias.filter(m => idsMaterias.includes(m.id));
        }
      }
      
      this.alumnos = todosLosAlumnos;
      this.materias = todasLasMaterias;
      
      // Para alumnos, las materias filtradas son las mismas que las materias
      if (this.permissionsService.esAlumno()) {
        this.materiasFiltradas = todasLasMaterias;
      } else {
        this.materiasFiltradas = [];
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.notificationService.showError('Error al cargar los datos');
    }
  }

  async cargarDatosAlumno(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) return;
    
    // Obtener el alumno actual
    const alumno = await this.alumnoService.getAlumnoById(usuarioId);
    if (!alumno) return;
    
    // Si el alumno tiene carrera, seleccionarla automáticamente
    if (alumno.carreraId) {
      this.carreraSeleccionada = alumno.carreraId;
      await this.cargarCursosPorCarrera();
    }
    
    // Las materias ya se cargaron en loadData(), solo asegurar que materiasFiltradas esté actualizada
    if (this.materias.length > 0) {
      this.materiasFiltradas = this.materias;
    }
    
    // Cargar asistencias del alumno
    this.misAsistencias = await this.getMisAsistencias();
    
    // Actualizar cache de estadísticas
    if (this.materiasFiltradas.length > 0) {
      for (const materia of this.materiasFiltradas) {
        await this.actualizarEstadisticasPorMateria(materia.id);
      }
    }
  }

  async onCarreraChange(): Promise<void> {
    this.materiaSeleccionada = ''; // Reset materia al cambiar carrera
    this.cursoSeleccionado = ''; // Reset curso al cambiar carrera
    this.cursoActual = null;
    this.horariosMateria = [];
    await this.cargarMateriasPorCarrera();
    await this.cargarCursosPorCarrera();
    await this.cargarAsistencias();
  }

  async onCursoChange(): Promise<void> {
    if (this.cursoSeleccionado) {
      // Buscar el curso seleccionado
      this.cursoActual = this.cursosDeCarrera.find(c => c.id === this.cursoSeleccionado) || null;
      
      // Si hay materia seleccionada, cargar horarios de esa materia en este curso
      if (this.materiaSeleccionada && this.cursoActual) {
        await this.cargarHorariosMateria();
      }
    } else {
      this.cursoActual = null;
      this.horariosMateria = [];
    }
    await this.cargarAsistencias();
  }

  async cargarMateriasPorCarrera(): Promise<void> {
    if (!this.carreraSeleccionada) {
      this.materiasFiltradas = [];
      return;
    }

    // Filtrar materias que pertenecen a esta carrera
    const cursosDeCarrera = await this.cursoService.getCursosByCarrera(this.carreraSeleccionada);
    this.materiasFiltradas = this.materias.filter(m => {
      // Verificar si la materia tiene carreraId o está en los cursos de la carrera
      if (m.carreraId === this.carreraSeleccionada) {
        return true;
      }
      
      // Verificar si está en algún curso de esta carrera
      return cursosDeCarrera.some(c => c.materias.includes(m.id));
    });
  }

  async cargarCursosPorCarrera(): Promise<void> {
    if (!this.carreraSeleccionada) {
      this.cursosDeCarrera = [];
      return;
    }
    this.cursosDeCarrera = await this.cursoService.getCursosByCarrera(this.carreraSeleccionada);
  }

  async cargarAsistencias(): Promise<void> {
    if (this.materiaSeleccionada && this.fechaSeleccionada) {
      this.asistencias = await this.alumnoService.getAsistenciasByMateriaYFecha(
        this.materiaSeleccionada, 
        this.fechaSeleccionada
      );
    } else {
      this.asistencias = [];
    }
  }

  async onMateriaChange(): Promise<void> {
    if (!this.carreraSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione primero una carrera');
      this.materiaSeleccionada = '';
      return;
    }
    
    // Si hay curso seleccionado, cargar horarios de la materia en ese curso
    // Si no, cargar horarios de todos los cursos que tengan esta materia
    await this.cargarHorariosMateria();
    await this.cargarAsistencias();
    
    // Actualizar estadísticas para la materia seleccionada
    if (this.materiaSeleccionada) {
      await this.actualizarEstadisticasPorMateria(this.materiaSeleccionada);
    }
    // Si es alumno, cargar sus asistencias
    if (this.permissionsService.esAlumno()) {
      this.misAsistencias = await this.getMisAsistencias();
      // Actualizar estadísticas para la materia seleccionada
      if (this.materiaSeleccionada) {
        await this.actualizarEstadisticasPorMateria(this.materiaSeleccionada);
      }
    } else {
      // Si es profesor, actualizar estadísticas de todos los alumnos
      if (this.materiaSeleccionada && this.alumnos.length > 0) {
        for (const alumno of this.alumnos) {
          await this.actualizarEstadisticasAlumno(alumno.id);
        }
      }
    }
    this.generarCalendario();
  }

  onFechaChange(): void {
    this.cargarAsistencias();
  }

  async cargarHorariosMateria(): Promise<void> {
    if (!this.materiaSeleccionada || !this.carreraSeleccionada) {
      this.horariosMateria = [];
      this.cursoActual = null;
      return;
    }

    // Si hay curso seleccionado, usar ese curso
    if (this.cursoSeleccionado) {
      this.cursoActual = this.cursosDeCarrera.find(c => c.id === this.cursoSeleccionado) || null;
    } else {
      // Si no hay curso seleccionado, buscar cursos que tienen esta materia
      const cursosConMateria = this.cursosDeCarrera.filter(c => 
        c.materias.includes(this.materiaSeleccionada) && 
        c.carreraId === this.carreraSeleccionada
      );
      
      // Si hay cursos con esta materia, tomar el primero
      this.cursoActual = cursosConMateria.length > 0 ? cursosConMateria[0] : null;
    }
    
    if (this.cursoActual) {
      // Cargar horarios de la materia en este curso
      this.horariosMateria = this.cursoActual.horarios.filter(h => 
        h.materiaId === this.materiaSeleccionada
      );
    } else {
      this.horariosMateria = [];
    }
  }

  getDiasDeClase(): string[] {
    return [...new Set(this.horariosMateria.map(h => h.dia))];
  }

  esDiaDeClase(fecha: string | Date): boolean {
    // Si no hay horarios configurados, permitir tomar asistencia (solo verificar día)
    if (this.horariosMateria.length === 0) {
      return true;
    }
    
    const fechaObj = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    // Mapear a formato del modelo (el modelo usa 'miercoles' y 'sabado' sin tilde)
    const diaMapeado = diaSemana === 'miercoles' ? 'miercoles' : 
                      diaSemana === 'sabado' ? 'sabado' :
                      diaSemana;
    
    // Verificar si hay algún horario para este día (solo verificar el día, no la hora)
    return this.horariosMateria.some(h => {
      const horarioDia = h.dia.toLowerCase();
      return horarioDia === diaMapeado || 
             horarioDia.includes(diaMapeado) || 
             diaMapeado.includes(horarioDia);
    });
  }

  generarCalendario(): void {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    this.diasDelMes = [];
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      this.diasDelMes.push(new Date(año, mes, i));
    }
  }

  cambiarMes(direccion: number): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + direccion, 1);
    this.generarCalendario();
  }

  seleccionarFecha(fecha: Date): void {
    this.fechaSeleccionada = fecha.toISOString().split('T')[0];
    this.cargarAsistencias();
    this.mostrarCalendario = false;
  }

  esFechaSeleccionada(fecha: Date): boolean {
    const fechaStr = fecha.toISOString().split('T')[0];
    return fechaStr === this.fechaSeleccionada;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  getDiaNombre(dia: string): string {
    const dias: { [key: string]: string } = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado'
    };
    return dias[dia] || dia;
  }

  getAsistenciaAlumno(alumnoId: string): Asistencia | undefined {
    return this.asistencias.find(a => a.alumnoId === alumnoId);
  }

  marcarPresente(alumno: Alumno): void {
    this.actualizarAsistencia(alumno, 'presente');
  }

  marcarAusente(alumno: Alumno): void {
    this.actualizarAsistencia(alumno, 'ausente');
  }

  marcarTardanza(alumno: Alumno): void {
    this.actualizarAsistencia(alumno, 'tardanza');
  }

  marcarJustificado(alumno: Alumno): void {
    this.actualizarAsistencia(alumno, 'justificado');
  }

  async actualizarAsistencia(alumno: Alumno, estado: 'presente' | 'ausente' | 'tardanza' | 'justificado'): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAsistencias')) {
      this.notificationService.showError('No tiene permisos para modificar asistencia');
      return;
    }
    
    if (!this.materiaSeleccionada || !this.fechaSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una materia y una fecha');
      return;
    }

    // Verificar si es día de clase - BLOQUEAR si no es día de clase programado
    if (this.horariosMateria.length > 0 && !this.esDiaDeClase(this.fechaSeleccionada)) {
      const diasDeClase = this.getDiasDeClaseTexto();
      this.notificationService.showError(`No se puede tomar asistencia. Esta materia solo tiene clase los: ${diasDeClase}`);
      return;
    }
    
    // Si es profesor, verificar que esté asignado a esta materia en el horario del día
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (!usuario) {
        this.notificationService.showError('No se pudo verificar su identidad');
        return;
      }
      
      // Verificar que el profesor esté asignado a esta materia
      const horarioDelDia = this.horariosMateria.find(h => {
        const fechaObj = new Date(this.fechaSeleccionada + 'T00:00:00');
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const diaSemana = diasSemana[fechaObj.getDay()];
        const horarioDia = h.dia.toLowerCase();
        return horarioDia === diaSemana || horarioDia.includes(diaSemana) || diaSemana.includes(horarioDia);
      });
      
      if (horarioDelDia && horarioDelDia.docenteId !== usuario.id) {
        this.notificationService.showError('No está asignado como profesor de esta materia en este horario');
        return;
      }
      
      // También verificar que la materia esté asignada al profesor
      const materia = this.materias.find(m => m.id === this.materiaSeleccionada);
      if (materia) {
        // Verificar si el profesor tiene esta materia asignada
        const docente = await this.docenteService.getDocenteById(usuario.id);
        const materiasAsignadas = docente?.materiasAsignadas || [];
        if (materiasAsignadas.length > 0 && !materiasAsignadas.includes(this.materiaSeleccionada)) {
          this.notificationService.showError('No tiene permisos para modificar asistencia de esta materia');
          return;
        }
      }
    }

    const asistenciaExistente = this.getAsistenciaAlumno(alumno.id);
    const usuario = this.authService.getCurrentUser();
    const ahora = new Date();
    const horaRegistro = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    if (asistenciaExistente) {
      const asistenciaActualizada: Asistencia = {
        ...asistenciaExistente,
        estado: estado,
        presente: estado === 'presente' || estado === 'tardanza',
        horaRegistro: estado === 'tardanza' ? horaRegistro : asistenciaExistente.horaRegistro,
        editadaPor: usuario?.id,
        fechaEdicion: new Date().toISOString()
      };
      await this.alumnoService.updateAsistencia(asistenciaActualizada);
    } else {
      // Obtener horarioId si hay horarios
      const horarioId = this.horariosMateria.length > 0 ? this.horariosMateria[0].id : undefined;
      
      const nuevaAsistencia: Asistencia = {
        id: crypto.randomUUID(),
        alumnoId: alumno.id,
        materiaId: this.materiaSeleccionada,
        cursoId: this.cursoActual?.id,
        horarioId: horarioId,
        fecha: this.fechaSeleccionada,
        estado: estado,
        presente: estado === 'presente' || estado === 'tardanza',
        horaRegistro: estado === 'tardanza' ? horaRegistro : undefined,
        justificada: estado === 'justificado',
        cargadaPor: usuario?.id,
        fechaCarga: new Date().toISOString(),
        puedeEditar: true
      };
      await this.alumnoService.addAsistencia(nuevaAsistencia);
    }

    await this.cargarAsistencias();
    // Actualizar estadísticas después de marcar asistencia
    if (this.materiaSeleccionada && !this.permissionsService.esAlumno()) {
      await this.actualizarEstadisticasPorMateria(this.materiaSeleccionada);
      if (alumno.id) {
        await this.actualizarEstadisticasAlumno(alumno.id);
      }
    }
    const mensajes = {
      'presente': 'Presente',
      'ausente': 'Ausente',
      'tardanza': 'Tardanza',
      'justificado': 'Justificado'
    };
    this.notificationService.showSuccess(`Asistencia marcada como ${mensajes[estado]}`);
  }

  getAlumnosFiltrados(): Alumno[] {
    if (!this.materiaSeleccionada || !this.carreraSeleccionada) return [];

    let alumnosFiltrados: Alumno[] = [];

    // Obtener todos los cursos de la carrera que tienen esta materia
    const cursosConMateria = this.cursosDeCarrera.filter(c => 
      c.materias.includes(this.materiaSeleccionada) && 
      c.carreraId === this.carreraSeleccionada
    );

    // Obtener todos los IDs de cursos que tienen esta materia
    const idsCursosConMateria = cursosConMateria.map(c => c.id);

    // Obtener todos los IDs de alumnos de esos cursos (desde c.alumnos)
    const idsAlumnosCursos = [...new Set(
      cursosConMateria.flatMap(c => c.alumnos || [])
    )];

    // Filtrar alumnos que:
    // 1. Están en los cursos que tienen esta materia (usando c.alumnos)
    // 2. O tienen cursoId/cursoIds que coinciden con los cursos
    // 3. Y pertenecen a la carrera seleccionada
    alumnosFiltrados = this.alumnos.filter(a => {
      // Verificar si está en los cursos usando c.alumnos
      const estaEnCurso = idsAlumnosCursos.includes(a.id);
      
      // Verificar si tiene cursoId o cursoIds que coinciden
      const tieneCursoId = a.cursoId && idsCursosConMateria.includes(a.cursoId);
      const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => idsCursosConMateria.includes(cId));
      
      // Verificar si pertenece a la carrera
      const perteneceACarrera = a.carreraId === this.carreraSeleccionada || !a.carreraId;
      
      return (estaEnCurso || tieneCursoId || tieneCursoIds) && perteneceACarrera;
    });

    // Si no hay alumnos en cursos, pero hay alumnos de la carrera, mostrarlos
    // (esto puede pasar si los cursos aún no tienen alumnos asignados)
    if (alumnosFiltrados.length === 0) {
      alumnosFiltrados = this.alumnos.filter(a => 
        a.carreraId === this.carreraSeleccionada || !a.carreraId
      );
    }

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      alumnosFiltrados = alumnosFiltrados.filter(a =>
        a.nombre.toLowerCase().includes(busquedaLower) ||
        a.apellido.toLowerCase().includes(busquedaLower)
      );
    }

    return alumnosFiltrados;
  }

  async getPorcentajeAsistencia(alumnoId: string): Promise<number> {
    if (!this.materiaSeleccionada) return 0;
    return await this.alumnoService.getPorcentajeAsistencia(alumnoId, this.materiaSeleccionada);
  }

  getEstadisticasAlumno(alumnoId: string): { totalClases: number; presentes: number; ausentes: number; tardanzas: number; justificados: number; porcentaje: number } {
    return this.estadisticasAlumnoCache.get(alumnoId) || { totalClases: 0, presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0, porcentaje: 0 };
  }

  async actualizarEstadisticasAlumno(alumnoId: string): Promise<void> {
    if (!this.materiaSeleccionada) {
      this.estadisticasAlumnoCache.set(alumnoId, { totalClases: 0, presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0, porcentaje: 0 });
      return;
    }
    
    // Si hay curso actual, usar ese, sino buscar en todos los cursos
    if (this.cursoActual) {
      const estadisticas = await this.alumnoService.getEstadisticasAsistencia(alumnoId, this.materiaSeleccionada, this.cursoActual.id);
      this.estadisticasAlumnoCache.set(alumnoId, estadisticas);
    } else {
      // Buscar en todos los cursos de la carrera que tienen esta materia
      const cursosConMateria = this.cursosDeCarrera.filter(c => 
        c.materias.includes(this.materiaSeleccionada)
      );
      
      if (cursosConMateria.length > 0) {
        // Usar el primer curso que tenga la materia
        const estadisticas = await this.alumnoService.getEstadisticasAsistencia(alumnoId, this.materiaSeleccionada, cursosConMateria[0].id);
        this.estadisticasAlumnoCache.set(alumnoId, estadisticas);
      } else {
        this.estadisticasAlumnoCache.set(alumnoId, { totalClases: 0, presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0, porcentaje: 0 });
      }
    }
  }

  async getMisAsistencias(): Promise<Asistencia[]> {
    if (!this.permissionsService.esAlumno()) return [];
    
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) return [];
    
    // Si hay materia seleccionada, filtrar por materia
    if (this.materiaSeleccionada) {
      const asistencias = await this.alumnoService.getAsistenciasByAlumno(usuarioId);
      return asistencias.filter(a => a.materiaId === this.materiaSeleccionada);
    }
    
    // Si no hay materia seleccionada, mostrar todas las asistencias del alumno
    return await this.alumnoService.getAsistenciasByAlumno(usuarioId);
  }

  getEstadisticasPorMateria(materiaId: string): { totalClases: number; presentes: number; ausentes: number; tardanzas: number; justificados: number; porcentaje: number } {
    return this.estadisticasPorMateriaCache.get(materiaId) || { totalClases: 0, presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0, porcentaje: 0 };
  }

  async actualizarEstadisticasPorMateria(materiaId: string): Promise<void> {
    if (!this.permissionsService.esAlumno()) {
      return;
    }
    
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) {
      return;
    }
    
    // Buscar cursos que tienen esta materia
    const cursosConMateria = this.cursosDeCarrera.filter(c => 
      c.materias.includes(materiaId)
    );
    
    if (cursosConMateria.length > 0) {
      const estadisticas = await this.alumnoService.getEstadisticasAsistencia(usuarioId, materiaId, cursosConMateria[0].id);
      this.estadisticasPorMateriaCache.set(materiaId, estadisticas);
    } else {
      this.estadisticasPorMateriaCache.set(materiaId, { totalClases: 0, presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0, porcentaje: 0 });
    }
  }

  getAlertaAsistencia(porcentaje: number): { tipo: 'success' | 'warning' | 'danger', mensaje: string } {
    if (porcentaje >= 75) {
      return { tipo: 'success', mensaje: 'Tu asistencia está en buen nivel' };
    } else if (porcentaje >= 50) {
      return { tipo: 'warning', mensaje: 'Tu asistencia está por debajo del mínimo recomendado (75%)' };
    } else {
      return { tipo: 'danger', mensaje: '¡Atención! Tu asistencia está muy baja. Riesgo de perder la regularidad' };
    }
  }

  getEstadoAsistenciaTexto(estado?: string): string {
    const estados: { [key: string]: string } = {
      'presente': 'Presente',
      'ausente': 'Ausente',
      'tardanza': 'Tardanza',
      'justificado': 'Justificado'
    };
    return estados[estado || ''] || 'Sin registrar';
  }

  getIconoEstadoAsistencia(estado?: string): string {
    const iconos: { [key: string]: string } = {
      'presente': 'check_circle',
      'ausente': 'cancel',
      'tardanza': 'schedule',
      'justificado': 'description'
    };
    return iconos[estado || ''] || 'help';
  }

  getColorEstado(estado?: string): string {
    const colores: { [key: string]: string } = {
      'presente': '#4caf50',
      'ausente': '#f44336',
      'tardanza': '#ff9800',
      'justificado': '#2196f3'
    };
    return colores[estado || ''] || '#9e9e9e';
  }

  getColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 75) return '#4caf50';
    if (porcentaje >= 50) return '#ff9800';
    return '#f44336';
  }

  getDiaNombreCompleto(fecha: string): string {
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return diasSemana[fechaObj.getDay()];
  }

  getNombreMateria(materiaId: string): string {
    const materia = this.materias.find(m => m.id === materiaId);
    return materia ? materia.nombre : '';
  }

  getNombreCarrera(carreraId: string): string {
    const carrera = this.carreras.find(c => c.id === carreraId);
    return carrera ? carrera.nombre : '';
  }

  getTotalAlumnosCarrera(): number {
    if (!this.carreraSeleccionada) return 0;
    
    // Obtener todos los alumnos de los cursos de esta carrera
    const idsAlumnosCursos = [...new Set(
      this.cursosDeCarrera.flatMap(c => c.alumnos || [])
    )];
    
    // Contar alumnos únicos que pertenecen a esta carrera
    const alumnosUnicos = new Set(idsAlumnosCursos);
    return alumnosUnicos.size;
  }

  getDiasDeClaseTexto(): string {
    const dias = this.getDiasDeClase();
    if (dias.length === 0) return 'No hay horarios configurados';
    return dias.map(d => this.getDiaNombre(d)).join(', ');
  }

  toggleDetalleMateria(materiaId: string): void {
    if (this.mostrarDetalleMateria === materiaId) {
      this.mostrarDetalleMateria = '';
    } else {
      this.mostrarDetalleMateria = materiaId;
    }
  }

  getAsistenciasPorMateria(materiaId: string): Asistencia[] {
    return this.misAsistencias.filter(a => a.materiaId === materiaId);
  }

  getAsistenciasOrdenadasPorFecha(asistencias: Asistencia[]): Asistencia[] {
    return [...asistencias].sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return fechaB - fechaA; // Más recientes primero
    });
  }

  async marcarTodosPresentes(): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAsistencias')) {
      this.notificationService.showError('No tiene permisos para modificar asistencia');
      return;
    }
    
    if (!this.materiaSeleccionada || !this.fechaSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una materia y una fecha');
      return;
    }

    const alumnos = this.getAlumnosFiltrados();
    for (const alumno of alumnos) {
      await this.actualizarAsistencia(alumno, 'presente');
    }
    this.notificationService.showSuccess(`Se marcaron ${alumnos.length} alumnos como presentes`);
  }

  async marcarTodosAusentes(): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAsistencias')) {
      this.notificationService.showError('No tiene permisos para modificar asistencia');
      return;
    }
    
    if (!this.materiaSeleccionada || !this.fechaSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una materia y una fecha');
      return;
    }

    const alumnos = this.getAlumnosFiltrados();
    for (const alumno of alumnos) {
      await this.actualizarAsistencia(alumno, 'ausente');
    }
    this.notificationService.showSuccess(`Se marcaron ${alumnos.length} alumnos como ausentes`);
  }

  getNumeroClase(): number {
    // Calcular número de clase basado en las asistencias previas de esta materia
    // El número de clase es el mismo para todos los alumnos (clases dadas de la materia)
    if (!this.materiaSeleccionada) return 1;
    
    // Obtener todas las asistencias de esta materia (de todos los alumnos)
    const asistenciasMateria = this.asistencias.filter(a => 
      a.materiaId === this.materiaSeleccionada &&
      a.fecha < this.fechaSeleccionada // Solo fechas anteriores a la seleccionada
    );
    
    // Contar días únicos con asistencia (fechas en las que se tomó asistencia)
    const fechasUnicas = new Set(asistenciasMateria.map(a => a.fecha));
    
    // El número de clase es la cantidad de clases anteriores + 1 (la clase actual)
    return fechasUnicas.size + 1;
  }

  getNumeroClaseAlumno(alumnoId: string): number {
    // Retorna el mismo número de clase para todos (clases dadas de la materia)
    // No es específico por alumno, sino por materia
    return this.getNumeroClase();
  }

  /**
   * Abrir modal de opciones de exportación
   */
  abrirModalExportacion(): void {
    if (!this.carreraSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una carrera');
      return;
    }
    // Resetear opciones a valores por defecto
    this.opcionesExportacion = {
      tipo: 'materia',
      incluirAlumno: true,
      incluirDNI: true,
      incluirMateria: true,
      incluirFecha: true,
      incluirEstado: true,
      incluirObservaciones: false,
      incluirEstadisticas: true,
      rango_fecha_inicio: '',
      rango_fecha_fin: ''
    };
    this.mostrarModalExportacion = true;
  }

  /**
   * Cerrar modal de exportación
   */
  cerrarModalExportacion(): void {
    this.mostrarModalExportacion = false;
  }

  /**
   * Procesar exportación con opciones seleccionadas
   */
  procederConExportacion(): void {
    if (this.opcionesExportacion.tipo === 'carrera') {
      this.exportarAsistenciaCarreraCompleta();
    } else {
      if (!this.materiaSeleccionada) {
        this.notificationService.showWarning('Por favor seleccione una materia para exportar');
        return;
      }
      this.exportarAsistenciaMateria();
    }
    this.cerrarModalExportacion();
  }

  /**
   * Exportar asistencia de una carrera completa
   */
  async exportarAsistenciaCarreraCompleta(): Promise<void> {
    if (!this.carreraSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una carrera');
      return;
    }

    try {
      const carreraInfo = this.carreras.find(c => c.id === this.carreraSeleccionada);
      const nombreArchivo = `asistencia_carrera_${carreraInfo?.nombre || 'completa'}_${new Date().getTime()}`;

      // Obtener todas las asistencias de la carrera
      const todasLasAsistencias = await this.alumnoService.getAsistenciasByCarrera(this.carreraSeleccionada);
      
      // Filtrar por rango de fechas si está especificado
      let asistenciasFiltradas = todasLasAsistencias;
      if (this.opcionesExportacion.rango_fecha_inicio && this.opcionesExportacion.rango_fecha_fin) {
        const fechaInicio = new Date(this.opcionesExportacion.rango_fecha_inicio);
        const fechaFin = new Date(this.opcionesExportacion.rango_fecha_fin);
        asistenciasFiltradas = todasLasAsistencias.filter(a => {
          const fechaAsistencia = new Date(a.fecha);
          return fechaAsistencia >= fechaInicio && fechaAsistencia <= fechaFin;
        });
      }

      // Construir datos detallados
      const datosDetallados = this.construirDatosDetallados(asistenciasFiltradas);
      const datosEstadisticas = this.construirEstadisticasCarreraDetalladas();
      const datosAlertasRiesgo = this.construirAlertasRiesgo();
      const datosComparativa = this.construirComparativaAsistencia();
      const datosResumen = this.construirResumenCarrera(carreraInfo, asistenciasFiltradas);

      // Exportar con el nuevo método detallado
      this.excelService.exportarDetalladoAsistencia(
        datosDetallados,
        datosEstadisticas,
        datosAlertasRiesgo,
        datosComparativa,
        datosResumen,
        nombreArchivo
      );

      this.notificationService.showSuccess(`Asistencia de carrera exportada correctamente a Excel con análisis completo`);
    } catch (error: any) {
      console.error('Error al exportar asistencia de carrera:', error);
      this.notificationService.showError('Error al exportar asistencia');
    }
  }

  /**
   * Exportar asistencia de una materia individual
   */
  async exportarAsistenciaMateria(): Promise<void> {
    if (!this.materiaSeleccionada || !this.carreraSeleccionada) {
      this.notificationService.showWarning('Por favor seleccione una carrera y materia');
      return;
    }

    try {
      const materiaInfo = this.materias.find(m => m.id === this.materiaSeleccionada);
      const carreraInfo = this.carreras.find(c => c.id === this.carreraSeleccionada);
      const nombreArchivo = `asistencia_${materiaInfo?.nombre || 'materia'}_${new Date().getTime()}`;

      // Obtener asistencias de la materia
      let asistenciasMateria = await this.alumnoService.getAsistenciasByMateria(this.materiaSeleccionada);

      // Filtrar por rango de fechas si está especificado
      if (this.opcionesExportacion.rango_fecha_inicio && this.opcionesExportacion.rango_fecha_fin) {
        const fechaInicio = new Date(this.opcionesExportacion.rango_fecha_inicio);
        const fechaFin = new Date(this.opcionesExportacion.rango_fecha_fin);
        asistenciasMateria = asistenciasMateria.filter(a => {
          const fechaAsistencia = new Date(a.fecha);
          return fechaAsistencia >= fechaInicio && fechaAsistencia <= fechaFin;
        });
      }

      // Construir datos detallados
      const datosDetallados = this.construirDatosDetallados(asistenciasMateria);
      const datosEstadisticas = this.construirEstadisticasMateriaDetalladas(this.materiaSeleccionada);
      const datosAlertasRiesgo = this.construirAlertasRiesgoMateria(this.materiaSeleccionada);
      const datosComparativa = this.construirComparativMateria(this.materiaSeleccionada);
      const datosResumen = this.construirResumenMateria(materiaInfo, carreraInfo, asistenciasMateria);

      // Exportar con el nuevo método detallado
      this.excelService.exportarDetalladoAsistencia(
        datosDetallados,
        datosEstadisticas,
        datosAlertasRiesgo,
        datosComparativa,
        datosResumen,
        nombreArchivo
      );

      this.notificationService.showSuccess('Asistencia de materia exportada correctamente a Excel con análisis completo');
    } catch (error: any) {
      console.error('Error al exportar asistencia:', error);
      this.notificationService.showError('Error al exportar asistencia');
    }
  }

  /**
   * Construir datos de exportación según opciones seleccionadas
   */
  private construirDatosExportacion(asistencias: Asistencia[]): any[] {
    return asistencias.map(asistencia => {
      const alumno = this.alumnos.find(a => a.id === asistencia.alumnoId);
      const materia = this.materias.find(m => m.id === asistencia.materiaId);
      const dato: any = {};

      if (this.opcionesExportacion.incluirAlumno) {
        dato['Alumno'] = alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido';
      }
      if (this.opcionesExportacion.incluirDNI) {
        dato['DNI'] = alumno?.dni || 'N/A';
      }
      if (this.opcionesExportacion.incluirMateria) {
        dato['Materia'] = materia?.nombre || '';
      }
      if (this.opcionesExportacion.incluirFecha) {
        dato['Fecha'] = asistencia.fecha;
      }
      if (this.opcionesExportacion.incluirEstado) {
        dato['Estado'] = asistencia.estado || 'Sin registrar';
      }
      if (this.opcionesExportacion.incluirObservaciones && asistencia.observaciones) {
        dato['Observaciones'] = asistencia.observaciones;
      }

      return dato;
    });
  }

  /**
   * Construir estadísticas por carrera completa
   */
  private construirEstadisticasCarrera(): any[] {
    return this.alumnos.map(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      const dato: any = {
        'Alumno': `${alumno.nombre} ${alumno.apellido}`,
        'DNI': alumno.dni || 'N/A'
      };

      if (this.opcionesExportacion.incluirEstadisticas) {
        dato['Total Clases'] = stats.totalClases;
        dato['Presentes'] = stats.presentes;
        dato['Ausentes'] = stats.ausentes;
        dato['Tardanzas'] = stats.tardanzas;
        dato['Justificados'] = stats.justificados;
        dato['Porcentaje'] = `${stats.porcentaje}%`;
      }

      return dato;
    });
  }

  /**
   * Construir estadísticas por materia
   */
  private construirEstadisticasMateria(materiaId: string): any[] {
    return this.getAlumnosFiltrados().map(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      const dato: any = {
        'Alumno': `${alumno.nombre} ${alumno.apellido}`,
        'DNI': alumno.dni || 'N/A'
      };

      if (this.opcionesExportacion.incluirEstadisticas) {
        dato['Total Clases'] = stats.totalClases;
        dato['Presentes'] = stats.presentes;
        dato['Ausentes'] = stats.ausentes;
        dato['Tardanzas'] = stats.tardanzas;
        dato['Justificados'] = stats.justificados;
        dato['Porcentaje'] = `${stats.porcentaje}%`;
      }

      return dato;
    });
  }

  /**
   * Construir datos detallados para exportación con información expandida
   */
  private construirDatosDetallados(asistencias: Asistencia[]): any[] {
    return asistencias.map(asistencia => {
      const alumno = this.alumnos.find(a => a.id === asistencia.alumnoId);
      const materia = this.materias.find(m => m.id === asistencia.materiaId);
      const fecha = new Date(asistencia.fecha);
      
      return {
        'Alumno': alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido',
        'DNI': alumno?.dni || 'N/A',
        'Email': alumno?.email || 'N/A',
        'Materia': materia?.nombre || '',
        'Código Materia': materia?.codigo || '',
        'Fecha': fecha.toLocaleDateString('es-ES'),
        'Día': ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SÁB'][fecha.getDay()],
        'Estado': asistencia.estado || 'Sin Registrar',
        'Observaciones': asistencia.observaciones || '-'
      };
    });
  }

  /**
   * Estadísticas detalladas por carrera con análisis adicionales
   */
  private construirEstadisticasCarreraDetalladas(): any[] {
    const minClasesParaEvaluacion = 10; // Mínimo de clases antes de evaluar riesgo
    
    return this.alumnos.map(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      const porcentajeNum = stats.porcentaje || 0;
      const totalClases = stats.totalClases;
      
      // Determinar riesgo solo si tiene suficientes clases registradas
      let riesgo = 'Bajo';
      if (totalClases >= minClasesParaEvaluacion) {
        // Con datos confiables, usar criterios de riesgo
        if (porcentajeNum < 50) riesgo = 'Crítico';
        else if (porcentajeNum < 60) riesgo = 'Alto';
        else if (porcentajeNum < 75) riesgo = 'Medio';
        else if (porcentajeNum < 85) riesgo = 'Bajo';
        else riesgo = 'Excelente';
      } else {
        // Con pocas clases, no evaluar riesgo aún
        riesgo = totalClases > 0 ? 'Sin evaluar' : 'Sin datos';
      }

      return {
        'Alumno': `${alumno.nombre} ${alumno.apellido}`,
        'DNI': alumno.dni || 'N/A',
        'Email': alumno.email || 'N/A',
        'Total Clases': stats.totalClases,
        'Presentes': stats.presentes,
        'Ausentes': stats.ausentes,
        'Tardanzas': stats.tardanzas,
        'Justificados': stats.justificados,
        'Porcentaje Asistencia': `${porcentajeNum}%`,
        'Nivel Riesgo': riesgo,
        'Por Recuperar': stats.totalClases >= minClasesParaEvaluacion ? 
          Math.max(0, Math.ceil(stats.totalClases * 0.75) - stats.presentes) : 
          'Muy poco para evaluar'
      };
    });
  }

  /**
   * Estadísticas detalladas por materia
   */
  private construirEstadisticasMateriaDetalladas(materiaId: string): any[] {
    const minClasesParaEvaluacion = 8; // Menos clases por materia individual
    
    return this.getAlumnosFiltrados().map(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      const porcentajeNum = stats.porcentaje || 0;
      const totalClases = stats.totalClases;
      
      // Determinar desempeño solo si tiene suficientes clases registradas
      let desempeño = 'Excelente';
      if (totalClases >= minClasesParaEvaluacion) {
        // Con datos confiables, usar criterios de desempeño
        if (porcentajeNum < 50) desempeño = 'Muy Deficiente';
        else if (porcentajeNum < 60) desempeño = 'Deficiente';
        else if (porcentajeNum < 75) desempeño = 'Regular';
        else if (porcentajeNum < 90) desempeño = 'Bueno';
        else desempeño = 'Excelente';
      } else {
        // Con pocas clases, no evaluar aún
        desempeño = totalClases > 0 ? 'Sin evaluar' : 'Sin datos';
      }

      return {
        'Alumno': `${alumno.nombre} ${alumno.apellido}`,
        'DNI': alumno.dni || 'N/A',
        'Total Clases': stats.totalClases,
        'Presentes': stats.presentes,
        'Ausentes': stats.ausentes,
        'Tardanzas': stats.tardanzas,
        'Justificados': stats.justificados,
        'Porcentaje': `${porcentajeNum}%`,
        'Desempeño': desempeño
      };
    });
  }

  /**
   * Alertas y riesgos: Alumnos con asistencia por debajo de límite
   */
  private construirAlertasRiesgo(): any[] {
    const umbralRiesgo = 75; // 75% de asistencia requerida
    const minClasesParaRiesgo = 10; // Mínimo de clases para considerar un riesgo real
    const alertas: any[] = [];

    this.alumnos.forEach(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      
      // Solo marcar como riesgo si tiene suficientes registros
      if (stats.totalClases >= minClasesParaRiesgo && stats.porcentaje < umbralRiesgo) {
        // Calcular si realmente está en riesgo crítico (no solo inicial)
        const ausenciasActuales = stats.ausentes;
        const presenciasActuales = stats.presentes;
        const tasaPresencia = stats.porcentaje;
        
        // Determinar severidad
        let nivelAlerta = 'Seguimiento';
        let recomendacion = 'Seguimiento recomendado';
        
        if (tasaPresencia < 50) {
          nivelAlerta = 'CRÍTICO';
          recomendacion = 'URGENTE: Contactar alumno e ir tutores immediatamente';
        } else if (tasaPresencia < 60) {
          nivelAlerta = 'ALTO';
          recomendacion = 'URGENTE: Contactar al alumno';
        } else if (tasaPresencia < 70) {
          nivelAlerta = 'MEDIO';
          recomendacion = 'Seguimiento frecuente recomendado';
        }
        
        alertas.push({
          'Alumno': `${alumno.nombre} ${alumno.apellido}`,
          'DNI': alumno.dni || 'N/A',
          'Porcentaje Asistencia': `${tasaPresencia}%`,
          'Clases Registradas': stats.totalClases,
          'Presentes': presenciasActuales,
          'Ausentes': ausenciasActuales,
          'Tardanzas': stats.tardanzas,
          'Nivel': nivelAlerta,
          'Recomendación': recomendacion,
          'Notas': `Necesita ${Math.ceil(stats.totalClases * 0.75 - stats.presentes)} más presencias para alcanzar 75%`
        });
      }
    });

    return alertas;
  }

  /**
   * Alertas por materia
   */
  private construirAlertasRiesgoMateria(materiaId: string): any[] {
    const umbralRiesgo = 75;
    const minClasesParaRiesgo = 8; // Menos clases por materia individual
    const alertas: any[] = [];

    this.getAlumnosFiltrados().forEach(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      
      // Solo marcar como riesgo si tiene suficientes registros EN ESTA MATERIA
      if (stats.totalClases >= minClasesParaRiesgo && stats.porcentaje < umbralRiesgo) {
        const tasaPresencia = stats.porcentaje;
        let nivelAlerta = 'ADVERTENCIA';
        let accion = 'Seguimiento recomendado';
        
        if (tasaPresencia < 50) {
          nivelAlerta = 'CRÍTICO';
          accion = 'Contactar inmediatamente: riesgo de reprobación';
        } else if (tasaPresencia < 60) {
          nivelAlerta = 'ALTO RIESGO';
          accion = 'Llamada al padre + reunión urgente con alumno';
        } else if (tasaPresencia < 70) {
          nivelAlerta = 'MEDIO RIESGO';
          accion = 'Conversación con alumno y padre';
        }
        
        alertas.push({
          'Alumno': `${alumno.nombre} ${alumno.apellido}`,
          'DNI': alumno.dni || 'N/A',
          'Clases Registradas': stats.totalClases,
          'Porcentaje': `${tasaPresencia}%`,
          'Ausentes': stats.ausentes,
          'Tardanzas': stats.tardanzas,
          'Nivel de Riesgo': nivelAlerta,
          'Acción Recomendada': accion,
          'Nota': `${stats.totalClases - stats.presentes} inasistencias registradas`
        });
      }
    });

    return alertas;
  }

  /**
   * Comparativa de asistencia: Análisis por rango de fechas y patrones
   */
  private construirComparativaAsistencia(): any[] {
    const comparativa: any[] = [];
    const materiasSinDuplicados = [...new Set(this.materias.map(m => m.nombre))];

    materiasSinDuplicados.forEach(materiaNombre => {
      const materia = this.materias.find(m => m.nombre === materiaNombre);
      if (!materia) return;

      const alumnos = this.getAlumnosFiltrados();
      const totalAlumnos = alumnos.length;
      
      let totalPresentes = 0;
      let totalAusentes = 0;
      let totalTardanzas = 0;

      alumnos.forEach(alumno => {
        const stats = this.getEstadisticasAlumno(alumno.id);
        totalPresentes += stats.presentes;
        totalAusentes += stats.ausentes;
        totalTardanzas += stats.tardanzas;
      });

      const porcentajePromedio = totalAlumnos > 0 
        ? Math.round(((totalPresentes / (totalPresentes + totalAusentes + totalTardanzas)) * 100) || 0)
        : 0;

      comparativa.push({
        'Materia': materiaNombre,
        'Total Alumnos': totalAlumnos,
        'Asistencia Promedio': `${porcentajePromedio}%`,
        'Tendencia': porcentajePromedio > 85 ? '↑ Excelente' : porcentajePromedio > 75 ? '→ Normal' : '↓ Preocupante'
      });
    });

    return comparativa;
  }

  /**
   * Comparativa por materia
   */
  private construirComparativMateria(materiaId: string): any[] {
    const comparativa: any[] = [];
    const alumnos = this.getAlumnosFiltrados();
    
    // Agrupar alumnos por rango de asistencia
    const rangos = {
      'Excelente (95-100%)': 0,
      'Muy Bueno (85-94%)': 0,
      'Bueno (75-84%)': 0,
      'Regular (60-74%)': 0,
      'Deficiente (<60%)': 0
    };

    alumnos.forEach(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      const porc = stats.porcentaje;
      
      if (porc >= 95) rangos['Excelente (95-100%)']++;
      else if (porc >= 85) rangos['Muy Bueno (85-94%)']++;
      else if (porc >= 75) rangos['Bueno (75-84%)']++;
      else if (porc >= 60) rangos['Regular (60-74%)']++;
      else rangos['Deficiente (<60%)']++;
    });

    Object.entries(rangos).forEach(([rango, cantidad]) => {
      comparativa.push({
        'Rango de Asistencia': rango,
        'Cantidad Alumnos': cantidad,
        'Porcentaje': alumnos.length > 0 ? `${Math.round((cantidad / alumnos.length) * 100)}%` : '0%'
      });
    });

    return comparativa;
  }

  /**
   * Resumen general de carrera
   */
  private construirResumenCarrera(carreraInfo: any, asistencias: Asistencia[]): any {
    const totalAlumnos = this.alumnos.length;
    const asistenciasActuales = asistencias.length;
    let totalPresentes = 0, totalAusentes = 0, totalTardanzas = 0;

    this.alumnos.forEach(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      totalPresentes += stats.presentes;
      totalAusentes += stats.ausentes;
      totalTardanzas += stats.tardanzas;
    });

    const porcentajePromedio = (totalPresentes + totalAusentes + totalTardanzas) > 0
      ? Math.round((totalPresentes / (totalPresentes + totalAusentes + totalTardanzas)) * 100)
      : 0;

    return {
      'RESUMEN GENERAL': carreraInfo?.nombre || 'Sin Especificar',
      'Total Alumnos': totalAlumnos,
      'Total Materias': this.materiasFiltradas?.length || 0,
      'Registros de Asistencia': asistenciasActuales,
      'Asistencia Promedio': `${porcentajePromedio}%`,
      'Fecha Generación': new Date().toLocaleDateString('es-ES'),
      'Período Análisis': `Desde hoy hasta hoy`,
      'Estatus General': porcentajePromedio > 85 ? '✓ Óptimo' : porcentajePromedio > 75 ? '~ Aceptable' : '✗ Crítico'
    };
  }

  /**
   * Resumen general de materia
   */
  private construirResumenMateria(materiaInfo: any, carreraInfo: any, asistencias: Asistencia[]): any {
    const totalAlumnos = this.getAlumnosFiltrados().length;
    let totalPresentes = 0, totalAusentes = 0, totalTardanzas = 0;

    this.getAlumnosFiltrados().forEach(alumno => {
      const stats = this.getEstadisticasAlumno(alumno.id);
      totalPresentes += stats.presentes;
      totalAusentes += stats.ausentes;
      totalTardanzas += stats.tardanzas;
    });

    const porcentajePromedio = (totalPresentes + totalAusentes + totalTardanzas) > 0
      ? Math.round((totalPresentes / (totalPresentes + totalAusentes + totalTardanzas)) * 100)
      : 0;

    return {
      'MATERIA': materiaInfo?.nombre || 'Sin Especificar',
      'Carrera': carreraInfo?.nombre || 'Sin Especificar',
      'Código Materia': materiaInfo?.codigo || 'N/A',
      'Total Alumnos': totalAlumnos,
      'Registros': asistencias.length,
      'Asistencia Promedio': `${porcentajePromedio}%`,
      'Fecha Generación': new Date().toLocaleDateString('es-ES'),
      'Estatus': porcentajePromedio > 80 ? '✓ Bueno' : porcentajePromedio > 70 ? '~ Aceptable' : '✗ Bajo'
    };
  }
}

