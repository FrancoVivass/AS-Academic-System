import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { EventoService } from '../../services/evento.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Evento } from '../../models/evento.model';
import { Materia } from '../../models/materia.model';

@Component({
  selector: 'app-calendario',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit {
  eventos: Evento[] = [];
  eventosProximos: Evento[] = [];
  fechaSeleccionada: Date = new Date();
  mesActual: number = new Date().getMonth();
  anioActual: number = new Date().getFullYear();
  eventoSeleccionado: Evento | null = null;
  modoEdicion: boolean = false;
  mostrarModal: boolean = false;
  eventoForm: FormGroup;

  tiposEvento = [
    { value: 'examen', label: 'Examen', icon: 'quiz', color: '#f44336' },
    { value: 'reunion', label: 'Reunión', icon: 'groups', color: '#2196f3' },
    { value: 'feriado', label: 'Feriado', icon: 'event', color: '#ff9800' },
    { value: 'evento', label: 'Evento', icon: 'celebration', color: '#9c27b0' },
    { value: 'entrega', label: 'Entrega', icon: 'assignment', color: '#4caf50' }
  ];

  constructor(
    private eventoService: EventoService,
    private materiaService: MateriaService,
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.eventoForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      fecha: ['', Validators.required],
      hora: [''],
      tipo: ['evento', Validators.required],
      materiaId: [''],
      color: ['']
    });
  }

  private materiasCache: Materia[] = [];
  private nombresMaterias: Map<string, string> = new Map();
  private eventosPorFecha: Map<string, Evento[]> = new Map();

  async ngOnInit(): Promise<void> {
    await this.loadEventos();
    await this.actualizarCacheMaterias();
    await this.cargarEventosPorFecha();
  }

  async actualizarCacheMaterias(): Promise<void> {
    this.materiasCache = await this.materiaService.getMaterias();
    this.materiasCache.forEach(materia => {
      this.nombresMaterias.set(materia.id, materia.nombre);
    });
  }

  async loadEventos(): Promise<void> {
    this.eventos = await this.eventoService.getEventos();
    this.eventosProximos = await this.eventoService.getEventosProximos(30);
  }

  async cargarEventosPorFecha(): Promise<void> {
    // Cargar eventos de todos los días del mes actual
    const diasDelMes = this.getDiasDelMes();
    for (const dia of diasDelMes) {
      const fechaStr = dia.toISOString().split('T')[0];
      const eventos = await this.eventoService.getEventosByFecha(fechaStr);
      this.eventosPorFecha.set(fechaStr, eventos);
    }
  }

  getEventosDelMes(): Evento[] {
    return this.eventos.filter(e => {
      const fechaEvento = new Date(e.fecha);
      return fechaEvento.getMonth() === this.mesActual && 
             fechaEvento.getFullYear() === this.anioActual;
    });
  }

  getEventosDelDia(fecha: Date): Evento[] {
    const fechaStr = fecha.toISOString().split('T')[0];
    return this.eventosPorFecha.get(fechaStr) || [];
  }

  cambiarMes(direccion: number): void {
    this.mesActual += direccion;
    if (this.mesActual < 0) {
      this.mesActual = 11;
      this.anioActual--;
    } else if (this.mesActual > 11) {
      this.mesActual = 0;
      this.anioActual++;
    }
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.eventoSeleccionado = null;
    this.mostrarModal = true;
    this.eventoForm.reset();
    this.eventoForm.patchValue({ 
      tipo: 'evento',
      fecha: new Date().toISOString().split('T')[0]
    });
  }

  abrirModalEditar(evento: Evento): void {
    this.modoEdicion = true;
    this.eventoSeleccionado = evento;
    this.mostrarModal = true;
    this.eventoForm.patchValue(evento);
  }

  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.notificationService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    const tipoSeleccionado = this.tiposEvento.find(t => t.value === this.eventoForm.value.tipo);
    
    if (this.modoEdicion && this.eventoSeleccionado) {
      const eventoActualizado: Evento = {
        ...this.eventoSeleccionado,
        ...this.eventoForm.value,
        color: tipoSeleccionado?.color || this.eventoSeleccionado.color
      };
      this.eventoService.updateEvento(eventoActualizado);
      this.notificationService.showSuccess('Evento actualizado correctamente');
    } else {
      const nuevoEvento: Evento = {
        id: Date.now().toString(),
        ...this.eventoForm.value,
        creadorId: this.authService.getCurrentUser()?.id || '',
        color: tipoSeleccionado?.color || '#246a73',
        recordatorio: false
      };
      this.eventoService.addEvento(nuevoEvento);
      this.notificationService.showSuccess('Evento creado correctamente');
    }

    this.loadEventos();
    this.cerrarModal();
  }

  eliminarEvento(id: string): void {
    if (confirm('¿Está seguro de eliminar este evento?')) {
      this.eventoService.deleteEvento(id);
      this.loadEventos();
      this.notificationService.showSuccess('Evento eliminado correctamente');
    }
  }

  cerrarModal(): void {
    this.eventoSeleccionado = null;
    this.modoEdicion = false;
    this.mostrarModal = false;
  }

  getNombreMateria(materiaId?: string): string {
    if (!materiaId) return '';
    return this.nombresMaterias.get(materiaId) || '';
  }

  getMaterias(): Materia[] {
    return this.materiasCache;
  }

  getDiasDelMes(): Date[] {
    const primerDia = new Date(this.anioActual, this.mesActual, 1);
    const ultimoDia = new Date(this.anioActual, this.mesActual + 1, 0);
    const dias: Date[] = [];
    
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(new Date(this.anioActual, this.mesActual, i));
    }
    
    return dias;
  }

  getNombreMes(): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[this.mesActual];
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }
}

