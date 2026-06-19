import { Component, Input, Output, EventEmitter, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CreateActivoUseCase } from '../../../features/inventory/application/use-cases/create-activo.use-case';
import { GetAllResponsablesUseCase } from '../../../features/responsables/application/use-cases/get-all-responsables.use-case';
import { GetActivoMetadataUseCase } from '../../../features/inventory/application/use-cases/get-activo-metadata.use-case';
import { Responsable } from '../../../features/responsables/domain/models/responsable.model';
import { Activo, ActivoMetadata } from '../../../features/inventory/domain/models/activo.model';
import { Location } from '../../../features/locations/domain/models/location.model';
import { GetAllLocationsUseCase } from '../../../features/locations/application/use-cases/get-all-locations.use-case';
import { environment } from '../../../../environments/environment';
import { UpdateActivoUseCase } from '../../../features/inventory/application/use-cases/update-activo.use-case';
import { CreateTipoActivoUseCase } from '../../../features/inventory/application/use-cases/create-tipo-activo.use-case';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-add-activo-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    @if (open) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        (click)="close()"
      ></div>
    }

    <!-- Drawer panel -->
    <div
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300"
      [class.translate-x-0]="open"
      [class.translate-x-full]="!open"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div>
          <h2 class="text-base font-bold text-slate-800">{{ activo ? 'Editar Activo' : 'Nuevo Activo' }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">{{ activo ? 'Modifica los datos del equipo seleccionado.' : 'Completa los datos del equipo a registrar.' }}</p>
        </div>
        <button (click)="close()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Toast Alerts (Fixed position) -->
      @if (toast()) {
        <div class="px-6 py-3 shrink-0">
          <div [class]="toast()!.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 leading-relaxed shadow-sm'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 leading-relaxed shadow-sm'">
            {{ toast()!.message }}
          </div>
        </div>
      }

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <!-- Tipo de Dispositivo -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Tipo de Dispositivo <span class="text-red-500">*</span></label>
          <select [(ngModel)]="tipo" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar tipo</option>
            @for (type of metadata()?.types; track type.id) {
              <option [value]="type.id">{{ type.label }}</option>
            }
          </select>

          @if (isAdmin()) {
            @if (showNewTipoForm()) {
              <div class="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1.5">
                <input type="text" [(ngModel)]="newTipoNombreValue" placeholder="Escribe el nombre del nuevo tipo (Ej: Monitor)"
                  class="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white" />
                <button type="button" (click)="saveNewTipo()" [disabled]="savingNewTipo()"
                  class="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors flex items-center justify-center"
                  title="Guardar nuevo tipo">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <button type="button" (click)="cancelNewTipo()" [disabled]="savingNewTipo()"
                  class="text-xs text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title="Cancelar">
                  Cancelar
                </button>
              </div>
            } @else {
              <button type="button" (click)="addNewTipoActivo()" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-1 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nuevo tipo
              </button>
            }
          }
        </div>

        <!-- Marca -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Marca <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="marca" placeholder="Ej: Dell"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Modelo -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Modelo <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="modelo" placeholder="Ej: Latitude 5540"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Número de Serie -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Número de Serie <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="serial" placeholder="Ej: SN-DL5540-XYZ"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Placa -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Placa <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="placa" placeholder="Ej: 1528-00001"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Bodega de ingreso -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Ubicación Actual</label>
          <select 
            [(ngModel)]="locationId" 
            [disabled]="!!(activo && activo.estado !== 'DISPONIBLE')" 
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
            
            @if (activo && activo.estado !== 'DISPONIBLE') {
              <option [value]="locationId">{{ locationMap()[locationId]?.nombre || 'Cargando...' }}</option>
            } @else {
              <option value="" disabled>Seleccionar bodega</option>
              @for (bodega of metadata()?.bodegas; track bodega.id) {
                <option [value]="bodega.id">{{ bodega.nombre }}</option>
              }
            }
          </select>
          
          @if (activo && activo.estado !== 'DISPONIBLE') {
            <p class="text-[10px] text-amber-600 font-medium mt-1">
              ⚠️ Para cambiar la ubicación de un equipo en operación, use el módulo de Movimientos.
            </p>
          }
        </div>

        <!-- Estado -->
        @if (activo) {
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700">Estado <span class="text-red-500">*</span></label>
            <select [(ngModel)]="estado" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="" disabled>Seleccionar estado</option>
              @for (status of metadata()?.statuses; track status.id) {
                @if (status.id !== 'BAJA') {
                  <option [value]="status.id">{{ status.label }}</option>
                }
              }
            </select>
          </div>
        }

        <!-- Responsable -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Responsable <span class="text-red-500">*</span></label>
          <select [(ngModel)]="responsibleId" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar responsable</option>
            @for (resp of responsibles(); track resp.id) {
              <option [value]="resp.id">{{ resp.nombre }}</option>
            }
          </select>
          <p class="text-xs text-slate-400">El responsable debe tener permisos asignados en la bodega seleccionada.</p>
        </div>

        <!-- Fecha Ingreso -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Fecha de Ingreso <span class="text-red-500">*</span></label>
          <input type="date" [(ngModel)]="fechaIngreso"
            [disabled]="!!activo"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" />
        </div>

        <!-- Precio Compra (Sólo visible para ADMIN) -->
        @if (isAdmin()) {
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700">Precio de Compra <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" [(ngModel)]="precioCompra" placeholder="Ej: 2500000"
                [disabled]="!!activo"
                class="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" />
            </div>
          </div>
        }

        <!-- Factura / Soporte -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Factura / Soporte <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
          <label class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
            @if (uploadingFile()) {
              <div class="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span class="text-sm text-slate-500">Subiendo archivo...</span>
            } @else {
              <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/>
              </svg>
              @if (facturaUrl()) {
                <span class="text-sm text-emerald-600 font-medium">✓ {{ fileName }}</span>
              } @else {
                <span class="text-sm text-slate-500">{{ fileName || 'Arrastra o haz clic para subir archivo' }}</span>
              }
              <span class="text-xs text-slate-400">PDF, JPG, PNG (máx. 5MB)</span>
            }
            <input type="file" class="hidden" accept=".pdf,.jpg,.png,.jpeg" (change)="onFileChange($event)" />
          </label>
        </div>

        <!-- Datos de Entrada a Mantenimiento (Dynamic form section) -->
        @if (activo?.estado !== 'MANTENIMIENTO' && estado === 'MANTENIMIENTO') {
          <div class="border-t border-slate-200 pt-4 space-y-4">
            <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Apertura de Mantenimiento</h4>
            
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Modalidad <span class="text-red-500">*</span></label>
              <select [(ngModel)]="maintModalidad" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="INTERNO">Interno (Bodega / Taller)</option>
                <option value="EXTERNO">Externo (Proveedor Directo)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Tipo de Mantenimiento <span class="text-red-500">*</span></label>
              <select [(ngModel)]="maintTipo" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="PREVENTIVO">Preventivo</option>
                <option value="CORRECTIVO">Correctivo</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Costo Estimado <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" [(ngModel)]="maintCostoEstimado" placeholder="Ej: 150000"
                  class="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Técnico Responsable / Proveedor <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
              <input type="text" [(ngModel)]="maintTecnicoResponsable" placeholder="Ej: Juan Pérez o Service Center"
                class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
            </div>
          </div>
        }

        <!-- Historial de Mantenimientos -->
        @if (activo) {
          <div class="border-t border-slate-200 pt-5 space-y-4">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de Mantenimientos</h4>
            
            @if (maintHistory().length === 0) {
              <p class="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                Este activo no registra mantenimientos anteriores.
              </p>
            } @else {
              <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
                @for (hist of maintHistory(); track hist.id) {
                  <div class="bg-slate-50/50 border border-slate-150 rounded-xl p-3 text-xs space-y-2 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-700 font-mono">#{{ hist.id.substring(0, 8) }}</span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white" 
                        [class]="hist.estado === 'CERRADO' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-amber-600 border-amber-100 bg-amber-50'">
                        {{ hist.estado }}
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-500">
                      <div><span class="font-medium text-slate-400">Tipo:</span> {{ hist.tipoMantenimiento }}</div>
                      <div><span class="font-medium text-slate-400">Modalidad:</span> {{ hist.modalidad }}</div>
                      @if (hist.tecnicoResponsable || hist.proveedorServicio) {
                        <div class="col-span-2">
                          <span class="font-medium text-slate-400">Resp/Téc:</span> {{ hist.tecnicoResponsable || hist.proveedorServicio }}
                        </div>
                      }
                      @if (hist.fechaApertura) {
                        <div class="col-span-2 text-[10px] text-slate-400">
                          Abierto el: {{ hist.fechaApertura | date:'dd/MM/yyyy HH:mm' }}
                        </div>
                      }
                    </div>

                    @if (hist.diagnostico) {
                      <div class="bg-white border border-slate-100 rounded-lg p-2 mt-1">
                        <span class="font-bold text-slate-400 text-[10px] block uppercase">Diagnóstico</span>
                        <p class="text-slate-600 italic text-[11px] leading-relaxed mt-0.5">{{ hist.diagnostico }}</p>
                      </div>
                    }

                    @if (hist.accionesRealizadas) {
                      <div class="bg-white border border-slate-100 rounded-lg p-2 mt-1">
                        <span class="font-bold text-slate-400 text-[10px] block uppercase">Acciones Realizadas</span>
                        <p class="text-slate-600 text-[11px] leading-relaxed mt-0.5">{{ hist.accionesRealizadas }}</p>
                      </div>
                    }

                    @if (hist.resultadoFinal) {
                      <div class="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-100 mt-2">
                        <span class="text-slate-400">Resultado Final:</span>
                        <span [class]="hist.resultadoFinal === 'REPARADO' ? 'text-emerald-600' : 'text-rose-600'">
                          {{ hist.resultadoFinal }}
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 shrink-0">
        <button (click)="handleSave()" [disabled]="saving()"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
          @if (saving()) {
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Guardando...
          } @else {
            {{ activo ? 'Actualizar Activo' : 'Guardar Activo' }}
          }
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AddActivoDrawerComponent implements OnInit {
  private updateActivoUseCase = inject(UpdateActivoUseCase);
  private createActivoUseCase = inject(CreateActivoUseCase);
  private getResponsablesUC = inject(GetAllResponsablesUseCase);
  private getMetadataUC = inject(GetActivoMetadataUseCase);
  private getLocationsUC = inject(GetAllLocationsUseCase);
  private createTipoActivoUC = inject(CreateTipoActivoUseCase);
  private http = inject(HttpClient);
  private keycloak = inject(Keycloak);

  isAdmin = computed(() => this.keycloak.hasRealmRole('admin') || this.keycloak.hasRealmRole('ADMIN'));

  // Maintenance fields for auto-creating a report
  maintModalidad = 'INTERNO';
  maintTipo = 'PREVENTIVO';
  maintCostoEstimado?: number;
  maintTecnicoResponsable = '';

  // Maintenance history
  maintHistory = signal<any[]>([]);

  @Input() open = false;
  @Input() set activo(val: Activo | null) {
    this._activo = val;
    if (val) {
      this.populateForm(val);
      this.loadMaintHistory(val.id);
    } else {
      this.resetForm();
      this.maintHistory.set([]);
    }
  }
  get activo() { return this._activo; }
  private _activo: Activo | null = null;

  loadMaintHistory(activoId: string) {
    this.http.get<any[]>(`${environment.apiUrl}/maintenance/history?activoId=${activoId}`).subscribe({
      next: (history) => this.maintHistory.set(history || []),
      error: (err) => console.error("Error loading maintenance history", err)
    });
  }

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  responsibles = signal<Responsable[]>([]);
  locations = signal<Location[]>([]);
  metadata = signal<ActivoMetadata | null>(null);

  locationMap = computed(() => {
    return this.locations().reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  });

  saving = signal(false);
  uploadingFile = signal(false);
  facturaUrl = signal<string | null>(null);

  showNewTipoForm = signal(false);
  newTipoNombreValue = '';
  savingNewTipo = signal(false);

  tipo = '';
  marca = '';
  modelo = '';
  serial = '';
  placa = '';
  estado = '';
  locationId = '';
  responsibleId = '';
  fechaIngreso = '';
  precioCompra: number | null = null;
  fileName = '';
  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.getResponsablesUC.execute().subscribe(resps => this.responsibles.set(resps));
    this.getMetadataUC.execute().subscribe(meta => this.metadata.set(meta));
    this.getLocationsUC.execute().subscribe(locs => this.locations.set(locs));
  }

  private populateForm(a: Activo) {
    this.tipo = a.tipoActivoId;
    this.marca = a.marca;
    this.modelo = a.modelo;
    this.serial = a.serial;
    this.placa = a.placa;
    this.estado = a.estado;
    this.locationId = a.locationId;
    this.responsibleId = a.responsibleId;
    this.precioCompra = a.precioCompra ?? null;
    if (a.fechaIngreso) {
      const d = new Date(a.fechaIngreso);
      this.fechaIngreso = d.toISOString().split('T')[0];
    }
    this.facturaUrl.set(a.facturaUrl || null);
    this.fileName = a.facturaUrl ? 'Factura cargada' : '';
  }

  close() {
    this.openChange.emit(false);
    this.toast.set(null);
    this.showNewTipoForm.set(false);
    this.newTipoNombreValue = '';
    if (!this.activo) {
      this.resetForm();
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.set({ type: 'error', message: 'El archivo no puede superar los 5MB.' });
      return;
    }
    this.fileName = file.name;
    this.uploadingFile.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'facturas'
      }).subscribe({
        next: (res) => {
          this.facturaUrl.set(res.url);
          this.uploadingFile.set(false);
        },
        error: () => {
          this.uploadingFile.set(false);
          this.toast.set({ type: 'error', message: 'Error al subir el archivo.' });
        }
      });
    };
    reader.readAsDataURL(file);
  }

  handleSave() {
    this.toast.set(null);
    if (!this.tipo || !this.marca || !this.modelo || !this.serial || !this.placa || !this.estado || !this.locationId || !this.responsibleId || !this.fechaIngreso) {
      this.toast.set({ type: 'error', message: 'Por favor completa todos los campos obligatorios.' });
      return;
    }
    this.saving.set(true);
    const payload = {
      tipoActivoId: this.tipo,
      marca: this.marca,
      modelo: this.modelo,
      serial: this.serial,
      placa: this.placa,
      estado: this.estado as any,
      locationId: this.locationId,
      responsibleId: this.responsibleId,
      fechaIngreso: this.fechaIngreso,
      facturaUrl: this.facturaUrl() ?? undefined,
      precioCompra: this.precioCompra ?? undefined,
      ...(this.estado === 'MANTENIMIENTO' && {
        maintenanceModalidad: this.maintModalidad,
        maintenanceTipo: this.maintTipo,
        maintenanceCostoEstimado: this.maintCostoEstimado,
        maintenanceTecnicoResponsable: this.maintTecnicoResponsable
      })
    };
    const request$ = this.activo 
      ? this.updateActivoUseCase.execute(this.activo.placa, payload) 
      : this.createActivoUseCase.execute(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.set({ type: 'success', message: `Activo "${this.placa}" ${this.activo ? 'actualizado' : 'guardado'} exitosamente.` });
        if (!this.activo) this.resetForm();
        setTimeout(() => {
          this.toast.set(null);
          this.close();
          this.saved.emit();
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Error inesperado.';
        this.toast.set({ type: 'error', message: msg });
      }
    });
  }

  addNewTipoActivo() {
    this.showNewTipoForm.set(true);
    this.newTipoNombreValue = '';
  }

  cancelNewTipo() {
    this.showNewTipoForm.set(false);
    this.newTipoNombreValue = '';
  }

  saveNewTipo() {
    const cleanNombre = this.newTipoNombreValue.trim();
    if (!cleanNombre) return;
    if (cleanNombre.length < 3) {
      this.toast.set({ type: 'error', message: 'El nombre del tipo debe tener al menos 3 caracteres.' });
      return;
    }

    this.savingNewTipo.set(true);
    this.createTipoActivoUC.execute(cleanNombre).subscribe({
      next: (res) => {
        this.getMetadataUC.execute().subscribe(meta => {
          this.metadata.set(meta);
          this.tipo = res.id;
          this.savingNewTipo.set(false);
          this.showNewTipoForm.set(false);
          this.newTipoNombreValue = '';
        });
      },
      error: (err) => {
        this.savingNewTipo.set(false);
        const msg = err.error?.message || 'Error al crear el tipo de activo.';
        this.toast.set({ type: 'error', message: msg });
      }
    });
  }

  private resetForm() {
    this.tipo = '';
    this.marca = '';
    this.modelo = '';
    this.serial = '';
    this.placa = '';
    this.estado = 'DISPONIBLE';
    this.locationId = '';
    this.responsibleId = '';
    this.fechaIngreso = '';
    this.precioCompra = null;
    this.fileName = '';
    this.facturaUrl.set(null);
    this.toast.set(null);
    this.maintModalidad = 'INTERNO';
    this.maintTipo = 'PREVENTIVO';
    this.maintCostoEstimado = undefined;
    this.maintTecnicoResponsable = '';
    this.maintHistory.set([]);
  }
}
