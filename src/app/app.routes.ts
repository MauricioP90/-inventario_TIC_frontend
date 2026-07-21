import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { authGuard } from './core/auth/guards/auth-guard';
import { adminGuard } from './core/auth/guards/admin-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/presentation/pages/login.component').then(m => m.LoginPageComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/presentation/pages/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/inventory/presentation/pages/inventory/inventory.component').then(m => m.InventoryPageComponent)
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./features/locations/presentation/pages/locations-list/locations-list.component').then(m => m.LocationsListComponent)
      },
      {
        path: 'movements',
        loadComponent: () =>
          import('./features/movements/presentation/pages/movements/movements.component').then(m => m.MovementsPageComponent)
      },
      {
        path: 'sim-cards',
        loadComponent: () =>
          import('./features/sim-cards/presentation/pages/sim-cards/sim-cards.component').then(m => m.SimCardsPageComponent)
      },
      {
        path: 'responsables',
        loadComponent: () =>
          import('./features/responsables/presentation/pages/responsables/responsables.component').then(m => m.ResponsablesPageComponent)
      },
      {
        path: 'catalogs',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/catalogs/presentation/pages/catalogs/catalogs.component').then(m => m.CatalogsComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/dashboard/presentation/pages/reports/reports.component').then(m => m.ReportsPageComponent)
      },

      {
        path: 'maintenance',
        loadComponent: () =>
          import('./features/maintenance/presentation/pages/maintenance/maintenance-list.component').then(m => m.MaintenanceListComponent)
      },
    ]
  },
  {
    path: 'public/receive/:token',
    loadComponent: () =>
      import('./features/movements/presentation/pages/magic-link/magic-link-receive.component').then(m => m.MagicLinkReceiveComponent)
  },
  { path: '**', redirectTo: 'login' }
];
