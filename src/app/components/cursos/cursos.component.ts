import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { CursoService } from '../../services/curso.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { DocenteService } from '../../services/docente.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { Curso } from '../../models/curso.model';
import { Docente } from '../../models/usuario.model';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTableModule
  ],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css'
})
export class CursosComponent implements OnInit {
  cursos: Curso[] = [];
  cursoSeleccionado: Curso | null = null;
  modoEdicion: boolean = false;
  modalAbierto: boolean = false;
  busqueda: string = '';
  cursoForm: FormGroup;
  docentes: Docente[] = [];
  mostrarAsignarProfesor: boolean = false;
  mostrarInscripciones: boolean = false;
  mostrarListaEspera: boolean = false;
  cursoParaAccion: Curso | null = null;

  constructor(
    private cursoService: CursoService,
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private docenteService: DocenteService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.cursoForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      año: [1, [Validators.required, Validators.min(1)]],
      division: ['', Validators.required],
      turno: ['mañana', Validators.required],
      capacidad: [30, [Validators.required, Validators.min(1)]],
      tutorId: ['']
    });
  }

  ngOnInit(): void {
    // Redirigir a la gestión desde carreras
    this.notificationService.showInfo('La gestión de cursos se realiza desde la sección de Carreras. Seleccione una carrera y luego "Ver Cursos"');
    // Opcional: redirigir automáticamente
    // this.router.navigate(['/app/carreras']);
  }

  loadDocentes(): void {
    this.docentes = this.docenteService.getDocentes();
  }

  loadCursos(): void {
    this.cursos = this.cursoService.getCursos();
  }

  abrirModalNuevo(): void {
    this.modalAbierto = true;
    this.modoEdicion = false;
    this.cursoSeleccionado = null;
    this.cursoForm.reset();
  }

  abrirModalEditar(curso: Curso): void {
    this.modalAbierto = true;
    this.modoEdicion = true;
    this.cursoSeleccionado = curso;
    this.cursoForm.patchValue(curso);
  }

  guardarCurso(): void {
    if (this.cursoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.modoEdicion && this.cursoSeleccionado) {
      const cursoActualizado: Curso = {
        ...this.cursoSeleccionado,
        ...this.cursoForm.value
      };
      this.cursoService.updateCurso(cursoActualizado);
      this.notificationService.showSuccess('Curso actualizado correctamente');
    } else {
      const nuevoCurso: Curso = {
        id: Date.now().toString(),
        ...this.cursoForm.value,
        horarios: [],
        materias: [],
        alumnos: [],
        estado: 'activo',
        cupoMaximo: this.cursoForm.value.capacidad,
        cupoActual: 0,
        listaEspera: [],
        modalidad: 'presencial',
        configuracion: {
          permiteAutoinscripcion: false,
          permiteEdicionHorariosProfesor: false,
          requiereAprobacionInscripcion: true,
          activaListaEspera: true
        }
      };
      this.cursoService.addCurso(nuevoCurso);
      this.notificationService.showSuccess('Curso creado correctamente');
    }

    this.loadCursos();
    this.cerrarModal();
  }

  eliminarCurso(id: string): void {
    if (confirm('¿Está seguro de eliminar este curso?')) {
      this.cursoService.deleteCurso(id);
      this.loadCursos();
      this.notificationService.showSuccess('Curso eliminado correctamente');
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.cursoSeleccionado = null;
    this.modoEdicion = false;
    this.cursoForm.reset();
  }

  getCantidadAlumnos(curso: Curso): number {
    return curso.alumnos.length;
  }

  getCantidadMaterias(curso: Curso): number {
    return curso.materias.length;
  }

  asignarProfesor(curso: Curso): void {
    this.cursoParaAccion = curso;
    this.mostrarAsignarProfesor = true;
  }

  gestionarInscripciones(curso: Curso): void {
    this.cursoParaAccion = curso;
    this.mostrarInscripciones = true;
  }

  gestionarListaEspera(curso: Curso): void {
    this.cursoParaAccion = curso;
    this.mostrarListaEspera = true;
  }

  asignarProfesorACurso(profesorId: string): void {
    // Esta funcionalidad ya no es necesaria - los profesores se asignan a las materias, no a los cursos
    this.notificationService.showInfo('Los profesores se asignan a las materias, no a los cursos. Por favor, asigne profesores desde la sección de Materias.');
    this.cerrarModales();
  }

  cerrarModales(): void {
    this.mostrarAsignarProfesor = false;
    this.mostrarInscripciones = false;
    this.mostrarListaEspera = false;
    this.cursoParaAccion = null;
  }
}

