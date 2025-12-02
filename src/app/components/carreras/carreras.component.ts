import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CarreraService } from '../../services/carrera.service';
import { CursoService } from '../../services/curso.service';
import { MateriaService } from '../../services/materia.service';
import { AlumnoService } from '../../services/alumno.service';
import { AulaService } from '../../services/aula.service';
import { DocenteService } from '../../services/docente.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { ScrollLockService } from '../../services/scroll-lock.service';
import { Carrera, PlanEstudio } from '../../models/carrera.model';
import { Curso, HorarioCurso } from '../../models/curso.model';
import { Materia, AlumnoMateria } from '../../models/materia.model';
import { Alumno } from '../../models/alumno.model';
import { Aula, HorarioAula } from '../../models/aula.model';
import { Docente } from '../../models/usuario.model';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-carreras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    MatStepperModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './carreras.component.html',
  styleUrl: './carreras.component.css'
})
export class CarrerasComponent implements OnInit {
  carreras: Carrera[] = [];
  carreraSeleccionada: Carrera | null = null;
  modoEdicion: boolean = false;
  modalAbierto: boolean = false;
  mostrarWizard: boolean = false;
  carreraForm: FormGroup;
  displayedColumns: string[] = ['nombre', 'codigo', 'duracion', 'estado', 'acciones'];
  
  // Wizard data
  wizardData: {
    carrera: Partial<Carrera> | null;
    aulasSeleccionadas: string[];
    cursos: Partial<Curso>[];
    materiasSeleccionadas: { materiaId: string; cursoId: string; profesorId: string; nombreMateria: string }[];
    materiasPorCurso: { cursoId: string; profesorId: string; materias: string[] }[];
    currentStep: number;
  } = {
    carrera: null,
    aulasSeleccionadas: [],
    cursos: [],
    materiasSeleccionadas: [],
    materiasPorCurso: [],
    currentStep: 0
  };
  
  // Gestión de cursos dentro de carrera
  mostrarCursos: boolean = false;
  cursosDeCarrera: Curso[] = [];
  materiasDisponibles: Materia[] = [];
  materiasDisponiblesParaCurso: Materia[] = [];
  alumnosDisponibles: Alumno[] = [];
  aulasDisponibles: Aula[] = [];
  docentesDisponibles: Docente[] = [];
  coordinadoresDisponibles: Docente[] = []; // Docentes que pueden ser coordinadores
  cursoSeleccionado: Curso | null = null;
  mostrarModalCurso: boolean = false;
  mostrarAsignarMaterias: boolean = false;
  mostrarInscribirAlumnos: boolean = false;
  mostrarGestionarHorarios: boolean = false;
  mostrarAlumnosInscritos: boolean = false;
  alumnosInscritos: Alumno[] = [];
  mostrarMateriasAsignadas: boolean = false;
  horariosTemporales: HorarioCurso[] = [];
  cursoForm: FormGroup;
  horarioForm: FormGroup;

  constructor(
    private carreraService: CarreraService,
    private cursoService: CursoService,
    private materiaService: MateriaService,
    private alumnoService: AlumnoService,
    private aulaService: AulaService,
    private docenteService: DocenteService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    public permissionsService: PermissionsService,
    private router: Router,
    private scrollLockService: ScrollLockService,
    private supabaseService: SupabaseService
  ) {
    this.carreraForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      descripcion: [''],
      duracionAnios: [3, [Validators.required, Validators.min(1)]],
      duracionCuatrimestres: [6, [Validators.required, Validators.min(1)]],
      estado: ['activa', Validators.required],
      coordinadorId: ['']
    });
    
    this.cursoForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      año: [1, [Validators.required, Validators.min(1)]],
      division: ['', Validators.required],
      turno: ['mañana', Validators.required],
      capacidad: [30, [Validators.required, Validators.min(1)]],
      cupoMaximo: [30, [Validators.min(1)]],
      tutorId: [''],
      aulaId: [''],
      cuatrimestre: [1, [Validators.required, Validators.min(1), Validators.max(2)]],
      modalidad: ['presencial', Validators.required],
      estado: ['activo', Validators.required],
      fechaInicio: [''],
      fechaFin: [''],
      permiteAutoinscripcion: [false],
      permiteEdicionHorariosProfesor: [false],
      requiereAprobacionInscripcion: [true],
      activaListaEspera: [true]
    });
    
    this.horarioForm = this.fb.group({
      dia: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      materiaId: ['', Validators.required],
      docenteId: ['', Validators.required],
      aulaId: ['', Validators.required]
    });
  }

  getNombreCoordinador(coordinadorId: string): string {
    const coordinador = this.docentesDisponibles.find(d => d.id === coordinadorId);
    return coordinador ? `${coordinador.nombre} ${coordinador.apellido}` : 'No asignado';
  }

  async ngOnInit(): Promise<void> {
    await this.loadCarreras();
    await this.actualizarCaches();
    
    // Verificar si se creó una materia desde el wizard de carreras
    const crearMateriaDesdeCarrera = sessionStorage.getItem('crearMateriaDesdeCarrera');
    if (crearMateriaDesdeCarrera) {
      // Actualizar cache de materias cuando se regresa
      await this.actualizarCaches();
      sessionStorage.removeItem('crearMateriaDesdeCarrera');
    }
  }

  async loadCarreras(): Promise<void> {
    this.carreras = await this.carreraService.getCarreras();
  }

  async verCursos(carrera: Carrera): Promise<void> {
    this.carreraSeleccionada = carrera;
    this.cursosDeCarrera = await this.cursoService.getCursosByCarrera(carrera.id);
    await this.loadAulasDisponibles();
    await this.loadDocentesDisponibles();
    this.mostrarCursos = true;
  }

  async verDetalleCarrera(carrera: Carrera): Promise<void> {
    this.carreraSeleccionada = carrera;
    this.cursosDeCarrera = await this.cursoService.getCursosByCarrera(carrera.id);
    await this.loadAulasDisponibles();
    await this.loadDocentesDisponibles();
    this.mostrarCursos = true;
  }

  async loadAulasDisponibles(): Promise<void> {
    const todasLasAulas = await this.aulaService.getAulas();
    this.aulasDisponibles = todasLasAulas.filter(a => a.estado === 'disponible');
  }

  async loadDocentesDisponibles(): Promise<void> {
    this.docentesDisponibles = await this.docenteService.getDocentes();
    this.coordinadoresDisponibles = this.docentesDisponibles; // Todos los docentes pueden ser coordinadores
  }

  cerrarCursos(): void {
    this.mostrarCursos = false;
    this.carreraSeleccionada = null;
    this.cursoSeleccionado = null;
  }

  abrirModalNuevoCurso(): void {
    if (!this.carreraSeleccionada) return;
    this.cursoSeleccionado = null;
    this.mostrarModalCurso = true;
    this.cursoForm.reset({
      año: 1,
      turno: 'mañana',
      capacidad: 30,
      cuatrimestre: 1
    });
  }

  abrirModalEditarCurso(curso: Curso): void {
    this.cursoSeleccionado = curso;
    this.mostrarModalCurso = true;
    this.cursoForm.patchValue(curso);
  }

  async guardarCurso(): Promise<void> {
    if (!this.carreraSeleccionada || this.cursoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.cursoForm.value;
    
    // Validar que el año no exceda la duración de la carrera
    if (formValue.año > this.carreraSeleccionada.duracionAnios) {
      this.notificationService.showError(`El año no puede ser mayor a ${this.carreraSeleccionada.duracionAnios} (duración de la carrera)`);
      return;
    }
    
    // Validar aula si está seleccionada
    if (formValue.aulaId) {
      const aula = this.aulasCache.get(formValue.aulaId);
      if (!aula) {
        this.notificationService.showError('El aula seleccionada no existe');
        return;
      }
      if (aula.estado !== 'disponible') {
        this.notificationService.showError('El aula seleccionada no está disponible');
        return;
      }
      if (aula.capacidad < formValue.capacidad) {
        this.notificationService.showWarning(`El aula tiene capacidad de ${aula.capacidad} pero el curso requiere ${formValue.capacidad}. Se recomienda seleccionar otra aula.`);
      }
    }
    
    if (this.cursoSeleccionado) {
      const cursoActualizado: Curso = {
        ...this.cursoSeleccionado,
        ...formValue,
        carreraId: this.carreraSeleccionada.id,
        cupoMaximo: formValue.cupoMaximo || formValue.capacidad,
        fechaInicio: formValue.fechaInicio || undefined,
        fechaFin: formValue.fechaFin || undefined,
        estado: formValue.estado || 'activo',
        configuracion: {
          permiteAutoinscripcion: formValue.permiteAutoinscripcion || false,
          permiteEdicionHorariosProfesor: formValue.permiteEdicionHorariosProfesor || false,
          requiereAprobacionInscripcion: formValue.requiereAprobacionInscripcion !== false,
          activaListaEspera: formValue.activaListaEspera !== false
        }
      };
      await this.cursoService.updateCurso(cursoActualizado);
      this.notificationService.showSuccess('Curso actualizado correctamente');
    } else {
      const nuevoCurso: Curso = {
        id: crypto.randomUUID(),
        carreraId: this.carreraSeleccionada.id,
        ...formValue,
        horarios: [],
        materias: [],
        alumnos: [],
        listaEspera: [],
        estado: 'activo',
        cupoMaximo: formValue.cupoMaximo || formValue.capacidad,
        cupoActual: 0,
        fechaInicio: formValue.fechaInicio || undefined,
        fechaFin: formValue.fechaFin || undefined,
        fechaCreacion: new Date().toISOString(),
        configuracion: {
          permiteAutoinscripcion: formValue.permiteAutoinscripcion || false,
          permiteEdicionHorariosProfesor: formValue.permiteEdicionHorariosProfesor || false,
          requiereAprobacionInscripcion: formValue.requiereAprobacionInscripcion !== false,
          activaListaEspera: formValue.activaListaEspera !== false
        }
      };
      await this.cursoService.addCurso(nuevoCurso);
      
      // Agregar curso a la carrera
      if (!this.carreraSeleccionada.cursos) {
        this.carreraSeleccionada.cursos = [];
      }
      this.carreraSeleccionada.cursos.push(nuevoCurso.id);
      this.carreraService.updateCarrera(this.carreraSeleccionada);
      
      this.notificationService.showSuccess('Curso creado correctamente. Ahora puede asignar materias e inscribir alumnos.');
    }

    this.loadCarreras();
    this.verCursos(this.carreraSeleccionada);
    this.cerrarModalCurso();
  }

  cerrarModalCurso(): void {
    this.mostrarModalCurso = false;
    this.cursoSeleccionado = null;
    this.cursoForm.reset();
  }

  async eliminarCurso(cursoId: string): Promise<void> {
    if (confirm('¿Está seguro de eliminar este curso?')) {
      await this.cursoService.deleteCurso(cursoId);
      if (this.carreraSeleccionada) {
        await this.verCursos(this.carreraSeleccionada);
      }
      this.notificationService.showSuccess('Curso eliminado correctamente');
    }
  }

  async asignarMaterias(curso: Curso): Promise<void> {
    // Las materias ya se asignaron al crear la carrera, pero se puede editar desde aquí
    this.cursoSeleccionado = curso;
    // Mostrar todas las materias disponibles (las que ya están asignadas al curso y las disponibles)
    const todasLasMaterias = await this.materiaService.getMaterias();
    this.materiasDisponibles = todasLasMaterias
      .filter(m => 
        (!m.carreraId || m.carreraId === curso.carreraId) && 
        (!m.año || m.año === curso['año']) &&
        (!m.cuatrimestre || m.cuatrimestre === curso.cuatrimestre)
      );
    
    this.mostrarAsignarMaterias = true;
  }

  async inscribirAlumnos(curso: Curso): Promise<void> {
    this.cursoSeleccionado = curso;
    // Mostrar TODOS los alumnos registrados en el sistema, no solo los de la misma carrera
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    const todosLosCursos = await this.cursoService.getCursosByCarrera(curso.carreraId);
    const cursosDelAño = todosLosCursos
      .filter(c => c['año'] === curso['año']);
    const alumnosYaInscritos = cursosDelAño.flatMap(c => c.alumnos || []);
    
    // Filtrar solo los que ya están inscritos en este curso específico
    // Permitir inscribir cualquier alumno, incluso si está en otra carrera
    this.alumnosDisponibles = todosLosAlumnos.filter(a => 
      !curso.alumnos.includes(a.id) // Solo excluir los que ya están en este curso
    );
    
    if (this.alumnosDisponibles.length === 0) {
      this.notificationService.showInfo('No hay alumnos disponibles para inscribir. Todos los alumnos registrados ya están inscritos en este curso.');
    } else {
      this.notificationService.showInfo(`Hay ${this.alumnosDisponibles.length} alumnos disponibles para inscribir en este curso.`);
    }
    
    this.mostrarInscribirAlumnos = true;
  }

  toggleMateriaEnCursoModal(materiaId: string): void {
    if (!this.cursoSeleccionado) return;
    
    const index = this.cursoSeleccionado.materias.indexOf(materiaId);
    if (index > -1) {
      this.cursoSeleccionado.materias.splice(index, 1);
    } else {
      this.cursoSeleccionado.materias.push(materiaId);
    }
    
    this.cursoService.updateCurso(this.cursoSeleccionado);
    this.notificationService.showSuccess('Materias actualizadas');
  }

  async inscribirAlumnoACurso(alumnoId: string): Promise<void> {
    if (!this.cursoSeleccionado) return;
    
    try {
      if (this.cursoSeleccionado.alumnos.includes(alumnoId)) {
        this.notificationService.showWarning('El alumno ya está inscrito en este curso');
        return;
      }
      
      const alumno = await this.alumnoService.getAlumnoById(alumnoId);
      if (!alumno) {
        this.notificationService.showError('Alumno no encontrado');
        return;
      }
      
      // Si el alumno pertenece a otra carrera, actualizar su carreraId al inscribirlo
      if (alumno.carreraId !== this.cursoSeleccionado.carreraId) {
        alumno.carreraId = this.cursoSeleccionado.carreraId;
        await this.alumnoService.updateAlumno(alumno);
        this.notificationService.showInfo(`El alumno ha sido asignado a la carrera "${this.carreraSeleccionada?.nombre || ''}"`);
      }
      
      // Verificar cupo
      const cupoMaximo = this.cursoSeleccionado.cupoMaximo || this.cursoSeleccionado.capacidad || 30;
      const cupoActual = this.cursoSeleccionado.cupoActual || 0;
      
      if (cupoActual >= cupoMaximo) {
        this.notificationService.showWarning('El curso está completo. El alumno será agregado a la lista de espera');
        // Agregar a lista de espera usando el servicio
        await this.cursoService.agregarAlumnoACurso(this.cursoSeleccionado.id, alumnoId);
        // Actualizar estado a lista de espera
        const { data: alumnoCurso } = await this.cursoService['supabase'].client
          .from('alumno_cursos')
          .select('id')
          .eq('alumno_id', alumnoId)
          .eq('curso_id', this.cursoSeleccionado.id)
          .single();
        
        if (alumnoCurso) {
          await this.cursoService['supabase'].update('alumno_cursos', alumnoCurso.id, {
            estado: 'en_lista_espera'
          });
        }
      } else {
        // Usar el método del servicio para inscribir al alumno
        await this.cursoService.agregarAlumnoACurso(this.cursoSeleccionado.id, alumnoId);
        
        // Actualizar cupo actual del curso
        const cursoActualizado = await this.cursoService.getCursoById(this.cursoSeleccionado.id);
        if (cursoActualizado) {
          cursoActualizado.cupoActual = (cursoActualizado.cupoActual || 0) + 1;
          await this.cursoService.updateCurso(cursoActualizado);
          this.cursoSeleccionado = cursoActualizado;
        }
        
        // Actualizar curso del alumno
        alumno.curso = `${this.cursoSeleccionado['año']}° ${this.cursoSeleccionado.division}`;
        await this.alumnoService.updateAlumno(alumno);
        
        // Inscribir automáticamente al alumno en todas las materias del curso
        await this.inscribirAlumnoEnMateriasDelCurso(alumnoId, this.cursoSeleccionado);
      }
      
      this.notificationService.showSuccess('Alumno inscrito correctamente');
      
      // Recargar los cursos para actualizar la vista
      if (this.carreraSeleccionada) {
        this.cursosDeCarrera = await this.cursoService.getCursosByCarrera(this.carreraSeleccionada.id);
        // Actualizar el curso seleccionado
        const cursoActualizado = this.cursosDeCarrera.find(c => c.id === this.cursoSeleccionado?.id);
        if (cursoActualizado) {
          this.cursoSeleccionado = cursoActualizado;
        }
      }
      
      // Recargar la lista de alumnos disponibles
      await this.inscribirAlumnos(this.cursoSeleccionado);
    } catch (error: any) {
      console.error('Error inscribiendo alumno:', error);
      const errorMessage = error?.message || 'Error desconocido al inscribir el alumno. Por favor, intente nuevamente.';
      this.notificationService.showError(`Error: ${errorMessage}`);
    }
  }

  inscribirAlumnoEnMateriasDelCurso(alumnoId: string, curso: Curso): void {
    // Inscribir al alumno en todas las materias del curso (solo si hay materias asignadas)
    if (curso.materias && curso.materias.length > 0) {
      curso.materias.forEach(materiaId => {
        const inscripcionExistente = this.materiaService.getInscripcionesByAlumno(alumnoId)
          .find(i => i.materiaId === materiaId);
        
        if (!inscripcionExistente) {
          const inscripcion = {
            id: crypto.randomUUID(),
            alumnoId: alumnoId,
            materiaId: materiaId,
            fechaInscripcion: new Date().toISOString()
          };
          this.materiaService.inscribirAlumno(inscripcion);
        }
      });
    }
  }

  async desinscribirAlumnoACurso(alumnoId: string): Promise<void> {
    if (!this.cursoSeleccionado) return;
    
    const index = this.cursoSeleccionado.alumnos.indexOf(alumnoId);
    if (index > -1) {
      this.cursoSeleccionado.alumnos.splice(index, 1);
      this.cursoSeleccionado.cupoActual = Math.max(0, (this.cursoSeleccionado.cupoActual || 0) - 1);
      
      // Actualizar curso del alumno
      const alumno = await this.alumnoService.getAlumnoById(alumnoId);
      if (alumno) {
        alumno.curso = '';
        await this.alumnoService.updateAlumno(alumno);
      }
      
      await this.cursoService.updateCurso(this.cursoSeleccionado);
      this.notificationService.showSuccess('Alumno desinscrito correctamente');
      await this.inscribirAlumnos(this.cursoSeleccionado);
    }
  }

  gestionarHorarios(curso: Curso): void {
    // Validar que el curso tenga materias asignadas
    if (!curso.materias || curso.materias.length === 0) {
      this.notificationService.showWarning('Este curso no tiene materias asignadas. Por favor, asigne materias primero.');
      return;
    }
    
    this.cursoSeleccionado = curso;
    this.horariosTemporales = [...curso.horarios];
    this.mostrarGestionarHorarios = true;
  }

  agregarHorario(): void {
    if (this.horarioForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos del horario');
      return;
    }
    
    const formValue = this.horarioForm.value;
    
    // Validar choque de horarios en el aula
    if (formValue.aulaId) {
      const tieneChoque = this.aulaService.verificarChoqueHorario(
        formValue.aulaId,
        formValue.dia,
        formValue.horaInicio,
        formValue.horaFin
      );
      
      if (tieneChoque) {
        this.notificationService.showError('El aula ya está ocupada en este horario. Por favor, seleccione otro horario o aula.');
        return;
      }
    }
    
    // Validar que el docente no tenga otro horario en el mismo momento
    const horariosDocente = this.horariosTemporales.filter(h => 
      h.docenteId === formValue.docenteId &&
      h.dia === formValue.dia &&
      ((formValue.horaInicio < h.horaFin && formValue.horaFin > h.horaInicio))
    );
    
    if (horariosDocente.length > 0) {
      this.notificationService.showError('El docente ya tiene una clase en este horario. Por favor, seleccione otro horario.');
      return;
    }
    
    const nuevoHorario: HorarioCurso = {
      id: crypto.randomUUID(),
      ...formValue,
      aula: formValue.aulaId ? this.aulasDisponibles.find(a => a.id === formValue.aulaId)?.nombre : undefined
    };
    
    this.horariosTemporales.push(nuevoHorario);
    
    // Guardar en horarios de aula
    if (formValue.aulaId) {
      const horarioAula: HorarioAula = {
        id: crypto.randomUUID(),
        aulaId: formValue.aulaId,
        dia: formValue.dia,
        horaInicio: formValue.horaInicio,
        horaFin: formValue.horaFin,
        cursoId: this.cursoSeleccionado!.id,
        materiaId: formValue.materiaId,
        estado: 'reservado'
      };
      this.aulaService.addHorarioAula(horarioAula);
    }
    
    this.horarioForm.reset();
    this.notificationService.showSuccess('Horario agregado correctamente');
  }

  eliminarHorario(horarioId: string): void {
    this.horariosTemporales = this.horariosTemporales.filter(h => h.id !== horarioId);
    this.notificationService.showSuccess('Horario eliminado');
  }

  guardarHorarios(): void {
    if (!this.cursoSeleccionado) return;
    
    this.cursoSeleccionado.horarios = [...this.horariosTemporales];
    this.cursoService.updateCurso(this.cursoSeleccionado);
    this.notificationService.showSuccess('Horarios guardados correctamente');
    this.cerrarModales();
  }

  verMateriasAsignadas(curso: Curso): void {
    this.cursoSeleccionado = curso;
    this.mostrarMateriasAsignadas = true;
  }

  getAnioMateria(materia: Materia): number | null {
    return (materia as any).año || (materia as any)['año'] || null;
  }

  cerrarModales(): void {
    this.mostrarAsignarMaterias = false;
    this.mostrarInscribirAlumnos = false;
    this.mostrarGestionarHorarios = false;
    this.mostrarAlumnosInscritos = false;
    this.mostrarMateriasAsignadas = false;
    this.cursoSeleccionado = null;
    this.horariosTemporales = [];
    this.horarioForm.reset();
    this.alumnosInscritos = [];
  }

  tieneMateria(materiaId: string): boolean {
    return this.cursoSeleccionado?.materias.includes(materiaId) || false;
  }

  getNombreMateria(materiaId: string): string {
    const materia = this.materiasDisponibles.find(m => m.id === materiaId);
    return materia ? materia.nombre : '';
  }

  private nombresAlumnos: Map<string, string> = new Map();
  private nombresAulas: Map<string, string> = new Map();
  private materiasCache: Map<string, Materia> = new Map();
  private aulasCache: Map<string, Aula> = new Map();
  private alumnosCache: Map<string, Alumno> = new Map();
  private carrerasCache: Map<string, Carrera> = new Map();

  async actualizarCaches(): Promise<void> {
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    todosLosAlumnos.forEach(alumno => {
      this.nombresAlumnos.set(alumno.id, `${alumno.nombre} ${alumno.apellido}`);
      this.alumnosCache.set(alumno.id, alumno);
    });

    const todasLasAulas = await this.aulaService.getAulas();
    todasLasAulas.forEach(aula => {
      this.nombresAulas.set(aula.id, aula.nombre);
      this.aulasCache.set(aula.id, aula);
    });

    const todasLasMaterias = await this.materiaService.getMaterias();
    todasLasMaterias.forEach(materia => {
      this.materiasCache.set(materia.id, materia);
    });

    const todasLasCarreras = await this.carreraService.getCarreras();
    todasLasCarreras.forEach(carrera => {
      this.carrerasCache.set(carrera.id, carrera);
    });
  }

  getNombreAlumno(alumnoId: string): string {
    return this.nombresAlumnos.get(alumnoId) || '';
  }

  getMateriaById(materiaId: string): Materia | undefined {
    return this.materiasCache.get(materiaId);
  }

  getAulaNombre(aulaId: string | undefined): string {
    if (!aulaId) return '';
    return this.nombresAulas.get(aulaId) || '';
  }

  getTotalMaterias(): number {
    return this.cursosDeCarrera.reduce((total, curso) => total + (curso.materias?.length || 0), 0);
  }

  getTotalAlumnos(): number {
    return this.cursosDeCarrera.reduce((total, curso) => total + (curso.alumnos?.length || 0), 0);
  }

  getTotalAulas(): number {
    const aulasUnicas = new Set(this.cursosDeCarrera.map(c => c.aulaId).filter(id => id));
    return aulasUnicas.size;
  }

  async verAlumnosInscritos(curso: Curso): Promise<void> {
    this.cursoSeleccionado = curso;
    
    // Cargar los alumnos inscritos desde la base de datos
    try {
      // Primero obtener los IDs de alumnos inscritos
      const { data: alumnoCursosData, error: alumnoCursosError } = await this.supabaseService.client
        .from('alumno_cursos')
        .select('alumno_id')
        .eq('curso_id', curso.id)
        .eq('estado', 'inscrito');

      if (alumnoCursosError) {
        console.error('Error cargando alumno_cursos:', alumnoCursosError);
        this.notificationService.showError('Error al cargar los alumnos inscritos');
        return;
      }

      if (!alumnoCursosData || alumnoCursosData.length === 0) {
        this.alumnosInscritos = [];
        this.mostrarAlumnosInscritos = true;
        return;
      }

      // Obtener los datos completos de los alumnos
      const alumnoIds = alumnoCursosData.map((ac: any) => ac.alumno_id);
      const alumnosCompletos = await this.alumnoService.getAlumnos();
      
      // Filtrar solo los alumnos inscritos en este curso
      this.alumnosInscritos = alumnosCompletos.filter(alumno => 
        alumnoIds.includes(alumno.id)
      );

      console.log(`Alumnos inscritos cargados: ${this.alumnosInscritos.length}`);
      this.mostrarAlumnosInscritos = true;
    } catch (error) {
      console.error('Error cargando alumnos inscritos:', error);
      this.notificationService.showError('Error al cargar los alumnos inscritos');
    }
  }

  getAlumnoById(alumnoId: string): Alumno | undefined {
    return this.alumnosCache.get(alumnoId);
  }

  getCarreraById(carreraId: string): Carrera | undefined {
    return this.carrerasCache.get(carreraId);
  }

  getNombreDocente(docenteId: string): string {
    const docente = this.docentesDisponibles.find(d => d.id === docenteId);
    return docente ? `${docente.nombre} ${docente.apellido}` : '';
  }
  
  getAulaById(aulaId: string): Aula | undefined {
    return this.aulasCache.get(aulaId);
  }

  async abrirModalNuevo(): Promise<void> {
    // Iniciar wizard
    this.mostrarWizard = true;
    this.modalAbierto = false;
    this.modoEdicion = false;
    this.carreraSeleccionada = null;
    this.scrollLockService.lockScroll();
    this.wizardData = {
      carrera: null,
      aulasSeleccionadas: [],
      cursos: [],
      materiasSeleccionadas: [],
      materiasPorCurso: [],
      currentStep: 0
    };
    this.carreraForm.reset({
      duracionAnios: 3,
      duracionCuatrimestres: 6,
      estado: 'activa',
      coordinadorId: ''
    });
    await this.loadAulasDisponibles();
    await this.loadDocentesDisponibles();
    // Actualizar cache de materias por si se creó una materia desde el wizard
    await this.actualizarCaches();
    await this.actualizarMateriasDisponibles();
  }
  
  cerrarWizard(): void {
    this.mostrarWizard = false;
    this.wizardData = {
      carrera: null,
      aulasSeleccionadas: [],
      cursos: [],
      materiasSeleccionadas: [],
      materiasPorCurso: [],
      currentStep: 0
    };
    this.carreraForm.reset();
    this.scrollLockService.unlockScroll();
  }
  
  // Paso 1: Crear Carrera
  completarPaso1(): void {
    if (this.carreraForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }
    
    const formValue = this.carreraForm.value;
    const esEdicion = this.modoEdicion && this.carreraSeleccionada;
    
    this.wizardData.carrera = {
      id: esEdicion ? this.carreraSeleccionada!.id : crypto.randomUUID(),
      nombre: formValue.nombre,
      codigo: formValue.codigo,
      descripcion: formValue.descripcion,
      duracionAnios: formValue.duracionAnios,
      duracionCuatrimestres: formValue.duracionCuatrimestres,
      estado: formValue.estado,
      coordinadorId: formValue.coordinadorId || null,
      materiasObligatorias: esEdicion ? this.carreraSeleccionada!.materiasObligatorias : [],
      materiasOptativas: esEdicion ? this.carreraSeleccionada!.materiasOptativas : [],
      equivalencias: esEdicion ? this.carreraSeleccionada!.equivalencias : [],
      cursos: esEdicion ? this.carreraSeleccionada!.cursos || [] : [],
      fechaCreacion: esEdicion ? this.carreraSeleccionada!.fechaCreacion : new Date().toISOString()
    };
    
    const mensaje = esEdicion 
      ? 'Datos de carrera actualizados. Continúe con el siguiente paso.'
      : 'Carrera creada. Continúe con el siguiente paso.';
    
    this.notificationService.showSuccess(mensaje);
  }
  
  // Paso 2: Asignar Aulas
  toggleAula(aulaId: string): void {
    const index = this.wizardData.aulasSeleccionadas.indexOf(aulaId);
    if (index > -1) {
      this.wizardData.aulasSeleccionadas.splice(index, 1);
    } else {
      this.wizardData.aulasSeleccionadas.push(aulaId);
    }
  }
  
  tieneAula(aulaId: string): boolean {
    return this.wizardData.aulasSeleccionadas.includes(aulaId);
  }
  
  completarPaso2(): void {
    if (this.wizardData.aulasSeleccionadas.length === 0) {
      this.notificationService.showWarning('Debe seleccionar al menos un aula');
      return;
    }
    this.notificationService.showSuccess('Aulas asignadas. Continúe con el siguiente paso.');
  }
  
  // Paso 3: Crear Cursos
  agregarCursoWizard(): void {
    const nuevoCurso: Partial<Curso> = {
      id: crypto.randomUUID(),
      nombre: '',
      codigo: '',
      año: 1,
      division: '',
      turno: 'mañana',
      capacidad: 30,
      cuatrimestre: 1,
      modalidad: 'presencial',
      aulaId: '',
      materias: [],
      alumnos: [],
      horarios: [],
      estado: 'activo'
    };
    this.wizardData.cursos.push(nuevoCurso);
    this.notificationService.showInfo('Curso agregado. Complete los datos del curso.');
  }
  
  eliminarCursoWizard(index: number): void {
    const cursoId = this.wizardData.cursos[index]?.id;
    this.wizardData.cursos.splice(index, 1);
    // Eliminar materias asociadas a este curso
    this.wizardData.materiasSeleccionadas = this.wizardData.materiasSeleccionadas.filter(
      m => m.cursoId !== cursoId
    );
    this.wizardData.materiasPorCurso = this.wizardData.materiasPorCurso.filter(
      m => m.cursoId !== cursoId
    );
  }
  
  completarPaso3(): void {
    // Validar que todos los cursos tengan datos completos
    for (let curso of this.wizardData.cursos) {
      if (!curso.nombre || !curso.codigo || !curso.division || !curso.aulaId) {
        this.notificationService.showError('Todos los cursos deben estar completos (nombre, código, división y aula)');
        return;
      }
    }
    
    if (this.wizardData.cursos.length === 0) {
      this.notificationService.showWarning('Debe crear al menos un curso');
      return;
    }
    
    this.notificationService.showSuccess('Cursos creados. Continúe con el siguiente paso.');
  }
  
  // Paso 4: Asignar Materias (Seleccionar materias directamente, el profesor ya viene con la materia)
  async actualizarMateriasDisponibles(): Promise<void> {
    // Actualizar cache antes de obtener las materias
    await this.actualizarCaches();
    // Obtener TODAS las materias disponibles (con o sin carreraId asignado)
    // El profesor ya viene asignado a cada materia
    this.materiasDisponiblesParaCurso = Array.from(this.materiasCache.values());
  }
  
  getMateriasDisponiblesParaCurso(curso: Partial<Curso>): Materia[] {
    // Retornar todas las materias disponibles, pero filtrar por año y cuatrimestre si están definidos
    // Si el curso tiene año y cuatrimestre, mostrar materias que coincidan O que no tengan año/cuatrimestre definidos
    if (!curso['año'] && !curso.cuatrimestre) {
      // Si el curso no tiene año ni cuatrimestre, mostrar todas las materias
      return this.materiasDisponiblesParaCurso;
    }
    
    return this.materiasDisponiblesParaCurso.filter(materia => {
      // Mostrar materia si:
      // 1. No tiene año definido O coincide con el año del curso
      // 2. Y no tiene cuatrimestre definido O coincide con el cuatrimestre del curso
      const añoCoincide = !materia['año'] || materia['año'] === curso['año'];
      const cuatrimestreCoincide = !materia.cuatrimestre || materia.cuatrimestre === curso.cuatrimestre;
      return añoCoincide && cuatrimestreCoincide;
    });
  }
  
  async toggleMateriaEnCurso(materiaId: string, cursoId: string, profesorId: string, nombreMateria: string): Promise<void> {
    // Validar que el cursoId sea válido
    if (!cursoId) {
      console.error('Error: cursoId no está definido');
      this.notificationService.showError('Error: El curso no tiene un ID válido');
      return;
    }
    
    // Obtener el profesor de la materia si no viene
    const materia = this.materiasCache.get(materiaId);
    const profesorMateria = materia?.profesor || profesorId;
    
    // Buscar o crear el cursoData
    let cursoData = this.wizardData.materiasPorCurso.find(m => m.cursoId === cursoId);
    if (!cursoData) {
      cursoData = { cursoId, profesorId: profesorMateria, materias: [] };
      this.wizardData.materiasPorCurso.push(cursoData);
    }
    
    const index = cursoData.materias.indexOf(materiaId);
    if (index > -1) {
      // Quitar materia
      cursoData.materias.splice(index, 1);
      // Eliminar de materias seleccionadas
      const indexSeleccionadas = this.wizardData.materiasSeleccionadas.findIndex(
        m => m.materiaId === materiaId && m.cursoId === cursoId
      );
      if (indexSeleccionadas > -1) {
        this.wizardData.materiasSeleccionadas.splice(indexSeleccionadas, 1);
      }
      this.notificationService.showInfo(`Materia "${nombreMateria}" removida del curso`);
    } else {
      // Agregar materia
      cursoData.materias.push(materiaId);
      // Obtener el profesor de la materia
      const profesorFinal = materia?.profesor || profesorMateria;
      // Buscar el ID del profesor por nombre
      const docente = this.docentesDisponibles.find(d => 
        `${d.nombre} ${d.apellido}` === profesorFinal || d.id === profesorFinal
      );
      const profesorIdFinal = docente?.id || profesorFinal;
      
      this.wizardData.materiasSeleccionadas.push({ 
        materiaId, 
        cursoId, 
        profesorId: profesorIdFinal,
        nombreMateria
      });
      this.notificationService.showSuccess(`Materia "${nombreMateria}" asignada al curso`);
    }
  }
  
  tieneMateriaEnCurso(materiaId: string, cursoId: string): boolean {
    const cursoData = this.wizardData.materiasPorCurso.find(m => m.cursoId === cursoId);
    return cursoData ? cursoData.materias.includes(materiaId) : false;
  }
  
  crearNuevaMateriaParaCurso(cursoId: string, profesorId: string): void {
    // Obtener el curso para obtener año y cuatrimestre
    const curso = this.wizardData.cursos.find(c => c.id === cursoId);
    
    // Guardar datos temporales para crear la materia
    // El profesor se asignará cuando se cree la materia
    sessionStorage.setItem('crearMateriaDesdeCarrera', JSON.stringify({
      carreraId: this.wizardData.carrera?.id,
      profesorId: profesorId || '', // Puede estar vacío, se asignará después
      cursoId: cursoId,
      año: curso?.['año'] || 1,
      cuatrimestre: curso?.cuatrimestre || 1
    }));
    
    // Redirigir a materias para crear la materia
    this.notificationService.showInfo('Redirigiendo a Materias para crear la nueva materia. Complete el wizard y regrese aquí.');
    // Usar router para navegar
    setTimeout(() => {
      this.router.navigate(['/app/materias']);
    }, 1500);
  }
  
  completarPaso4(): void {
    // Validar que cada curso tenga al menos una materia
    for (let curso of this.wizardData.cursos) {
      if (!curso.id) {
        this.notificationService.showError(`El curso "${curso.nombre}" no tiene un ID válido. Por favor, recree el curso.`);
        return;
      }
      const cursoData = this.wizardData.materiasPorCurso.find(m => m.cursoId === curso.id);
      if (!cursoData || !cursoData.materias || cursoData.materias.length === 0) {
        this.notificationService.showError(`El curso "${curso.nombre}" debe tener al menos una materia asignada`);
        return;
      }
    }
    
    this.notificationService.showInfo('Materias asignadas. Finalizando...');
  }
  
  // Finalizar Wizard
  async finalizarWizard(): Promise<void> {
    try {
      if (!this.wizardData.carrera) {
        this.notificationService.showError('Error: No se pudo procesar la carrera');
        return;
      }
      
      // Mostrar indicador de carga
      this.notificationService.showInfo('Procesando carrera... Por favor espere.');
      
      const esEdicion = this.modoEdicion && this.carreraSeleccionada;
    
    // 1. Guardar/Actualizar carrera
    const carrera: Carrera = {
      ...this.wizardData.carrera as Carrera,
      cursos: []
    };
    
    if (esEdicion) {
      // Actualizar carrera existente
      carrera.id = this.carreraSeleccionada!.id;
      carrera.fechaCreacion = this.carreraSeleccionada!.fechaCreacion;
      
      // Eliminar cursos antiguos que no están en el wizard
      const cursosAntiguos = await this.cursoService.getCursosByCarrera(carrera.id);
      const idsCursosNuevos = this.wizardData.cursos.map(c => c.id!);
      for (const cursoAntiguo of cursosAntiguos) {
        if (!idsCursosNuevos.includes(cursoAntiguo.id)) {
          await this.cursoService.deleteCurso(cursoAntiguo.id);
        }
      }
    } else {
      // Crear nueva carrera
      await this.carreraService.addCarrera(carrera);
    }
    
    // 2. Actualizar materias con carreraId si no lo tienen
    for (let materiaSeleccionada of this.wizardData.materiasSeleccionadas) {
      const materia = this.materiasCache.get(materiaSeleccionada.materiaId);
      if (materia && (!materia.carreraId || materia.carreraId === '')) {
        // Obtener el curso correspondiente para obtener año y cuatrimestre
        const cursoCorrespondiente = this.wizardData.cursos.find(c => c.id === materiaSeleccionada.cursoId);
        // Asignar carreraId a la materia si no lo tiene
        const materiaActualizada: Materia = {
          ...materia,
          carreraId: carrera.id,
          año: cursoCorrespondiente?.['año'] || materia.año,
          cuatrimestre: cursoCorrespondiente?.cuatrimestre || materia.cuatrimestre,
          tipo: materia.tipo || 'obligatoria'
        };
        await this.materiaService.updateMateria(materiaActualizada);
        // Actualizar cache
        this.materiasCache.set(materia.id, materiaActualizada);
      }
    }
    
    // 3. Guardar/Actualizar cursos
    for (let cursoData of this.wizardData.cursos) {
      const materiasDelCurso = this.wizardData.materiasSeleccionadas
        .filter(m => m.cursoId === cursoData.id)
        .map(m => m.materiaId);
      
      if (esEdicion && cursoData.id) {
        const cursoExistente = await this.cursoService.getCursoById(cursoData.id);
        if (cursoExistente) {
          // Actualizar curso existente
          const curso: Curso = {
            ...cursoExistente,
            nombre: cursoData.nombre!,
            codigo: cursoData.codigo!,
            año: cursoData['año']!,
            division: cursoData.division!,
            turno: cursoData.turno!,
            capacidad: cursoData.capacidad!,
            cuatrimestre: cursoData.cuatrimestre!,
            modalidad: cursoData.modalidad!,
            aulaId: cursoData.aulaId!,
            materias: materiasDelCurso
          };
          await this.cursoService.updateCurso(curso);
          if (!carrera.cursos) {
            carrera.cursos = [];
          }
          if (!carrera.cursos.includes(curso.id)) {
            carrera.cursos.push(curso.id);
          }
        }
      } else {
        // Crear nuevo curso
        const curso: Curso = {
          id: cursoData.id || crypto.randomUUID(),
          carreraId: carrera.id,
          nombre: cursoData.nombre!,
          codigo: cursoData.codigo!,
          año: cursoData['año']!,
          division: cursoData.division!,
          turno: cursoData.turno!,
          capacidad: cursoData.capacidad!,
          cuatrimestre: cursoData.cuatrimestre!,
          modalidad: cursoData.modalidad!,
          aulaId: cursoData.aulaId!,
          horarios: [],
          materias: materiasDelCurso,
          alumnos: [],
          listaEspera: [],
          estado: 'activo',
          cupoMaximo: cursoData.capacidad,
          cupoActual: 0,
          fechaCreacion: new Date().toISOString(),
          configuracion: {
            permiteAutoinscripcion: false,
            permiteEdicionHorariosProfesor: false,
            requiereAprobacionInscripcion: true,
            activaListaEspera: true
          }
        };
        await this.cursoService.addCurso(curso);
        if (!carrera.cursos) {
          carrera.cursos = [];
        }
        carrera.cursos.push(curso.id);
      }
    }
    
    // 3. Actualizar carrera con cursos
    await this.carreraService.updateCarrera(carrera);
    
    const mensaje = esEdicion 
      ? '¡Carrera actualizada exitosamente con todos sus cursos y materias!'
      : '¡Carrera creada exitosamente con todos sus cursos y materias!';
    
    this.notificationService.showSuccess(mensaje);
    await this.loadCarreras();
    this.cerrarWizard();
    } catch (error: any) {
      console.error('Error al finalizar wizard:', error);
      const errorMessage = error?.message || 'Error desconocido al crear la carrera. Por favor, intente nuevamente.';
      this.notificationService.showError(`Error: ${errorMessage}`);
    }
  }

  async abrirModalEditar(carrera: Carrera): Promise<void> {
    // Iniciar wizard en modo edición
    this.mostrarWizard = true;
    this.modalAbierto = false;
    this.modoEdicion = true;
    this.carreraSeleccionada = carrera;
    this.scrollLockService.lockScroll();
    
    // Cargar datos de la carrera en el wizard
    this.carreraForm.patchValue({
      nombre: carrera.nombre,
      codigo: carrera.codigo,
      descripcion: carrera.descripcion,
      duracionAnios: carrera.duracionAnios,
      duracionCuatrimestres: carrera.duracionCuatrimestres,
      estado: carrera.estado,
      coordinadorId: carrera.coordinadorId || ''
    });
    
    // Cargar datos existentes en wizardData
    this.wizardData = {
      carrera: { ...carrera },
      aulasSeleccionadas: [],
      cursos: [],
      materiasSeleccionadas: [],
      materiasPorCurso: [],
      currentStep: 0
    };
    
    // Cargar cursos existentes de la carrera
    if (carrera.cursos && carrera.cursos.length > 0) {
      const cursosExistentes = await this.cursoService.getCursosByCarrera(carrera.id);
      this.wizardData.cursos = cursosExistentes.map((curso: Curso) => ({
        id: curso.id,
        nombre: curso.nombre,
        codigo: curso.codigo,
        año: curso['año'],
        division: curso.division,
        turno: curso.turno,
        capacidad: curso.capacidad,
        cuatrimestre: curso.cuatrimestre,
        modalidad: curso.modalidad,
        aulaId: curso.aulaId
      }));
      
      // Cargar materias seleccionadas por curso
      for (const curso of cursosExistentes) {
        if (curso.materias && curso.materias.length > 0) {
          for (const materiaId of curso.materias) {
            const materia = this.materiasCache.get(materiaId);
            if (materia) {
              const profesorId = this.docentesDisponibles.find(d => 
                `${d.nombre} ${d.apellido}` === materia.profesor
              )?.id || '';
              
              this.wizardData.materiasSeleccionadas.push({
                materiaId,
                cursoId: curso.id,
                profesorId,
                nombreMateria: materia.nombre
              });
              
              // Agregar a materiasPorCurso
              let cursoData = this.wizardData.materiasPorCurso.find(m => m.cursoId === curso.id);
              if (!cursoData) {
                cursoData = { cursoId: curso.id, profesorId, materias: [] };
                this.wizardData.materiasPorCurso.push(cursoData);
              }
              cursoData.materias.push(materiaId);
            }
          }
        }
      }
    }
    
    // Cargar aulas de los cursos
    const aulasUsadas = new Set<string>();
    this.wizardData.cursos.forEach(curso => {
      if (curso.aulaId) {
        aulasUsadas.add(curso.aulaId);
      }
    });
    this.wizardData.aulasSeleccionadas = Array.from(aulasUsadas);
    
    this.loadAulasDisponibles();
    this.loadDocentesDisponibles();
  }

  guardarCarrera(): void {
    if (this.carreraForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.modoEdicion && this.carreraSeleccionada) {
      const carreraActualizada: Carrera = {
        ...this.carreraSeleccionada,
        ...this.carreraForm.value
      };
      this.carreraService.updateCarrera(carreraActualizada);
      this.notificationService.showSuccess('Carrera actualizada correctamente');
    } else {
      const nuevaCarrera: Carrera = {
        id: crypto.randomUUID(),
        ...this.carreraForm.value,
        materiasObligatorias: [],
        materiasOptativas: [],
        equivalencias: [],
        cursos: [],
        fechaCreacion: new Date().toISOString()
      };
      this.carreraService.addCarrera(nuevaCarrera);
      this.notificationService.showSuccess('Carrera creada correctamente');
    }

    this.loadCarreras();
    this.cerrarModal();
  }

  eliminarCarrera(id: string): void {
    if (confirm('¿Está seguro de eliminar esta carrera?')) {
      this.carreraService.deleteCarrera(id);
      this.loadCarreras();
      this.notificationService.showSuccess('Carrera eliminada correctamente');
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.carreraSeleccionada = null;
    this.modoEdicion = false;
    this.carreraForm.reset();
  }
}

