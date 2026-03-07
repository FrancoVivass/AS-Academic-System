import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AlumnoService } from '../../services/alumno.service';
import { CarreraService } from '../../services/carrera.service';
import { MateriaService } from '../../services/materia.service';
import { DocenteService } from '../../services/docente.service';
import { CursoService } from '../../services/curso.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { ScrollLockService } from '../../services/scroll-lock.service';
import { Alumno } from '../../models/alumno.model';
import { Usuario } from '../../models/usuario.model';
import { Carrera } from '../../models/carrera.model';
import { Materia } from '../../models/materia.model';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './alumnos.component.html',
  styleUrl: './alumnos.component.css'
})
export class AlumnosComponent implements OnInit {
  alumnos: Alumno[] = [];
  alumnosFiltrados: Alumno[] = [];
  alumnoSeleccionado: Alumno | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  busqueda: string = '';
  filtroCurso: string = '';
  alumnoForm: FormGroup;
  displayedColumns: string[] = ['nombre', 'dni', 'curso', 'promedio', 'asistencia', 'estado', 'acciones'];

  usuariosDisponibles: Usuario[] = [];
  mostrarUsuarios: boolean = false;
  mostrarModalImportar: boolean = false;
  carreras: Carrera[] = [];
  carreraSeleccionada: string = ''; // Para profesores y filtro
  filtroCarrera: string = ''; // Filtro de carrera para admin/secretario
  filtroMateria: string = ''; // Filtro por materia para profesores
  cursosDisponibles: any[] = []; // Cursos disponibles para el formulario
  cursosParaFiltro: any[] = []; // Cursos disponibles para el filtro (según carrera seleccionada)
  materiasProfesor: Materia[] = []; // Materias del profesor
  materiasDisponibles: Materia[] = []; // Materias disponibles para filtro
  estadisticasPorMateria: Map<string, { promedio: number; asistencia: number; totalAlumnos: number }> = new Map();

  constructor(
    private alumnoService: AlumnoService,
    private carreraService: CarreraService,
    private materiaService: MateriaService,
    private docenteService: DocenteService,
    private cursoService: CursoService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private scrollLockService: ScrollLockService
  ) {
    this.alumnoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      carreraId: ['', Validators.required],
      cursoId: ['', Validators.required],
      fechaNacimiento: [''],
      direccion: [''],
      localidad: ['']
    });
    
    // Cargar cursos cuando cambia la carrera seleccionada en el formulario
    this.alumnoForm.get('carreraId')?.valueChanges.subscribe(async (carreraId) => {
      console.log('Carrera seleccionada en formulario:', carreraId);
      if (carreraId) {
        await this.cargarCursosPorCarrera(carreraId);
        // Limpiar el curso seleccionado cuando cambia la carrera
        this.alumnoForm.get('cursoId')?.setValue('');
      } else {
        this.cursosDisponibles = [];
        this.alumnoForm.get('cursoId')?.setValue('');
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCarreras();
    
    // Para admin/secretario: cargar todos los cursos para el filtro inicial
    if (!this.permissionsService.esProfesor()) {
      try {
        const todosLosCursos = await this.cursoService.getCursos();
        this.cursosParaFiltro = todosLosCursos;
        console.log('Cursos cargados para filtro inicial:', this.cursosParaFiltro.length);
      } catch (error) {
        console.error('Error cargando cursos para filtro:', error);
        this.cursosParaFiltro = [];
      }
    }
    
    // loadAlumnos se llama después si es profesor y hay carrera seleccionada
    if (!this.permissionsService.esProfesor() || this.carreraSeleccionada) {
      await this.loadAlumnos();
    }
    
    // Suscribirse a cambios en alumnos desde el servicio para actualizar automáticamente
    // Usar takeUntil para evitar suscripciones múltiples y bucles infinitos
    let cargandoAlumnos = false;
    this.alumnoService.alumnos$.subscribe(async (alumnos) => {
      // Evitar bucles infinitos: no recargar si ya estamos cargando
      if (cargandoAlumnos) {
        return;
      }
      
      // Evitar actualizaciones innecesarias si ya tenemos los mismos alumnos
      if (alumnos.length === this.alumnos.length && 
          alumnos.every((a, i) => a.id === this.alumnos[i]?.id)) {
        return; // No hay cambios reales, evitar recarga
      }
      
      // Actualizar cuando hay cambios significativos
      if (alumnos.length !== this.alumnos.length) {
        console.log(`Cambio detectado: ${alumnos.length} alumnos en servicio vs ${this.alumnos.length} en componente`);
        cargandoAlumnos = true;
        try {
          // En lugar de llamar a loadAlumnos() que puede crear un bucle, 
          // simplemente actualizar la lista directamente
          this.alumnos = alumnos;
          this.aplicarFiltros();
        } finally {
          cargandoAlumnos = false;
        }
      }
    });
  }

  async cargarCursosPorCarrera(carreraId: string): Promise<void> {
    try {
      console.log('Cargando cursos para carrera:', carreraId);
      this.cursosDisponibles = await this.cursoService.getCursosByCarrera(carreraId);
      console.log(`Cursos cargados para carrera ${carreraId}:`, this.cursosDisponibles.length);
      console.log('Cursos disponibles:', this.cursosDisponibles);
      
      // Si no hay cursos, mostrar un mensaje
      if (this.cursosDisponibles.length === 0) {
        console.warn('No se encontraron cursos para la carrera seleccionada');
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      this.cursosDisponibles = [];
      this.notificationService.showWarning('Error al cargar los cursos de la carrera seleccionada');
    }
  }

  getAnioCurso(curso: any): number {
    return curso.año || (curso as any)['año'] || 0;
  }

  async loadCarreras(): Promise<void> {
    if (this.permissionsService.esProfesor()) {
      // Para profesores: solo carreras donde tiene materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        // Intentar obtener docente por ID
        let docente = await this.docenteService.getDocenteById(usuario.id);
        
        // Si no se encuentra por ID, buscar por nombre
        if (!docente) {
          const todosLosDocentes = await this.docenteService.getDocentes();
          docente = todosLosDocentes.find(d => 
            d.nombre === usuario.nombre && d.apellido === usuario.apellido
          );
        }
        
        const materiasAsignadas = docente?.materiasAsignadas || [];
        const todasLasMaterias = await this.materiaService.getMaterias();
        const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
        
        // Filtrar materias del profesor
        const materiasProfesor = todasLasMaterias.filter((m: Materia) => {
          // Por materiasAsignadas si existe
          if (materiasAsignadas.length > 0) {
            return materiasAsignadas.includes(m.id);
          }
          // Fallback: por nombre del profesor
          return m.profesor === nombreProfesor || 
                 m.profesor?.includes(usuario.nombre) ||
                 m.profesor?.includes(usuario.apellido);
        });
        
        this.materiasProfesor = materiasProfesor;
        this.materiasDisponibles = materiasProfesor; // Para el filtro de materia
        
        // Obtener carreras únicas de las materias del profesor
        const carrerasIds = new Set<string>();
        materiasProfesor.forEach((m: Materia) => {
          if (m.carreraId) {
            carrerasIds.add(m.carreraId);
          }
        });
        
        // También buscar en cursos que tienen estas materias
        const todasLasCarreras = await this.carreraService.getCarreras();
        const cursos = await this.cursoService.getCursos();
        
        cursos.forEach(curso => {
          if (curso.materias.some(mId => materiasProfesor.some(m => m.id === mId))) {
            if (curso.carreraId) {
              carrerasIds.add(curso.carreraId);
            }
          }
        });
        
        this.carreras = todasLasCarreras.filter(c => carrerasIds.has(c.id));
        
        // Si hay carreras, seleccionar la primera por defecto y cargar alumnos
        if (this.carreras.length > 0 && !this.carreraSeleccionada) {
          this.carreraSeleccionada = this.carreras[0].id;
          // Cargar alumnos después de seleccionar la carrera
          await this.loadAlumnos();
        }
        
        // Cargar cursos para el filtro cuando hay carrera seleccionada
        if (this.carreraSeleccionada) {
          const cursosCarrera = await this.cursoService.getCursosByCarrera(this.carreraSeleccionada);
          this.cursosParaFiltro = cursosCarrera.filter(c => 
            c.materias.some(mId => materiasProfesor.some(m => m.id === mId))
          );
        }
      }
    } else {
      // Para admin/secretario: todas las carreras
      this.carreras = await this.carreraService.getCarreras();
      
      // Cargar todos los cursos para el filtro inicial
      try {
        const todosLosCursos = await this.cursoService.getCursos();
        this.cursosParaFiltro = todosLosCursos;
        console.log('Todos los cursos cargados para filtro inicial:', this.cursosParaFiltro.length);
        console.log('Cursos cargados:', this.cursosParaFiltro);
      } catch (error) {
        console.error('Error cargando todos los cursos:', error);
        this.cursosParaFiltro = [];
      }
    }
  }

  async onCarreraChange(): Promise<void> {
    console.log('Carrera cambiada a:', this.carreraSeleccionada);
    // Limpiar filtros cuando cambia la carrera
    this.filtroCurso = '';
    this.filtroMateria = '';
    // Cargar cursos para el filtro
    if (this.carreraSeleccionada && this.permissionsService.esProfesor()) {
      const cursosCarrera = await this.cursoService.getCursosByCarrera(this.carreraSeleccionada);
      this.cursosParaFiltro = cursosCarrera.filter(c => 
        c.materias.some(mId => this.materiasProfesor.some(m => m.id === mId))
      );
    }
    await this.loadAlumnos();
  }
  
  async onMateriaChange(): Promise<void> {
    console.log('Materia cambiada a:', this.filtroMateria);
    this.aplicarFiltros();
    // Actualizar estadísticas de todos los alumnos filtrados cuando cambia el filtro de materia
    if (this.alumnosFiltrados.length > 0) {
      for (const alumno of this.alumnosFiltrados) {
        await this.actualizarEstadisticasMateriasAlumno(alumno.id);
      }
    }
  }
  
  async actualizarEstadisticasPorMateria(materiaId: string): Promise<void> {
    const alumnosMateria = this.alumnosFiltrados.filter(a => {
      // Verificar si el alumno está en un curso que tiene esta materia
      const cursos = this.cursosParaFiltro.filter(c => c.materias.includes(materiaId));
      const idsCursos = cursos.map(c => c.id);
      return idsCursos.some(cId => 
        a.cursoId === cId || 
        (a.cursoIds && a.cursoIds.includes(cId)) ||
        cursos.some(c => c.alumnos.includes(a.id))
      );
    });
    
    let sumaPromedios = 0;
    let sumaAsistencias = 0;
    let contador = 0;
    
    for (const alumno of alumnosMateria) {
      try {
        // Obtener promedio general del alumno (no por materia específica)
        const promedio = await this.alumnoService.getPromedioAlumno(alumno.id);
        const asistencia = await this.alumnoService.getPorcentajeAsistencia(alumno.id, materiaId);
        sumaPromedios += promedio;
        sumaAsistencias += asistencia;
        contador++;
      } catch (error) {
        console.error(`Error obteniendo estadísticas para alumno ${alumno.id}:`, error);
      }
    }
    
    this.estadisticasPorMateria.set(materiaId, {
      promedio: contador > 0 ? sumaPromedios / contador : 0,
      asistencia: contador > 0 ? sumaAsistencias / contador : 0,
      totalAlumnos: contador
    });
  }
  
  getEstadisticasPorMateria(materiaId: string): { promedio: number; asistencia: number; totalAlumnos: number } {
    return this.estadisticasPorMateria.get(materiaId) || { promedio: 0, asistencia: 0, totalAlumnos: 0 };
  }

  async onCarreraFiltroChange(): Promise<void> {
    console.log('Filtro de carrera cambiado a:', this.filtroCarrera);
    // Limpiar filtro de curso cuando cambia el filtro de carrera
    this.filtroCurso = '';
    
    // Cargar cursos de la carrera seleccionada para el filtro
    if (this.filtroCarrera && this.filtroCarrera !== '') {
      try {
        const cursosCarrera = await this.cursoService.getCursosByCarrera(this.filtroCarrera);
        this.cursosParaFiltro = cursosCarrera;
        console.log(`Cursos cargados para filtro de carrera ${this.filtroCarrera}:`, this.cursosParaFiltro.length);
        console.log('Cursos cargados:', this.cursosParaFiltro);
      } catch (error) {
        console.error('Error cargando cursos para filtro:', error);
        this.cursosParaFiltro = [];
      }
    } else {
      // Si no hay carrera seleccionada, cargar todos los cursos
      try {
        const todosLosCursos = await this.cursoService.getCursos();
        this.cursosParaFiltro = todosLosCursos;
        console.log('Todos los cursos cargados para filtro:', this.cursosParaFiltro.length);
        console.log('Todos los cursos:', this.cursosParaFiltro);
      } catch (error) {
        console.error('Error cargando todos los cursos:', error);
        this.cursosParaFiltro = [];
      }
    }
    
    await this.loadAlumnos();
  }

  async loadAlumnos(): Promise<void> {
    try {
      console.log('Cargando alumnos desde la base de datos...');
      // Recargar alumnos desde el servicio (esto fuerza una recarga desde la base de datos)
      await this.alumnoService.recargarAlumnos();
      let todosLosAlumnos = await this.alumnoService.getAlumnos();
      console.log(`Alumnos obtenidos del servicio: ${todosLosAlumnos.length}`);
      
      // Si es profesor, filtrar alumnos de cursos donde tiene materias asignadas
      if (this.permissionsService.esProfesor()) {
        const usuario = this.authService.getCurrentUser();
        if (!usuario) {
          this.alumnos = [];
          this.aplicarFiltros();
          return;
        }

        // Obtener materias del profesor
        let docente = await this.docenteService.getDocenteById(usuario.id);
        if (!docente) {
          const todosLosDocentes = await this.docenteService.getDocentes();
          docente = todosLosDocentes.find(d => 
            d.nombre === usuario.nombre && d.apellido === usuario.apellido
          );
        }

        const materiasAsignadas = docente?.materiasAsignadas || [];
        const todasLasMaterias = await this.materiaService.getMaterias();
        const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
        
        // Filtrar materias del profesor
        const materiasProfesor = todasLasMaterias.filter((m: Materia) => {
          if (materiasAsignadas.length > 0) {
            return materiasAsignadas.includes(m.id);
          }
          return m.profesor === nombreProfesor || 
                 m.profesor?.includes(usuario.nombre) ||
                 m.profesor?.includes(usuario.apellido);
        });

        const materiasIdsProfesor = new Set(materiasProfesor.map(m => m.id));
        
        // Obtener todos los cursos
        const todosLosCursos = await this.cursoService.getCursos();
        
        // Filtrar cursos donde el profesor tiene materias
        const cursosDelProfesor = todosLosCursos.filter(curso => 
          curso.materias.some(mId => materiasIdsProfesor.has(mId))
        );
        
        // Obtener IDs de alumnos de esos cursos
        const idsAlumnosCursos = new Set<string>();
        cursosDelProfesor.forEach(curso => {
          curso.alumnos.forEach(alumnoId => idsAlumnosCursos.add(alumnoId));
        });

        // Si hay carrera seleccionada, también filtrar por carrera
        if (this.carreraSeleccionada) {
          todosLosAlumnos = todosLosAlumnos.filter(a => {
            // Debe estar en un curso del profesor Y pertenecer a la carrera seleccionada
            const estaEnCurso = idsAlumnosCursos.has(a.id);
            const perteneceACarrera = a.carreraId === this.carreraSeleccionada;
            const tieneCursoId = a.cursoId && cursosDelProfesor.some(c => c.id === a.cursoId);
            const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => cursosDelProfesor.some(c => c.id === cId));
            
            return (estaEnCurso || tieneCursoId || tieneCursoIds) && perteneceACarrera;
          });
          console.log(`Alumnos filtrados por carrera (${this.carreraSeleccionada}) y materias del profesor: ${todosLosAlumnos.length}`);
        } else {
          // Si no hay carrera seleccionada, mostrar alumnos de todos los cursos del profesor
          todosLosAlumnos = todosLosAlumnos.filter(a => {
            const estaEnCurso = idsAlumnosCursos.has(a.id);
            const tieneCursoId = a.cursoId && cursosDelProfesor.some(c => c.id === a.cursoId);
            const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => cursosDelProfesor.some(c => c.id === cId));
            return estaEnCurso || tieneCursoId || tieneCursoIds;
          });
          console.log(`Alumnos filtrados por materias del profesor (sin carrera): ${todosLosAlumnos.length}`);
        }
      }
      
      this.alumnos = todosLosAlumnos;
      console.log(`✅ Alumnos asignados al componente: ${this.alumnos.length}`);
      if (this.alumnos.length > 0) {
        console.log('📋 Primeros 3 alumnos:', this.alumnos.slice(0, 3).map(a => ({
          nombre: `${a.nombre} ${a.apellido}`,
          dni: a.dni,
          carreraId: a.carreraId,
          curso: a.curso || 'Sin curso',
          cursoId: a.cursoId,
          estado: a.estado || 'regular'
        })));
      }
      
      // Inicializar alumnosFiltrados con todos los alumnos si no hay filtros activos
      // Esto asegura que se muestren todos los alumnos cuando no hay filtros
      const tieneFiltros = (this.filtroCarrera && this.filtroCarrera !== '') || 
                           (this.filtroCurso && this.filtroCurso !== '') || 
                           (this.busqueda && this.busqueda.trim() !== '');
      
      if (!tieneFiltros) {
        this.alumnosFiltrados = [...this.alumnos];
        console.log(`✅ Alumnos filtrados inicializados (sin filtros): ${this.alumnosFiltrados.length}`);
      } else {
        // Aplicar filtros (esto también aplicará el filtro de carrera si está activo)
        this.aplicarFiltros();
      }
      
      // Si después de aplicar filtros no hay resultados pero hay alumnos, puede ser un problema de filtrado
      if (this.alumnosFiltrados.length === 0 && this.alumnos.length > 0) {
        console.warn('⚠️ ADVERTENCIA: Hay alumnos pero no se muestran después de aplicar filtros');
        console.warn('Estado de filtros:', {
          filtroCarrera: this.filtroCarrera,
          filtroCurso: this.filtroCurso,
          busqueda: this.busqueda,
          esProfesor: this.permissionsService.esProfesor(),
          carreraSeleccionada: this.carreraSeleccionada,
          tieneFiltros
        });
      }
      
      // Actualizar cache de estadísticas para los alumnos filtrados
      // Hacer esto de forma asíncrona para no bloquear la UI
      setTimeout(async () => {
        const alumnosParaEstadisticas = (this.alumnosFiltrados.length > 0 ? this.alumnosFiltrados : this.alumnos).slice(0, 50); // Limitar a 50 para no bloquear
        for (const alumno of alumnosParaEstadisticas) {
          try {
            await this.actualizarEstadisticasMateriasAlumno(alumno.id);
            await this.actualizarPromedioAlumno(alumno.id);
            await this.actualizarPorcentajeAsistenciaAlumno(alumno.id);
          } catch (error) {
            console.error(`Error actualizando estadísticas para alumno ${alumno.id}:`, error);
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      this.notificationService.showError('Error al cargar los alumnos. Por favor, recargue la página.');
      this.alumnos = [];
      this.alumnosFiltrados = [];
    }
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros...', {
      totalAlumnos: this.alumnos.length,
      filtroCarrera: this.filtroCarrera,
      filtroCurso: this.filtroCurso,
      busqueda: this.busqueda,
      esProfesor: this.permissionsService.esProfesor()
    });

    // Si no hay alumnos cargados, no hacer nada
    if (this.alumnos.length === 0) {
      console.warn('⚠️ No hay alumnos para filtrar');
      this.alumnosFiltrados = [];
      return;
    }

    let filtrados = [...this.alumnos];
    console.log(`📊 Alumnos iniciales para filtrar: ${filtrados.length}`);

    // Filtrar por carrera (solo para admin/secretario, no profesores)
    if (!this.permissionsService.esProfesor() && this.filtroCarrera && this.filtroCarrera !== '') {
      const antes = filtrados.length;
      filtrados = filtrados.filter(a => a.carreraId === this.filtroCarrera);
      console.log(`Filtro por carrera: ${antes} -> ${filtrados.length}`);
    }

    // Para profesores, filtrar por carrera seleccionada primero
    if (this.permissionsService.esProfesor() && this.carreraSeleccionada && this.carreraSeleccionada !== '') {
      const antes = filtrados.length;
      filtrados = filtrados.filter(a => a.carreraId === this.carreraSeleccionada);
      console.log(`Filtro por carrera seleccionada (profesor): ${antes} -> ${filtrados.length}`);
    }

    // Filtrar por materia (para profesores)
    if (this.permissionsService.esProfesor() && this.filtroMateria && this.filtroMateria !== '') {
      const antes = filtrados.length;
      // Obtener cursos que tienen esta materia
      const cursosConMateria = this.cursosParaFiltro.filter(c => c.materias.includes(this.filtroMateria));
      const idsCursosConMateria = cursosConMateria.map(c => c.id);
      const idsAlumnosCursos = [...new Set(cursosConMateria.flatMap(c => c.alumnos || []))];
      
      filtrados = filtrados.filter(a => {
        const estaEnCurso = idsAlumnosCursos.includes(a.id);
        const tieneCursoId = a.cursoId && idsCursosConMateria.includes(a.cursoId);
        const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => idsCursosConMateria.includes(cId));
        return estaEnCurso || tieneCursoId || tieneCursoIds;
      });
      console.log(`Filtro por materia: ${antes} -> ${filtrados.length}`);
    }
    
    // Filtrar por curso
    if (this.filtroCurso && this.filtroCurso !== '') {
      const antes = filtrados.length;
      // Buscar el cursoId correspondiente al string formateado
      const cursoEncontrado = this.cursosParaFiltro.find(c => {
        const año = this.getAnioCurso(c);
        const cursoFormateado = `${año}° ${c.division}`;
        return cursoFormateado === this.filtroCurso;
      });
      
      const cursoId = cursoEncontrado?.id;
      console.log(`Buscando curso: "${this.filtroCurso}", encontrado ID: ${cursoId}`);
      
      // Filtrar por string curso O por cursoId
      filtrados = filtrados.filter(a => {
        // Comparar por string curso
        if (a.curso === this.filtroCurso) {
          return true;
        }
        // Comparar por cursoId principal
        if (cursoId && a.cursoId === cursoId) {
          return true;
        }
        // Comparar por cursoIds (array)
        if (cursoId && a.cursoIds && a.cursoIds.includes(cursoId)) {
          return true;
        }
        return false;
      });
      console.log(`Filtro por curso: ${antes} -> ${filtrados.length}`);
    }

    // Filtrar por búsqueda (al final para que funcione con todos los filtros)
    if (this.busqueda && this.busqueda.trim() !== '') {
      const antes = filtrados.length;
      const busquedaLower = this.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(a =>
        (a.nombre && a.nombre.toLowerCase().includes(busquedaLower)) ||
        (a.apellido && a.apellido.toLowerCase().includes(busquedaLower)) ||
        (a.dni && a.dni.toString().includes(busquedaLower)) ||
        (a.email && a.email.toLowerCase().includes(busquedaLower))
      );
      console.log(`Filtro por búsqueda: ${antes} -> ${filtrados.length}`);
    }

    this.alumnosFiltrados = filtrados;
    console.log(`✅ Alumnos filtrados finales: ${filtrados.length} de ${this.alumnos.length} totales`);
    
    // Debug: mostrar algunos alumnos filtrados
    if (filtrados.length > 0) {
      console.log('Primeros alumnos filtrados:', filtrados.slice(0, 3).map(a => `${a.nombre} ${a.apellido} - ${a.curso || 'Sin curso'}`));
    }
    
    // Si no hay alumnos y hay filtros activos, puede ser que no se hayan cargado correctamente
    if (filtrados.length === 0 && this.alumnos.length > 0) {
      console.warn('⚠️ No se encontraron alumnos con los filtros aplicados, pero hay alumnos en total');
      console.warn('Filtros activos:', {
        filtroCarrera: this.filtroCarrera,
        filtroCurso: this.filtroCurso,
        busqueda: this.busqueda
      });
      console.warn('Ejemplo de alumnos disponibles:', this.alumnos.slice(0, 3).map(a => ({
        nombre: `${a.nombre} ${a.apellido}`,
        carreraId: a.carreraId,
        curso: a.curso,
        cursoId: a.cursoId
      })));
    }
    
    // Si no hay alumnos en absoluto, verificar la carga
    if (filtrados.length === 0 && this.alumnos.length === 0) {
      console.error('❌ No hay alumnos cargados. Verificar conexión con la base de datos.');
    }
  }

  onBusquedaChange(): void {
    console.log('Búsqueda cambiada:', this.busqueda);
    this.aplicarFiltros();
  }

  onFiltroCursoChange(): void {
    console.log('Filtro de curso cambiado:', this.filtroCurso);
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    if (!this.permissionsService.puedeVer('crearAlumnos')) {
      this.notificationService.showError('No tiene permisos para crear alumnos');
      return;
    }
    this.modoEdicion = false;
    this.alumnoSeleccionado = null;
    this.mostrarUsuarios = false; // Mostrar formulario, no usuarios
    this.alumnoForm.reset();
    this.cursosDisponibles = [];
    this.mostrarModal = true;
    this.scrollLockService.lockScroll();
  }

  async cargarUsuariosDisponibles(): Promise<void> {
    const usuariosRegistrados = await this.authService.getUsuariosByRol('alumno');
    const alumnosAsociados = await this.alumnoService.getAlumnos();
    const idsAsociados = alumnosAsociados.map((a: Alumno) => a.id);
    
    // Filtrar usuarios que no están asociados como alumnos
    this.usuariosDisponibles = usuariosRegistrados.filter((u: Usuario) => !idsAsociados.includes(u.id));
  }

  async asociarUsuario(usuario: Usuario): Promise<void> {
    const nuevoAlumno: Alumno = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni || '',
      email: usuario.email,
      telefono: usuario.telefono || '',
      curso: '', // Se asignará después cuando se inscriba a un curso
      carreraId: '', // Se puede asignar después
      fechaNacimiento: usuario.fechaNacimiento || '',
      direccion: usuario.direccion || '',
      estado: 'regular',
      fechaRegistro: new Date().toISOString(),
      documentacion: {
        dniCompleto: false,
        analiticoCompleto: false,
        aptoMedicoCompleto: false
      },
      historialEstados: [{
        estado: 'regular',
        fecha: new Date().toISOString()
      }]
    };
    
    await this.alumnoService.addAlumno(nuevoAlumno);
    this.notificationService.showSuccess(`Alumno ${usuario.nombre} ${usuario.apellido} asociado correctamente`);
    await this.loadAlumnos();
    this.mostrarUsuarios = false;
    this.cerrarModal();
  }

  async abrirModalEditar(alumno: Alumno): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para editar alumnos');
      return;
    }
    this.modoEdicion = true;
    this.alumnoSeleccionado = alumno;
    this.mostrarUsuarios = false;
    this.alumnoForm.patchValue(alumno);
    
    // Cargar cursos si tiene carrera asignada
    if (alumno.carreraId) {
      await this.cargarCursosPorCarrera(alumno.carreraId);
    }
    
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.alumnoSeleccionado = null;
    this.modoEdicion = false;
    this.alumnoForm.reset();
    this.cursosDisponibles = [];
    this.scrollLockService.unlockScroll();
  }

  async guardarAlumno(): Promise<void> {
    if (this.alumnoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.alumnoForm.value;
    
    if (this.modoEdicion && this.alumnoSeleccionado) {
      try {
        const alumnoActualizado: Alumno = {
          ...this.alumnoSeleccionado,
          ...formValue
        };

        // Si cambió el cursoId, actualizar inscripciones a materias
        if (formValue.cursoId && formValue.cursoId !== this.alumnoSeleccionado.cursoId) {
          const nuevoCurso = await this.cursoService.getCursoById(formValue.cursoId);
          const cursoAntiguo = this.alumnoSeleccionado.cursoId ? await this.cursoService.getCursoById(this.alumnoSeleccionado.cursoId) : null;
          
          // Desinscrибir de materias del curso antiguo
          if (cursoAntiguo && cursoAntiguo.materias) {
            for (const materiaId of cursoAntiguo.materias) {
              this.materiaService.desinscribirAlumno(this.alumnoSeleccionado.id, materiaId);
            }
          }
          
          // Inscribir en materias del nuevo curso
          if (nuevoCurso && nuevoCurso.materias) {
            for (const materiaId of nuevoCurso.materias) {
              try {
                const inscripcion = {
                  id: crypto.randomUUID(),
                  alumnoId: this.alumnoSeleccionado.id,
                  materiaId: materiaId,
                  fechaInscripcion: new Date().toISOString(),
                  estado: 'activo'
                };
                this.materiaService.inscribirAlumno(inscripcion);
              } catch (error) {
                console.warn(`Error inscribiendo alumno en materia ${materiaId}:`, error);
              }
            }
            this.notificationService.showSuccess(`Alumno inscrito en ${nuevoCurso.materias.length} materias del nuevo curso`);
          }
        }

        await this.alumnoService.updateAlumno(alumnoActualizado);
        this.notificationService.showSuccess('Alumno actualizado correctamente');
      } catch (error: any) {
        console.error('Error al actualizar alumno:', error);
        const errorMessage = error?.message || 'Error desconocido al actualizar el alumno. Por favor, intente nuevamente.';
        this.notificationService.showError(`Error: ${errorMessage}`);
        return;
      }
    } else {
      try {
        // Validar que se haya seleccionado un curso
        if (!formValue.cursoId) {
          this.notificationService.showError('Debe seleccionar un curso para el alumno');
          return;
        }

        // Obtener el curso seleccionado para obtener el nombre del curso
        const cursoSeleccionado = await this.cursoService.getCursoById(formValue.cursoId);
        if (!cursoSeleccionado) {
          this.notificationService.showError('El curso seleccionado no existe');
          return;
        }

        // Obtener año del curso
        const año = cursoSeleccionado.año;

        const nuevoAlumno: Alumno = {
          id: crypto.randomUUID(),
          ...formValue,
          curso: `${año}° ${cursoSeleccionado.division}`, // Asignar curso inmediatamente
          estado: 'regular',
          fechaRegistro: new Date().toISOString(),
          activo: true,
          documentacion: {
            dniCompleto: false,
            analiticoCompleto: false,
            aptoMedicoCompleto: false
          },
          historialEstados: [{
            estado: 'regular',
            fecha: new Date().toISOString()
          }]
        };
        
        // Crear el alumno
        await this.alumnoService.addAlumno(nuevoAlumno);
        
        // Inscribir automáticamente al alumno en el curso seleccionado
        await this.cursoService.agregarAlumnoACurso(formValue.cursoId, nuevoAlumno.id);
        
        // Inscribir automáticamente al alumno en todas las materias del curso
        if (cursoSeleccionado.materias && cursoSeleccionado.materias.length > 0) {
          for (const materiaId of cursoSeleccionado.materias) {
            try {
              // Inscribir al alumno en la materia usando el servicio de materias
              const inscripcion = {
                id: crypto.randomUUID(),
                alumnoId: nuevoAlumno.id,
                materiaId: materiaId,
                fechaInscripcion: new Date().toISOString(),
                estado: 'activo'
              };
              // Usar el método inscribirAlumno del servicio de materias
              this.materiaService.inscribirAlumno(inscripcion);
              console.log(`Alumno ${nuevoAlumno.id} inscrito en materia ${materiaId}`);
            } catch (error) {
              console.warn(`Error inscribiendo alumno en materia ${materiaId}:`, error);
            }
          }
          this.notificationService.showSuccess(`Alumno inscrito en ${cursoSeleccionado.materias.length} materias del curso`);
        }
        
        // Actualizar cupo del curso
        cursoSeleccionado.cupoActual = (cursoSeleccionado.cupoActual || 0) + 1;
        await this.cursoService.updateCurso(cursoSeleccionado);
        
        // El servicio ya crea el usuario, no necesitamos crearlo de nuevo
        const username = `alumno_${formValue.dni}`;
        this.notificationService.showSuccess(`Alumno creado e inscrito correctamente en el curso y sus ${cursoSeleccionado.materias?.length || 0} materias. Usuario: ${username}, Contraseña: temp123 (debe cambiarse)`);
        
        // Cerrar modal y recargar alumnos
        this.cerrarModal();
        await this.loadAlumnos();
      } catch (error: any) {
        console.error('Error al guardar alumno:', error);
        const errorMessage = error?.message || 'Error desconocido al crear el alumno. Por favor, intente nuevamente.';
        this.notificationService.showError(`Error: ${errorMessage}`);
        return;
      }
    }

    // Esperar un momento para que Supabase procese la inserción
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Recargar carreras primero para actualizar los filtros (por si el alumno tiene una carrera nueva)
    await this.loadCarreras();
    
    // Luego recargar alumnos para mostrar el nuevo alumno
    await this.loadAlumnos();
    
    this.cerrarModal();
  }

  async eliminarAlumno(id: string): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para desasociar alumnos');
      return;
    }
    if (confirm('¿Está seguro de desasociar este alumno?')) {
      await this.alumnoService.deleteAlumno(id);
      await this.loadAlumnos();
      this.notificationService.showSuccess('Alumno desasociado correctamente');
    }
  }


  getCursosUnicos(): string[] {
    console.log('getCursosUnicos() llamado. filtroCarrera:', this.filtroCarrera);
    console.log('cursosParaFiltro:', this.cursosParaFiltro.length);
    
    // Si hay filtro de carrera, usar los cursos de esa carrera
    if (this.filtroCarrera && this.filtroCarrera !== '') {
      console.log('Filtrando por carrera:', this.filtroCarrera);
      // Obtener cursos de la carrera seleccionada y formatearlos
      const cursosFormateados = this.cursosParaFiltro
        .filter(curso => curso.carreraId === this.filtroCarrera)
        .map(curso => {
          const año = this.getAnioCurso(curso);
          return `${año}° ${curso.division}`;
        });
      console.log('Cursos formateados para carrera:', cursosFormateados);
      const cursosUnicos = cursosFormateados.filter((c, i, arr) => arr.indexOf(c) === i).sort();
      console.log('Cursos únicos:', cursosUnicos);
      return cursosUnicos;
    }
    
    // Si no hay filtro de carrera, obtener cursos únicos de los alumnos
    const cursos = this.alumnos
      .map(a => a.curso)
      .filter(c => c && c.trim() !== '') // Filtrar cursos vacíos
      .filter((c, i, arr) => arr.indexOf(c) === i); // Eliminar duplicados
    console.log('Cursos de alumnos (sin filtro):', cursos);
    return Array.from(cursos).sort();
  }

  getPromedioAlumno(id: string): number {
    return this.promediosCache.get(id) || 0;
  }

  async actualizarPromedioAlumno(id: string): Promise<void> {
    let promedio: number;
    // Si es profesor, calcular promedio solo de sus materias
    if (this.permissionsService.esProfesor() && this.carreraSeleccionada) {
      promedio = await this.getPromedioAlumnoPorMateriasProfesor(id);
    } else {
      promedio = await this.alumnoService.getPromedioAlumno(id);
    }
    this.promediosCache.set(id, promedio);
  }

  getPorcentajeAsistenciaAlumno(id: string): number {
    return this.porcentajesAsistenciaCache.get(id) || 0;
  }

  async actualizarPorcentajeAsistenciaAlumno(id: string): Promise<void> {
    let porcentaje: number;
    // Si es profesor, calcular asistencia solo de sus materias
    if (this.permissionsService.esProfesor() && this.carreraSeleccionada) {
      porcentaje = await this.getPorcentajeAsistenciaPorMateriasProfesor(id);
    } else {
      porcentaje = await this.alumnoService.getPorcentajeAsistencia(id);
    }
    this.porcentajesAsistenciaCache.set(id, porcentaje);
  }

  async getPromedioAlumnoPorMateriasProfesor(alumnoId: string): Promise<number> {
    if (!this.carreraSeleccionada || this.materiasProfesor.length === 0) {
      return 0;
    }

    const materiasIds = this.materiasProfesor
      .filter(m => m.carreraId === this.carreraSeleccionada)
      .map(m => m.id);

    const todasLasNotas = await this.alumnoService.getNotasByAlumno(alumnoId);
    const notas = todasLasNotas.filter((n: any) => materiasIds.includes(n.materiaId));

    if (notas.length === 0) return 0;

    const suma = notas.reduce((acc: number, nota: any) => acc + nota.calificacion, 0);
    return Math.round((suma / notas.length) * 100) / 100;
  }

  async getPorcentajeAsistenciaPorMateriasProfesor(alumnoId: string): Promise<number> {
    if (!this.carreraSeleccionada || this.materiasProfesor.length === 0) {
      return 0;
    }

    const materiasIds = this.materiasProfesor
      .filter(m => m.carreraId === this.carreraSeleccionada)
      .map(m => m.id);

    const asistencias = await this.alumnoService.getAsistenciasByAlumno(alumnoId);
    const asistenciasFiltradas = asistencias.filter((a: any) => materiasIds.includes(a.materiaId));

    if (asistenciasFiltradas.length === 0) return 0;

    const presentes = asistenciasFiltradas.filter((a: any) => a.presente || a.estado === 'presente').length;
    return Math.round((presentes / asistenciasFiltradas.length) * 100);
  }

  private estadisticasMateriasCache: Map<string, { materia: string; promedio: number; asistencia: number }[]> = new Map();
  private promediosCache: Map<string, number> = new Map();
  private porcentajesAsistenciaCache: Map<string, number> = new Map();

  getEstadisticasMateriasAlumno(alumnoId: string): { materia: string; promedio: number; asistencia: number }[] {
    return this.estadisticasMateriasCache.get(alumnoId) || [];
  }

  async actualizarEstadisticasMateriasAlumno(alumnoId: string): Promise<void> {
    const estadisticas = await this.calcularEstadisticasMateriasAlumno(alumnoId);
    this.estadisticasMateriasCache.set(alumnoId, estadisticas);
  }

  private async calcularEstadisticasMateriasAlumno(alumnoId: string): Promise<{ materia: string; promedio: number; asistencia: number }[]> {
    if (!this.carreraSeleccionada || this.materiasProfesor.length === 0) {
      return [];
    }

    // Si hay un filtro de materia activo, solo mostrar estadísticas de esa materia
    let materiasACalcular: Materia[] = [];
    
    if (this.filtroMateria && this.filtroMateria !== '') {
      // Solo calcular estadísticas de la materia filtrada
      const materiaFiltrada = this.materiasProfesor.find(m => m.id === this.filtroMateria);
      if (materiaFiltrada) {
        materiasACalcular = [materiaFiltrada];
      } else {
        return [];
      }
    } else {
      // Si no hay filtro, mostrar todas las materias de la carrera
      materiasACalcular = this.materiasProfesor.filter(m => m.carreraId === this.carreraSeleccionada);
    }

    const estadisticasPromises = materiasACalcular.map(async (materia) => {
      const todasLasNotas = await this.alumnoService.getNotasByAlumno(alumnoId);
      const notas = todasLasNotas.filter((n: any) => n.materiaId === materia.id);
      const promedio = notas.length > 0
        ? Math.round((notas.reduce((acc: number, n: any) => acc + n.calificacion, 0) / notas.length) * 100) / 100
        : 0;

      const todasLasAsistencias = await this.alumnoService.getAsistenciasByAlumno(alumnoId);
      const asistencias = todasLasAsistencias.filter((a: any) => a.materiaId === materia.id);
      const asistencia = asistencias.length > 0
        ? Math.round((asistencias.filter((a: any) => a.estado === 'presente' || a.estado === 'tardanza' || a.estado === 'justificado').length / asistencias.length) * 100)
        : 0;

      return {
        materia: materia.nombre,
        promedio,
        asistencia
      };
    });
    const estadisticas = await Promise.all(estadisticasPromises);
    
    return estadisticas;
  }

  getCantidadRegulares(): number {
    // Usar el estado del alumno directamente
    return this.alumnos.filter(a => {
      // Si el estado está definido, usarlo
      if (a.estado) {
        return a.estado === 'regular';
      }
      // Si no hay estado, intentar calcular por promedio y asistencia
      const promedio = this.getPromedioAlumno(a.id);
      const asistencia = this.getPorcentajeAsistenciaAlumno(a.id);
      // Si no hay datos, considerar regular por defecto
      if (promedio === 0 && asistencia === 0) {
        return true; // Por defecto, considerar regular si no hay datos
      }
      return promedio >= 6 && asistencia >= 75;
    }).length;
  }

  getCantidadIrregulares(): number {
    return this.alumnos.filter(a => {
      // Si el estado está definido, usarlo
      if (a.estado) {
        return a.estado !== 'regular' && a.estado !== 'egresado';
      }
      // Si no hay estado, intentar calcular por promedio y asistencia
      const promedio = this.getPromedioAlumno(a.id);
      const asistencia = this.getPorcentajeAsistenciaAlumno(a.id);
      // Si no hay datos, no considerar irregular
      if (promedio === 0 && asistencia === 0) {
        return false;
      }
      return promedio < 6 || asistencia < 75;
    }).length;
  }

  getColorEstado(estado?: string): 'primary' | 'accent' | 'warn' {
    switch (estado) {
      case 'regular': return 'primary';
      case 'irregular': return 'warn';
      case 'egresado': return 'accent';
      case 'expulsado': return 'warn';
      case 'suspendido': return 'warn';
      case 'libre': return 'accent';
      default: return 'primary';
    }
  }

  getPromedioGeneral(): number {
    if (this.alumnos.length === 0) return 0;
    const promedios = this.alumnos.map(a => this.getPromedioAlumno(a.id)).filter(p => p > 0);
    if (promedios.length === 0) return 0;
    return Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100;
  }

  async cambiarEstadoAlumno(alumno: Alumno, nuevoEstado?: string): Promise<void> {
    const estados: ('regular' | 'irregular' | 'egresado' | 'expulsado' | 'suspendido' | 'libre')[] = 
      ['regular', 'irregular', 'egresado', 'expulsado', 'suspendido', 'libre'];
    
    // Si se proporciona un nuevo estado, usarlo; si no, usar el siguiente en la lista
    const estadoFinal: 'regular' | 'irregular' | 'egresado' | 'expulsado' | 'suspendido' | 'libre' = 
      (nuevoEstado as any) || (() => {
        const estadoActual = alumno.estado || 'regular';
        const indiceActual = estados.indexOf(estadoActual as any);
        return estados[(indiceActual + 1) % estados.length];
      })();
    
    const alumnoActualizado: Alumno = {
      ...alumno,
      estado: estadoFinal,
      historialEstados: [
        ...(alumno.historialEstados || []),
        {
          estado: estadoFinal,
          fecha: new Date().toISOString(),
          motivo: 'Cambio de estado',
          cambiadoPor: this.authService.getCurrentUser()?.id || ''
        }
      ]
    };
    
    await this.alumnoService.updateAlumno(alumnoActualizado);
    this.notificationService.showSuccess(`Estado cambiado a: ${estadoFinal}`);
    await this.loadAlumnos();
  }

  mostrarModalValidacion: boolean = false;
  alumnoValidacion: Alumno | null = null;
  validacionForm: any = {
    dniCompleto: false,
    analiticoCompleto: false,
    aptoMedicoCompleto: false
  };

  abrirModalValidacion(alumno: Alumno): void {
    this.alumnoValidacion = alumno;
    const doc = alumno.documentacion || {
      dniCompleto: false,
      analiticoCompleto: false,
      aptoMedicoCompleto: false
    };
    this.validacionForm = {
      dniCompleto: doc.dniCompleto || false,
      analiticoCompleto: doc.analiticoCompleto || false,
      aptoMedicoCompleto: doc.aptoMedicoCompleto || false
    };
    this.mostrarModalValidacion = true;
  }

  cerrarModalValidacion(): void {
    this.mostrarModalValidacion = false;
    this.alumnoValidacion = null;
    this.validacionForm = {
      dniCompleto: false,
      analiticoCompleto: false,
      aptoMedicoCompleto: false
    };
  }

  async validarDocumentacion(): Promise<void> {
    if (!this.alumnoValidacion) return;
    
    const documentacion = {
      dniCompleto: this.validacionForm.dniCompleto,
      analiticoCompleto: this.validacionForm.analiticoCompleto,
      aptoMedicoCompleto: this.validacionForm.aptoMedicoCompleto,
      fechaValidacion: new Date().toISOString(),
      validadoPor: this.authService.getCurrentUser()?.id
    };
    
    const alumnoActualizado: Alumno = {
      ...this.alumnoValidacion,
      documentacion
    };
    
    await this.alumnoService.updateAlumno(alumnoActualizado);
    this.cerrarModalValidacion();
    this.notificationService.showSuccess('Documentación validada correctamente');
    await this.loadAlumnos();
  }

  estaDocumentacionValidada(alumno: Alumno): boolean {
    const doc = alumno.documentacion;
    return doc ? (doc.dniCompleto && doc.analiticoCompleto && doc.aptoMedicoCompleto) : false;
  }

  importarAlumnos(): void {
    this.mostrarModalImportar = true;
    this.scrollLockService.lockScroll();
  }

  cerrarModalImportar(): void {
    this.mostrarModalImportar = false;
    this.scrollLockService.unlockScroll();
  }

  descargarFormatoExcel(): void {
    // Crear un archivo Excel de ejemplo
    const formato = [
      ['Nombre', 'Apellido', 'DNI', 'Email', 'Teléfono', 'Carrera', 'Fecha Nacimiento', 'Dirección']
    ];
    
    const csv = formato.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'formato_importacion_alumnos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.showSuccess('Formato descargado correctamente');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.notificationService.showError('Por favor seleccione un archivo CSV o Excel');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      this.procesarArchivoExcel(text);
    };
    reader.readAsText(file);
  }

  async procesarArchivoExcel(text: string): Promise<void> {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      this.notificationService.showError('El archivo está vacío o no tiene el formato correcto');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['Nombre', 'Apellido', 'DNI', 'Email', 'Carrera'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      this.notificationService.showError(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
      return;
    }
    
    let importados = 0;
    let errores = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      
      const alumnoData: any = {};
      headers.forEach((header, index) => {
        alumnoData[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
      });
      
      try {
        // Buscar carrera por nombre
        const nombreCarrera = alumnoData.carrera || '';
        const carrera = this.carreras.find(c => c.nombre.toLowerCase() === nombreCarrera.toLowerCase());
        const carreraId = carrera ? carrera.id : '';
        
        if (!carreraId && nombreCarrera) {
          this.notificationService.showWarning(`Carrera "${nombreCarrera}" no encontrada para el alumno ${alumnoData.nombre} ${alumnoData.apellido}`);
        }
        
        const nuevoAlumno: Alumno = {
          id: crypto.randomUUID(),
          nombre: alumnoData.nombre || '',
          apellido: alumnoData.apellido || '',
          dni: alumnoData.dni || '',
          email: alumnoData.email || '',
          telefono: alumnoData.teléfono || alumnoData.telefono || '',
          curso: '', // Se asignará después cuando se inscriba a un curso
          carreraId: carreraId,
          fechaNacimiento: alumnoData.fechanacimiento || '',
          direccion: alumnoData.dirección || alumnoData.direccion || '',
          estado: 'regular',
          fechaRegistro: new Date().toISOString(),
          documentacion: {
            dniCompleto: false,
            analiticoCompleto: false,
            aptoMedicoCompleto: false
          },
          historialEstados: [{
            estado: 'regular',
            fecha: new Date().toISOString()
          }]
        };
        
        // Crear usuario para que pueda iniciar sesión
        const nuevoUsuario: Usuario = {
          id: nuevoAlumno.id,
          username: nuevoAlumno.email.split('@')[0] || `alumno_${nuevoAlumno.id}`,
          password: nuevoAlumno.dni || '1234',
          nombre: nuevoAlumno.nombre,
          apellido: nuevoAlumno.apellido,
          email: nuevoAlumno.email,
          telefono: nuevoAlumno.telefono,
          dni: nuevoAlumno.dni,
          fechaNacimiento: nuevoAlumno.fechaNacimiento,
          direccion: nuevoAlumno.direccion,
          rol: 'alumno',
          fechaRegistro: new Date().toISOString(),
          activo: true
        };
        
        await this.alumnoService.addAlumno(nuevoAlumno);
        importados++;
      } catch (error) {
        errores++;
      }
    }
    
    this.notificationService.showSuccess(`Importación completada: ${importados} alumnos importados${errores > 0 ? `, ${errores} errores` : ''}`);
    await this.loadAlumnos();
    this.cerrarModalImportar();
  }

  async mostrarUsuariosDisponibles(): Promise<void> {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para asociar alumnos');
      return;
    }
    await this.cargarUsuariosDisponibles();
    this.mostrarUsuarios = true;
    this.mostrarModal = true;
    this.scrollLockService.lockScroll();
  }
}

