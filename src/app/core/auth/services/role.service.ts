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
  readonly isAuxiliarInventario = computed(() => this.hasRole('auxiliar_inventario'));
  readonly hasAnyRole = computed(() => 
    this.isAdmin() || this.isCoordinador() || this.isTecnico() || this.isConsultor() || this.isAuxiliarInventario()
  );

  // Matriz de permisos de acciones
  readonly canCreateActivo = computed(() => this.isAdmin());
  readonly canEditActivo = computed(() => this.isAdmin() || this.isCoordinador() || this.isTecnico());
  readonly canDeleteActivo = computed(() => this.isAdmin());

  readonly canRegisterMovement = computed(() => 
    this.isAdmin() || this.isCoordinador() || this.isTecnico() || this.isAuxiliarInventario()
  );
  readonly canRegisterHurto = computed(() => this.isAdmin());

  readonly canManageResponsables = computed(() => 
    this.isAdmin() || this.isCoordinador() || this.isAuxiliarInventario()
  );
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
    if (this.isAuxiliarInventario()) return 'Auxiliar de Inventario';
    return 'Sin Rol';
  });

  readonly userRoleTheme = computed(() => {
    if (this.isAdmin()) {
      return {
        avatar: 'bg-rose-600 text-white',
        badge: 'bg-rose-950/60 text-rose-300 border-rose-700/50'
      };
    }
    if (this.isCoordinador()) {
      return {
        avatar: 'bg-amber-600 text-white',
        badge: 'bg-amber-950/60 text-amber-300 border-amber-700/50'
      };
    }
    if (this.isTecnico()) {
      return {
        avatar: 'bg-indigo-600 text-white',
        badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50'
      };
    }
    if (this.isConsultor()) {
      return {
        avatar: 'bg-emerald-600 text-white',
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
      };
    }
    if (this.isAuxiliarInventario()) {
      return {
        avatar: 'bg-purple-600 text-white',
        badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50'
      };
    }
    // Usuario sin rol asignado
    return {
      avatar: 'bg-slate-600 text-slate-300',
      badge: 'bg-slate-800 text-slate-400 border-slate-700'
    };
  });
}
