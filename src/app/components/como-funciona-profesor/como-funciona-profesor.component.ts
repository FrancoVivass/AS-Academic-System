import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-como-funciona-profesor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './como-funciona-profesor.component.html',
  styleUrl: './como-funciona-profesor.component.css'
})
export class ComoFuncionaProfesorComponent {
  pasos = [
    {
      titulo: 'Ver Mis Materias',
      descripcion: 'Consulta las materias que tienes asignadas.',
      icono: 'menu_book',
      detalles: [
        'Ve a la sección "Mis Materias"',
        'Verás todas las materias que te han sido asignadas',
        'Puedes ver los alumnos inscritos en cada materia',
        'Revisa los horarios y detalles de cada materia'
      ],
      ruta: '/app/materias'
    },
    {
      titulo: 'Ver Mis Alumnos',
      descripcion: 'Consulta los alumnos de tus materias.',
      icono: 'people',
      detalles: [
        'Ve a la sección "Mis Alumnos"',
        'Selecciona una carrera para filtrar',
        'Verás todos los alumnos de tus materias',
        'Puedes ver sus promedios y asistencias por materia'
      ],
      ruta: '/app/alumnos'
    },
    {
      titulo: 'Tomar Asistencia',
      descripcion: 'Registra la asistencia de tus alumnos.',
      icono: 'event_available',
      detalles: [
        'Ve a la sección "Tomar Asistencia"',
        'Selecciona la materia y fecha',
        'Marca cada alumno como presente, ausente, tardanza o justificado',
        'Guarda los cambios. El sistema calculará automáticamente los porcentajes'
      ],
      ruta: '/app/asistencia'
    },
    {
      titulo: 'Cargar Notas',
      descripcion: 'Registra las calificaciones de tus alumnos.',
      icono: 'grade',
      detalles: [
        'Ve a la sección "Cargar Notas"',
        'Filtra por carrera y materia',
        'Selecciona el alumno y tipo de evaluación (parcial, final, trabajo, etc.)',
        'Ingresa la calificación (0-10)',
        'Guarda la nota. El sistema calculará automáticamente los promedios'
      ],
      ruta: '/app/notas'
    },
    {
      titulo: 'Ver Reportes',
      descripcion: 'Consulta estadísticas y reportes de tus materias.',
      icono: 'assessment',
      detalles: [
        'Ve a la sección "Reportes"',
        'Filtra por materia si lo deseas',
        'Consulta estadísticas de rendimiento',
        'Exporta reportes si es necesario'
      ],
      ruta: '/app/reportes'
    },
    {
      titulo: 'Enviar Mensajes',
      descripcion: 'Comunícate con alumnos y otros profesores.',
      icono: 'message',
      detalles: [
        'Ve a la sección "Mensajes"',
        'Envía mensajes a alumnos o colegas',
        'Marca mensajes como importantes si es necesario',
        'Revisa tu bandeja de entrada regularmente'
      ],
      ruta: '/app/mensajes'
    }
  ];

  funcionalidades = [
    {
      titulo: 'Dashboard',
      icono: 'dashboard',
      descripcion: 'Vista general de tus materias, alumnos y estadísticas rápidas.',
      ruta: '/app/dashboard'
    },
    {
      titulo: 'Mis Materias',
      icono: 'menu_book',
      descripcion: 'Consulta las materias que tienes asignadas y sus detalles.',
      ruta: '/app/materias'
    },
    {
      titulo: 'Mis Alumnos',
      icono: 'people',
      descripcion: 'Ve los alumnos de tus materias con sus promedios y asistencias.',
      ruta: '/app/alumnos'
    },
    {
      titulo: 'Tomar Asistencia',
      icono: 'event_available',
      descripcion: 'Registra la asistencia de tus alumnos por materia y fecha.',
      ruta: '/app/asistencia'
    },
    {
      titulo: 'Cargar Notas',
      icono: 'grade',
      descripcion: 'Registra calificaciones de evaluaciones, trabajos y exámenes.',
      ruta: '/app/notas'
    },
    {
      titulo: 'Reportes',
      icono: 'assessment',
      descripcion: 'Consulta estadísticas y reportes del rendimiento académico.',
      ruta: '/app/reportes'
    },
    {
      titulo: 'Mensajes',
      icono: 'message',
      descripcion: 'Comunícate con alumnos y otros profesores del sistema.',
      ruta: '/app/mensajes'
    },
    {
      titulo: 'Configuración',
      icono: 'settings',
      descripcion: 'Gestiona tu perfil y preferencias del sistema.',
      ruta: '/app/configuracion'
    }
  ];
}

