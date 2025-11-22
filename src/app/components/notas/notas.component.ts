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

  ngOnInit(): void {
    this.loadCarreras();
    this.loadNotas();
    
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

  loadCarreras(): void {
    if (this.permissionsService.esAdmin() || this.permissionsService.esSecretario()) {
      this.carreras = this.carreraService.getCarreras();
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: solo carreras donde tiene materias
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        // Intentar obtener docente por ID
        let docente = this.docenteService.getDocenteById(usuario.id);
        
        // Si no se encuentra por ID, buscar por nombre
        if (!docente) {
          const todosLosDocentes = this.docenteService.getDocentes();
          docente = todosLosDocentes.find(d => 
            d.nombre === usuario.nombre && d.apellido === usuario.apellido
          );
        }
        
        const materiasAsignadas = docente?.materiasAsignadas || [];
        const todasLasMaterias = this.materiaService.getMaterias();
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
        const todasLasCarreras = this.carreraService.getCarreras();
        const cursos = this.cursoService.getCursos();
        
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
          this.onCarreraChange();
        }
      }
    }
  }

  onCarreraChange(): void {
    this.filtroMateria = '';
    this.filtroAlumno = '';
    this.notaForm.patchValue({ materiaId: '', alumnoId: '' });
    this.loadMateriasPorCarrera();
    this.loadAlumnosPorCarrera();
    this.aplicarFiltros();
  }

  loadMateriasPorCarrera(): void {
    // Usar carreraId del formulario si está disponible, sino usar filtroCarrera
    const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
    
    if (!carreraId) {
      this.materiasDisponibles = [];
      return;
    }

    let todasLasMaterias = this.materiaService.getMaterias();
    
    // Si es profesor, primero obtener sus materias
    let materiasProfesor: Materia[] = [];
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        // Intentar obtener docente por ID
        let docente = this.docenteService.getDocenteById(usuario.id);
        
        // Si no se encuentra por ID, buscar por nombre
        if (!docente) {
          const todosLosDocentes = this.docenteService.getDocentes();
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
    const cursosDeCarrera = this.cursoService.getCursos().filter(c => c.carreraId === carreraId);
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

  loadAlumnosPorCarrera(): void {
    // Usar carreraId del formulario si está disponible, sino usar filtroCarrera
    const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
    
    if (!carreraId) {
      this.alumnosDisponibles = [];
      return;
    }

    // Obtener alumnos de la carrera
    let alumnos = this.alumnoService.getAlumnos().filter(a => 
      a.carreraId === carreraId
    );
    
    this.alumnosDisponibles = alumnos;
  }

  loadAlumnosPorMateria(): void {
    // Usar materiaId del formulario si está disponible, sino usar filtroMateria
    const materiaId = this.notaForm.get('materiaId')?.value || this.filtroMateria;
    // Usar carreraId del formulario si está disponible, sino usar filtroCarrera
    const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
    
    if (!materiaId || !carreraId) {
      this.alumnosDisponibles = [];
      return;
    }

    // Obtener cursos de la carrera que tienen esta materia
    this.cursos = this.cursoService.getCursosByCarrera(carreraId);
    const cursosConMateria = this.cursos.filter(c => c.materias.includes(materiaId));
    
    // Obtener IDs de alumnos de esos cursos
    const idsAlumnos = [...new Set(cursosConMateria.flatMap(c => c.alumnos || []))];
    
    // Filtrar alumnos que pertenecen a la carrera y están en los cursos
    let alumnos = this.alumnoService.getAlumnos().filter(a => 
      a.carreraId === carreraId && idsAlumnos.includes(a.id)
    );
    
    // Si no hay alumnos en cursos, mostrar todos los de la carrera
    if (alumnos.length === 0) {
      alumnos = this.alumnoService.getAlumnos().filter(a => 
        a.carreraId === carreraId
      );
    }
    
    this.alumnosDisponibles = alumnos;
  }

  loadNotas(): void {
    let todasLasNotas = this.alumnoService.getNotas();
    
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
        let docente = this.docenteService.getDocenteById(usuario.id);
        
        // Si no se encuentra por ID, buscar por nombre
        if (!docente) {
          const todosLosDocentes = this.docenteService.getDocentes();
          docente = todosLosDocentes.find(d => 
            d.nombre === usuario.nombre && d.apellido === usuario.apellido
          );
        }
        
        const materiasAsignadas = docente?.materiasAsignadas || [];
        const todasLasMaterias = this.materiaService.getMaterias();
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
        const todosLosCursos = this.cursoService.getCursos();
        todosLosCursos.forEach(curso => {
          if (curso.materias.some(mId => materiasProfesor.some(m => m.id === mId))) {
            if (curso.carreraId) {
              carrerasIds.add(curso.carreraId);
            }
          }
        });
        
        // Obtener IDs de materias del profesor
        const materiasIdsProfesor = new Set<string>(materiasProfesor.map(m => m.id));
        
        // Filtrar notas: solo de materias del profesor y alumnos de sus carreras
        todasLasNotas = todasLasNotas.filter(n => {
          // Verificar que la nota sea de una materia del profesor
          if (!materiasIdsProfesor.has(n.materiaId)) {
            return false;
          }
          
          const alumno = this.alumnoService.getAlumnoById(n.alumnoId);
          if (!alumno) return false;
          
          // Verificar que el alumno pertenezca a una carrera del profesor
          // Si el alumno no tiene carreraId, también mostrarlo (puede ser que aún no esté asignado)
          if (!alumno.carreraId) {
            return true; // Mostrar notas de alumnos sin carrera asignada
          }
          
          return carrerasIds.has(alumno.carreraId);
        });
      }
    }
    
    this.notas = todasLasNotas;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = [...this.notas];

    if (this.filtroCarrera) {
      // Filtrar por carrera: solo notas de alumnos de esa carrera
      const alumnosCarrera = this.alumnoService.getAlumnos()
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

  abrirModalEditar(nota: Nota): void {
    if (!this.permissionsService.puedeVer('editarNotas')) {
      this.notificationService.showError('No tiene permisos para editar notas');
      return;
    }
    this.modoEdicion = true;
    this.notaSeleccionada = nota;
    
    // Obtener carrera del alumno
    const alumno = this.alumnoService.getAlumnoById(nota.alumnoId);
    const carreraId = alumno?.carreraId || '';
    
    this.notaForm.patchValue({
      ...nota,
      carreraId: carreraId
    });
    
    // Cargar datos relacionados
    if (carreraId) {
      this.filtroCarrera = carreraId;
      this.loadMateriasPorCarrera();
      this.loadAlumnosPorMateria();
    }
    
    this.mostrarModal = true;
  }

  onCarreraChangeModal(): void {
    const carreraId = this.notaForm.get('carreraId')?.value;
    if (carreraId) {
      this.filtroCarrera = carreraId;
      // Limpiar materia y alumno
      this.notaForm.patchValue({ materiaId: '', alumnoId: '' });
      // Cargar materias del profesor para esta carrera
      this.loadMateriasPorCarrera();
      // Cargar alumnos de la carrera
      this.loadAlumnosPorCarrera();
    } else {
      this.materiasDisponibles = [];
      this.alumnosDisponibles = [];
    }
  }

  onMateriaChangeModal(): void {
    const materiaId = this.notaForm.get('materiaId')?.value;
    if (materiaId) {
      this.filtroMateria = materiaId;
      // Limpiar alumno seleccionado
      this.notaForm.patchValue({ alumnoId: '' });
      // Cargar alumnos de la materia (filtrados por carrera y materia)
      this.loadAlumnosPorMateria();
    } else {
      // Si no hay materia, cargar todos los alumnos de la carrera
      const carreraId = this.notaForm.get('carreraId')?.value || this.filtroCarrera;
      if (carreraId) {
        this.loadAlumnosPorCarrera();
      } else {
        this.alumnosDisponibles = [];
      }
    }
  }

  guardarNota(): void {
    if (this.notaForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.notaForm.value;
    const materiaId = formValue.materiaId;
    const carreraId = formValue.carreraId;
    
    // Validar que el alumno pertenezca a la carrera seleccionada
    const alumno = this.alumnoService.getAlumnoById(formValue.alumnoId);
    if (alumno && carreraId && alumno.carreraId !== carreraId) {
      this.notificationService.showError('El alumno seleccionado no pertenece a la carrera seleccionada');
      return;
    }
    
    // Validar que solo el profesor asignado a la materia pueda cargar notas
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const docente = this.docenteService.getDocenteById(usuario.id);
        const materiasAsignadas = docente?.materiasAsignadas || [];
        const materia = this.materiaService.getMateriaById(materiaId);
        
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
          const docente = this.docenteService.getDocenteById(usuario.id);
          const materiasAsignadas = docente?.materiasAsignadas || [];
          const materia = this.materiaService.getMateriaById(this.notaSeleccionada.materiaId);
          
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
      this.alumnoService.updateNota(notaActualizada);
      this.notificationService.showSuccess('Nota actualizada correctamente');
    } else {
      // Remover carreraId antes de guardar (no es parte del modelo Nota)
      const { carreraId, ...notaData } = formValue;
      
      const nuevaNota: Nota = {
        id: Date.now().toString(),
        ...notaData,
        estado: 'cargada'
      };
      this.alumnoService.addNota(nuevaNota);
      this.notificationService.showSuccess('Nota registrada correctamente');
    }

    // Cerrar modal primero
    this.cerrarModal();
    
    // Recargar notas (esto actualizará la lista)
    this.loadNotas();
    
    // Recargar alumnos y materias si hay filtros activos (para los dropdowns)
    if (this.filtroCarrera) {
      this.onCarreraChange();
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.notaSeleccionada = null;
    this.modoEdicion = false;
  }

  eliminarNota(id: string): void {
    if (!this.permissionsService.puedeVer('editarNotas')) {
      this.notificationService.showError('No tiene permisos para eliminar notas');
      return;
    }
    if (confirm('¿Está seguro de eliminar esta nota?')) {
      this.alumnoService.deleteNota(id);
      this.loadNotas();
      this.notificationService.showSuccess('Nota eliminada correctamente');
    }
  }

  getNombreAlumno(alumnoId: string): string {
    const alumno = this.alumnoService.getAlumnoById(alumnoId);
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Desconocido';
  }

  getNombreMateria(materiaId: string): string {
    const materia = this.materiaService.getMateriaById(materiaId);
    return materia ? materia.nombre : 'Desconocida';
  }

  getMaterias() {
    let materias = this.materiaService.getMaterias();
    
    // Si es profesor, solo mostrar sus materias asignadas
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      materias = materias.filter(m => materiasAsignadas.includes(m.id));
    }
    
    return materias;
  }

  getAlumnos() {
    let alumnos = this.alumnoService.getAlumnos();
    
    // Si es profesor, solo mostrar alumnos de sus materias
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      const notasMaterias = this.notas.filter(n => materiasAsignadas.includes(n.materiaId));
      const idsAlumnos = [...new Set(notasMaterias.map(n => n.alumnoId))];
      alumnos = alumnos.filter(a => idsAlumnos.includes(a.id));
    }
    // Si es alumno, solo ver sus propios datos
    else if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      alumnos = alumnos.filter(a => a.id === usuarioId);
    }
    
    return alumnos;
  }
}

