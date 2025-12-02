import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { TareaService } from '../../services/tarea.service';
import { MateriaService } from '../../services/materia.service';
import { AlumnoService } from '../../services/alumno.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { Tarea, EntregaTarea } from '../../models/tarea.model';
import { Materia } from '../../models/materia.model';
import { Alumno } from '../../models/alumno.model';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.css'
})
export class TareasComponent implements OnInit {
  tareas: Tarea[] = [];
  tareasFiltradas: Tarea[] = [];
  entregas: EntregaTarea[] = [];
  materias: Materia[] = [];
  alumnos: Alumno[] = [];
  
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;
  tareaSeleccionada: Tarea | null = null;
  tareaParaEntregar: Tarea | null = null;
  
  filtroMateria: string = '';
  busqueda: string = '';
  
  tareaForm: FormGroup;
  entregaForm: FormGroup;

  constructor(
    private tareaService: TareaService,
    private materiaService: MateriaService,
    private alumnoService: AlumnoService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      materiaId: ['', Validators.required],
      fechaEntrega: ['', Validators.required],
      fechaLimite: [''],
      tipo: ['tarea', Validators.required],
      puntos: [0, [Validators.min(0)]],
      visibleParaAlumnos: [true]
    });

    this.entregaForm = this.fb.group({
      comentario: [''],
      archivos: [''], // Puede ser una URL o múltiples URLs separadas por comas
      archivosSubidos: [[]] // Para archivos reales (futuro)
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadMaterias();
    await this.loadTareas();
    await this.loadAlumnos(); // Cargar alumnos para mostrar nombres
    
    // Verificar si viene un queryParam de materia
    this.route.queryParams.subscribe(params => {
      if (params['materia']) {
        this.filtroMateria = params['materia'];
        this.aplicarFiltros();
      }
    });
  }

  async loadMaterias(): Promise<void> {
    if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      if (usuario) {
        const todasLasMaterias = await this.materiaService.getMaterias();
        // Filtrar materias del profesor
        this.materias = todasLasMaterias.filter(m => 
          m.profesor === `${usuario.nombre} ${usuario.apellido}` ||
          m.profesor?.includes(usuario.nombre)
        );
      }
    } else {
      // Para alumnos, cargar materias de sus cursos
      const usuarioId = this.authService.getCurrentUser()?.id;
      if (usuarioId) {
        const alumno = await this.alumnoService.getAlumnoById(usuarioId);
        if (alumno) {
          const todasLasMaterias = await this.materiaService.getMaterias();
          // Filtrar materias del curso del alumno
          this.materias = todasLasMaterias.filter(m => 
            m.curso === alumno.curso
          );
        }
      }
    }
  }

  async loadTareas(): Promise<void> {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    if (this.permissionsService.esProfesor()) {
      this.tareas = await this.tareaService.getTareasByProfesor(usuario.id);
    } else if (this.permissionsService.esAlumno()) {
      // Cargar tareas de las materias del alumno
      const todasLasTareas = await this.tareaService.getTareas();
      this.tareas = todasLasTareas.filter(t => 
        this.materias.some(m => m.id === t.materiaId) && 
        t.visibleParaAlumnos && 
        t.estado === 'activa'
      );
    } else {
      this.tareas = await this.tareaService.getTareas();
    }
    
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = [...this.tareas];

    if (this.filtroMateria) {
      filtradas = filtradas.filter(t => t.materiaId === this.filtroMateria);
    }

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      filtradas = filtradas.filter(t =>
        t.titulo.toLowerCase().includes(busquedaLower) ||
        t.descripcion.toLowerCase().includes(busquedaLower)
      );
    }

    this.tareasFiltradas = filtradas;
  }

  getNombreMateria(materiaId: string): string {
    const materia = this.materias.find(m => m.id === materiaId);
    return materia?.nombre || 'Materia desconocida';
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.tareaSeleccionada = null;
    this.tareaForm.reset({
      tipo: 'tarea',
      puntos: 0,
      visibleParaAlumnos: true
    });
    this.mostrarModal = true;
  }

  async guardarTarea(): Promise<void> {
    if (this.tareaForm.invalid) {
      this.notificationService.showError('Por favor, complete todos los campos requeridos');
      return;
    }

    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    const formValue = this.tareaForm.value;
    const nuevaTarea: Tarea = {
      id: crypto.randomUUID(),
      materiaId: formValue.materiaId,
      profesorId: usuario.id,
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      fechaCreacion: new Date().toISOString(),
      fechaEntrega: formValue.fechaEntrega,
      fechaLimite: formValue.fechaLimite || undefined,
      tipo: formValue.tipo,
      estado: 'activa',
      puntos: formValue.puntos || undefined,
      visibleParaAlumnos: formValue.visibleParaAlumnos !== false
    };

    try {
      if (this.modoEdicion && this.tareaSeleccionada) {
        await this.tareaService.updateTarea({ ...this.tareaSeleccionada, ...nuevaTarea });
        this.notificationService.showSuccess('Tarea actualizada correctamente');
      } else {
        await this.tareaService.addTarea(nuevaTarea);
        this.notificationService.showSuccess('Tarea creada correctamente');
      }
      await this.loadTareas();
      this.cerrarModal();
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Error al guardar la tarea');
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.tareaSeleccionada = null;
    this.tareaForm.reset();
  }

  async eliminarTarea(tareaId: string): Promise<void> {
    if (!confirm('¿Está seguro de eliminar esta tarea?')) return;

    try {
      await this.tareaService.deleteTarea(tareaId);
      this.notificationService.showSuccess('Tarea eliminada correctamente');
      await this.loadTareas();
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Error al eliminar la tarea');
    }
  }

  async abrirEntrega(tarea: Tarea): Promise<void> {
    this.tareaParaEntregar = tarea;
    this.entregaForm.reset();
  }

  async entregarTarea(): Promise<void> {
    if (!this.tareaParaEntregar) return;

    const usuario = this.authService.getCurrentUser();
    if (!usuario) return;

    const formValue = this.entregaForm.value;
    
    // Procesar archivos: puede ser una URL, múltiples URLs separadas por comas, o un array
    let archivosAdjuntos: string[] | undefined = undefined;
    if (formValue.archivos) {
      if (typeof formValue.archivos === 'string') {
        // Separar por comas y limpiar espacios
        archivosAdjuntos = formValue.archivos.split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0);
      } else if (Array.isArray(formValue.archivos)) {
        archivosAdjuntos = formValue.archivos;
      }
    }
    
    // Agregar archivos subidos si existen (futuro)
    if (formValue.archivosSubidos && Array.isArray(formValue.archivosSubidos) && formValue.archivosSubidos.length > 0) {
      if (!archivosAdjuntos) archivosAdjuntos = [];
      archivosAdjuntos = [...archivosAdjuntos, ...formValue.archivosSubidos];
    }
    
    const nuevaEntrega: EntregaTarea = {
      id: crypto.randomUUID(),
      tareaId: this.tareaParaEntregar.id,
      alumnoId: usuario.id,
      fechaEntrega: new Date().toISOString(),
      comentario: formValue.comentario || undefined,
      archivosAdjuntos: archivosAdjuntos && archivosAdjuntos.length > 0 ? archivosAdjuntos : undefined,
      estado: 'pendiente'
    };

    try {
      await this.tareaService.addEntrega(nuevaEntrega);
      this.notificationService.showSuccess('Tarea entregada correctamente');
      this.tareaParaEntregar = null;
      this.entregaForm.reset();
      await this.loadTareas(); // Recargar tareas para actualizar el estado
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Error al entregar la tarea');
    }
  }

  async verEntregas(tarea: Tarea): Promise<void> {
    this.tareaSeleccionada = tarea;
    this.entregas = await this.tareaService.getEntregasByTarea(tarea.id);
    await this.loadAlumnos(); // Cargar alumnos para mostrar nombres
  }

  async calificarEntrega(entrega: EntregaTarea, calificacion: number, observaciones?: string): Promise<void> {
    const entregaActualizada: EntregaTarea = {
      ...entrega,
      calificacion,
      observaciones,
      estado: 'calificada',
      fechaCalificacion: new Date().toISOString()
    };

    try {
      await this.tareaService.updateEntrega(entregaActualizada);
      this.notificationService.showSuccess('Entrega calificada correctamente');
      if (this.tareaSeleccionada) {
        await this.verEntregas(this.tareaSeleccionada);
      }
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Error al calificar la entrega');
    }
  }

  getNombreAlumno(alumnoId: string): string {
    const alumno = this.alumnos.find(a => a.id === alumnoId);
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Alumno desconocido';
  }

  async loadAlumnos(): Promise<void> {
    this.alumnos = await this.alumnoService.getAlumnos();
  }

  tieneEntrega(tareaId: string): boolean {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return false;
    return this.entregas.some(e => e.tareaId === tareaId && e.alumnoId === usuario.id);
  }

  getEstadoEntrega(tareaId: string): string {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) return 'no_entregada';
    const entrega = this.entregas.find(e => e.tareaId === tareaId && e.alumnoId === usuario.id);
    return entrega?.estado || 'no_entregada';
  }
}

