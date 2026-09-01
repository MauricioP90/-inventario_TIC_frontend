import { Injectable, inject, computed } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private keycloak = inject(Keycloak);

  private hasRole(roleName: string): boolean {
    if (!this.keycloak.authenticated) return false;
    return (
      this.keycloak.hasRealmRole(roleName.toLowerCase()) ||
      this.keycloak.hasRealmRole(roleName.toUpperCase()) ||
      this.keycloak.hasRealmRole(roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase())
    );
  }

  // Identificación de roles base
  readonly isAdmin = computed(() => this.hasRole('admin'));
  readonly isCoordinador = computed(() => this.hasRole('coordinador'));
  readonly isTecnico = computed(() => this.hasRole('tecnico'));
  readonly isConsultor = computed(() => this.hasRole('consultor'));

  // Matriz de permisos de acciones
  readonly canCreateActivo = computed(() => this.isAdmin());
  readonly canEditActivo = computed(() => this.isAdmin() || this.isCoordinador() || this.isTecnico());
  readonly canDeleteActivo = computed(() => this.isAdmin());

  readonly canRegisterMovement = computed(() => this.isAdmin() || this.isCoordinador() || this.isTecnico());
  readonly canRegisterHurto = computed(() => this.isAdmin());

  readonly canManageResponsables = computed(() => this.isAdmin() || this.isCoordinador());
  readonly canManageLocations = computed(() => this.isAdmin() || this.isCoordinador());

  readonly canRegisterMaintenance = computed(() => this.isAdmin() || this.isTecnico());
  readonly canAccessCatalogs = computed(() => this.isAdmin());

  // Información visual del usuario
  readonly userName = computed(() => {
    const token = this.keycloak.tokenParsed;
    if (!token) return 'Usuario';
    return (token['name'] as string) || (token['preferred_username'] as string) || (token['email'] as string) || 'Usuario';
  });

  readonly userRoleLabel = computed(() => {
    if (this.isAdmin()) return 'Administrador';
    if (this.isCoordinador()) return 'Coordinador';
    if (this.isTecnico()) return 'Técnico';
    if (this.isConsultor()) return 'Consultor';
    return 'Consultor';
  });
}
