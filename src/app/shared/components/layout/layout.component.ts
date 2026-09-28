import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RoleService } from '../../../core/auth/services/role.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  host: {
    'class': 'block h-full'
  },
  template: `
    <div class="flex h-full bg-slate-100 overflow-hidden">
      <!-- Desktop Sidebar -->
      <div class="hidden md:block h-full shrink-0">
        <app-sidebar />
      </div>

      <!-- Mobile Sidebar Drawer Overlay -->
      @if (isMobileMenuOpen()) {
        <div 
          (click)="toggleMobileMenu()"
          class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity"
        ></div>
        <div class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 md:hidden shadow-2xl transition-transform">
          <app-sidebar (click)="onMobileNavClick($event)" />
        </div>
      }

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header class="h-14 md:h-12 flex items-center justify-between md:justify-start px-4 md:px-6 bg-white border-b border-slate-200 shrink-0 shadow-xs">
          <div class="flex items-center gap-3">
            <!-- Mobile Hamburger Button -->
            <button
              (click)="toggleMobileMenu()"
              type="button"
              class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
              aria-label="Abrir menú"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <h1 class="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight truncate">
              Flota La Macarena <span class="text-slate-400 font-normal">·</span> Sistema de Inventario
            </h1>
          </div>
        </header>
        <main class="flex-1 overflow-auto p-3 sm:p-6">
          @if (!roleService.hasAnyRole()) {
            <div class="h-full min-h-[400px] flex items-center justify-center">
              <div class="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
                <div class="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                  🔒
                </div>
                <div class="space-y-1">
                  <h3 class="text-lg font-bold text-slate-800">Acceso no autorizado</h3>
                  <p class="text-xs text-slate-500 leading-relaxed">
                    Hola <span class="font-semibold text-slate-700">{{ roleService.userName() }}</span>, tu cuenta no tiene permisos asignados para acceder a los módulos de la plataforma.
                  </p>
                </div>
                <div class="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-left space-y-1.5 text-xs text-slate-600">
                  <p class="font-semibold text-slate-700">¿Cómo obtener acceso?</p>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Comunícate con el área de tecnología o con un administrador del sistema para que te asigne uno de los roles autorizados (<span class="font-mono text-indigo-600 font-semibold">admin, coordinador, técnico, consultor o auxiliar_inventario</span>) en Keycloak.
                  </p>
                </div>
              </div>
            </div>
          } @else {
            <router-outlet />
          }
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class LayoutComponent {
  public roleService = inject(RoleService);
  isMobileMenuOpen = signal(false);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMobileMenuOpen.set(false);
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  onMobileNavClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      this.isMobileMenuOpen.set(false);
    }
  }
}
