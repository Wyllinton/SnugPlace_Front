import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenService } from '../services/token-service';

export const roleGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const expectedRole: string[] = next.data["expectedRole"];
  const realRole = tokenService.getRole();

  // Verifica si está logueado y si su rol coincide
  if (!tokenService.isLogged() || !expectedRole.includes(realRole)) {
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};