import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
export class LayoutComponent implements OnInit {
  isMobile = false;
  sidenavOpened = false; // Cambiado a false para que el menú flotante esté cerrado por defecto

  navItems: NavItem[] = [];

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
        { label: 'Asistencia', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Calendario', icon: 'calendar_today', route: '/app/calendario', visible: true },
        { label: 'Biblioteca', icon: 'library_books', route: '/app/biblioteca', visible: true },
        { label: 'Mensajes', icon: 'message', route: '/app/mensajes', visible: true },
        { label: 'Reportes', icon: 'assessment', route: '/app/reportes', visible: true },
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
