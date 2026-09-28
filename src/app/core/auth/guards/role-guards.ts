import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../services/role.service';

/**
 * Guard para SIM Cards:
 * Solo accesible para usuarios autenticados con rol, excepto si su rol es exclusivamente Técnico.
 */
export const simCardGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (roleService.hasAnyRole() && !roleService.isTecnico()) {
    return true;
  }

  router.navigate(['/products']);
  return false;
};

/**
 * Guard para Mantenimiento:
 * Solo accesible para usuarios autenticados con rol, excepto si su rol es exclusivamente Consultor o Auxiliar de Inventario.
 */
export const maintenanceGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (roleService.hasAnyRole() && !roleService.isConsultor() && !roleService.isAuxiliarInventario()) {
    return true;
  }

  router.navigate(['/products']);
  return false;
};
