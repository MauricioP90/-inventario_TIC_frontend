import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GetAllSoftwareAppsUseCase,
  CreateSoftwareAppUseCase,
  GetAppVersionsUseCase,
  AddSoftwareVersionUseCase,
  SetVigenteVersionUseCase
} from '../../../application/use-cases/software.use-cases';
import { SoftwareApp, SoftwareVersion } from '../../../domain/models/software.model';

@Component({
  selector: 'app-software-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header y Acciones -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800">Catálogo de Aplicativos Corporativos</h2>
              <p class="text-xs text-slate-500">Administra las aplicaciones institucionales y sus versiones vigentes oficiales</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Buscador -->
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar aplicación..."
              class="w-56 pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Botón Nueva App -->
          <button
            type="button"
            (click)="openCreateAppModal()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Aplicativo
          </button>
        </div>
      </div>

      <!-- Banner de Toast -->
      @if (toast()) {
        <div
          class="p-4 rounded-xl text-xs font-medium flex items-center justify-between transition-all"
          [ngClass]="toast()!.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'"
        >
          <span>{{ toast()!.message }}</span>
          <button (click)="toast.set(null)" class="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      }

      <!-- Grid de Aplicativos -->
      @if (loadingApps()) {
        <div class="p-12 text-center text-slate-400">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p class="text-xs">Cargando catálogo de aplicaciones...</p>
        </div>
      } @else if (filteredApps().length === 0) {
        <div class="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="text-sm font-bold text-slate-700 mb-1">No hay aplicaciones registradas</h3>
          <p class="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Comienza registrando las aplicaciones móviles o software instalables en tus activos tecnológicos.
          </p>
          <button
            type="button"
            (click)="openCreateAppModal()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
          >
            + Registrar Primera Aplicación
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (app of filteredApps(); track app.id) {
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {{ app.nombre.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {{ app.nombre }}
                      </h3>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {{ app.estado }}
                      </span>
                    </div>
                  </div>
                </div>

                <p class="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                  {{ app.descripcion || 'Sin descripción detallada registrada.' }}
                </p>
              </div>

              <!-- Footer con botón para ver versiones -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-400 font-medium">
                  Versiones homologadas
                </span>
                <button
                  type="button"
                  (click)="openVersionsModal(app)"
                  class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Gestionar Versiones
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- MODAL: Crear Nueva Aplicación -->
      @if (showCreateAppModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800">Registrar Aplicación de Software</h3>
              <button (click)="showCreateAppModal.set(false)" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Aplicación <span class="text-rose-500">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newAppNombre"
                  placeholder="Ej: App Despacho Flota, POS Sunmi..."
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Descripción / Propósito</label>
                <textarea
                  [(ngModel)]="newAppDescripcion"
                  rows="3"
                  placeholder="Describe el objetivo y entorno donde opera..."
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
            </div>
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                (click)="showCreateAppModal.set(false)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="saveNewApp()"
                [disabled]="savingApp() || !newAppNombre.trim()"
                class="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {{ savingApp() ? 'Guardando...' : 'Guardar Aplicación' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Gestión de Versiones de una Aplicación -->
      @if (selectedApp()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div class="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header Modal -->
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-800">Versiones de {{ selectedApp()!.nombre }}</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {{ appVersions().length }} registradas
                  </span>
                </div>
                <p class="text-xs text-slate-400">Define la versión oficial vigente para la auditoría de activos</p>
              </div>
              <button (click)="selectedApp.set(null)" class="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <!-- Contenido Scrollable -->
            <div class="p-6 overflow-y-auto space-y-6">
              <!-- Formulario para Añadir Nueva Versión -->
              <div class="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                <h4 class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registrar Nueva Versión
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nº Versión <span class="text-rose-500">*</span></label>
                    <input
                      type="text"
                      [(ngModel)]="newVersionStr"
                      placeholder="Ej: 1.05, 2.10..."
                      class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Notas de Lanzamiento / Cambios</label>
                    <input
                      type="text"
                      [(ngModel)]="newVersionNotas"
                      placeholder="Ej: Corrección de impresión de tiquetes..."
                      class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div class="flex items-center justify-between pt-1">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      [(ngModel)]="newVersionEsVigente"
                      class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span class="text-xs font-semibold text-slate-700">Marcar de inmediato como Versión Oficial Vigente</span>
                  </label>
                  <button
                    type="button"
                    (click)="saveNewVersion()"
                    [disabled]="savingVersion() || !newVersionStr.trim()"
                    class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {{ savingVersion() ? 'Guardando...' : '+ Agregar Versión' }}
                  </button>
                </div>
              </div>

              <!-- Lista de Versiones Existentes -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-slate-700">Historial de Versiones Registradas</h4>
                @if (loadingVersions()) {
                  <div class="p-6 text-center text-slate-400 text-xs">Cargando versiones...</div>
                } @else if (appVersions().length === 0) {
                  <div class="p-6 text-center bg-slate-50 rounded-xl text-xs text-slate-400 border border-slate-200/60">
                    Aún no hay versiones registradas para esta aplicación.
                  </div>
                } @else {
                  <div class="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                    @for (v of appVersions(); track v.id) {
                      <div class="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                            [ngClass]="v.esVigente ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'"
                          >
                            {{ v.version }}
                          </div>
                          <div>
                            <div class="flex items-center gap-2">
                              <span class="text-xs font-bold text-slate-800">Versión {{ v.version }}</span>
                              @if (v.esVigente) {
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                                  ⭐ VIGENTE OFICIAL
                                </span>
                              }
                            </div>
                            <p class="text-[11px] text-slate-400">
                              {{ v.notasLanzamiento || 'Sin notas de lanzamiento registradas.' }}
                              <span class="text-slate-300">•</span>
                              {{ v.fechaLanzamiento | date:'mediumDate' }}
                            </p>
                          </div>
                        </div>

                        <!-- Botón para fijar vigente -->
                        @if (!v.esVigente) {
                          <button
                            type="button"
                            (click)="makeVersionVigente(v)"
                            class="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>☆</span> Fijar como Vigente
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                (click)="selectedApp.set(null)"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SoftwareTabComponent implements OnInit {
  private getAllSoftwareAppsUC = inject(GetAllSoftwareAppsUseCase);
  private createSoftwareAppUC = inject(CreateSoftwareAppUseCase);
  private getAppVersionsUC = inject(GetAppVersionsUseCase);
  private addSoftwareVersionUC = inject(AddSoftwareVersionUseCase);
  private setVigenteVersionUC = inject(SetVigenteVersionUseCase);

  apps = signal<SoftwareApp[]>([]);
  loadingApps = signal(false);
  searchQuery = '';

  filteredApps = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.apps();
    return this.apps().filter(a => a.nombre.toLowerCase().includes(q) || (a.descripcion && a.descripcion.toLowerCase().includes(q)));
  });

  // Modal Crear App
  showCreateAppModal = signal(false);
  savingApp = signal(false);
  newAppNombre = '';
  newAppDescripcion = '';

  // Modal Versiones
  selectedApp = signal<SoftwareApp | null>(null);
  appVersions = signal<SoftwareVersion[]>([]);
  loadingVersions = signal(false);
  savingVersion = signal(false);
  newVersionStr = '';
  newVersionNotas = '';
  newVersionEsVigente = false;

  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  ngOnInit() {
    this.loadApps();
  }

  loadApps() {
    this.loadingApps.set(true);
    this.getAllSoftwareAppsUC.execute().subscribe({
      next: (data) => {
        this.apps.set(data);
        this.loadingApps.set(false);
      },
      error: (err) => {
        this.showToast('error', 'Error al cargar aplicativos: ' + (err.error?.message || err.message));
        this.loadingApps.set(false);
      }
    });
  }

  openCreateAppModal() {
    this.newAppNombre = '';
    this.newAppDescripcion = '';
    this.showCreateAppModal.set(true);
  }

  saveNewApp() {
    if (!this.newAppNombre.trim()) return;
    this.savingApp.set(true);
    this.createSoftwareAppUC.execute({
      nombre: this.newAppNombre.trim(),
      descripcion: this.newAppDescripcion.trim() || undefined
    }).subscribe({
      next: (created) => {
        this.showToast('success', `Aplicación "${created.nombre}" registrada correctamente.`);
        this.showCreateAppModal.set(false);
        this.savingApp.set(false);
        this.loadApps();
      },
      error: (err) => {
        this.showToast('error', err.error?.message || err.message || 'Error al guardar la aplicación.');
        this.savingApp.set(false);
      }
    });
  }

  openVersionsModal(app: SoftwareApp) {
    this.selectedApp.set(app);
    this.newVersionStr = '';
    this.newVersionNotas = '';
    this.newVersionEsVigente = false;
    this.loadAppVersions(app.id);
  }

  loadAppVersions(appId: string) {
    this.loadingVersions.set(true);
    this.getAppVersionsUC.execute(appId).subscribe({
      next: (versions) => {
        this.appVersions.set(versions);
        this.loadingVersions.set(false);
      },
      error: (err) => {
        this.showToast('error', 'Error al cargar versiones: ' + (err.error?.message || err.message));
        this.loadingVersions.set(false);
      }
    });
  }

  saveNewVersion() {
    const app = this.selectedApp();
    if (!app || !this.newVersionStr.trim()) return;

    this.savingVersion.set(true);
    this.addSoftwareVersionUC.execute(app.id, {
      version: this.newVersionStr.trim(),
      notasLanzamiento: this.newVersionNotas.trim() || undefined,
      esVigente: this.newVersionEsVigente
    }).subscribe({
      next: (v) => {
        this.showToast('success', `Versión ${v.version} registrada con éxito.`);
        this.newVersionStr = '';
        this.newVersionNotas = '';
        this.newVersionEsVigente = false;
        this.savingVersion.set(false);
        this.loadAppVersions(app.id);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || err.message || 'Error al agregar la versión.');
        this.savingVersion.set(false);
      }
    });
  }

  makeVersionVigente(v: SoftwareVersion) {
    const app = this.selectedApp();
    if (!app) return;

    this.setVigenteVersionUC.execute(v.id).subscribe({
      next: () => {
        this.showToast('success', `Versión ${v.version} fijada como vigente oficial.`);
        this.loadAppVersions(app.id);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || err.message || 'Error al actualizar versión vigente.');
      }
    });
  }

  private showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ type, message });
    setTimeout(() => {
      if (this.toast()?.message === message) {
        this.toast.set(null);
      }
    }, 4500);
  }
}
