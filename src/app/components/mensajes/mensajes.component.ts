import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MensajeService } from '../../services/mensaje.service';
import { AuthService } from '../../services/auth.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { NotificationService } from '../../services/notification.service';
import { PermissionsService } from '../../services/permissions.service';
import { DocenteService } from '../../services/docente.service';
import { CursoService } from '../../services/curso.service';
import { Mensaje } from '../../models/mensaje.model';
import { Docente } from '../../models/usuario.model';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.css'
})
export class MensajesComponent implements OnInit {
  @ViewChild('mensajeForm') mensajeForm!: NgForm;
  
  mensajes: Mensaje[] = [];
  mensajesNoLeidos: Mensaje[] = [];
  mensajesEntrada: Mensaje[] = [];
  mensajesSalida: Mensaje[] = [];
  bandejaActual: 'entrada' | 'salida' = 'entrada';
  mensajeSeleccionado: Mensaje | null = null;
  mostrarDetalle: boolean = false;
  nuevoMensaje: Partial<Mensaje> = {
    asunto: '',
    contenido: ''
  };
  destinatarioSeleccionado: string = '';
  tipoDestinatario: 'alumno' | 'curso' | 'profesor' = 'alumno';
  cursoSeleccionado: string = '';
  profesorSeleccionado: string = '';

  esProfesor: boolean = false;
  esAlumno: boolean = false;
  
  cursosDisponibles: Curso[] = [];
  profesoresDisponibles: Docente[] = [];

  constructor(
    private mensajeService: MensajeService,
    private authService: AuthService,
    private alumnoService: AlumnoService,
    private materiaService: MateriaService,
    private notificationService: NotificationService,
    public permissionsService: PermissionsService,
    private docenteService: DocenteService,
    private cursoService: CursoService
  ) {
    this.esProfesor = this.permissionsService.esProfesor();
    this.esAlumno = this.permissionsService.esAlumno();
  }

  async ngOnInit(): Promise<void> {
    await this.actualizarCache();
    await this.loadMensajes();
    if (this.esProfesor) {
      await this.cargarCursosYProfesores();
    }
  }

  async cargarCursosYProfesores(): Promise<void> {
    try {
      // Cargar cursos del profesor
      const usuario = this.authService.getCurrentUser();
      if (!usuario) return;

      const docente = await this.docenteService.getDocenteById(usuario.id);
      const materiasAsignadas = docente?.materiasAsignadas || [];
      
      const todasLasMaterias = await this.materiaService.getMaterias();
      const materiasProfesor = todasLasMaterias.filter(m => 
        materiasAsignadas.includes(m.id)
      );
      const materiasIdsProfesor = new Set(materiasProfesor.map(m => m.id));
      
      const todosLosCursos = await this.cursoService.getCursos();
      this.cursosDisponibles = todosLosCursos.filter(curso => 
        curso.materias.some(mId => materiasIdsProfesor.has(mId))
      );

      // Cargar todos los profesores (excluyendo al actual)
      const todosLosProfesores = await this.docenteService.getDocentes();
      this.profesoresDisponibles = todosLosProfesores.filter(p => p.id !== usuario.id);
      
      // Actualizar cache de nombres de profesores
      this.profesoresDisponibles.forEach(profesor => {
        this.nombresUsuarios.set(profesor.id, `${profesor.nombre} ${profesor.apellido}`);
      });
    } catch (error) {
      console.error('Error cargando cursos y profesores:', error);
    }
  }

  async loadMensajes(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) return;

    let todosLosMensajes = await this.mensajeService.getMensajesByUsuario(usuarioId);

    // Si es profesor, filtrar para mostrar mensajes con sus alumnos y otros profesores
    if (this.esProfesor) {
      const alumnosIds = new Set(this.alumnosCache.map(a => a.id));
      const profesoresIds = new Set(this.profesoresDisponibles.map(p => p.id));
      todosLosMensajes = todosLosMensajes.filter(m => {
        // Mensajes enviados a sus alumnos, recibidos de sus alumnos, o con otros profesores
        const esConAlumno = alumnosIds.has(m.destinatarioId) || alumnosIds.has(m.remitenteId);
        const esConProfesor = profesoresIds.has(m.destinatarioId) || profesoresIds.has(m.remitenteId);
        const esMensajePropio = m.remitenteId === usuarioId || m.destinatarioId === usuarioId;
        return esMensajePropio && (esConAlumno || esConProfesor);
      });
    }
    // Si es alumno, solo mostrar mensajes de profesores
    else if (this.esAlumno) {
      // Obtener todos los profesores
      const todosLosAlumnos = await this.alumnoService.getAlumnos();
      const alumnosIds = new Set(todosLosAlumnos.map(a => a.id));
      todosLosMensajes = todosLosMensajes.filter(m => {
        // Solo mensajes donde el alumno es destinatario o remitente, pero el otro no es alumno (es profesor)
        if (m.destinatarioId === usuarioId) {
          return !alumnosIds.has(m.remitenteId); // El remitente debe ser profesor
        }
        if (m.remitenteId === usuarioId) {
          return !alumnosIds.has(m.destinatarioId); // El destinatario debe ser profesor
        }
        return false;
      });
    }

    this.mensajes = todosLosMensajes;
    this.mensajesNoLeidos = this.mensajes.filter(m => m.destinatarioId === usuarioId && !m.leido);
    // Separar mensajes de entrada y salida
    this.mensajesEntrada = this.mensajes.filter(m => m.destinatarioId === usuarioId);
    this.mensajesSalida = this.mensajes.filter(m => m.remitenteId === usuarioId);
  }

  getMensajesActuales(): Mensaje[] {
    return this.bandejaActual === 'entrada' ? this.mensajesEntrada : this.mensajesSalida;
  }

  cambiarBandeja(bandeja: 'entrada' | 'salida'): void {
    this.bandejaActual = bandeja;
    this.mensajeSeleccionado = null;
    this.mostrarDetalle = false;
  }

  abrirMensaje(mensaje: Mensaje): void {
    this.mensajeSeleccionado = mensaje;
    this.mostrarDetalle = true;
    if (!mensaje.leido && !this.esRemitente(mensaje)) {
      this.marcarComoLeido(mensaje.id);
    }
  }

  cerrarDetalle(): void {
    this.mensajeSeleccionado = null;
    this.mostrarDetalle = false;
  }

  async enviarMensaje(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId || !this.nuevoMensaje.asunto || !this.nuevoMensaje.contenido) {
      this.notificationService.showWarning('Por favor complete todos los campos');
      return;
    }

    let destinatariosIds: string[] = [];

    // Determinar destinatarios según el tipo seleccionado
    if (this.tipoDestinatario === 'alumno') {
      if (!this.destinatarioSeleccionado) {
        this.notificationService.showWarning('Por favor seleccione un alumno');
        return;
      }
      destinatariosIds = [this.destinatarioSeleccionado];
    } else if (this.tipoDestinatario === 'curso') {
      if (!this.cursoSeleccionado) {
        this.notificationService.showWarning('Por favor seleccione un curso');
        return;
      }
      const curso = this.cursosDisponibles.find(c => c.id === this.cursoSeleccionado);
      if (!curso || !curso.alumnos || curso.alumnos.length === 0) {
        this.notificationService.showWarning('El curso seleccionado no tiene alumnos');
        return;
      }
      destinatariosIds = curso.alumnos;
    } else if (this.tipoDestinatario === 'profesor') {
      if (!this.profesorSeleccionado) {
        this.notificationService.showWarning('Por favor seleccione un profesor');
        return;
      }
      destinatariosIds = [this.profesorSeleccionado];
    }

    if (destinatariosIds.length === 0) {
      this.notificationService.showWarning('No hay destinatarios seleccionados');
      return;
    }

    // Enviar mensaje a cada destinatario
    let mensajesEnviados = 0;
    for (const destinatarioId of destinatariosIds) {
      try {
        const mensaje: Mensaje = {
          id: crypto.randomUUID(),
          remitenteId: usuarioId,
          destinatarioId: destinatarioId,
          asunto: this.nuevoMensaje.asunto!,
          contenido: this.nuevoMensaje.contenido!,
          fecha: new Date().toISOString(),
          leido: false,
          importante: false
        };
        await this.mensajeService.addMensaje(mensaje);
        mensajesEnviados++;
      } catch (error) {
        console.error(`Error enviando mensaje a ${destinatarioId}:`, error);
      }
    }

    if (mensajesEnviados > 0) {
      const mensaje = destinatariosIds.length === 1 
        ? 'Mensaje enviado correctamente'
        : `${mensajesEnviados} mensajes enviados correctamente`;
      this.notificationService.showSuccess(mensaje);
    } else {
      this.notificationService.showError('Error al enviar los mensajes');
      return;
    }
    
    // Limpiar formulario y resetear validación
    this.nuevoMensaje = { asunto: '', contenido: '' };
    this.destinatarioSeleccionado = '';
    this.cursoSeleccionado = '';
    this.profesorSeleccionado = '';
    this.tipoDestinatario = 'alumno';
    
    // Resetear el formulario para limpiar el estado de validación
    if (this.mensajeForm) {
      this.mensajeForm.resetForm();
    }
    
    // Recargar mensajes
    await this.loadMensajes();
    // Cambiar a bandeja de salida para ver los mensajes enviados
    this.cambiarBandeja('salida');
  }

  onTipoDestinatarioChange(): void {
    // Limpiar selecciones cuando cambia el tipo
    this.destinatarioSeleccionado = '';
    this.cursoSeleccionado = '';
    this.profesorSeleccionado = '';
  }

  getNombreCurso(curso: Curso): string {
    const año = curso.año || 1;
    const division = curso.division || '';
    const turno = curso.turno || '';
    return `${año}° ${division}${turno ? ' - ' + turno : ''}`;
  }

  async marcarComoLeido(mensajeId: string): Promise<void> {
    await this.mensajeService.marcarComoLeido(mensajeId);
    await this.loadMensajes();
  }

  // Cache para nombres de usuarios
  private nombresUsuarios: Map<string, string> = new Map();
  private alumnosCache: any[] = [];

  async actualizarCache(): Promise<void> {
    const usuarioId = this.authService.getCurrentUser()?.id;
    if (!usuarioId) return;

    if (this.esProfesor) {
      // Si es profesor, solo obtener sus alumnos
      this.alumnosCache = await this.mensajeService.getAlumnosParaProfesor(usuarioId);
    } else {
      // Si es admin o secretario, obtener todos los alumnos
      this.alumnosCache = await this.alumnoService.getAlumnos();
    }

    this.alumnosCache.forEach(alumno => {
      this.nombresUsuarios.set(alumno.id, `${alumno.nombre} ${alumno.apellido}`);
    });
  }

  getNombreUsuario(usuarioId: string): string {
    // Buscar en cache de alumnos
    if (this.nombresUsuarios.has(usuarioId)) {
      return this.nombresUsuarios.get(usuarioId)!;
    }
    // Buscar en profesores
    const profesor = this.profesoresDisponibles.find(p => p.id === usuarioId);
    if (profesor) {
      return `${profesor.nombre} ${profesor.apellido}`;
    }
    return 'Usuario';
  }

  getAlumnos() {
    return this.alumnosCache;
  }

  esRemitente(mensaje: Mensaje): boolean {
    return mensaje.remitenteId === this.authService.getCurrentUser()?.id;
  }
}

