import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activo } from '../../../../features/inventory/domain/models/activo.model';
import {
  InstalledSoftwareEvaluation,
  SoftwareHistoryDetail,
  SoftwareApp,
  SoftwareVersion
} from '../../../../features/catalogs/domain/models/software.model';
import {
  GetActivoInstalledSoftwareUseCase,
  GetActivoSoftwareHistoryUseCase,
  GetAllSoftwareAppsUseCase,
  GetAppVersionsUseCase,
  InstallActivoSoftwareUseCase,
  UpgradeActivoSoftwareUseCase,
  RetireActivoSoftwareUseCase
} from '../../../../features/catalogs/application/use-cases/software.use-cases';

export interface PreSelectedApp {
  appId: string;
  appName: string;
  versionId: string;
  versionNumber: string;
  esVigente?: boolean;
  licencia?: string;
  observaciones?: string;
}

@Component({
  selector: 'app-activo-software-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 pt-4 border-t border-slate-200">
      <!-- Encabezado de la Sección -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800">
              {{ isCreationMode() ? 'Aplicativos a Asignar' : 'Aplicativos Instalados' }}
            </h3>
            <p class="text-[11px] text-slate-400">
              {{ isCreationMode() ? 'Pre-asignar software instalado al registrar el equipo' : 'Control de versiones corporativas y homologación' }}
            </p>
          </div>
        </div>

        @if (canEdit && !showInstallForm()) {
          <button
            type="button"
            (click)="openInstallForm()"
            class="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ isCreationMode() ? 'Asignar App' : 'Instalar App' }}
          </button>
        }
      </div>

      <!-- Alerta Toast Local -->
      @if (localAlert()) {
        <div
          class="p-2.5 rounded-lg text-xs font-medium flex items-center justify-between"
          [ngClass]="localAlert()!.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'"
        >
          <span>{{ localAlert()!.message }}</span>
          <button (click)="localAlert.set(null)" class="text-slate-400 hover:text-slate-600 font-bold ml-2">✕</button>
        </div>
      }

      <!-- Formulario Inline: Instalar / Asignar Software -->
      @if (showInstallForm()) {
        <div class="p-3.5 bg-slate-50 border border-indigo-100 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-indigo-900">
              {{ isCreationMode() ? 'Asignar Aplicativo al Nuevo Activo' : 'Nueva Instalación de Software' }}
            </span>
            <button (click)="showInstallForm.set(false)" class="text-slate-400 hover:text-slate-600 text-xs">✕ Cancelar</button>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Aplicación <span class="text-rose-500">*</span></label>
              <select
                [(ngModel)]="selectedAppId"
                (change)="onAppSelected()"
                class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>-- Selecciona un aplicativo --</option>
                @for (app of uninstalledApps(); track app.id) {
                  <option [value]="app.id">{{ app.nombre }}</option>
                }
              </select>
            </div>

            @if (selectedAppId) {
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Versión a Instalar <span class="text-rose-500">*</span></label>
                @if (loadingVersions()) {
                  <p class="text-[11px] text-slate-400">Cargando versiones...</p>
                } @else if (availableVersions().length === 0) {
                  <p class="text-[11px] text-rose-500">Esta app no tiene versiones registradas en Catálogos.</p>
                } @else {
                  <select
                    [(ngModel)]="selectedVersionId"
                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    @for (v of availableVersions(); track v.id) {
                      <option [value]="v.id">
                        Versión {{ v.version }} {{ v.esVigente ? '★ (Vigente Oficial)' : '' }}
                      </option>
                    }
                  </select>
                }
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Licencia / Clave (Opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="installLicencia"
                  placeholder="Ej: OEM-1234-ABCD"
                  class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Observaciones</label>
                <input
                  type="text"
                  [(ngModel)]="installObservaciones"
                  placeholder="Notas adicionales..."
                  class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            }
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="showInstallForm.set(false)"
              class="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="submitInstall()"
              [disabled]="installing() || !selectedVersionId"
              class="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
            >
              {{ isCreationMode() ? 'Agregar a la Lista' : (installing() ? 'Instalando...' : 'Confirmar Instalación') }}
            </button>
          </div>
        </div>
      }

      <!-- Formulario Inline: Actualizar Software -->
      @if (upgradingItem()) {
        <div class="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-900">Actualizar: {{ upgradingItem()!.appName }}</span>
            <button (click)="upgradingItem.set(null)" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
          <p class="text-[11px] text-slate-600">
            Versión actual instalada: <strong>{{ upgradingItem()!.installedVersion }}</strong>
          </p>

          <div class="space-y-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Nueva Versión <span class="text-rose-500">*</span></label>
              <select
                [(ngModel)]="upgradeVersionId"
                class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                @for (v of availableVersions(); track v.id) {
                  <option [value]="v.id">
                    Versión {{ v.version }} {{ v.esVigente ? '★ (Vigente Oficial)' : '' }}
                  </option>
                }
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Licencia / Clave</label>
              <input
                type="text"
                [(ngModel)]="upgradeLicencia"
                class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="upgradingItem.set(null)"
              class="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="submitUpgrade()"
              [disabled]="upgrading() || !upgradeVersionId"
              class="px-3 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50"
            >
              {{ upgrading() ? 'Actualizando...' : 'Confirmar Actualización' }}
            </button>
          </div>
        </div>
      }

      <!-- Formulario Inline: Retirar Software -->
      @if (retiringItem()) {
        <div class="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-900">Desinstalar: {{ retiringItem()!.appName }}</span>
            <button (click)="retiringItem.set(null)" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Motivo de Retiro / Desinstalación</label>
            <input
              type="text"
              [(ngModel)]="retireMotivo"
              placeholder="Ej: Cambio de software, equipo reasignado..."
              class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="retiringItem.set(null)"
              class="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="submitRetire()"
              [disabled]="retiring()"
              class="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
            >
              {{ retiring() ? 'Retirando...' : 'Confirmar Retiro' }}
            </button>
          </div>
        </div>
      }

      <!-- MODO CREACIÓN: Software Pre-seleccionado -->
      @if (isCreationMode()) {
        @if (preSelectedApps().length === 0 && !showInstallForm()) {
          <div class="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <p class="text-xs text-slate-500 font-medium">Sin aplicativos pre-asignados.</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Si este equipo ya tiene aplicaciones corporativas instaladas (ej: App TKM), haz clic en "Asignar App".</p>
          </div>
        } @else if (preSelectedApps().length > 0) {
          <div class="space-y-2">
            @for (item of preSelectedApps(); track item.appId) {
              <div class="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-800">{{ item.appName }}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      v{{ item.versionNumber }} {{ item.esVigente ? '★ (Vigente Oficial)' : '' }}
                    </span>
                  </div>
                  @if (item.licencia) {
                    <p class="text-[10px] text-slate-500 font-mono">🔑 Licencia: {{ item.licencia }}</p>
                  }
                  @if (item.observaciones) {
                    <p class="text-[10px] text-slate-400 italic">{{ item.observaciones }}</p>
                  }
                </div>

                @if (canEdit) {
                  <button
                    type="button"
                    (click)="removePreSelected(item.appId)"
                    class="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Quitar de la lista">
                    ✕ Quitar
                  </button>
                }
              </div>
            }
          </div>
        }
      } @else {
        <!-- MODO EDICIÓN: Lista de Software Actualmente Instalado con Semáforos -->
        @if (loadingInstalled()) {
          <div class="p-4 text-center text-xs text-slate-400">Cargando aplicaciones instaladas...</div>
        } @else if (installedList().length === 0) {
          <div class="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <p class="text-xs text-slate-500 font-medium">No tiene aplicaciones registradas</p>
            <p class="text-[11px] text-slate-400">Registra las apps corporativas que operan en este equipo.</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (item of installedList(); track item.historyId) {
              <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-800">{{ item.appName }}</span>
                      <!-- Semáforo de Versión -->
                      @if (item.semaforo === 'AL_DIA') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Al día (v{{ item.installedVersion }})
                        </span>
                      } @else if (item.semaforo === 'DESACTUALIZADO') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Requiere v{{ item.vigenteVersion }} (Instalada: v{{ item.installedVersion }})
                        </span>
                      } @else if (item.semaforo === 'BETA') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Versión Beta (v{{ item.installedVersion }})
                        </span>
                      } @else {
                        <span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          v{{ item.installedVersion }}
                        </span>
                      }
                    </div>

                    <div class="flex items-center gap-3 text-[11px] text-slate-500">
                      @if (item.licencia) {
                        <span class="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                          🔑 {{ item.licencia }}
                        </span>
                      }
                      <span>Instalado: {{ item.fechaInstalacion | date:'dd/MM/yyyy' }}</span>
                      <span>Por: {{ item.instaladoPor }}</span>
                    </div>

                    @if (item.observaciones) {
                      <p class="text-[10px] text-slate-400 italic">{{ item.observaciones }}</p>
                    }
                  </div>

                  <!-- Acciones sobre la app -->
                  @if (canEdit) {
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        (click)="openUpgrade(item)"
                        class="px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                        title="Actualizar versión"
                      >
                        Actualizar
                      </button>
                      <button
                        type="button"
                        (click)="openRetire(item)"
                        class="px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Desinstalar app"
                      >
                        Retirar
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Acordeón de Historial de Software -->
        @if (historyList().length > 0) {
          <div class="pt-2">
            <button
              type="button"
              (click)="showHistory.set(!showHistory())"
              class="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-800 py-1"
            >
              <span>Historial y Trazabilidad de Software ({{ historyList().length }})</span>
              <span>{{ showHistory() ? '▲ Ocultar' : '▼ Ver Historial' }}</span>
            </button>

            @if (showHistory()) {
              <div class="mt-2 space-y-1.5 divide-y divide-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200">
                @for (h of historyList(); track h.historyId) {
                  <div class="pt-1.5 first:pt-0 text-[11px]">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-700">{{ h.appName }} v{{ h.version }}</span>
                      <span
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        [ngClass]="h.estado === 'INSTALADO' ? 'bg-emerald-100 text-emerald-800' : (h.estado === 'ACTUALIZADO' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700')"
                      >
                        {{ h.estado }}
                      </span>
                    </div>
                    <p class="text-slate-400">
                      {{ h.fechaInstalacion | date:'short' }} por {{ h.instaladoPor }}
                      @if (h.retiradoPor) {
                        <span> • Retirado por {{ h.retiradoPor }} ({{ h.observaciones || 'Sin motivo' }})</span>
                      }
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class ActivoSoftwareSectionComponent implements OnInit, OnChanges {
  @Input() activo: Activo | null = null;
  @Input() canEdit = false;
  @Output() softwareChanged = new EventEmitter<void>();
  @Output() preSelectedAppsChange = new EventEmitter<PreSelectedApp[]>();

  private getInstalledSoftwareUC = inject(GetActivoInstalledSoftwareUseCase);
  private getHistoryUC = inject(GetActivoSoftwareHistoryUseCase);
  private getAllAppsUC = inject(GetAllSoftwareAppsUseCase);
  private getAppVersionsUC = inject(GetAppVersionsUseCase);
  private installUC = inject(InstallActivoSoftwareUseCase);
  private upgradeUC = inject(UpgradeActivoSoftwareUseCase);
  private retireUC = inject(RetireActivoSoftwareUseCase);

  isCreationMode = computed(() => !this.activo);
  preSelectedApps = signal<PreSelectedApp[]>([]);

  installedList = signal<InstalledSoftwareEvaluation[]>([]);
  historyList = signal<SoftwareHistoryDetail[]>([]);
  allApps = signal<SoftwareApp[]>([]);
  loadingInstalled = signal(false);

  showHistory = signal(false);
  localAlert = signal<{ type: 'success' | 'error', message: string } | null>(null);

  // Formulario Instalar
  showInstallForm = signal(false);
  installing = signal(false);
  selectedAppId = '';
  selectedVersionId = '';
  installLicencia = '';
  installObservaciones = '';
  availableVersions = signal<SoftwareVersion[]>([]);
  loadingVersions = signal(false);

  // Formulario Upgrade
  upgradingItem = signal<InstalledSoftwareEvaluation | null>(null);
  upgrading = signal(false);
  upgradeVersionId = '';
  upgradeLicencia = '';

  // Formulario Retirar
  retiringItem = signal<InstalledSoftwareEvaluation | null>(null);
  retiring = signal(false);
  retireMotivo = '';

  uninstalledApps = signal<SoftwareApp[]>([]);

  ngOnInit() {
    this.loadAllApps();
    if (this.activo) {
      this.refreshData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activo']) {
      if (this.activo) {
        this.preSelectedApps.set([]);
        this.refreshData();
      } else {
        this.installedList.set([]);
        this.historyList.set([]);
        this.computeUninstalledApps();
      }
    }
  }

  loadAllApps() {
    this.getAllAppsUC.execute().subscribe({
      next: (apps) => {
        this.allApps.set(apps.filter(a => a.estado === 'ACTIVO'));
        this.computeUninstalledApps();
      },
      error: (err) => console.error('Error loading software apps', err)
    });
  }

  refreshData() {
    if (!this.activo) return;
    this.loadingInstalled.set(true);

    this.getInstalledSoftwareUC.execute(this.activo.id).subscribe({
      next: (items) => {
        this.installedList.set(items);
        this.loadingInstalled.set(false);
        this.computeUninstalledApps();
      },
      error: (err) => {
        this.loadingInstalled.set(false);
        console.error('Error loading installed software', err);
      }
    });

    this.getHistoryUC.execute(this.activo.id).subscribe({
      next: (history) => this.historyList.set(history),
      error: (err) => console.error('Error loading software history', err)
    });
  }

  computeUninstalledApps() {
    if (this.isCreationMode()) {
      const preSelectedIds = new Set(this.preSelectedApps().map(i => i.appId));
      this.uninstalledApps.set(this.allApps().filter(a => !preSelectedIds.has(a.id)));
      return;
    }

    const installedAppIds = new Set(this.installedList().map(i => i.appId));
    this.uninstalledApps.set(this.allApps().filter(a => !installedAppIds.has(a.id)));
  }

  openInstallForm() {
    this.selectedAppId = '';
    this.selectedVersionId = '';
    this.installLicencia = '';
    this.installObservaciones = '';
    this.availableVersions.set([]);
    this.computeUninstalledApps();
    this.showInstallForm.set(true);
    this.upgradingItem.set(null);
    this.retiringItem.set(null);
  }

  onAppSelected() {
    if (!this.selectedAppId) return;
    this.loadingVersions.set(true);
    this.getAppVersionsUC.execute(this.selectedAppId).subscribe({
      next: (versions) => {
        this.availableVersions.set(versions);
        // Pre-seleccionar la versión vigente si existe
        const vigente = versions.find(v => v.esVigente);
        if (vigente) {
          this.selectedVersionId = vigente.id;
        } else if (versions.length > 0) {
          this.selectedVersionId = versions[0].id;
        }
        this.loadingVersions.set(false);
      },
      error: () => {
        this.loadingVersions.set(false);
        this.showAlert('error', 'Error al consultar versiones de la aplicación.');
      }
    });
  }

  submitInstall() {
    if (!this.selectedVersionId) return;

    if (this.isCreationMode()) {
      const app = this.allApps().find(a => a.id === this.selectedAppId);
      const version = this.availableVersions().find(v => v.id === this.selectedVersionId);
      if (!app || !version) return;

      const newItem: PreSelectedApp = {
        appId: app.id,
        appName: app.nombre,
        versionId: version.id,
        versionNumber: version.version,
        esVigente: version.esVigente,
        licencia: this.installLicencia.trim() || undefined,
        observaciones: this.installObservaciones.trim() || undefined
      };

      this.preSelectedApps.update(list => [...list, newItem]);
      this.preSelectedAppsChange.emit(this.preSelectedApps());
      this.computeUninstalledApps();
      this.showInstallForm.set(false);
      this.selectedAppId = '';
      this.selectedVersionId = '';
      this.installLicencia = '';
      this.installObservaciones = '';
      this.showAlert('success', `Aplicativo "${app.nombre}" agregado para instalación inicial.`);
      return;
    }

    if (!this.activo) return;
    this.installing.set(true);
    this.installUC.execute(this.activo.id, {
      softwareVersionId: this.selectedVersionId,
      licencia: this.installLicencia.trim() || undefined,
      observaciones: this.installObservaciones.trim() || undefined
    }).subscribe({
      next: () => {
        this.showAlert('success', 'Software instalado correctamente.');
        this.showInstallForm.set(false);
        this.installing.set(false);
        this.refreshData();
        this.softwareChanged.emit();
      },
      error: (err) => {
        this.showAlert('error', err.error?.message || err.message || 'Error al instalar software.');
        this.installing.set(false);
      }
    });
  }

  removePreSelected(appId: string) {
    this.preSelectedApps.update(list => list.filter(i => i.appId !== appId));
    this.preSelectedAppsChange.emit(this.preSelectedApps());
    this.computeUninstalledApps();
  }

  openUpgrade(item: InstalledSoftwareEvaluation) {
    this.upgradingItem.set(item);
    this.upgradeLicencia = item.licencia || '';
    this.showInstallForm.set(false);
    this.retiringItem.set(null);

    this.getAppVersionsUC.execute(item.appId).subscribe({
      next: (versions) => {
        this.availableVersions.set(versions);
        const vigente = versions.find(v => v.esVigente);
        if (vigente) {
          this.upgradeVersionId = vigente.id;
        } else if (versions.length > 0) {
          this.upgradeVersionId = versions[0].id;
        }
      }
    });
  }

  submitUpgrade() {
    const item = this.upgradingItem();
    if (!this.activo || !item || !this.upgradeVersionId) return;

    this.upgrading.set(true);
    this.upgradeUC.execute(this.activo.id, {
      newSoftwareVersionId: this.upgradeVersionId,
      licencia: this.upgradeLicencia.trim() || undefined
    }).subscribe({
      next: () => {
        this.showAlert('success', `Software ${item.appName} actualizado con éxito.`);
        this.upgradingItem.set(null);
        this.upgrading.set(false);
        this.refreshData();
        this.softwareChanged.emit();
      },
      error: (err) => {
        this.showAlert('error', err.error?.message || err.message || 'Error al actualizar software.');
        this.upgrading.set(false);
      }
    });
  }

  openRetire(item: InstalledSoftwareEvaluation) {
    this.retiringItem.set(item);
    this.retireMotivo = '';
    this.showInstallForm.set(false);
    this.upgradingItem.set(null);
  }

  submitRetire() {
    const item = this.retiringItem();
    if (!item) return;

    this.retiring.set(true);
    this.retireUC.execute(item.historyId, {
      motivoRetiro: this.retireMotivo.trim() || undefined
    }).subscribe({
      next: () => {
        this.showAlert('success', `Software ${item.appName} retirado.`);
        this.retiringItem.set(null);
        this.retiring.set(false);
        this.refreshData();
        this.softwareChanged.emit();
      },
      error: (err) => {
        this.showAlert('error', err.error?.message || err.message || 'Error al retirar software.');
        this.retiring.set(false);
      }
    });
  }

  private showAlert(type: 'success' | 'error', message: string) {
    this.localAlert.set({ type, message });
    setTimeout(() => {
      if (this.localAlert()?.message === message) {
        this.localAlert.set(null);
      }
    }, 4500);
  }
}
