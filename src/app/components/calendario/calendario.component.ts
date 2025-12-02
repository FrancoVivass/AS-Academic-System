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
    MatDialogModule
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
    // Recargar eventos desde el servicio para asegurar que estén actualizados
    this.eventos = await this.eventoService.getEventos();
    // Filtrar eventos eliminados (verificar que existan en el servicio)
    this.eventos = this.eventos.filter(e => e && e.id);
    this.eventosProximos = await this.eventoService.getEventosProximos(30);
    // Recargar eventos por fecha después de cargar eventos
    await this.cargarEventosPorFecha();
  }

  async cargarEventosPorFecha(): Promise<void> {
    // Limpiar eventos por fecha
    this.eventosPorFecha.clear();
    
    // Asegurarse de que los eventos estén cargados
    if (this.eventos.length === 0) {
      await this.loadEventos();
    }
    
    // Cargar eventos de todos los días del mes actual Y del mes siguiente
    // Esto asegura que los eventos del mes siguiente aparezcan
    const diasDelMes = this.getDiasDelMes();
    const mesSiguiente = this.mesActual === 11 ? 0 : this.mesActual + 1;
    const anioSiguiente = this.mesActual === 11 ? this.anioActual + 1 : this.anioActual;
    const primerDiaSiguiente = new Date(anioSiguiente, mesSiguiente, 1);
    const ultimoDiaSiguiente = new Date(anioSiguiente, mesSiguiente + 1, 0);
    const diasDelMesSiguiente: Date[] = [];
    for (let i = 1; i <= ultimoDiaSiguiente.getDate(); i++) {
      diasDelMesSiguiente.push(new Date(anioSiguiente, mesSiguiente, i));
    }
    
    // Combinar días del mes actual y siguiente
    const todosLosDias = [...diasDelMes, ...diasDelMesSiguiente];
    
    for (const dia of todosLosDias) {
      // Normalizar la fecha a medianoche para comparación (usando hora local)
      const diaNormalizado = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
      const fechaStr = `${diaNormalizado.getFullYear()}-${String(diaNormalizado.getMonth() + 1).padStart(2, '0')}-${String(diaNormalizado.getDate()).padStart(2, '0')}`;
      
      // Filtrar eventos del día desde la lista de eventos cargados (solo eventos válidos)
      const eventosDelDia = this.eventos.filter(e => {
        if (!e.fecha) return false;
        // Parsear fecha de manera segura (manejar diferentes formatos)
        let fechaEvento: Date;
        if (typeof e.fecha === 'string') {
          // Si es string, puede venir en formato ISO o local
          if (e.fecha.includes('T')) {
            fechaEvento = new Date(e.fecha);
          } else {
            // Formato YYYY-MM-DD
            const partes = e.fecha.split('-');
            fechaEvento = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
          }
        } else {
          fechaEvento = new Date(e.fecha);
        }
        
        // Normalizar a medianoche (hora local)
        const fechaNormalizada = new Date(fechaEvento.getFullYear(), fechaEvento.getMonth(), fechaEvento.getDate());
        const fechaStrEvento = `${fechaNormalizada.getFullYear()}-${String(fechaNormalizada.getMonth() + 1).padStart(2, '0')}-${String(fechaNormalizada.getDate()).padStart(2, '0')}`;
        return fechaStrEvento === fechaStr;
      });
      
      if (eventosDelDia.length > 0) {
        this.eventosPorFecha.set(fechaStr, eventosDelDia);
      }
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
    // Normalizar la fecha a medianoche para comparación (usando hora local)
    const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const fechaStr = `${fechaNormalizada.getFullYear()}-${String(fechaNormalizada.getMonth() + 1).padStart(2, '0')}-${String(fechaNormalizada.getDate()).padStart(2, '0')}`;
    
    // Primero intentar obtener del mapa
    let eventos = this.eventosPorFecha.get(fechaStr);
    
    // Si no hay en el mapa, buscar directamente en los eventos (solo eventos válidos)
    if (!eventos || eventos.length === 0) {
      eventos = this.eventos.filter(e => {
        if (!e.fecha) return false;
        // Parsear fecha de manera segura
        let fechaEvento: Date;
        if (typeof e.fecha === 'string') {
          if (e.fecha.includes('T')) {
            fechaEvento = new Date(e.fecha);
          } else {
            const partes = e.fecha.split('-');
            fechaEvento = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
          }
        } else {
          fechaEvento = new Date(e.fecha);
        }
        
        // Normalizar a medianoche (hora local)
        const fechaEventoNormalizada = new Date(fechaEvento.getFullYear(), fechaEvento.getMonth(), fechaEvento.getDate());
        const fechaStrEvento = `${fechaEventoNormalizada.getFullYear()}-${String(fechaEventoNormalizada.getMonth() + 1).padStart(2, '0')}-${String(fechaEventoNormalizada.getDate()).padStart(2, '0')}`;
        return fechaStrEvento === fechaStr;
      });
      // Guardar en el mapa para futuras consultas
      if (eventos.length > 0) {
        this.eventosPorFecha.set(fechaStr, eventos);
      }
    }
    
    return eventos || [];
  }

  async cambiarMes(direccion: number): Promise<void> {
    this.mesActual += direccion;
    if (this.mesActual < 0) {
      this.mesActual = 11;
      this.anioActual--;
    } else if (this.mesActual > 11) {
      this.mesActual = 0;
      this.anioActual++;
    }
    // Recargar eventos del nuevo mes
    await this.loadEventos();
    await this.cargarEventosPorFecha();
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

  async guardarEvento(): Promise<void> {
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
      await this.eventoService.updateEvento(eventoActualizado);
      this.notificationService.showSuccess('Evento actualizado correctamente');
    } else {
      const nuevoEvento: Evento = {
        id: crypto.randomUUID(),
        ...this.eventoForm.value,
        creadorId: this.authService.getCurrentUser()?.id || '',
        color: tipoSeleccionado?.color || '#246a73',
        recordatorio: false
      };
      await this.eventoService.addEvento(nuevoEvento);
      this.notificationService.showSuccess('Evento creado correctamente');
    }

    // Limpiar eventos por fecha y recargar
    this.eventosPorFecha.clear();
    await this.loadEventos();
    this.cerrarModal();
  }

  async eliminarEvento(id: string): Promise<void> {
    if (confirm('¿Está seguro de eliminar este evento?')) {
      await this.eventoService.deleteEvento(id);
      // Remover el evento de la lista local inmediatamente
      this.eventos = this.eventos.filter(e => e.id !== id);
      this.eventosProximos = this.eventosProximos.filter(e => e.id !== id);
      // Limpiar eventos por fecha y recargar
      this.eventosPorFecha.clear();
      // Recargar desde el servicio para asegurar sincronización
      await this.loadEventos();
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
    
    // Agregar días del mes anterior para completar la primera semana
    const primerDiaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    if (primerDiaSemana > 0) {
      const mesAnterior = this.mesActual === 0 ? 11 : this.mesActual - 1;
      const anioAnterior = this.mesActual === 0 ? this.anioActual - 1 : this.anioActual;
      const ultimoDiaMesAnterior = new Date(anioAnterior, mesAnterior + 1, 0);
      for (let i = ultimoDiaMesAnterior.getDate() - primerDiaSemana + 1; i <= ultimoDiaMesAnterior.getDate(); i++) {
        dias.push(new Date(anioAnterior, mesAnterior, i));
      }
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(new Date(this.anioActual, this.mesActual, i));
    }
    
    // Agregar días del mes siguiente para completar la última semana
    const ultimoDiaSemana = ultimoDia.getDay();
    const diasFaltantes = 6 - ultimoDiaSemana;
    if (diasFaltantes > 0) {
      const mesSiguiente = this.mesActual === 11 ? 0 : this.mesActual + 1;
      const anioSiguiente = this.mesActual === 11 ? this.anioActual + 1 : this.anioActual;
      for (let i = 1; i <= diasFaltantes; i++) {
        dias.push(new Date(anioSiguiente, mesSiguiente, i));
      }
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

  formatearFecha(fechaStr: string): string {
    // Parsear fecha de manera segura para evitar problemas de zona horaria
    let fecha: Date;
    if (fechaStr.includes('T')) {
      fecha = new Date(fechaStr);
    } else {
      // Formato YYYY-MM-DD
      const partes = fechaStr.split('-');
      fecha = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    }
    
    // Usar métodos locales para evitar problemas de zona horaria
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    // Formato: DD/MM - YYYY (separando el año)
    return `${dia}/${mes} - ${anio}`;
  }

}

