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
import { CursoService } from '../../services/curso.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { NotificationService } from '../../services/notification.service';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-cursos',
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

  constructor(
    private cursoService: CursoService,
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
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
    this.loadCursos();
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
        estado: 'activo'
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
}

