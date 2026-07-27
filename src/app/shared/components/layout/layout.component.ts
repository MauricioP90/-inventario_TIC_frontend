import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
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
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class LayoutComponent {
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
