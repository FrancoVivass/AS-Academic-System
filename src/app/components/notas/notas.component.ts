import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { CarreraService } from '../../services/carrera.service';
import { CursoService } from '../../services/curso.service';
import { DocenteService } from '../../services/docente.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Nota } from '../../models/alumno.model';
import { Carrera } from '../../models/carrera.model';
import { Curso } from '../../models/curso.model';
import { Materia } from '../../models/materia.model';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    DatePipe
  ],
  templateUrl: './notas.component.html',
  styleUrl: './notas.component.css'
})
export class NotasComponent implements OnInit {
  notas: Nota[] = [];
  notasFiltradas: Nota[] = [];
  notaSeleccionada: Nota | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  filtroCarrera: string = '';
  filtroMateria: string = '';
  filtroAlumno: string = '';
  notaForm: FormGroup;
  displayedColumns: string[] = ['alumno', 'materia', 'calificacion', 'tipo', 'fecha', 'acciones'];
  
  carreras: Carrera[] = [];
  materiasDisponibles: any[] = [];
  alumnosDisponibles: any[] = [];
  cursos: Curso[] = [];

  constructor(
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private carreraService: CarreraService,
    private cursoService: CursoService,
    private docenteService: DocenteService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.notaForm = this.fb.group({
      carreraId: ['', Validators.required],
      materiaId: ['', Validators.required],
      alumnoId: ['', Validators.required],
      calificacion: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      tipo: ['parcial', Validators.required],
      fecha: ['', Validators.required],
      observaciones: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCarreras();
    await this.loadNotas();
    await this.actualizarCacheNombres();
    
    // Si es profesor, asegurar que se carguen las carreras correctamente
    if (this.permissionsService.esProfesor()) {
      // Forzar recarga después de un pequeño delay para asegurar que los servicios estén listos
      setTimeout(() => {
        if (this.carreras.length === 0) {
          this.loadCarreras();
        }
      }, 100);
    }
  }

  async loadCarreras(): Promise<void> {
    if (this.permissionsService.esAdmin() || this.permissionsService.esSecretario()) {
      this.carreras = await this.carreraService.getCarreras();
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: solo carreras donde tiene materias
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
        const materiasProfesor = todasLasMaterias.filter(m => {
          // Por materiasAsignadas si existe
          if (materiasAsignadas.length > 0) {
            return materiasAsignadas.includes(m.id);
          }
          // Fallback: por nombre del profesor
          return m.profesor === nombreProfesor || 
                 m.profesor?.includes(usuario.nombre) ||
                 m.profesor?.includes(usuario.apellido);
        });
        
        // Obtener carreras únicas de las materias del profesor
        const carrerasIds = new Set<string>();
        materiasProfesor.forEach(m => {
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
        
        // Si hay carreras, seleccionar la primera por defecto en los filtros
        if (this.carreras.length > 0 && !this.filtroCarrera) {
          this.filtroCarrera = this.carreras[0].id;
          await this.onCarreraChange();
        }
      }
    }
  }

  async onCarreraChange(): Promise<void> {
    this.filtroMateria = '';
    this.filtroAlumno = '';
    this.notaForm.patchValue({ materiaId: '', alumnoId: '' });
    await this.loadMateriasPorCarrera();
    await this.loadAlumnosPorCarrera();
    await this.aplicarFiltros();
  }

  async loadMateriasPorCarrera(): Promise<void> {
    // Usar carreraId del formulario si está disponible, sino usar filtroCarrera
    const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
    
    if (!carreraId) {
      this.materiasDisponibles = [];
      return;
    }

    let todasLasMaterias = await this.materiaService.getMaterias();
    
    // Si es profesor, primero obtener sus materias
    let materiasProfesor: Materia[] = [];
    if (this.permissionsService.esProfesor()) {
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
        const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
        
        if (materiasAsignadas.length > 0) {
          // Filtrar por materiasAsignadas
          materiasProfesor = todasLasMaterias.filter(m => materiasAsignadas.includes(m.id));
        } else {
          // Fallback: buscar por nombre del profesor
          materiasProfesor = todasLasMaterias.filter(m => 
            m.profesor === nombreProfesor || 
            m.profesor?.includes(usuario.nombre) ||
            m.profesor?.includes(usuario.apellido)
          );
        }
      }
    } else {
      // Si no es profesor, usar todas las materias
      materiasProfesor = todasLasMaterias;
    }
    
    // Ahora filtrar por carrera: materias que tienen el carreraId O que están en cursos de esa carrera
    const todosLosCursos = await this.cursoService.getCursos();
    const cursosDeCarrera = todosLosCursos.filter(c => c.carreraId === carreraId);
    const materiasIdsEnCursos = new Set<string>();
    cursosDeCarrera.forEach(curso => {
      if (curso.materias) {
        curso.materias.forEach(materiaId => materiasIdsEnCursos.add(materiaId));
      }
    });
    
    // Filtrar materias del profesor que:
    // 1. Tienen el carreraId de la carrera seleccionada, O
    // 2. Están en algún curso de esa carrera
    this.materiasDisponibles = materiasProfesor.filter(m => {
      // Si la materia tiene carreraId y coincide
      if (m.carreraId === carreraId) {
        return true;
      }
      // Si la materia está en algún curso de esa carrera
      if (materiasIdsEnCursos.has(m.id)) {
        return true;
      }
      return false;
    });
  }

  onMateriaChange(): void {
    this.filtroAlumno = '';
    this.notaForm.patchValue({ alumnoId: '' });
    this.loadAlumnosPorMateria();
    this.aplicarFiltros();
  }

  async loadAlumnosPorCarrera(): Promise<void> {
    // Usar carreraId del formulario si está disponible, sino usar filtroCarrera
    const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
    
    if (!carreraId) {
      this.alumnosDisponibles = [];
      return;
    }

    // Obtener alumnos de la carrera
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    let alumnos = todosLosAlumnos.filter(a => 
      a.carreraId === carreraId
    );
    
    this.alumnosDisponibles = alumnos;
  }

  async loadAlumnosPorMateria(): Promise<void> {
    // Usar materiaId del formulario si está disponible, sino usar filtroMateria
    const materiaId = this.notaForm.get('materiaId')?.value || this.filtroMateria;
    // Usar carreraId del formulario si está disponible, sino usar filtroCarrera
    const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
    
    if (!materiaId || !carreraId) {
      this.alumnosDisponibles = [];
      return;
    }

    // Obtener cursos de la carrera que tienen esta materia
    this.cursos = await this.cursoService.getCursosByCarrera(carreraId);
    let cursosConMateria = this.cursos.filter(c => c.materias.includes(materiaId));
    
    // Si es profesor, asegurar que solo se muestren cursos donde tiene materias asignadas
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
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
        const materiasProfesor = todasLasMaterias.filter(m => {
          if (materiasAsignadas.length > 0) {
            return materiasAsignadas.includes(m.id);
          }
          return m.profesor === nombreProfesor || 
                 m.profesor?.includes(usuario.nombre) ||
                 m.profesor?.includes(usuario.apellido);
        });

        const materiasIdsProfesor = new Set(materiasProfesor.map(m => m.id));
        
        // Filtrar cursos donde el profesor tiene materias Y la materia seleccionada
        cursosConMateria = cursosConMateria.filter(c => 
          c.materias.some(mId => materiasIdsProfesor.has(mId)) &&
          c.materias.includes(materiaId)
        );
      }
    }
    
    // Obtener IDs de cursos que tienen esta materia
    const idsCursosConMateria = cursosConMateria.map(c => c.id);
    
    // Obtener IDs de alumnos de esos cursos (desde c.alumnos)
    const idsAlumnosCursos = [...new Set(cursosConMateria.flatMap(c => c.alumnos || []))];
    
    // Filtrar alumnos que pertenecen a la carrera y están en los cursos
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    let alumnos = todosLosAlumnos.filter(a => {
      // Verificar si pertenece a la carrera
      if (a.carreraId !== carreraId) {
        return false;
      }
      
      // Verificar si está en los cursos usando c.alumnos
      const estaEnCurso = idsAlumnosCursos.includes(a.id);
      
      // Verificar si tiene cursoId o cursoIds que coinciden
      const tieneCursoId = a.cursoId && idsCursosConMateria.includes(a.cursoId);
      const tieneCursoIds = a.cursoIds && a.cursoIds.some(cId => idsCursosConMateria.includes(cId));
      
      return estaEnCurso || tieneCursoId || tieneCursoIds;
    });
    
    // Si no hay alumnos en cursos, mostrar todos los de la carrera (solo si no es profesor)
    if (alumnos.length === 0 && !this.permissionsService.esProfesor()) {
      alumnos = todosLosAlumnos.filter(a => 
        a.carreraId === carreraId
      );
    }
    
    this.alumnosDisponibles = alumnos;
  }

  async loadNotas(): Promise<void> {
    try {
      let todasLasNotas = await this.alumnoService.getNotas();
      
      // Si es alumno, solo ver sus propias notas
      if (this.permissionsService.esAlumno()) {
        const usuarioId = this.authService.getCurrentUser()?.id;
        todasLasNotas = todasLasNotas.filter(n => n.alumnoId === usuarioId);
      }
      // Si es profesor, solo ver notas de sus materias y alumnos de sus carreras
      else if (this.permissionsService.esProfesor()) {
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
          const materiasProfesor = todasLasMaterias.filter(m => {
            // Por materiasAsignadas si existe
            if (materiasAsignadas.length > 0) {
              return materiasAsignadas.includes(m.id);
            }
            // Fallback: por nombre del profesor
            return m.profesor === nombreProfesor || 
                   m.profesor?.includes(usuario.nombre) ||
                   m.profesor?.includes(usuario.apellido);
          });
          
          // Obtener carreras del profesor (de materias y de cursos)
          const carrerasIds = new Set<string>();
          materiasProfesor.forEach(m => {
            if (m.carreraId) {
              carrerasIds.add(m.carreraId);
            }
          });
          
          // También buscar en cursos que tienen estas materias
          const todosLosCursos = await this.cursoService.getCursos();
          todosLosCursos.forEach(curso => {
            if (curso.materias.some(mId => materiasProfesor.some(m => m.id === mId))) {
              if (curso.carreraId) {
                carrerasIds.add(curso.carreraId);
              }
            }
          });
          
          // Obtener IDs de materias del profesor
          const materiasIdsProfesor = new Set<string>(materiasProfesor.map(m => m.id));
          
          // Filtrar notas: solo de materias del profesor
          // Simplificar: si la nota es de una materia del profesor, mostrarla
          // No filtrar por carrera del alumno, ya que el profesor puede tener alumnos de diferentes carreras
          todasLasNotas = todasLasNotas.filter(nota => {
            return materiasIdsProfesor.has(nota.materiaId);
          });
          
          console.log(`Notas filtradas para profesor: ${todasLasNotas.length} de ${todasLasNotas.length + (await this.alumnoService.getNotas()).length - todasLasNotas.length} totales`);
          console.log('Materias del profesor:', materiasProfesor.map(m => m.nombre));
        }
      }
      
      this.notas = todasLasNotas;
      await this.aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar notas:', error);
      this.notificationService.showError('Error al cargar las notas');
    }
  }

  async aplicarFiltros(): Promise<void> {
    let filtradas = [...this.notas];

    if (this.filtroCarrera) {
      // Filtrar por carrera: solo notas de alumnos de esa carrera
      const todosLosAlumnos = await this.alumnoService.getAlumnos();
      const alumnosCarrera = todosLosAlumnos
        .filter(a => a.carreraId === this.filtroCarrera)
        .map(a => a.id);
      filtradas = filtradas.filter(n => alumnosCarrera.includes(n.alumnoId));
    }

    if (this.filtroMateria) {
      filtradas = filtradas.filter(n => n.materiaId === this.filtroMateria);
    }

    if (this.filtroAlumno) {
      filtradas = filtradas.filter(n => n.alumnoId === this.filtroAlumno);
    }

    this.notasFiltradas = filtradas;
  }

  abrirModalNuevo(): void {
    if (!this.permissionsService.puedeVer('editarNotas')) {
      this.notificationService.showError('No tiene permisos para cargar notas');
      return;
    }
    
    // Recargar carreras si es profesor (siempre recargar para asegurar datos actualizados)
    if (this.permissionsService.esProfesor()) {
      this.loadCarreras();
    }
    
    this.modoEdicion = false;
    this.notaSeleccionada = null;
    
    // Limpiar arrays de materias y alumnos disponibles
    this.materiasDisponibles = [];
    this.alumnosDisponibles = [];
    
    this.notaForm.reset();
    
    // Determinar carrera inicial
    let carreraInicial = this.filtroCarrera || '';
    if (!carreraInicial && this.permissionsService.esProfesor() && this.carreras.length > 0) {
      carreraInicial = this.carreras[0].id;
      this.filtroCarrera = carreraInicial;
    }
    
    this.notaForm.patchValue({ 
      fecha: new Date().toISOString().split('T')[0],
      carreraId: carreraInicial,
      materiaId: this.filtroMateria || '',
      alumnoId: ''
    });
    
    // Cargar datos según la carrera seleccionada (usar setTimeout para asegurar que el form se actualizó)
    setTimeout(() => {
      if (carreraInicial) {
        this.loadMateriasPorCarrera();
        if (this.filtroMateria) {
          this.loadAlumnosPorMateria();
        } else {
          this.loadAlumnosPorCarrera();
        }
      } else if (this.permissionsService.esProfesor() && this.carreras.length > 0) {
        // Si no hay carrera inicial pero hay carreras disponibles, seleccionar la primera
        const primeraCarrera = this.carreras[0].id;
        this.filtroCarrera = primeraCarrera;
        this.notaForm.patchValue({ carreraId: primeraCarrera });
        this.loadMateriasPorCarrera();
        this.loadAlumnosPorCarrera();
      }
    }, 100);
    
    this.mostrarModal = true;
  }

  async abrirModalEditar(nota: Nota): Promise<void> {
    if (!this.permissionsService.puedeVer('editarNotas')) {
      this.notificationService.showError('No tiene permisos para editar notas');
      return;
    }
    this.modoEdicion = true;
    this.notaSeleccionada = nota;
    
    // Obtener carrera del alumno
    const alumno = await this.alumnoService.getAlumnoById(nota.alumnoId);
    const carreraId = alumno?.carreraId || '';
    
    this.notaForm.patchValue({
      ...nota,
      carreraId: carreraId
    });
    
    // Cargar datos relacionados
    if (carreraId) {
      this.filtroCarrera = carreraId;
      await this.loadMateriasPorCarrera();
      await this.loadAlumnosPorMateria();
    }
    
    this.mostrarModal = true;
  }

  async onCarreraChangeModal(): Promise<void> {
    const carreraId = this.notaForm.get('carreraId')?.value;
    if (carreraId) {
      this.filtroCarrera = carreraId;
      // Limpiar materia y alumno
      this.notaForm.patchValue({ materiaId: '', alumnoId: '' });
      // Cargar materias del profesor para esta carrera
      await this.loadMateriasPorCarrera();
      // Cargar alumnos de la carrera
      await this.loadAlumnosPorCarrera();
    } else {
      this.materiasDisponibles = [];
      this.alumnosDisponibles = [];
    }
  }

  async onMateriaChangeModal(): Promise<void> {
    const materiaId = this.notaForm.get('materiaId')?.value;
    if (materiaId) {
      this.filtroMateria = materiaId;
      // Limpiar alumno seleccionado
      this.notaForm.patchValue({ alumnoId: '' });
      // Cargar alumnos de la materia (filtrados por carrera y materia)
      await this.loadAlumnosPorMateria();
    } else {
      // Si no hay materia, cargar todos los alumnos de la carrera
      const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
      if (carreraId) {
        await this.loadAlumnosPorCarrera();
      } else {
        this.alumnosDisponibles = [];
      }
    }
  }

  async guardarNota(): Promise<void> {
    if (this.notaForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.notaForm.value;
    const materiaId = formValue.materiaId;
    const carreraId = formValue.carreraId;
    
    // Validar que el alumno pertenezca a la carrera seleccionada
    const alumno = await this.alumnoService.getAlumnoById(formValue.alumnoId);
    if (alumno && carreraId && alumno.carreraId !== carreraId) {
      this.notificationService.showError('El alumno seleccionado no pertenece a la carrera seleccionada');
      return;
    }
    
    // Validar que solo el profesor asignado a la materia pueda cargar notas
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const docente = await this.docenteService.getDocenteById(usuario.id);
        const materiasAsignadas = docente?.materiasAsignadas || [];
        const materia = await this.materiaService.getMateriaById(materiaId);
        
        if (materiasAsignadas.length > 0 && !materiasAsignadas.includes(materiaId)) {
          this.notificationService.showError('No tiene permisos para cargar notas en esta materia. Solo puede cargar notas en sus materias asignadas.');
          return;
        } else if (materia) {
          const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
          if (materia.profesor !== nombreProfesor && !materia.profesor?.includes(usuario.nombre)) {
            this.notificationService.showError('No tiene permisos para cargar notas en esta materia. Solo puede cargar notas en sus materias asignadas.');
            return;
          }
        }
      }
    }

    if (this.modoEdicion && this.notaSeleccionada) {
      // Validar que el profesor solo pueda editar sus propias notas
      if (this.permissionsService.esProfesor()) {
        const usuario = this.authService.getCurrentUser();
        if (usuario) {
          const docente = await this.docenteService.getDocenteById(usuario.id);
          const materiasAsignadas = docente?.materiasAsignadas || [];
          const materia = await this.materiaService.getMateriaById(this.notaSeleccionada.materiaId);
          
          if (materiasAsignadas.length > 0 && !materiasAsignadas.includes(this.notaSeleccionada.materiaId)) {
            this.notificationService.showError('No tiene permisos para editar esta nota');
            return;
          } else if (materia) {
            const nombreProfesor = `${usuario.nombre} ${usuario.apellido}`;
            if (materia.profesor !== nombreProfesor && !materia.profesor?.includes(usuario.nombre)) {
              this.notificationService.showError('No tiene permisos para editar esta nota');
              return;
            }
          }
        }
      }
      
      // Remover carreraId antes de guardar (no es parte del modelo Nota)
      const { carreraId, ...notaData } = formValue;
      
      const notaActualizada: Nota = {
        ...this.notaSeleccionada,
        ...notaData
      };
      await this.alumnoService.updateNota(notaActualizada);
      this.notificationService.showSuccess('Nota actualizada correctamente');
    } else {
      // Remover carreraId antes de guardar (no es parte del modelo Nota)
      const { carreraId, ...notaData } = formValue;
      
      const nuevaNota: Nota = {
        id: crypto.randomUUID(),
        ...notaData,
        estado: 'cargada'
      };
      await this.alumnoService.addNota(nuevaNota);
      this.notificationService.showSuccess('Nota registrada correctamente');
    }

    // Guardar valores del formulario antes de cerrar el modal
    const materiaIdGuardada = formValue.materiaId;
    const alumnoIdGuardada = formValue.alumnoId;
    const carreraIdGuardada = formValue.carreraId;
    
    // Cerrar modal primero
    this.cerrarModal();
    
    // Esperar un momento para que Supabase procese la inserción
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Recargar notas (esto actualizará la lista)
    await this.loadNotas();
    
    // Actualizar cache de nombres para mostrar correctamente en la tabla
    await this.actualizarCacheNombres();
    
    // Ajustar filtros para mostrar la nota recién guardada
    // Si hay filtros activos que no coinciden con la nota guardada, ajustarlos
    if (this.filtroCarrera && this.filtroCarrera !== carreraIdGuardada) {
      // Si el filtro de carrera no coincide, ajustarlo para mostrar la nota
      this.filtroCarrera = carreraIdGuardada || '';
      await this.onCarreraChange();
    }
    
    if (this.filtroMateria && this.filtroMateria !== materiaIdGuardada) {
      // Si el filtro de materia no coincide, ajustarlo
      this.filtroMateria = materiaIdGuardada || '';
      await this.onMateriaChange();
    }
    
    if (this.filtroAlumno && this.filtroAlumno !== alumnoIdGuardada) {
      // Si el filtro de alumno no coincide, ajustarlo
      this.filtroAlumno = alumnoIdGuardada || '';
    }
    
    // Aplicar filtros actualizados
    await this.aplicarFiltros();
    
    // Verificar que la nota aparezca en la tabla
    const notaEncontrada = this.notasFiltradas.find(n => 
      n.materiaId === materiaIdGuardada && 
      n.alumnoId === alumnoIdGuardada
    );
    
    if (!notaEncontrada && (this.filtroCarrera || this.filtroMateria || this.filtroAlumno)) {
      // Si la nota no aparece y hay filtros, limpiarlos para mostrarla
      console.log('Nota no encontrada con filtros activos, limpiando filtros...');
      this.filtroCarrera = '';
      this.filtroMateria = '';
      this.filtroAlumno = '';
      await this.aplicarFiltros();
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.notaSeleccionada = null;
    this.modoEdicion = false;
  }

  async eliminarNota(id: string): Promise<void> {
    if (!this.permissionsService.puedeVer('editarNotas')) {
      this.notificationService.showError('No tiene permisos para eliminar notas');
      return;
    }
    if (confirm('¿Está seguro de eliminar esta nota?')) {
      await this.alumnoService.deleteNota(id);
      await this.loadNotas();
      this.notificationService.showSuccess('Nota eliminada correctamente');
    }
  }

  // Cache para nombres (se actualiza cuando se cargan los datos)
  private nombresAlumnos: Map<string, string> = new Map();
  private nombresMaterias: Map<string, string> = new Map();

  async actualizarCacheNombres(): Promise<void> {
    // Actualizar cache de nombres de alumnos
    const todosLosAlumnos = await this.alumnoService.getAlumnos();
    todosLosAlumnos.forEach(alumno => {
      this.nombresAlumnos.set(alumno.id, `${alumno.nombre} ${alumno.apellido}`);
    });

    // Actualizar cache de nombres de materias
    const todasLasMaterias = await this.materiaService.getMaterias();
    todasLasMaterias.forEach(materia => {
      this.nombresMaterias.set(materia.id, materia.nombre);
    });
  }

  getNombreAlumno(alumnoId: string): string {
    return this.nombresAlumnos.get(alumnoId) || 'Desconocido';
  }

  getNombreMateria(materiaId: string): string {
    return this.nombresMaterias.get(materiaId) || 'Desconocida';
  }

  getMaterias(): Materia[] {
    return this.materiasDisponibles;
  }

  getAlumnos() {
    return this.alumnosDisponibles;
  }
}

