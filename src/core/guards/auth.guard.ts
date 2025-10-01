import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoutePaths } from 'app/app.router-path';
import { AuthService } from 'core/services/auth/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthValue) {
    return true;
  }

  try {
    await firstValueFrom(authService.checkAuth());
    return authService.isAuthValue;
  } catch {
    router.navigate([`/${RoutePaths.Auth}`]);
    return false;
  }
};

