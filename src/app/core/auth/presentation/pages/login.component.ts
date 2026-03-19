import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">

      <!-- Card -->
      <div class="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        <!-- Header -->
        <div class="flex flex-col items-center pt-10 pb-6 px-8 bg-gradient-to-b from-indigo-50 to-white">
          <div class="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800">Flota La Macarena</h1>
          <p class="text-sm text-slate-500 mt-0.5">Sistema de Inventario</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="handleLogin()" #loginForm="ngForm" class="px-8 pb-8 pt-4 space-y-4">

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
              {{ error() }}
            </div>
          }

          <div class="space-y-1.5">
            <label for="login-email" class="block text-sm font-medium text-slate-700">Correo Electrónico</label>
            <input
              id="login-email"
              type="email"
              name="email"
              [(ngModel)]="email"
              placeholder="usuario@empresa.com"
              required
              class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <div class="space-y-1.5">
            <label for="login-password" class="block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              [(ngModel)]="password"
              placeholder="••••••••"
              required
              class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-lg transition-colors mt-2"
          >
            @if (loading()) {
              <span class="flex items-center justify-center gap-2">
                <span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Iniciando sesión...
              </span>
            } @else {
              Iniciar Sesión
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class LoginPageComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private router: Router) {}

  handleLogin() {
    this.error.set(null);

    if (!this.email || !this.password) {
      this.error.set('Por favor ingresa tu correo y contraseña.');
      return;
    }

    this.loading.set(true);

    // Simulación — reemplazar con llamada real al AuthService
    setTimeout(() => {
      this.loading.set(false);
      // Aquí conectarás tu AuthService del backend
      this.router.navigate(['/']);
    }, 800);
  }
}
