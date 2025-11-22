import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { EncabezadoComponent } from '../encabezado/encabezado.component';
import { FooterComponent } from '../footer/footer.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  visible?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    EncabezadoComponent,
    FooterComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  isMobile = false;
  sidenavOpened = false; // Cambiado a false para que el menú flotante esté cerrado por defecto

  navItems: NavItem[] = [];
  private routerSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public permissionsService: PermissionsService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private notificationService: NotificationService
  ) {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.sidenavOpened = !result.matches;
      });
  }

  ngOnInit(): void {
    this.themeService.theme$.subscribe(() => {
      // Theme changed
    });
    this.updateNavItems();
    
    // Scroll to top cuando cambia la ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateNavItems(): void {
    const permisos = this.permissionsService.getPermisos();
    const rol = this.authService.getCurrentUser()?.rol;

    // Navegación personalizada por rol
    if (this.permissionsService.esAlumno()) {
      // Alumno: Dashboard, Materias (solo ver), Asistencias (ver), Notas (ver), Calendario, Biblioteca (solo ver), Mensajes
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Mis Materias', icon: 'menu_book', route: '/app/materias', visible: true },
        { label: 'Mis Asistencias', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Mis Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Calendario', icon: 'calendar_today', route: '/app/calendario', visible: true },
        { label: 'Biblioteca', icon: 'library_books', route: '/app/biblioteca', visible: true },
        { label: 'Mensajes', icon: 'message', route: '/app/mensajes', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: Dashboard, Alumnos (por materias), Materias (asociadas), Asistencias (tomar), Notas (poner), Reportes, Mensajes
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Mis Alumnos', icon: 'people', route: '/app/alumnos', visible: true },
        { label: 'Mis Materias', icon: 'menu_book', route: '/app/materias', visible: true },
        { label: 'Tomar Asistencia', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Cargar Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Reportes', icon: 'assessment', route: '/app/reportes', visible: true },
        { label: 'Mensajes', icon: 'message', route: '/app/mensajes', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esSecretario()) {
      // Secretario: Todo
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Alumnos', icon: 'people', route: '/app/alumnos', visible: true },
        { label: 'Docentes', icon: 'person', route: '/app/docentes', visible: true },
        { label: 'Materias', icon: 'menu_book', route: '/app/materias', visible: true },
        { label: 'Cursos', icon: 'class', route: '/app/cursos', visible: true },
        { label: 'Asistencia', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Calendario', icon: 'calendar_today', route: '/app/calendario', visible: true },
        { label: 'Biblioteca', icon: 'library_books', route: '/app/biblioteca', visible: true },
        { label: 'Mensajes', icon: 'message', route: '/app/mensajes', visible: true },
        { label: 'Reportes', icon: 'assessment', route: '/app/reportes', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esAdmin()) {
      // Admin: Todo de administración y más
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Alumnos', icon: 'people', route: '/app/alumnos', visible: true },
        { label: 'Docentes', icon: 'person', route: '/app/docentes', visible: true },
        { label: 'Materias', icon: 'menu_book', route: '/app/materias', visible: true },
        { label: 'Cursos', icon: 'class', route: '/app/cursos', visible: true },
        { label: 'Carreras', icon: 'school', route: '/app/carreras', visible: permisos.verCarreras },
        { label: 'Aulas', icon: 'meeting_room', route: '/app/aulas', visible: permisos.gestionarAulas },
        { label: 'Asistencia', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Justificativos', icon: 'description', route: '/app/justificativos', visible: permisos.gestionarJustificativos },
        { label: 'Calendario', icon: 'calendar_today', route: '/app/calendario', visible: true },
        { label: 'Biblioteca', icon: 'library_books', route: '/app/biblioteca', visible: true },
        { label: 'Mensajes', icon: 'message', route: '/app/mensajes', visible: true },
        { label: 'Reportes', icon: 'assessment', route: '/app/reportes', visible: true },
        { label: 'Auditoría', icon: 'history', route: '/app/auditoria', visible: permisos.verAuditoria },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esCoordinador()) {
      // Coordinador: Aprobación de correlatividades, notas finales, equivalencias
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Alumnos', icon: 'people', route: '/app/alumnos', visible: permisos.verAlumnos },
        { label: 'Materias', icon: 'menu_book', route: '/app/materias', visible: permisos.verMaterias },
        { label: 'Carreras', icon: 'school', route: '/app/carreras', visible: permisos.verCarreras },
        { label: 'Notas Pendientes', icon: 'pending_actions', route: '/app/notas-pendientes', visible: permisos.aprobarNotasFinales },
        { label: 'Equivalencias', icon: 'swap_horiz', route: '/app/equivalencias', visible: permisos.gestionarEquivalencias },
        { label: 'Solicitudes', icon: 'assignment', route: '/app/solicitudes', visible: permisos.verSolicitudes },
        { label: 'Reportes', icon: 'assessment', route: '/app/reportes', visible: permisos.verReportes },
        { label: 'Análisis', icon: 'analytics', route: '/app/analisis', visible: permisos.analizarRendimiento },
        { label: 'Mensajes', icon: 'message', route: '/app/mensajes', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else {
      // Por defecto
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    }
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.showInfo('Sesión cerrada correctamente');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    const theme = this.themeService.getTheme();
    this.notificationService.showInfo(`Modo ${theme === 'dark' ? 'oscuro' : 'claro'} activado`);
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile) {
      this.sidenavOpened = false;
    }
  }
}
