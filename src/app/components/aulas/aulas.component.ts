import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AulaService } from '../../services/aula.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { Aula, RecursoAula } from '../../models/aula.model';

@Component({
  selector: 'app-aulas',
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
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  templateUrl: './aulas.component.html',
  styleUrl: './aulas.component.css'
})
export class AulasComponent implements OnInit {
  aulas: Aula[] = [];
  aulaSeleccionada: Aula | null = null;
  modoEdicion: boolean = false;
  modalAbierto: boolean = false;
  aulaForm: FormGroup;
  displayedColumns: string[] = ['nombre', 'codigo', 'capacidad', 'tipo', 'estado', 'acciones'];

  recursosDisponibles: { tipo: string; label: string }[] = [
    { tipo: 'proyector', label: 'Proyector' },
    { tipo: 'pizarra', label: 'Pizarra' },
    { tipo: 'pc', label: 'PC' },
    { tipo: 'pantalla', label: 'Pantalla' },
    { tipo: 'aire_acondicionado', label: 'Aire Acondicionado' },
    { tipo: 'wifi', label: 'WiFi' }
  ];

  constructor(
    private aulaService: AulaService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    public permissionsService: PermissionsService
  ) {
    this.aulaForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      capacidad: [30, [Validators.required, Validators.min(1)]],
      tipo: ['aula', Validators.required],
      estado: ['disponible', Validators.required],
      edificio: [''],
      piso: [1],
      observaciones: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadAulas();
  }

  async loadAulas(): Promise<void> {
    this.aulas = await this.aulaService.getAulas();
  }

  abrirModalNuevo(): void {
    this.modalAbierto = true;
    this.modoEdicion = false;
    this.aulaSeleccionada = null;
    this.aulaForm.reset({
      capacidad: 30,
      tipo: 'aula',
      estado: 'disponible',
      piso: 1
    });
  }

  abrirModalEditar(aula: Aula): void {
    this.modalAbierto = true;
    this.modoEdicion = true;
    this.aulaSeleccionada = aula;
    this.aulaForm.patchValue(aula);
  }

  async guardarAula(): Promise<void> {
    if (this.aulaForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.modoEdicion && this.aulaSeleccionada) {
      const aulaActualizada: Aula = {
        ...this.aulaSeleccionada,
        ...this.aulaForm.value
      };
      await this.aulaService.updateAula(aulaActualizada);
      this.notificationService.showSuccess('Aula actualizada correctamente');
    } else {
      const nuevaAula: Aula = {
        id: Date.now().toString(),
        ...this.aulaForm.value,
        recursos: []
      };
      await this.aulaService.addAula(nuevaAula);
      this.notificationService.showSuccess('Aula creada correctamente');
    }

    await this.loadAulas();
    this.cerrarModal();
  }

  async eliminarAula(id: string): Promise<void> {
    if (confirm('¿Está seguro de eliminar esta aula?')) {
      await this.aulaService.deleteAula(id);
      await this.loadAulas();
      this.notificationService.showSuccess('Aula eliminada correctamente');
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.aulaSeleccionada = null;
    this.modoEdicion = false;
    this.aulaForm.reset();
  }
}

