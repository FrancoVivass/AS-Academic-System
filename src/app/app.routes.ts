import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { institucionGuard } from './guards/institucion.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'instituciones',
    loadComponent: () => import('./components/seleccion-institucion/seleccion-institucion').then(m => m.SeleccionInstitucionComponent)
  },
  {
    path: 'como-funciona',
    loadComponent: () => import('./components/como-funciona/como-funciona').then(m => m.ComoFuncionaComponent)
  },
  {
    path: 'acerca-de',
    loadComponent: () => import('./components/acerca-de/acerca-de').then(m => m.AcercaDeComponent)
  },
  {
    path: 'soporte',
    loadComponent: () => import('./components/soporte/soporte').then(m => m.SoporteComponent)
  },
  {
    path: 'test-conexion',
    loadComponent: () => import('./components/test-conexion/test-conexion.component').then(m => m.TestConexionComponent)
  },
  {
    path: 'migracion-datos',
    loadComponent: () => import('./components/migracion-datos/migracion-datos.component').then(m => m.MigracionDatosComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    canActivate: [institucionGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./components/registro/registro.component').then(m => m.RegistroComponent),
    canActivate: [institucionGuard]
  },
  {
    path: 'app',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard, institucionGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'alumnos',
        loadComponent: () => import('./components/alumnos/alumnos.component').then(m => m.AlumnosComponent)
      },
      {
        path: 'docentes',
        loadComponent: () => import('./components/docentes/docentes.component').then(m => m.DocentesComponent)
      },
      {
        path: 'materias',
        loadComponent: () => import('./components/materias/materias.component').then(m => m.MateriasComponent)
      },
      {
        path: 'cursos',
        loadComponent: () => import('./components/cursos/cursos.component').then(m => m.CursosComponent)
      },
      {
        path: 'asistencia',
        loadComponent: () => import('./components/asistencia/asistencia.component').then(m => m.AsistenciaComponent)
      },
      {
        path: 'notas',
        loadComponent: () => import('./components/notas/notas.component').then(m => m.NotasComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./components/calendario/calendario.component').then(m => m.CalendarioComponent)
      },
      {
        path: 'biblioteca',
        loadComponent: () => import('./components/biblioteca/biblioteca.component').then(m => m.BibliotecaComponent)
      },
      {
        path: 'mensajes',
        loadComponent: () => import('./components/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./components/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'carreras',
        loadComponent: () => import('./components/carreras/carreras.component').then(m => m.CarrerasComponent)
      },
      {
        path: 'aulas',
        loadComponent: () => import('./components/aulas/aulas.component').then(m => m.AulasComponent)
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./components/auditoria/auditoria.component').then(m => m.AuditoriaComponent)
      },
      {
        path: 'justificativos',
        loadComponent: () => import('./components/justificativos/justificativos.component').then(m => m.JustificativosComponent)
      },
      {
        path: 'equivalencias',
        loadComponent: () => import('./components/equivalencias/equivalencias.component').then(m => m.EquivalenciasComponent)
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./components/solicitudes/solicitudes.component').then(m => m.SolicitudesComponent)
      },
      {
        path: 'notas-pendientes',
        loadComponent: () => import('./components/notas-pendientes/notas-pendientes.component').then(m => m.NotasPendientesComponent)
      },
      {
        path: 'documentacion',
        loadComponent: () => import('./components/documentacion/documentacion.component').then(m => m.DocumentacionComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'analisis',
        loadComponent: () => import('./components/analisis/analisis.component').then(m => m.AnalisisComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./components/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'ayuda',
        loadComponent: () => import('./components/ayuda/ayuda').then(m => m.AyudaComponent)
      },
      {
        path: 'contacto',
        loadComponent: () => import('./components/contacto/contacto').then(m => m.ContactoComponent)
      },
      {
        path: 'como-funciona/admin',
        loadComponent: () => import('./components/como-funciona-admin/como-funciona-admin.component').then(m => m.ComoFuncionaAdminComponent)
      },
      {
        path: 'como-funciona/profesor',
        loadComponent: () => import('./components/como-funciona-profesor/como-funciona-profesor.component').then(m => m.ComoFuncionaProfesorComponent)
      },
      {
        path: 'como-funciona/alumno',
        loadComponent: () => import('./components/como-funciona-alumno/como-funciona-alumno.component').then(m => m.ComoFuncionaAlumnoComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
