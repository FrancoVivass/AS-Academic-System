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
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Nota } from '../../models/alumno.model';

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
  filtroMateria: string = '';
  filtroAlumno: string = '';
  notaForm: FormGroup;
  displayedColumns: string[] = ['alumno', 'materia', 'calificacion', 'tipo', 'fecha', 'acciones'];

  constructor(
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.notaForm = this.fb.group({
      alumnoId: ['', Validators.required],
      materiaId: ['', Validators.required],
      calificacion: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      tipo: ['parcial', Validators.required],
      fecha: ['', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadNotas();
  }

  loadNotas(): void {
    let todasLasNotas = this.alumnoService.getNotas();
    
    // Si es alumno, solo ver sus propias notas
    if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      todasLasNotas = todasLasNotas.filter(n => n.alumnoId === usuarioId);
    }
    // Si es profesor, solo ver notas de sus materias
    else if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      todasLasNotas = todasLasNotas.filter(n => materiasAsignadas.includes(n.materiaId));
    }
    
    this.notas = todasLasNotas;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = [...this.notas];

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
    this.modoEdicion = false;
    this.notaSeleccionada = null;
    this.notaForm.reset();
    this.notaForm.patchValue({ fecha: new Date().toISOString().split('T')[0] });
    this.mostrarModal = true;
  }

  abrirModalEditar(nota: Nota): void {
    if (!this.permissionsService.puedeVer('editarNotas')) {
      this.notificationService.showError('No tiene permisos para editar notas');
      return;
    }
    this.modoEdicion = true;
    this.notaSeleccionada = nota;
    this.notaForm.patchValue(nota);
    this.mostrarModal = true;
  }

  guardarNota(): void {
    if (this.notaForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.modoEdicion && this.notaSeleccionada) {
      const notaActualizada: Nota = {
        ...this.notaSeleccionada,
        ...this.notaForm.value
      };
      this.alumnoService.updateNota(notaActualizada);
      this.notificationService.showSuccess('Nota actualizada correctamente');
    } else {
      const nuevaNota: Nota = {
        id: Date.now().toString(),
        ...this.notaForm.value
      };
      this.alumnoService.addNota(nuevaNota);
      this.notificationService.showSuccess('Nota registrada correctamente');
    }

    this.loadNotas();
    this.cerrarModal();
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

