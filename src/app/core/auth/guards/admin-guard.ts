import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

export const adminGuard: CanActivateFn = (route, state) => {
  const keycloak = inject(Keycloak);
  const router = inject(Router);

  const isAdmin = keycloak.hasRealmRole('admin') || keycloak.hasRealmRole('ADMIN');
  if (!isAdmin) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
