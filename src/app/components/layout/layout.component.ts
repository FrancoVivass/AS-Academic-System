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
import { MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { PermissionsService } from '../../services/permissions.service';
import { NotificationService } from '../../services/notification.service';
import { WelcomeService } from '../../services/welcome.service';
import { EncabezadoComponent } from '../encabezado/encabezado.component';
import { FooterComponent } from '../footer/footer.component';
import { MatDialog } from '@angular/material/dialog';
import { WelcomeModalComponent } from '../welcome-modal/welcome-modal.component';

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
    MatDialogModule,
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
    private notificationService: NotificationService,
    private welcomeService: WelcomeService,
    private dialog: MatDialog
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
    
    // Scroll to top y cerrar sidenav cuando cambia la ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Cerrar el sidenav cuando se navega a una nueva ruta
        this.sidenavOpened = false;
      });

    // Mostrar modal de bienvenida si es la primera vez
    this.checkAndShowWelcome();
  }

  checkAndShowWelcome(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.welcomeService.shouldShowWelcome(currentUser)) {
      const dialogRef = this.dialog.open(WelcomeModalComponent, {
        width: '500px',
        maxWidth: '90vw',
        disableClose: true,
        data: { user: currentUser }
      });
      
      dialogRef.afterClosed().subscribe(() => {
        if (currentUser) {
          this.welcomeService.markWelcomeAsSeen(currentUser.id);
        }
      });
    }
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
      // Alumno: Solo ver Asistencias y Notas (NO registrar), Materias (ver)
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Mis Materias', icon: 'menu_book', route: '/app/materias', visible: true },
        { label: 'Ver Asistencias', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Ver Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esProfesor()) {
      // Profesor: Solo VER Asistencias y Notas (NO registrar ni cargar)
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Ver Asistencias', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Ver Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esAdmin()) {
      // Admin: Gestión de carreras, alumnos, asistencia (registrar), notas
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Carreras', icon: 'school', route: '/app/carreras', visible: true },
        { label: 'Materias', icon: 'subject', route: '/app/materias', visible: true },
        { label: 'Aulas', icon: 'room', route: '/app/aulas', visible: true },
        { label: 'Alumnos', icon: 'people', route: '/app/alumnos', visible: true },
        { label: 'Docentes', icon: 'person', route: '/app/docentes', visible: true },
        { label: 'Registrar Asistencia', icon: 'check_circle', route: '/app/asistencia', visible: true },
        { label: 'Cargar Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Reportes y Estadísticas', icon: 'assessment', route: '/app/reportes', visible: true },
        { label: 'Configuración', icon: 'settings', route: '/app/configuracion', visible: true },
        { label: 'Ayuda', icon: 'help_outline', route: '/app/ayuda', visible: true }
      ];
    } else if (this.permissionsService.esCoordinador()) {
      // Coordinador: Acceso limitado a lo básico
      this.navItems = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', visible: true },
        { label: 'Ver Notas', icon: 'grade', route: '/app/notas', visible: true },
        { label: 'Ver Asistencias', icon: 'check_circle', route: '/app/asistencia', visible: true },
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
    // Cerrar el sidenav siempre que se hace clic en un enlace
    this.sidenavOpened = false;
  }
}
