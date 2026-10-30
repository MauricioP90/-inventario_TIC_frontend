import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TiposTabComponent } from '../../components/tipos-tab/tipos-tab.component';
import { NotificacionesTabComponent } from '../../components/notificaciones-tab/notificaciones-tab.component';
import { CargosTabComponent } from '../../components/cargos-tab/cargos-tab.component';
import { SoftwareTabComponent } from '../../components/software-tab/software-tab.component';
import { TelemetriaTabComponent } from '../../components/telemetria-tab/telemetria-tab.component';

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [
    CommonModule,
    TiposTabComponent,
    NotificacionesTabComponent,
    CargosTabComponent,
    SoftwareTabComponent,
    TelemetriaTabComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-50 p-6 space-y-6">

      <!-- Header & Tab Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Catálogos del Sistema</h1>
          <p class="text-sm text-slate-500 mt-0.5">Gestión de datos maestros, tipos de activo y matriz de notificaciones automáticas</p>
        </div>

        <div class="flex items-center gap-3">
          @if (activeTab() === 'tipos') {
            <button
              (click)="openNewTipo()"
              [disabled]="tiposTab?.showForm() === true"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              id="btn-nuevo-tipo"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Tipo
            </button>
          } @else if (activeTab() === 'notificaciones') {
            <button
              (click)="openNewDestinatario()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              id="btn-nuevo-destinatario"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Destinatario
            </button>
          } @else if (activeTab() === 'cargos') {
            <button
              (click)="openNewCargo()"
              [disabled]="cargosTab?.showCargoForm() === true"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              id="btn-nuevo-cargo"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Cargo
            </button>
          }
        </div>
      </div>

      <!-- Tabs Navigation Selector -->
      <div class="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          (click)="activeTab.set('tipos')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap"
          [class.border-indigo-600]="activeTab() === 'tipos'"
          [class.text-indigo-600]="activeTab() === 'tipos'"
          [class.border-transparent]="activeTab() !== 'tipos'"
          [class.text-slate-500]="activeTab() !== 'tipos'"
          [class.hover:text-slate-800]="activeTab() !== 'tipos'"
          id="tab-tipos"
        >
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          Tipos de Activo
          @if (tiposCount() > 0) {
            <span
              class="px-2 py-0.5 text-xs rounded-full"
              [class.bg-indigo-100]="activeTab() === 'tipos'"
              [class.text-indigo-700]="activeTab() === 'tipos'"
              [class.bg-slate-100]="activeTab() !== 'tipos'"
              [class.text-slate-600]="activeTab() !== 'tipos'"
            >{{ tiposCount() }}</span>
          }
        </button>

        <button
          (click)="activeTab.set('notificaciones')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap"
          [class.border-indigo-600]="activeTab() === 'notificaciones'"
          [class.text-indigo-600]="activeTab() === 'notificaciones'"
          [class.border-transparent]="activeTab() !== 'notificaciones'"
          [class.text-slate-500]="activeTab() !== 'notificaciones'"
          [class.hover:text-slate-800]="activeTab() !== 'notificaciones'"
          id="tab-notificaciones"
        >
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Notificaciones Automáticas
          @if (recipientsCount() > 0) {
            <span
              class="px-2 py-0.5 text-xs rounded-full"
              [class.bg-indigo-100]="activeTab() === 'notificaciones'"
              [class.text-indigo-700]="activeTab() === 'notificaciones'"
              [class.bg-slate-100]="activeTab() !== 'notificaciones'"
              [class.text-slate-600]="activeTab() !== 'notificaciones'"
            >{{ recipientsCount() }}</span>
          }
        </button>

        <button
          (click)="activeTab.set('cargos')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap"
          [class.border-indigo-600]="activeTab() === 'cargos'"
          [class.text-indigo-600]="activeTab() === 'cargos'"
          [class.border-transparent]="activeTab() !== 'cargos'"
          [class.text-slate-500]="activeTab() !== 'cargos'"
          [class.hover:text-slate-800]="activeTab() !== 'cargos'"
          id="tab-cargos"
        >
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
          </svg>
          Cargos / Puestos
          @if (cargosCount() > 0) {
            <span
              class="px-2 py-0.5 text-xs rounded-full"
              [class.bg-indigo-100]="activeTab() === 'cargos'"
              [class.text-indigo-700]="activeTab() === 'cargos'"
              [class.bg-slate-100]="activeTab() !== 'cargos'"
              [class.text-slate-600]="activeTab() !== 'cargos'"
            >{{ cargosCount() }}</span>
          }
        </button>

        <button
          (click)="activeTab.set('software')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap"
          [class.border-indigo-600]="activeTab() === 'software'"
          [class.text-indigo-600]="activeTab() === 'software'"
          [class.border-transparent]="activeTab() !== 'software'"
          [class.text-slate-500]="activeTab() !== 'software'"
          [class.hover:text-slate-800]="activeTab() !== 'software'"
          id="tab-software"
        >
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Aplicativos
        </button>

        <button
          (click)="activeTab.set('telemetria')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap"
          [class.border-indigo-600]="activeTab() === 'telemetria'"
          [class.text-indigo-600]="activeTab() === 'telemetria'"
          [class.border-transparent]="activeTab() !== 'telemetria'"
          [class.text-slate-500]="activeTab() !== 'telemetria'"
          [class.hover:text-slate-800]="activeTab() !== 'telemetria'"
          id="tab-telemetria"
        >
          <span>📡</span>
          Telemetría y Geocerca
        </button>
      </div>

      <!-- Tab Contents -->
      @if (activeTab() === 'tipos') {
        <app-tipos-tab #tiposTab (countChanged)="tiposCount.set($event)" (showToast)="onShowToast($event)" />
      } @else if (activeTab() === 'notificaciones') {
        <app-notificaciones-tab #notificacionesTab (countChanged)="recipientsCount.set($event)" (showToast)="onShowToast($event)" />
      } @else if (activeTab() === 'cargos') {
        <app-cargos-tab #cargosTab (countChanged)="cargosCount.set($event)" (showToast)="onShowToast($event)" />
      } @else if (activeTab() === 'software') {
        <app-software-tab #softwareTab />
      } @else if (activeTab() === 'telemetria') {
        <app-telemetria-tab #telemetriaTab (showToast)="onShowToast($event)" />
      }

      <!-- Global Floating Toast Notification -->
      @if (toast()) {
        <div
          class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all animate-bounce"
          [class.bg-emerald-600]="toast()?.type === 'success'"
          [class.text-white]="toast()?.type === 'success'"
          [class.bg-red-600]="toast()?.type === 'error'"
          [class.text-white]="toast()?.type === 'error'"
        >
          @if (toast()?.type === 'success') {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          } @else {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          <span>{{ toast()?.message }}</span>
        </div>
      }

    </div>
  `
})
export class CatalogsComponent {
  @ViewChild('tiposTab') tiposTab?: TiposTabComponent;
  @ViewChild('notificacionesTab') notificacionesTab?: NotificacionesTabComponent;
  @ViewChild('cargosTab') cargosTab?: CargosTabComponent;
  @ViewChild('softwareTab') softwareTab?: SoftwareTabComponent;

  activeTab = signal<'tipos' | 'notificaciones' | 'cargos' | 'software' | 'telemetria'>('tipos');

  tiposCount = signal(0);
  recipientsCount = signal(0);
  cargosCount = signal(0);

  toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  openNewTipo() {
    this.tiposTab?.openNewForm();
  }

  openNewDestinatario() {
    this.notificacionesTab?.openRecipientModal();
  }

  openNewCargo() {
    this.cargosTab?.openNewCargoForm();
  }

  openNewSoftwareApp() {
    this.softwareTab?.openCreateAppModal();
  }

  onShowToast(t: { type: 'success' | 'error'; message: string }) {
    this.toast.set(t);
    setTimeout(() => this.toast.set(null), 3500);
  }
}
