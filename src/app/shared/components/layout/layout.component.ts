import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  host: {
    'class': 'block h-full'
  },
  template: `
    <div class="flex h-full bg-slate-100 overflow-hidden">
      <app-sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-12 flex items-center px-6 bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <h1 class="text-sm font-semibold text-slate-600">Flota La Macarena · Sistema de Inventario</h1>
        </header>
        <main class="flex-1 overflow-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class LayoutComponent {}
