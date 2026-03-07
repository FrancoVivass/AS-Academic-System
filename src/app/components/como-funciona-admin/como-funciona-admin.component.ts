import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-como-funciona-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatStepperModule,
    MatExpansionModule
  ],
  templateUrl: './como-funciona-admin.component.html',
  styleUrl: './como-funciona-admin.component.css'
})
export class ComoFuncionaAdminComponent {
  steps = [
    {
      title: 'Paso 1: Crear Docentes',
      description: 'Primero debes crear los docentes que dictarán las materias.',
      icon: 'person_add',
      details: [
        'Ve a la sección "Docentes"',
        'Haz clic en "Nuevo Docente"',
        'Completa los datos del docente (nombre, apellido, email, etc.)',
        'Guarda el docente. El sistema creará automáticamente su usuario.'
      ],
      route: '/app/docentes'
    },
    {
      title: 'Paso 2: Crear Materias',
      description: 'Crea las materias que se dictarán en las carreras.',
      icon: 'menu_book',
      details: [
        'Ve a la sección "Materias"',
        'Haz clic en "+ Nueva Materia"',
        'Completa los datos básicos (nombre, código)',
        'Asigna un profesor (debe estar creado previamente)',
        'Configura horas, créditos y otros parámetros',
        'Guarda la materia'
      ],
      route: '/app/materias'
    },
    {
      title: 'Paso 3: Crear Aulas (Opcional)',
      description: 'Crea las aulas físicas donde se dictarán las clases.',
      icon: 'meeting_room',
      details: [
        'Ve a la sección "Aulas"',
        'Haz clic en "Nueva Aula"',
        'Completa los datos (nombre, capacidad, tipo, etc.)',
        'Guarda el aula'
      ],
      route: '/app/aulas'
    },
    {
      title: 'Paso 4: Crear Carreras',
      description: 'Crea las carreras con sus cursos y materias asignadas.',
      icon: 'school',
      details: [
        'Ve a la sección "Carreras"',
        'Haz clic en "Nueva Carrera"',
        'Completa los datos de la carrera (nombre, código, duración)',
        'Asigna las aulas que utilizará la carrera',
        'Crea los cursos (año, división, turno)',
        'Asigna materias a cada curso',
        'Finaliza la creación de la carrera'
      ],
      route: '/app/carreras'
    },
    {
      title: 'Paso 5: Registrar Alumnos',
      description: 'Registra los alumnos que se inscribirán a las carreras.',
      icon: 'people',
      details: [
        'Ve a la sección "Alumnos"',
        'Haz clic en "Nuevo Alumno"',
        'Completa los datos del alumno',
        'Selecciona la carrera a la que pertenece',
        'El sistema creará automáticamente su usuario',
        'Opcional: Puedes importar alumnos desde Excel'
      ],
      route: '/app/alumnos'
    },
    {
      title: 'Paso 6: Gestionar Cursos',
      description: 'Los cursos se gestionan desde la sección de Carreras.',
      icon: 'class',
      details: [
        'Ve a la sección "Carreras"',
        'Selecciona una carrera',
        'Desde allí puedes ver y gestionar todos los cursos de esa carrera',
        'Puedes asignar materias, inscribir alumnos, etc.'
      ],
      route: '/app/carreras'
    }
  ];

  funcionalidades = [
    {
      title: 'Gestión de Docentes',
      icon: 'person',
      description: 'Crea y gestiona los docentes del sistema. Asigna materias y revisa su información.',
      route: '/app/docentes'
    },
    {
      title: 'Gestión de Alumnos',
      icon: 'people',
      description: 'Registra alumnos, importa desde Excel, gestiona su estado académico y documentación.',
      route: '/app/alumnos'
    },
    {
      title: 'Gestión de Materias',
      icon: 'menu_book',
      description: 'Crea materias, asigna profesores, configura correlatividades y gestiona inscripciones.',
      route: '/app/materias'
    },
    {
      title: 'Gestión de Carreras',
      icon: 'school',
      description: 'Crea carreras completas con cursos, materias y aulas asignadas.',
      route: '/app/carreras'
    },
    {
      title: 'Gestión de Aulas',
      icon: 'meeting_room',
      description: 'Gestiona las aulas físicas, su capacidad y disponibilidad.',
      route: '/app/aulas'
    },
    {
      title: 'Control de Asistencia',
      icon: 'event_available',
      description: 'Registra y consulta las asistencias de los alumnos por materia.',
      route: '/app/asistencia'
    },
    {
      title: 'Gestión de Notas',
      icon: 'grade',
      description: 'Registra calificaciones, aprueba notas y gestiona recuperatorios.',
      route: '/app/notas'
    },
    {
      title: 'Calendario Académico',
      icon: 'calendar_today',
      description: 'Gestiona eventos, exámenes y actividades del calendario académico.',
      route: '/app/calendario'
    },
    {
      title: 'Reportes y Estadísticas',
      icon: 'assessment',
      description: 'Genera reportes completos del rendimiento académico y estadísticas.',
      route: '/app/reportes'
    },
    {
      title: 'Auditoría',
      icon: 'history',
      description: 'Revisa el historial de cambios y acciones realizadas en el sistema.',
      route: '/app/auditoria'
    }
  ];
}

