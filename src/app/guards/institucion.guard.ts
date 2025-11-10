import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { InstitucionService } from '../services/institucion.service';

export const institucionGuard: CanActivateFn = (route, state) => {
  const institucionService = inject(InstitucionService);
  const router = inject(Router);

  const currentInstitucion = institucionService.getCurrentInstitucion();

  if (!currentInstitucion) {
    router.navigate(['/instituciones']);
    return false;
  }

  return true;
};

