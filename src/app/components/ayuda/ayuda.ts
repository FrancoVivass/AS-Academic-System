import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MensajeService } from '../../services/mensaje.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './ayuda.html',
  styleUrl: './ayuda.css'
})
export class AyudaComponent {
  mostrarFormularioSoporte: boolean = false;
  mensajeSoporte: {
    asunto: string;
    contenido: string;
  } = {
    asunto: '',
    contenido: ''
  };

  constructor(
    private router: Router,
    private mensajeService: MensajeService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  irAContacto(): void {
    // Navegar a la landing page con el fragmento de contacto
    this.router.navigate(['/'], { fragment: 'contacto' });
  }

  tutoriales = [
    {
      titulo: 'Cómo gestionar alumnos',
      icono: 'people',
      pasos: [
        'Accede al módulo "Alumnos" desde el menú lateral',
        'Haz clic en "Asociar Alumno" para vincular un usuario existente',
        'Completa los datos del alumno (nombre, DNI, curso, etc.)',
        'Guarda los cambios. El alumno quedará asociado a la institución.'
      ]
    },
    {
      titulo: 'Cómo cargar notas',
      icono: 'grade',
      pasos: [
        'Ve al módulo "Notas" desde el menú lateral',
        'Selecciona el alumno y la materia',
        'Ingresa la calificación (número del 1 al 10)',
        'Selecciona el tipo de evaluación (parcial, final, trabajo práctico)',
        'Guarda la nota. El sistema calculará automáticamente los promedios.'
      ]
    },
    {
      titulo: 'Cómo tomar asistencia',
      icono: 'check_circle',
      pasos: [
        'Accede al módulo "Asistencia"',
        'Selecciona la materia y la fecha',
        'Marca como presente o ausente a cada alumno',
        'Puedes justificar ausencias si es necesario',
        'Guarda los cambios. El sistema calculará los porcentajes automáticamente.'
      ]
    },
    {
      titulo: 'Cómo crear materias',
      icono: 'menu_book',
      pasos: [
        'Ve al módulo "Materias"',
        'Haz clic en "Nueva Materia"',
        'Completa el nombre, código y asigna un profesor',
        'Configura horarios y aula si es necesario',
        'Guarda la materia. Ahora podrás asignar alumnos a ella.'
      ]
    },
    {
      titulo: 'Cómo generar reportes',
      icono: 'assessment',
      pasos: [
        'Accede al módulo "Reportes"',
        'Selecciona el tipo de reporte (alumnos, materias, etc.)',
        'Aplica filtros si es necesario (por fecha, materia, etc.)',
        'Visualiza las estadísticas y gráficos',
        'Exporta el reporte en CSV si lo necesitas.'
      ]
    },
    {
      titulo: 'Cómo usar el calendario',
      icono: 'calendar_today',
      pasos: [
        'Ve al módulo "Calendario"',
        'Haz clic en una fecha para agregar un evento',
        'Completa los datos del evento (título, descripción, tipo)',
        'Los eventos aparecerán en el calendario mensual',
        'Puedes editar o eliminar eventos haciendo clic en ellos.'
      ]
    }
  ];

  abrirFormularioSoporte(): void {
    this.mostrarFormularioSoporte = true;
  }

  cerrarFormularioSoporte(): void {
    this.mostrarFormularioSoporte = false;
    this.mensajeSoporte = { asunto: '', contenido: '' };
  }

  async enviarMensajeSoporte(): Promise<void> {
    if (!this.mensajeSoporte.asunto || !this.mensajeSoporte.contenido) {
      this.notificationService.showError('Por favor, complete todos los campos');
      return;
    }

    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      this.notificationService.showError('Debe iniciar sesión para enviar un mensaje de soporte');
      return;
    }

    try {
      // Crear mensaje de soporte (destinatario será "soporte" o un ID especial)
      const mensaje = {
        id: crypto.randomUUID(),
        remitenteId: usuario.id,
        destinatarioId: 'soporte', // ID especial para soporte
        asunto: `[SOPORTE] ${this.mensajeSoporte.asunto}`,
        contenido: this.mensajeSoporte.contenido,
        fecha: new Date().toISOString(),
        leido: false,
        importante: true,
        tipo: 'notificacion' as const,
        prioridad: 'alta' as const
      };

      await this.mensajeService.addMensaje(mensaje);
      this.notificationService.showSuccess('Mensaje de soporte enviado correctamente. Nos pondremos en contacto contigo pronto.');
      this.cerrarFormularioSoporte();
    } catch (error: any) {
      this.notificationService.showError(error.message || 'Error al enviar el mensaje de soporte');
    }
  }
}
