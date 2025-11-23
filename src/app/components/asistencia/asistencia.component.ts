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
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
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
  materiaSeleccionada: string = '';
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  busqueda: string = '';
  mostrarCalendario: boolean = false;
  diasDelMes: Date[] = [];
  mesActual: Date = new Date();
  mostrarDetalleMateria: string = ''; // Para alumnos: ID de la materia cuyo detalle se está mostrando

  constructor(
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private cursoService: CursoService,
    private carreraService: CarreraService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService
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
    this.cursos = await this.cursoService.getCursos();
    this.carreras = await this.carreraService.getCarreras();
    this.alumnos = await this.alumnoService.getAlumnos();
    
    // Cargar todas las materias disponibles
    let todasLasMaterias = await this.materiaService.getMaterias();
    
    // Si es profesor, filtrar por sus materias
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        // Buscar materias donde el profesor es el asignado
        todasLasMaterias = todasLasMaterias.filter(m => {
          const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
          return m.profesor === nombreProfesor || m.profesor?.includes(usuario.nombre);
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
    
    this.materias = todasLasMaterias;
    
    // Para alumnos, las materias filtradas son las mismas que las materias
    if (this.permissionsService.esAlumno()) {
      this.materiasFiltradas = todasLasMaterias;
    } else {
      this.materiasFiltradas = [];
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
    this.cursoActual = null;
    this.horariosMateria = [];
    await this.cargarMateriasPorCarrera();
    await this.cargarCursosPorCarrera();
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
    this.cargarHorariosMateria();
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

  cargarHorariosMateria(): void {
    if (!this.materiaSeleccionada || !this.carreraSeleccionada) {
      this.horariosMateria = [];
      this.cursoActual = null;
      return;
    }

    // Buscar todos los cursos de la carrera que tienen esta materia
    const cursosConMateria = this.cursosDeCarrera.filter(c => 
      c.materias.includes(this.materiaSeleccionada) && 
      c.carreraId === this.carreraSeleccionada
    );

    // Si hay múltiples cursos, usar el primero (o podríamos mostrar todos)
    // En el futuro se podría permitir seleccionar el curso específico
    this.cursoActual = cursosConMateria.length > 0 ? cursosConMateria[0] : null;

    if (this.cursoActual) {
      // Obtener horarios de esta materia en el curso
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
    if (this.horariosMateria.length === 0) return false;
    
    const fechaObj = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    // Mapear a formato del modelo (el modelo usa 'miercoles' y 'sabado' sin tilde)
    const diaMapeado = diaSemana === 'miercoles' ? 'miercoles' : 
                      diaSemana === 'sabado' ? 'sabado' :
                      diaSemana;
    
    return this.getDiasDeClase().includes(diaMapeado);
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

    // Verificar si es día de clase
    if (!this.esDiaDeClase(this.fechaSeleccionada)) {
      this.notificationService.showWarning('No hay clase programada para esta materia en esta fecha según el horario');
      return;
    }
    
    // Si es profesor, verificar que la materia esté asignada
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materia = this.materias.find(m => m.id === this.materiaSeleccionada);
      if (materia && materia.profesor !== `${usuario?.nombre} ${usuario?.apellido}`) {
        this.notificationService.showError('No tiene permisos para modificar asistencia de esta materia');
        return;
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
        id: Date.now().toString(),
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

    // Obtener todos los IDs de alumnos de esos cursos
    const idsAlumnosCursos = [...new Set(
      cursosConMateria.flatMap(c => c.alumnos || [])
    )];

    // Filtrar alumnos que:
    // 1. Están en los cursos que tienen esta materia
    // 2. Pertenecen a la carrera seleccionada (o no tienen carreraId asignado aún)
    alumnosFiltrados = this.alumnos.filter(a => {
      const estaEnCurso = idsAlumnosCursos.includes(a.id);
      const perteneceACarrera = a.carreraId === this.carreraSeleccionada || !a.carreraId;
      return estaEnCurso && perteneceACarrera;
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
      'presente': '✅ Presente',
      'ausente': '❌ Ausente',
      'tardanza': '⏰ Tardanza',
      'justificado': '📝 Justificado'
    };
    return estados[estado || ''] || 'Sin registrar';
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
}

