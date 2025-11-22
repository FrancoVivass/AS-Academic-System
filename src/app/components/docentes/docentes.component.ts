import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { DocenteService } from '../../services/docente.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ScrollLockService } from '../../services/scroll-lock.service';
import { Docente } from '../../models/usuario.model';

@Component({
  selector: 'app-docentes',
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
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatStepperModule
  ],
  templateUrl: './docentes.component.html',
  styleUrl: './docentes.component.css'
})
export class DocentesComponent implements OnInit {
  docentes: Docente[] = [];
  docentesFiltrados: Docente[] = [];
  docenteSeleccionado: Docente | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  mostrarWizard: boolean = false;
  busqueda: string = '';
  docenteForm: FormGroup;
  displayedColumns: string[] = ['nombre', 'especialidad', 'materias', 'email', 'acciones'];
  
  // Wizard data (simplificado - solo datos personales)

  constructor(
    private docenteService: DocenteService,
    private materiaService: MateriaService,
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private scrollLockService: ScrollLockService
  ) {
    this.docenteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      especialidad: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadDocentes();
  }

  loadDocentes(): void {
    this.docentes = this.docenteService.getDocentes();
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.docentes];

    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(d =>
        d.nombre.toLowerCase().includes(busquedaLower) ||
        d.apellido.toLowerCase().includes(busquedaLower) ||
        d.email.toLowerCase().includes(busquedaLower) ||
        d.especialidad?.toLowerCase().includes(busquedaLower)
      );
    }

    this.docentesFiltrados = filtrados;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    this.mostrarWizard = true;
    this.modoEdicion = false;
    this.docenteSeleccionado = null;
    this.docenteForm.reset();
    this.docenteForm.patchValue({ rol: 'profesor' });
    this.scrollLockService.lockScroll();
  }
  
  cerrarWizard(): void {
    this.mostrarWizard = false;
    this.docenteForm.reset();
    this.scrollLockService.unlockScroll();
  }
  
  finalizarWizardDocente(): void {
    if (this.docenteForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }
    
    const formValue = this.docenteForm.value;
    const nuevoDocente: Docente = {
      id: Date.now().toString(),
      ...formValue,
      rol: 'profesor',
      materiasAsignadas: [], // Se asignarán cuando se creen las materias o se asignen a cursos
      fechaRegistro: new Date().toISOString(),
      activo: true
    };
    
    this.docenteService.addDocente(nuevoDocente);
    this.notificationService.showSuccess(`Docente creado exitosamente. Las materias se asignarán cuando se creen materias o se configuren los cursos. Usuario: ${nuevoDocente.username}`);
    this.loadDocentes();
    this.cerrarWizard();
  }

  abrirModalEditar(docente: Docente): void {
    this.modoEdicion = true;
    this.docenteSeleccionado = docente;
    this.docenteForm.patchValue(docente);
    this.docenteForm.get('password')?.clearValidators();
    this.docenteForm.get('password')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  guardarDocente(): void {
    if (this.docenteForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const formValue = this.docenteForm.value;
    
    if (this.modoEdicion && this.docenteSeleccionado) {
      const docenteActualizado: Docente = {
        ...this.docenteSeleccionado,
        ...formValue,
        rol: 'profesor'
      };
      this.docenteService.updateDocente(docenteActualizado);
      this.notificationService.showSuccess('Docente actualizado correctamente');
    } else {
      const nuevoDocente: Docente = {
        id: Date.now().toString(),
        ...formValue,
        rol: 'profesor',
        materiasAsignadas: [],
        fechaRegistro: new Date().toISOString(),
        activo: true
      };
      this.docenteService.addDocente(nuevoDocente);
      
      // El servicio ya crea el usuario, pero mostramos las credenciales
      this.notificationService.showSuccess(`Docente agregado correctamente. Usuario: ${nuevoDocente.username}, Password: ${nuevoDocente.password}`);
    }

    this.loadDocentes();
    this.cerrarModal();
  }

  eliminarDocente(id: string): void {
    if (confirm('¿Está seguro de eliminar este docente?')) {
      this.docenteService.deleteDocente(id);
      this.loadDocentes();
      this.notificationService.showSuccess('Docente eliminado correctamente');
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.docenteSeleccionado = null;
    this.modoEdicion = false;
    this.docenteForm.reset();
    this.docenteForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
  }

  getMateriasAsignadas(docente: Docente): string {
    if (!docente.materiasAsignadas || docente.materiasAsignadas.length === 0) {
      return 'Sin materias asignadas';
    }
    return docente.materiasAsignadas.length + ' materia(s)';
  }

  getTotalMateriasAsignadas(): number {
    return this.docentes.reduce((total, docente) => {
      return total + (docente.materiasAsignadas?.length || 0);
    }, 0);
  }

  getCantidadConMaterias(): number {
    return this.docentes.filter(d => d.materiasAsignadas && d.materiasAsignadas.length > 0).length;
  }
}

