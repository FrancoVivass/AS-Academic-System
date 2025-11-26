import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-como-funciona-alumno',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './como-funciona-alumno.component.html',
  styleUrl: './como-funciona-alumno.component.css'
})
export class ComoFuncionaAlumnoComponent {
  funcionalidades = [
    {
      titulo: 'Dashboard',
      icono: 'dashboard',
      descripcion: 'Vista general de tu rendimiento académico: promedio general, asistencia, materias inscritas y alertas importantes.',
      ruta: '/app/dashboard',
      quePuedesVer: [
        'Tu promedio general',
        'Tu porcentaje de asistencia',
        'Faltas acumuladas',
        'Total de materias inscritas',
        'Alertas y advertencias sobre tu rendimiento'
      ]
    },
    {
      titulo: 'Mis Materias',
      icono: 'menu_book',
      descripcion: 'Consulta todas las materias en las que estás inscrito con sus detalles, profesores y horarios.',
      ruta: '/app/materias',
      quePuedesVer: [
        'Lista de todas tus materias',
        'Profesor de cada materia',
        'Horarios de clase',
        'Código y descripción de cada materia',
        'Cantidad de alumnos inscritos'
      ]
    },
    {
      titulo: 'Mis Asistencias',
      icono: 'event_available',
      descripcion: 'Consulta tu asistencia por materia, ve tus faltas y porcentajes de asistencia.',
      ruta: '/app/asistencia',
      quePuedesVer: [
        'Asistencia por materia',
        'Porcentaje de asistencia en cada materia',
        'Días presentes, ausentes y tardanzas',
        'Justificativos aplicados',
        'Alertas si tu asistencia está baja'
      ]
    },
    {
      titulo: 'Mis Notas',
      icono: 'grade',
      descripcion: 'Consulta todas tus calificaciones, promedios por materia y estado académico.',
      ruta: '/app/notas',
      quePuedesVer: [
        'Todas tus calificaciones',
        'Promedio por materia',
        'Tipo de evaluación (parcial, final, trabajo, etc.)',
        'Fechas de cada evaluación',
        'Estado de aprobación'
      ]
    },
    {
      titulo: 'Calendario',
      icono: 'calendar_today',
      descripcion: 'Consulta eventos, exámenes y actividades del calendario académico.',
      ruta: '/app/calendario',
      quePuedesVer: [
        'Eventos del calendario académico',
        'Exámenes programados',
        'Actividades importantes',
        'Fechas de entrega de trabajos'
      ]
    },
    {
      titulo: 'Biblioteca',
      icono: 'library_books',
      descripcion: 'Accede a recursos y materiales de estudio compartidos por profesores.',
      ruta: '/app/biblioteca',
      quePuedesVer: [
        'Recursos compartidos por materia',
        'Materiales de estudio',
        'Documentos y archivos',
        'Enlaces útiles'
      ]
    },
    {
      titulo: 'Mensajes',
      icono: 'message',
      descripcion: 'Comunícate con tus profesores y recibe mensajes importantes.',
      ruta: '/app/mensajes',
      quePuedesVer: [
        'Mensajes de tus profesores',
        'Comunicados importantes',
        'Notificaciones del sistema',
        'Historial de mensajes'
      ],
      quePuedesHacer: [
        'Enviar mensajes a profesores',
        'Recibir y leer mensajes',
        'Marcar mensajes como leídos'
      ]
    },
    {
      titulo: 'Configuración',
      icono: 'settings',
      descripcion: 'Gestiona tu perfil y preferencias del sistema.',
      ruta: '/app/configuracion',
      quePuedesHacer: [
        'Ver y editar tu perfil',
        'Cambiar tu contraseña',
        'Configurar preferencias',
        'Exportar tus datos'
      ]
    }
  ];
}

