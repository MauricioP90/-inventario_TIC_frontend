import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (!roleService.isAdmin()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
