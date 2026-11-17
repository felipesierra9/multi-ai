import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

/** Exige el rol indicado en data: { role: '...' } de la ruta. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = route.data['role'] as Role;

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }
  return auth.hasRole(required) ? true : router.createUrlTree(['/dashboard']);
};
