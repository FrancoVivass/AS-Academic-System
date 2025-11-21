import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { AlumnoService } from '../../services/alumno.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Alumno } from '../../models/alumno.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatSelectModule
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
  displayedColumns: string[] = ['nombre', 'dni', 'curso', 'promedio', 'asistencia', 'acciones'];

  usuariosDisponibles: Usuario[] = [];
  mostrarUsuarios: boolean = false;

  constructor(
    private alumnoService: AlumnoService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.alumnoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      curso: ['', Validators.required],
      fechaNacimiento: [''],
      direccion: ['']
    });
  }

  ngOnInit(): void {
    this.loadAlumnos();
  }

  loadAlumnos(): void {
    this.alumnos = this.alumnoService.getAlumnos();
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.alumnos];

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(a =>
        a.nombre.toLowerCase().includes(busquedaLower) ||
        a.apellido.toLowerCase().includes(busquedaLower) ||
        a.dni.includes(busquedaLower)
      );
    }

    if (this.filtroCurso) {
      filtrados = filtrados.filter(a => a.curso === this.filtroCurso);
    }

    this.alumnosFiltrados = filtrados;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroCursoChange(): void {
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para asociar alumnos');
      return;
    }
    this.modoEdicion = false;
    this.alumnoSeleccionado = null;
    this.mostrarUsuarios = true;
    this.cargarUsuariosDisponibles();
    this.mostrarModal = true;
  }

  cargarUsuariosDisponibles(): void {
    const usuariosRegistrados = this.authService.getUsuariosByRol('alumno');
    const alumnosAsociados = this.alumnoService.getAlumnos();
    const idsAsociados = alumnosAsociados.map(a => a.id);
    
    // Filtrar usuarios que no están asociados como alumnos
    this.usuariosDisponibles = usuariosRegistrados.filter(u => !idsAsociados.includes(u.id));
  }

  asociarUsuario(usuario: Usuario): void {
    const nuevoAlumno: Alumno = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni || '',
      email: usuario.email,
      telefono: usuario.telefono || '',
      curso: '', // Se puede asignar después
      fechaNacimiento: usuario.fechaNacimiento || '',
      direccion: usuario.direccion || ''
    };
    
    this.alumnoService.addAlumno(nuevoAlumno);
    this.notificationService.showSuccess(`Alumno ${usuario.nombre} ${usuario.apellido} asociado correctamente`);
    this.loadAlumnos();
    this.mostrarUsuarios = false;
    this.cerrarModal();
  }

  abrirModalEditar(alumno: Alumno): void {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para editar alumnos');
      return;
    }
    this.modoEdicion = true;
    this.alumnoSeleccionado = alumno;
    this.mostrarUsuarios = false;
    this.alumnoForm.patchValue(alumno);
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.alumnoSeleccionado = null;
    this.modoEdicion = false;
    this.alumnoForm.reset();
  }

  guardarAlumno(): void {
    if (this.alumnoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.alumnoForm.value;
    
    if (this.modoEdicion && this.alumnoSeleccionado) {
      const alumnoActualizado: Alumno = {
        ...this.alumnoSeleccionado,
        ...formValue
      };
      this.alumnoService.updateAlumno(alumnoActualizado);
      this.notificationService.showSuccess('Alumno actualizado correctamente');
    } else {
      const nuevoAlumno: Alumno = {
        id: Date.now().toString(),
        ...formValue
      };
      this.alumnoService.addAlumno(nuevoAlumno);
      this.notificationService.showSuccess('Alumno asociado correctamente');
    }

    this.loadAlumnos();
    this.cerrarModal();
  }

  eliminarAlumno(id: string): void {
    if (!this.permissionsService.puedeVer('editarAlumnos')) {
      this.notificationService.showError('No tiene permisos para desasociar alumnos');
      return;
    }
    if (confirm('¿Está seguro de desasociar este alumno?')) {
      this.alumnoService.deleteAlumno(id);
      this.loadAlumnos();
      this.notificationService.showSuccess('Alumno desasociado correctamente');
    }
  }


  getCursosUnicos(): string[] {
    const cursos = this.alumnos.map(a => a.curso).filter((c, i, arr) => arr.indexOf(c) === i);
    return cursos.sort();
  }

  getPromedioAlumno(id: string): number {
    return this.alumnoService.getPromedioAlumno(id);
  }

  getPorcentajeAsistenciaAlumno(id: string): number {
    return this.alumnoService.getPorcentajeAsistencia(id);
  }

  getCantidadRegulares(): number {
    return this.alumnos.filter(a => {
      const promedio = this.getPromedioAlumno(a.id);
      const asistencia = this.getPorcentajeAsistenciaAlumno(a.id);
      return promedio >= 6 && asistencia >= 75;
    }).length;
  }

  getCantidadIrregulares(): number {
    return this.alumnos.length - this.getCantidadRegulares();
  }

  getPromedioGeneral(): number {
    if (this.alumnos.length === 0) return 0;
    const promedios = this.alumnos.map(a => this.getPromedioAlumno(a.id)).filter(p => p > 0);
    if (promedios.length === 0) return 0;
    return Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100;
  }
}

