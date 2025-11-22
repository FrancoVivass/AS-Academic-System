import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MateriaService } from '../../services/materia.service';
import { AlumnoService } from '../../services/alumno.service';
import { CarreraService } from '../../services/carrera.service';
import { CursoService } from '../../services/curso.service';
import { DocenteService } from '../../services/docente.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { ScrollLockService } from '../../services/scroll-lock.service';
import { Docente } from '../../models/usuario.model';
import { Materia, AlumnoMateria, ConfiguracionMateria } from '../../models/materia.model';
import { Alumno } from '../../models/alumno.model';
import { Carrera } from '../../models/carrera.model';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-materias',
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
    MatCheckboxModule,
    MatChipsModule,
    MatStepperModule
  ],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class MateriasComponent implements OnInit {
  materias: Materia[] = [];
  materiasFiltradas: Materia[] = [];
  materiaSeleccionada: Materia | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  mostrarWizard: boolean = false;
  busqueda: string = '';
  filtroCurso: string = '';

  materiaForm: FormGroup;
  mostrarInscripciones: boolean = false;
  alumnosDisponibles: Alumno[] = [];
  alumnosInscritos: Alumno[] = [];
  carreras: Carrera[] = [];
  cursos: Curso[] = [];
  docentes: Docente[] = [];
  materiasDisponibles: Materia[] = [];
  correlatividadesSeleccionadas: string[] = [];
  
  // Wizard data
  wizardData: {
    carreraSeleccionada: Carrera | null;
    profesorSeleccionado: Docente | null;
    correlatividades: string[];
  } = {
    carreraSeleccionada: null,
    profesorSeleccionado: null,
    correlatividades: []
  };

  constructor(
    private materiaService: MateriaService,
    private alumnoService: AlumnoService,
    private carreraService: CarreraService,
    private cursoService: CursoService,
    private docenteService: DocenteService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private scrollLockService: ScrollLockService
  ) {
    this.materiaForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      descripcion: [''],
      profesor: [''], // No requerido en wizard, se asigna desde wizardData
      curso: [''], // No requerido, se asigna cuando se agrega a un curso
      horario: [''],
      creditos: [0, [Validators.min(0)]],
      horasSemanales: [0, [Validators.min(0)]],
      carreraId: [''], // Opcional, se asigna después en la carrera
      año: [1, [Validators.min(1)]], // Opcional
      cuatrimestre: [1, [Validators.min(1), Validators.max(2)]], // Opcional
      tipo: ['obligatoria'], // Opcional
      tieneNota: [true],
      tieneAsistencia: [true],
      requiereAprobacion: [false],
      notaMinimaAprobacion: [6, [Validators.min(0), Validators.max(10)]],
      porcentajeAsistenciaMinimo: [75, [Validators.min(0), Validators.max(100)]],
      correlatividades: [[]]
    });
  }

  ngOnInit(): void {
    // Cargar datos básicos (cargar docentes primero para que estén disponibles al filtrar materias)
    this.loadDocentes();
    this.loadCarreras();
    this.loadCursos();
    this.loadMateriasDisponibles();
    // Cargar materias después de cargar docentes
    this.loadMaterias();
    
    // Verificar si viene desde carreras para crear una materia
    const datosTemporales = sessionStorage.getItem('crearMateriaDesdeCarrera');
    if (datosTemporales) {
      try {
        const datos = JSON.parse(datosTemporales);
        // Abrir wizard automáticamente después de que se carguen los datos
        setTimeout(() => {
          this.abrirModalNuevo();
          // Pre-seleccionar carrera y profesor después de un pequeño delay
          setTimeout(() => {
            if (datos.carreraId) {
              // Pre-seleccionar carrera si viene desde el wizard de carreras
              if (datos.carreraId) {
                this.wizardData.carreraSeleccionada = this.carreras.find(c => c.id === datos.carreraId) || null;
                if (this.wizardData.carreraSeleccionada) {
                  this.materiaForm.patchValue({ carreraId: datos.carreraId });
                }
              }
              this.materiaForm.patchValue({ 
                carreraId: datos.carreraId,
                año: datos.año || 1
              });
            }
            if (datos.profesorId) {
              this.seleccionarProfesor(datos.profesorId);
            }
          }, 100);
          // Limpiar datos temporales
          sessionStorage.removeItem('crearMateriaDesdeCarrera');
        }, 300);
      } catch (e) {
        console.error('Error al cargar datos temporales:', e);
      }
    }
  }

  loadCarreras(): void {
    if (!this.carreras || this.carreras.length === 0) {
      this.carreras = this.carreraService.getCarreras();
    }
  }

  loadCursos(): void {
    if (!this.cursos || this.cursos.length === 0) {
      this.cursos = this.cursoService.getCursos();
    }
  }

  loadDocentes(): void {
    if (!this.docentes || this.docentes.length === 0) {
      this.docentes = this.docenteService.getDocentes();
    }
  }

  loadMateriasDisponibles(): void {
    if (!this.materiasDisponibles || this.materiasDisponibles.length === 0) {
      this.materiasDisponibles = this.materiaService.getMaterias();
    }
  }

  loadMaterias(): void {
    let todasLasMaterias = this.materiaService.getMaterias();
    
    // Si es alumno, solo mostrar materias en las que está inscrito
    if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      if (usuarioId) {
        const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId);
        todasLasMaterias = todasLasMaterias.filter(m => 
          inscripciones.some(i => i.materiaId === m.id)
        );
      }
    }
    // Si es profesor, mostrar sus materias asignadas
    else if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        // Intentar obtener el docente completo desde DocenteService
        const docente = this.docenteService.getDocenteById(usuario.id);
        
        if (docente && docente.materiasAsignadas && docente.materiasAsignadas.length > 0) {
          // Filtrar por materias asignadas del docente
          todasLasMaterias = todasLasMaterias.filter(m => 
            docente.materiasAsignadas!.includes(m.id)
          );
        } else {
          // Si no tiene materiasAsignadas en el docente, buscar por nombre del profesor
          const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
          todasLasMaterias = todasLasMaterias.filter(m => 
            m.profesor === nombreCompleto || m.profesor?.includes(usuario.nombre)
          );
        }
      }
    }
    
    this.materias = todasLasMaterias;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = [...this.materias];

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      filtradas = filtradas.filter(m =>
        m.nombre.toLowerCase().includes(busquedaLower) ||
        m.codigo.toLowerCase().includes(busquedaLower) ||
        m.profesor.toLowerCase().includes(busquedaLower)
      );
    }

    if (this.filtroCurso) {
      filtradas = filtradas.filter(m => m.curso === this.filtroCurso);
    }

    this.materiasFiltradas = filtradas;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroCursoChange(): void {
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    // Abrir wizard inmediatamente
    this.mostrarWizard = true;
    this.modoEdicion = false;
    this.materiaSeleccionada = null;
    this.mostrarModal = false;
    this.scrollLockService.lockScroll();
    
    // Resetear datos del wizard
    this.wizardData = {
      carreraSeleccionada: null,
      profesorSeleccionado: null,
      correlatividades: []
    };
    this.correlatividadesSeleccionadas = [];
    
    // Verificar si viene desde el wizard de carreras
    const crearDesdeCarrera = sessionStorage.getItem('crearMateriaDesdeCarrera');
    let carreraIdPreSeleccionada = null;
    let añoPreSeleccionado = null;
    let profesorIdPreSeleccionado = null;
    
    if (crearDesdeCarrera) {
      try {
        const data = JSON.parse(crearDesdeCarrera);
        carreraIdPreSeleccionada = data.carreraId;
        añoPreSeleccionado = data.año;
        profesorIdPreSeleccionado = data.profesorId;
        // Limpiar sessionStorage
        sessionStorage.removeItem('crearMateriaDesdeCarrera');
      } catch (e) {
        console.error('Error al parsear datos de carrera:', e);
      }
    }
    
    // Si viene desde carrera, pre-seleccionar carrera y profesor
    if (carreraIdPreSeleccionada) {
      this.wizardData.carreraSeleccionada = this.carreras.find(c => c.id === carreraIdPreSeleccionada) || null;
    }
    
    // Resetear formulario con valores por defecto
    this.materiaForm.reset({
      nombre: '',
      codigo: '',
      descripcion: '',
      creditos: 0,
      horasSemanales: 0,
      año: añoPreSeleccionado || 1,
      cuatrimestre: 1,
      tipo: 'obligatoria',
      carreraId: carreraIdPreSeleccionada || '',
      tieneNota: true,
      tieneAsistencia: true,
      requiereAprobacion: false,
      notaMinimaAprobacion: 6,
      porcentajeAsistenciaMinimo: 75,
      correlatividades: []
    });
    
    // Cargar datos de forma asíncrona después de mostrar el wizard
    // Esto hace que el wizard aparezca inmediatamente
    setTimeout(() => {
      this.loadCarreras();
      this.loadDocentes();
      this.loadMateriasDisponibles();
      
      // Si viene desde carrera, pre-seleccionar carrera y profesor después de cargar
      if (carreraIdPreSeleccionada) {
        this.wizardData.carreraSeleccionada = this.carreras.find(c => c.id === carreraIdPreSeleccionada) || null;
        if (profesorIdPreSeleccionado) {
          this.seleccionarProfesor(profesorIdPreSeleccionado);
        }
      }
    }, 0);
  }
  
  cerrarWizard(): void {
    this.mostrarWizard = false;
    this.wizardData = {
      carreraSeleccionada: null,
      profesorSeleccionado: null,
      correlatividades: []
    };
    this.correlatividadesSeleccionadas = [];
    this.materiaForm.reset();
    this.scrollLockService.unlockScroll();
  }
  
  completarPaso1(): void {
    if (this.materiaForm.get('nombre')?.invalid || 
        this.materiaForm.get('codigo')?.invalid) {
      this.notificationService.showWarning('Por favor complete nombre y código de la materia');
      return;
    }
    this.notificationService.showSuccess('Datos básicos completados. Continúe con la asignación de profesor.');
  }
  
  seleccionarProfesor(profesorId: string): void {
    this.wizardData.profesorSeleccionado = this.docentes.find(d => d.id === profesorId) || null;
    if (this.wizardData.profesorSeleccionado) {
      const nombreProfesor = `${this.wizardData.profesorSeleccionado.nombre} ${this.wizardData.profesorSeleccionado.apellido}`;
      this.materiaForm.patchValue({ profesor: nombreProfesor });
      this.notificationService.showSuccess(`Profesor "${nombreProfesor}" seleccionado.`);
    }
  }
  
  completarPaso2(): void {
    if (!this.wizardData.profesorSeleccionado) {
      this.notificationService.showWarning('Debe seleccionar un profesor');
      return;
    }
    this.notificationService.showSuccess('Profesor asignado. Continúe con la configuración final.');
  }
  
  toggleCorrelatividad(materiaId: string): void {
    const index = this.correlatividadesSeleccionadas.indexOf(materiaId);
    if (index > -1) {
      this.correlatividadesSeleccionadas.splice(index, 1);
    } else {
      this.correlatividadesSeleccionadas.push(materiaId);
    }
  }
  
  tieneCorrelatividad(materiaId: string): boolean {
    return this.correlatividadesSeleccionadas.includes(materiaId);
  }
  
  getMateriasParaCorrelatividades(): Materia[] {
    if (!this.wizardData.carreraSeleccionada) return [];
    
    const añoActual = this.materiaForm.get('año')?.value || 1;
    // Mostrar materias de años anteriores de la misma carrera
    return this.materiasDisponibles.filter(m => {
      const añoMateria = m['año'] || m.año;
      const mismaCarrera = m.carreraId === this.wizardData.carreraSeleccionada?.id;
      return mismaCarrera && añoMateria && añoMateria < añoActual && m.id !== this.materiaSeleccionada?.id;
    });
  }
  
  finalizarWizardMateria(): void {
    console.log('Finalizando wizard de materia...');
    console.log('Form value:', this.materiaForm.value);
    console.log('Wizard data:', this.wizardData);
    
    // Validar campos básicos
    if (!this.materiaForm.get('nombre')?.value || !this.materiaForm.get('codigo')?.value) {
      this.notificationService.showWarning('Por favor complete nombre y código de la materia');
      return;
    }
    
    if (!this.wizardData.profesorSeleccionado) {
      this.notificationService.showWarning('Debe seleccionar un profesor');
      return;
    }
    
    console.log('Validaciones pasadas, creando materia...');
    
    // Si hay carrera seleccionada, usarla; si no, dejar carreraId vacío (se asignará después)
    const carreraId = this.wizardData.carreraSeleccionada?.id || this.materiaForm.get('carreraId')?.value || '';
    if (carreraId) {
      this.materiaForm.patchValue({ carreraId: carreraId });
    }
    
    const formValue = this.materiaForm.value;
    const nombreProfesor = `${this.wizardData.profesorSeleccionado.nombre} ${this.wizardData.profesorSeleccionado.apellido}`;
    
    const configuracion: ConfiguracionMateria = {
      tieneNota: formValue.tieneNota ?? true,
      tieneAsistencia: formValue.tieneAsistencia ?? true,
      requiereAprobacion: formValue.requiereAprobacion ?? false,
      notaMinimaAprobacion: formValue.notaMinimaAprobacion ?? 6,
      porcentajeAsistenciaMinimo: formValue.porcentajeAsistenciaMinimo ?? 75
    };
    
    const esEdicion = this.modoEdicion && this.materiaSeleccionada;
    
    if (esEdicion) {
      // Actualizar materia existente
      const materiaActualizada: Materia = {
        ...this.materiaSeleccionada!,
        nombre: formValue.nombre,
        codigo: formValue.codigo,
        descripcion: formValue.descripcion || '',
        profesor: nombreProfesor,
        creditos: formValue.creditos || 0,
        horasSemanales: formValue.horasSemanales || 0,
        carreraId: carreraId || this.materiaSeleccionada!.carreraId || '',
        año: formValue.año || this.materiaSeleccionada!.año || undefined,
        cuatrimestre: formValue.cuatrimestre || this.materiaSeleccionada!.cuatrimestre || undefined,
        tipo: formValue.tipo || this.materiaSeleccionada!.tipo || 'obligatoria',
        correlatividades: this.materiaSeleccionada!.correlatividades || [],
        configuracion,
        estado: this.materiaSeleccionada!.estado || 'activa',
        fechaCreacion: this.materiaSeleccionada!.fechaCreacion || new Date().toISOString()
      };
      
      this.materiaService.updateMateria(materiaActualizada);
      
      // Actualizar materias asignadas del docente
      // Remover de docentes anteriores si cambió el profesor
      if (this.materiaSeleccionada!.profesor !== nombreProfesor) {
        const docentesAnteriores = this.docentes.filter(d => 
          d.materiasAsignadas?.includes(materiaActualizada.id)
        );
        docentesAnteriores.forEach(d => {
          if (d.materiasAsignadas) {
            d.materiasAsignadas = d.materiasAsignadas.filter(id => id !== materiaActualizada.id);
            this.docenteService.updateDocente(d);
          }
        });
      }
      
      // Agregar al nuevo docente
      if (!this.wizardData.profesorSeleccionado.materiasAsignadas) {
        this.wizardData.profesorSeleccionado.materiasAsignadas = [];
      }
      if (!this.wizardData.profesorSeleccionado.materiasAsignadas.includes(materiaActualizada.id)) {
        this.wizardData.profesorSeleccionado.materiasAsignadas.push(materiaActualizada.id);
        this.docenteService.updateDocente(this.wizardData.profesorSeleccionado);
      }
      
      this.notificationService.showSuccess(`Materia "${materiaActualizada.nombre}" actualizada exitosamente`);
    } else {
      // Crear nueva materia
      const nuevaMateria: Materia = {
        id: Date.now().toString(),
        nombre: formValue.nombre,
        codigo: formValue.codigo,
        descripcion: formValue.descripcion || '',
        profesor: nombreProfesor,
        curso: '',
        horario: '',
        creditos: formValue.creditos || 0,
        horasSemanales: formValue.horasSemanales || 0,
        carreraId: carreraId || '',
        año: formValue.año || undefined,
        cuatrimestre: formValue.cuatrimestre || undefined,
        tipo: formValue.tipo || 'obligatoria',
        correlatividades: [], // Las correlatividades se configuran después cuando se asigna a la carrera
        configuracion,
        estado: 'activa',
        fechaCreacion: new Date().toISOString()
      };
      
      console.log('Nueva materia a crear:', nuevaMateria);
      this.materiaService.addMateria(nuevaMateria);
      console.log('Materia guardada en servicio');
      
      // Asignar materia al docente
      if (!this.wizardData.profesorSeleccionado.materiasAsignadas) {
        this.wizardData.profesorSeleccionado.materiasAsignadas = [];
      }
      if (!this.wizardData.profesorSeleccionado.materiasAsignadas.includes(nuevaMateria.id)) {
        this.wizardData.profesorSeleccionado.materiasAsignadas.push(nuevaMateria.id);
        this.docenteService.updateDocente(this.wizardData.profesorSeleccionado);
        console.log('Materia asignada al docente');
      }
      
      this.notificationService.showSuccess(`Materia "${nuevaMateria.nombre}" creada exitosamente y asignada al profesor ${nombreProfesor}`);
    }
    
    console.log('Recargando materias...');
    this.loadMaterias();
    this.loadMateriasDisponibles();
    console.log('Materias recargadas. Total:', this.materias.length);
    this.cerrarWizard();
  }

  abrirModalEditar(materia: Materia): void {
    // Abrir wizard en modo edición
    this.mostrarWizard = true;
    this.modoEdicion = true;
    this.materiaSeleccionada = materia;
    this.mostrarModal = false;
    this.correlatividadesSeleccionadas = materia.correlatividades || [];
    this.scrollLockService.lockScroll();
    
    // Buscar el docente por nombre para obtener el objeto completo
    const docente = this.docentes.find(d => 
      materia.profesor && materia.profesor.includes(d.nombre) && materia.profesor.includes(d.apellido)
    );
    
    // Buscar la carrera
    const carrera = this.carreras.find(c => c.id === materia.carreraId);
    
    // Configurar wizardData
    this.wizardData = {
      carreraSeleccionada: carrera || null,
      profesorSeleccionado: docente || null,
      correlatividades: materia.correlatividades || []
    };
    
    // Cargar datos en el formulario
    this.materiaForm.patchValue({
      nombre: materia.nombre,
      codigo: materia.codigo,
      descripcion: materia.descripcion || '',
      profesor: materia.profesor || '',
      carreraId: materia.carreraId || '',
      año: materia['año'] || materia.año || 1,
      cuatrimestre: materia.cuatrimestre || 1,
      tipo: materia.tipo || 'obligatoria',
      horasSemanales: materia.horasSemanales || 0,
      creditos: materia.creditos || 0,
      tieneNota: materia.configuracion?.tieneNota ?? true,
      tieneAsistencia: materia.configuracion?.tieneAsistencia ?? true,
      requiereAprobacion: materia.configuracion?.requiereAprobacion ?? false,
      notaMinimaAprobacion: materia.configuracion?.notaMinimaAprobacion ?? 6,
      porcentajeAsistenciaMinimo: materia.configuracion?.porcentajeAsistenciaMinimo ?? 75
    });
    
    this.loadCarreras();
    this.loadDocentes();
    this.loadMateriasDisponibles();
  }

  guardarMateria(): void {
    if (this.materiaForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.materiaForm.value;
    
    // Validar que tenga carrera asignada
    if (!formValue.carreraId) {
      this.notificationService.showError('Debe seleccionar una carrera para la materia');
      return;
    }
    
    // Validar que tenga año y cuatrimestre
    if (!formValue.año || !formValue.cuatrimestre) {
      this.notificationService.showError('Debe especificar el año y cuatrimestre de la materia');
      return;
    }
    
    // Validar que tenga profesor asignado
    if (!formValue.profesor) {
      this.notificationService.showError('Debe asignar un profesor a la materia');
      return;
    }
    
    const profesorId = formValue.profesor;
    const docente = this.docentes.find(d => d.id === profesorId);
    if (!docente) {
      this.notificationService.showError('El profesor seleccionado no existe');
      return;
    }
    const nombreProfesor = `${docente.nombre} ${docente.apellido}`;
    
    const configuracion: ConfiguracionMateria = {
      tieneNota: formValue.tieneNota,
      tieneAsistencia: formValue.tieneAsistencia,
      requiereAprobacion: formValue.requiereAprobacion,
      notaMinimaAprobacion: formValue.notaMinimaAprobacion,
      porcentajeAsistenciaMinimo: formValue.porcentajeAsistenciaMinimo
    };

    if (this.modoEdicion && this.materiaSeleccionada) {
      const materiaActualizada: Materia = {
        ...this.materiaSeleccionada,
        ...formValue,
        profesor: nombreProfesor,
        correlatividades: this.correlatividadesSeleccionadas,
        configuracion,
        estado: this.materiaSeleccionada.estado || 'activa',
        fechaCreacion: this.materiaSeleccionada.fechaCreacion || new Date().toISOString()
      };
      this.materiaService.updateMateria(materiaActualizada);
      
      // Actualizar materias asignadas del docente
      if (!docente.materiasAsignadas) {
        docente.materiasAsignadas = [];
      }
      // Remover de materias anteriores si cambió el profesor
      if (this.materiaSeleccionada.profesor !== nombreProfesor) {
        const docentesAnteriores = this.docentes.filter(d => 
          d.materiasAsignadas?.includes(materiaActualizada.id)
        );
        docentesAnteriores.forEach(d => {
          if (d.materiasAsignadas) {
            d.materiasAsignadas = d.materiasAsignadas.filter(id => id !== materiaActualizada.id);
            this.docenteService.updateDocente(d);
          }
        });
      }
      if (!docente.materiasAsignadas.includes(materiaActualizada.id)) {
        docente.materiasAsignadas.push(materiaActualizada.id);
      }
      this.docenteService.updateDocente(docente);
      
      this.notificationService.showSuccess('Materia actualizada correctamente');
    } else {
      const nuevaMateria: Materia = {
        id: Date.now().toString(),
        ...formValue,
        profesor: nombreProfesor,
        correlatividades: this.correlatividadesSeleccionadas,
        configuracion,
        estado: 'activa',
        fechaCreacion: new Date().toISOString()
      };
      this.materiaService.addMateria(nuevaMateria);
      
      // Asignar materia al docente
      if (!docente.materiasAsignadas) {
        docente.materiasAsignadas = [];
      }
      if (!docente.materiasAsignadas.includes(nuevaMateria.id)) {
        docente.materiasAsignadas.push(nuevaMateria.id);
      }
      this.docenteService.updateDocente(docente);
      
      this.notificationService.showSuccess('Materia creada correctamente. Ahora puede asignarla a cursos desde la sección de Carreras.');
      
      // Si tiene carreraId, agregar automáticamente al plan de estudio
      if (nuevaMateria.carreraId) {
        this.agregarMateriaACarrera(nuevaMateria);
      }
    }

    this.loadMaterias();
    this.cerrarModal();
  }

  agregarMateriaACarrera(materia: Materia): void {
    if (!materia.carreraId) return;
    
    const carrera = this.carreraService.getCarreraById(materia.carreraId);
    if (carrera) {
      if (materia.tipo === 'obligatoria') {
        if (!carrera.materiasObligatorias.includes(materia.id)) {
          carrera.materiasObligatorias.push(materia.id);
        }
      } else if (materia.tipo === 'optativa') {
        if (!carrera.materiasOptativas.includes(materia.id)) {
          carrera.materiasOptativas.push(materia.id);
        }
      }
      this.carreraService.updateCarrera(carrera);
    }
  }

  // Métodos para el wizard (usan la misma lógica)
  toggleCorrelatividadWizard(materiaId: string): void {
    this.toggleCorrelatividad(materiaId);
  }
  
  tieneCorrelatividadWizard(materiaId: string): boolean {
    return this.tieneCorrelatividad(materiaId);
  }

  eliminarMateria(id: string): void {
    if (confirm('¿Está seguro de eliminar esta materia?')) {
      this.materiaService.deleteMateria(id);
      this.loadMaterias();
    }
  }

  abrirInscripciones(materia: Materia): void {
    this.materiaSeleccionada = materia;
    this.mostrarInscripciones = true;
    this.cargarAlumnosInscripcion();
  }

  cargarAlumnosInscripcion(): void {
    if (!this.materiaSeleccionada) return;
    
    this.alumnosDisponibles = this.alumnoService.getAlumnos();
    const inscripciones = this.materiaService.getInscripcionesByMateria(this.materiaSeleccionada.id);
    const idsInscritos = inscripciones.map(i => i.alumnoId);
    
    this.alumnosInscritos = this.alumnosDisponibles.filter(a => idsInscritos.includes(a.id));
    this.alumnosDisponibles = this.alumnosDisponibles.filter(a => !idsInscritos.includes(a.id));
  }

  inscribirAlumno(alumnoId: string): void {
    if (!this.materiaSeleccionada) return;
    
    const inscripcion: AlumnoMateria = {
      id: Date.now().toString(),
      alumnoId,
      materiaId: this.materiaSeleccionada.id,
      fechaInscripcion: new Date().toISOString()
    };
    
    this.materiaService.inscribirAlumno(inscripcion);
    this.cargarAlumnosInscripcion();
  }

  desinscribirAlumno(alumnoId: string): void {
    if (!this.materiaSeleccionada) return;
    
    this.materiaService.desinscribirAlumno(alumnoId, this.materiaSeleccionada.id);
    this.cargarAlumnosInscripcion();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.materiaSeleccionada = null;
    this.modoEdicion = false;
    this.mostrarInscripciones = false;
    this.correlatividadesSeleccionadas = [];
    this.materiaForm.reset();
  }


  getCursosUnicos(): string[] {
    const cursos = this.materias.map(m => m.curso).filter((c, i, arr) => arr.indexOf(c) === i);
    return cursos.sort();
  }

  getCantidadInscritos(materiaId: string): number {
    return this.materiaService.getInscripcionesByMateria(materiaId).length;
  }
}

