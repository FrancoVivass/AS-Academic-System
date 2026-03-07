import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';
import { NotificationService } from '../services/notification.service';

export const routePermissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const user = authService.getCurrentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const path = state.url.split('/').pop() || '';
  
  // Definir qué rutas pueden acceder cada rol
  const allowedRoutes: { [key: string]: string[] } = {
    'admin': [
      'dashboard', 'alumnos', 'docentes', 'carreras', 'materias', 
      'asistencia', 'notas', 'reportes', 'aulas', 'auditoria', 
      'usuarios', 'configuracion', 'ayuda', 'perfil', 'contacto'
    ],
    'secretario': [
      'dashboard', 'alumnos', 'carreras', 'materias', 
      'asistencia', 'notas', 'reportes', 'configuracion', 
      'ayuda', 'perfil', 'contacto'
    ],
    'profesor': [
      'dashboard', 'asistencia', 'notas', 
      'configuracion', 'ayuda', 'perfil', 'contacto'
    ],
    'alumno': [
      'dashboard', 'materias', 'asistencia', 'notas',
      'calendario', 'biblioteca', 'mensajes', 
      'configuracion', 'ayuda', 'perfil', 'contacto', 'documentacion'
    ],
    'coordinador': [
      'dashboard', 'notas', 'asistencia',
      'configuracion', 'ayuda', 'perfil', 'contacto'
    ]
  };

  const userRole = user.rol || 'invitado';
  const allowedRoutesForRole = allowedRoutes[userRole] || [];

  // Permitir rutas generales
  const generalRoutes = ['como-funciona', 'dashboard', 'perfil', 'configuracion', 'ayuda', 'contacto'];
  if (generalRoutes.includes(path)) {
    return true;
  }

  // Verificar si la ruta está permitida
  if (!allowedRoutesForRole.includes(path)) {
    notificationService.showError(`No tiene permiso para acceder a ${path}`);
    router.navigate(['/app/dashboard']);
    return false;
  }

  return true;
};
