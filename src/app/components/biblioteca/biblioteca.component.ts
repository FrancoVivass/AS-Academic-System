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
import { MatTabsModule } from '@angular/material/tabs';
import { BibliotecaService } from '../../services/biblioteca.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { RecursoBiblioteca } from '../../models/biblioteca.model';
import { Materia } from '../../models/materia.model';

@Component({
  selector: 'app-biblioteca',
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
    MatTabsModule
  ],
  templateUrl: './biblioteca.component.html',
  styleUrl: './biblioteca.component.css'
})
export class BibliotecaComponent implements OnInit {
  recursos: RecursoBiblioteca[] = [];
  recursosFiltrados: RecursoBiblioteca[] = [];
  recursoSeleccionado: RecursoBiblioteca | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  busqueda: string = '';
  filtroMateria: string = '';
  filtroTipo: string = '';
  recursoForm: FormGroup;

  tiposRecurso = [
    { value: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
    { value: 'video', label: 'Video', icon: 'video_library' },
    { value: 'imagen', label: 'Imagen', icon: 'image' },
    { value: 'enlace', label: 'Enlace', icon: 'link' },
    { value: 'documento', label: 'Documento', icon: 'description' },
    { value: 'presentacion', label: 'Presentación', icon: 'slideshow' }
  ];

  constructor(
    private bibliotecaService: BibliotecaService,
    private materiaService: MateriaService,
    private authService: AuthService,
    public permissionsService: PermissionsService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.recursoForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      tipo: ['pdf', Validators.required],
      url: ['', Validators.required],
      materiaId: [''],
      etiquetas: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.actualizarCache();
    this.loadRecursos();
  }

  loadRecursos(): void {
    let todosLosRecursos = this.bibliotecaService.getRecursos();
    
    // Si es alumno, solo mostrar recursos de sus materias o generales
    if (this.permissionsService.esAlumno()) {
      const usuarioId = this.authService.getCurrentUser()?.id;
      if (usuarioId) {
        const inscripciones = this.materiaService.getInscripcionesByAlumno(usuarioId);
        const materiasIds = inscripciones.map(i => i.materiaId);
        todosLosRecursos = todosLosRecursos.filter(r => 
          !r.materiaId || materiasIds.includes(r.materiaId) || r.visible
        );
      }
    }
    // Si es profesor, solo mostrar recursos de sus materias
    else if (this.permissionsService.esProfesor()) {
      const usuario = this.authService.getCurrentUser();
      const materiasAsignadas = (usuario as any).materiasAsignadas || [];
      todosLosRecursos = todosLosRecursos.filter(r => 
        !r.materiaId || materiasAsignadas.includes(r.materiaId) || r.visible
      );
    }
    
    this.recursos = todosLosRecursos;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.recursos];

    if (this.busqueda) {
      filtrados = this.bibliotecaService.buscarRecursos(this.busqueda);
    }

    if (this.filtroMateria) {
      filtrados = filtrados.filter(r => r.materiaId === this.filtroMateria);
    }

    if (this.filtroTipo) {
      filtrados = filtrados.filter(r => r.tipo === this.filtroTipo);
    }

    this.recursosFiltrados = filtrados;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.recursoSeleccionado = null;
    this.mostrarModal = true;
    this.recursoForm.reset();
    this.recursoForm.patchValue({ tipo: 'pdf' });
  }

  abrirModalEditar(recurso: RecursoBiblioteca): void {
    this.modoEdicion = true;
    this.recursoSeleccionado = recurso;
    this.mostrarModal = true;
    this.recursoForm.patchValue({
      ...recurso,
      etiquetas: recurso.etiquetas.join(', ')
    });
  }

  guardarRecurso(): void {
    if (this.recursoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.recursoForm.value;
    const etiquetas = formValue.etiquetas ? formValue.etiquetas.split(',').map((e: string) => e.trim()) : [];

    if (this.modoEdicion && this.recursoSeleccionado) {
      const recursoActualizado: RecursoBiblioteca = {
        ...this.recursoSeleccionado,
        ...formValue,
        etiquetas
      };
      this.bibliotecaService.updateRecurso(recursoActualizado);
      this.notificationService.showSuccess('Recurso actualizado correctamente');
    } else {
      const nuevoRecurso: RecursoBiblioteca = {
        id: Date.now().toString(),
        ...formValue,
        etiquetas,
        autorId: this.authService.getCurrentUser()?.id || '',
        fechaSubida: new Date().toISOString(),
        descargas: 0,
        visible: true
      };
      this.bibliotecaService.addRecurso(nuevoRecurso);
      this.notificationService.showSuccess('Recurso agregado correctamente');
    }

    this.loadRecursos();
    this.cerrarModal();
  }

  eliminarRecurso(id: string): void {
    if (confirm('¿Está seguro de eliminar este recurso?')) {
      this.bibliotecaService.deleteRecurso(id);
      this.loadRecursos();
      this.notificationService.showSuccess('Recurso eliminado correctamente');
    }
  }

  descargarRecurso(recurso: RecursoBiblioteca): void {
    this.bibliotecaService.incrementarDescargas(recurso.id);
    this.notificationService.showInfo(`Descargando: ${recurso.titulo}`);
    // Simulación de descarga
  }

  cerrarModal(): void {
    this.recursoSeleccionado = null;
    this.modoEdicion = false;
    this.mostrarModal = false;
  }

  private materiasCache: Materia[] = [];
  private nombresMaterias: Map<string, string> = new Map();

  async actualizarCache(): Promise<void> {
    this.materiasCache = await this.materiaService.getMaterias();
    this.materiasCache.forEach(materia => {
      this.nombresMaterias.set(materia.id, materia.nombre);
    });
  }

  getNombreMateria(materiaId?: string): string {
    if (!materiaId) return 'General';
    return this.nombresMaterias.get(materiaId) || 'Desconocida';
  }

  getMaterias(): Materia[] {
    return this.materiasCache;
  }

  getIconoTipo(tipo: string): string {
    const tipoRecurso = this.tiposRecurso.find(t => t.value === tipo);
    return tipoRecurso?.icon || 'insert_drive_file';
  }
}

