import { Component, Input, Output, EventEmitter, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { RoleService } from '../../../core/auth/services/role.service';
import { Area } from '../../../features/responsables/domain/models/area.model';
import { GetAllAreasUseCase } from '../../../features/responsables/application/use-cases/get-all-areas.use-case';
import { ActivoFacturaSectionComponent } from './activo-components/activo-factura-section.component';
import { ActivoMaintenanceTriggerComponent } from './activo-components/activo-maintenance-trigger.component';
import { ActivoHistorySectionComponent } from './activo-components/activo-history-section.component';

@Component({
  selector: 'app-add-activo-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ActivoFacturaSectionComponent,
    ActivoMaintenanceTriggerComponent,
    ActivoHistorySectionComponent
  ],
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

      <!-- Form Content -->
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
            <p class="text-[11px] text-slate-400 mt-1">
              ¿No encuentras el tipo? Adminístralo en <a routerLink="/catalogs" (click)="close()" class="text-indigo-600 hover:underline font-semibold">Catálogos</a>.
            </p>
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
          <input type="text" [ngModel]="placa" (input)="onPlacaInput($event)" placeholder="Ej: 1528-000001" maxlength="11"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-mono" />
          <p class="text-[11px] text-slate-400">Formato requerido: <span class="font-mono">0000-000000</span> (4 números - 6 números).</p>
        </div>

        <!-- Bodega de ingreso -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Ubicación Actual</label>
          <select 
            [(ngModel)]="locationId" 
            (change)="onLocationChange()"
            [disabled]="!!(activo && activo.estado !== 'DISPONIBLE')" 
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
            
            @if (activo && activo.estado !== 'DISPONIBLE') {
              <option [value]="locationId">{{ locationMap()[locationId]?.nombre || 'Cargando...' }}</option>
            } @else {
              <option value="" disabled>Ubicación Inicial</option>
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

        <!-- Área -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Área <span class="text-red-500">*</span></label>
          @if (getAvailableAreas().length > 0) {
            <select [(ngModel)]="areaId" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="" disabled>Seleccionar área</option>
              @for (area of getAvailableAreas(); track area.id) {
                <option [value]="area.id">{{ area.nombre }}</option>
              }
            </select>
          } @else {
            <select [disabled]="true" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-500">
              <option value="8b8b9c8c-1e2a-43cf-8a27-024848bb0000">NO APLICA</option>
            </select>
          }
        </div>

        <!-- Fecha Ingreso -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Fecha de Ingreso <span class="text-red-500">*</span></label>
          <input type="date" [(ngModel)]="fechaIngreso"
            [disabled]="!!activo"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" />
        </div>

        <!-- Precio Compra (Admin only) -->
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

        <!-- Factura y Justificación de Auditoría -->
        <app-activo-factura-section
          [activo]="activo"
          [facturaUrl]="facturaUrl()"
          (facturaUrlChange)="facturaUrl.set($event)"
          [fileName]="fileName"
          (fileNameChange)="fileName = $event"
          [precioCompra]="precioCompra"
          [justification]="justification"
          (justificationChange)="justification = $event"
          (uploadError)="toast.set({ type: 'error', message: $event })"
        />

        <!-- Apertura de Mantenimiento Dinámico -->
        @if (activo?.estado !== 'MANTENIMIENTO' && estado === 'MANTENIMIENTO') {
          <app-activo-maintenance-trigger
            [modalidad]="maintModalidad"
            (modalidadChange)="maintModalidad = $event"
            [tipo]="maintTipo"
            (tipoChange)="maintTipo = $event"
            [costoEstimado]="maintCostoEstimado"
            (costoEstimadoChange)="maintCostoEstimado = $event"
            [tecnicoResponsable]="maintTecnicoResponsable"
            (tecnicoResponsableChange)="maintTecnicoResponsable = $event"
          />
        }

        <!-- Historiales de Mantenimiento y Auditoría -->
        @if (activo) {
          <app-activo-history-section
            [maintHistory]="maintHistory()"
            [auditHistory]="auditHistory()"
          />
        }

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 shrink-0">
        @if ((!activo && roleService.canCreateActivo()) || (activo && roleService.canEditActivo())) {
          <button (click)="handleSave()" [disabled]="saving()"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
            @if (saving()) {
              <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Guardando...
            } @else {
              {{ activo ? 'Actualizar Activo' : 'Guardar Activo' }}
            }
          </button>
        }
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
  private http = inject(HttpClient);
  public roleService = inject(RoleService);
  private getAllAreasUC = inject(GetAllAreasUseCase);

  isAdmin = computed(() => this.roleService.isAdmin());

  // Maintenance fields for auto-creating a report
  maintModalidad = 'INTERNO';
  maintTipo = 'PREVENTIVO';
  maintCostoEstimado?: number;
  maintTecnicoResponsable = '';

  // Maintenance history
  maintHistory = signal<any[]>([]);

  // Audit history & justification
  justification = '';
  auditHistory = signal<any[]>([]);

  @Input() open = false;
  @Input() set activo(val: Activo | null) {
    this._activo = val;
    if (val) {
      this.populateForm(val);
      this.loadMaintHistory(val.id);
      this.loadAuditHistory(val.id);
    } else {
      this.resetForm();
      this.maintHistory.set([]);
      this.auditHistory.set([]);
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

  loadAuditHistory(activoId: string) {
    this.http.get<any[]>(`${environment.apiUrl}/activos/${activoId}/audit-history`).subscribe({
      next: (history) => this.auditHistory.set(history || []),
      error: (err) => console.error("Error loading audit history", err)
    });
  }

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<string>();

  responsibles = signal<Responsable[]>([]);
  locations = signal<Location[]>([]);
  areas = signal<Area[]>([]);
  metadata = signal<ActivoMetadata | null>(null);

  locationMap = computed(() => {
    return this.locations().reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  });

  saving = signal(false);
  facturaUrl = signal<string | null>(null);

  tipo = '';
  marca = '';
  modelo = '';
  serial = '';
  placa = '';
  estado = '';
  locationId = '';
  responsibleId = '';
  areaId = '';
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
    this.getAllAreasUC.execute().subscribe(areas => this.areas.set(areas));
  }

  getAvailableAreas(): Area[] {
    const loc = this.locations().find(l => l.id === this.locationId);
    return loc?.areas || [];
  }

  onLocationChange() {
    const available = this.getAvailableAreas();
    if (available.length > 0) {
      const isValid = available.some(a => a.id === this.areaId);
      if (!isValid) {
        this.areaId = available[0].id;
      }
    } else {
      this.areaId = '8b8b9c8c-1e2a-43cf-8a27-024848bb0000'; // NO APLICA
    }
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
    this.areaId = a.areaId || '8b8b9c8c-1e2a-43cf-8a27-024848bb0000';
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
    if (!this.activo) {
      this.resetForm();
    }
  }

  handleSave() {
    this.toast.set(null);
    if (this.getAvailableAreas().length === 0) {
      this.areaId = '8b8b9c8c-1e2a-43cf-8a27-024848bb0000';
    }

    if (!this.tipo || !this.marca || !this.modelo || !this.serial || !this.placa || !this.estado || !this.locationId || !this.responsibleId || !this.areaId || !this.fechaIngreso) {
      this.toast.set({ type: 'error', message: 'Por favor completa todos los campos obligatorios.' });
      return;
    }

    const placaRegex = /^\d{4}-\d{6}$/;
    if (!placaRegex.test(this.placa)) {
      this.toast.set({ type: 'error', message: 'La placa debe cumplir el formato 0000-000000 (4 números - 6 números).' });
      return;
    }

    // Validación de Inactivación con SIM Cards vinculadas
    if (this.activo && this.estado === 'BAJA' && this.activo.simCards && this.activo.simCards.length > 0) {
      const numeros = this.activo.simCards.map(s => s.numero || s.iccid).join(', ');
      this.toast.set({
        type: 'error',
        message: `No se puede inactivar o dar de baja el activo porque tiene ${this.activo.simCards.length} tarjeta(s) SIM vinculada(s) (${numeros}). Primero debes desvincular las tarjetas SIM.`
      });
      return;
    }

    // Validación de Auditoría Obligatoria
    if (this.activo) {
      const facturaChanged = this.facturaUrl() !== (this.activo.facturaUrl || null);
      const precioChanged = (this.precioCompra ?? null) !== (this.activo.precioCompra ?? null);
      if ((facturaChanged || precioChanged) && !this.justification.trim()) {
        this.toast.set({ type: 'error', message: 'Se requiere ingresar una justificación de auditoría obligatoria para modificar la factura o precio.' });
        return;
      }
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
      areaId: this.areaId,
      fechaIngreso: this.fechaIngreso,
      facturaUrl: this.facturaUrl() ?? undefined,
      precioCompra: this.precioCompra ?? undefined,
      justification: this.justification || undefined,
      changedByUser: this.roleService.userName() || 'Usuario Autenticado',
      ...(this.estado === 'MANTENIMIENTO' && {
        maintenanceModalidad: this.maintModalidad,
        maintenanceTipo: this.maintTipo,
        maintenanceCostoEstimado: this.maintCostoEstimado,
        maintenanceTecnicoResponsable: this.maintTecnicoResponsable
      })
    };
    const current = this.activo;
    const request$ = current
      ? this.updateActivoUseCase.execute(current.placa, payload)
      : this.createActivoUseCase.execute(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.set({ type: 'success', message: `Activo "${this.placa}" ${this.activo ? 'actualizado' : 'guardado'} exitosamente.` });
        const savedPlaca = this.placa;
        this.justification = '';
        if (!this.activo) this.resetForm();
        setTimeout(() => {
          this.toast.set(null);
          this.close();
          this.saved.emit(savedPlaca);
        }, 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Error inesperado.';
        this.toast.set({ type: 'error', message: msg });
      }
    });
  }

  onPlacaInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    this.placa = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
    input.value = this.placa;
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
    this.areaId = '';
    this.fechaIngreso = '';
    this.precioCompra = null;
    this.fileName = '';
    this.facturaUrl.set(null);
    this.justification = '';
    this.toast.set(null);
    this.maintModalidad = 'INTERNO';
    this.maintTipo = 'PREVENTIVO';
    this.maintCostoEstimado = undefined;
    this.maintTecnicoResponsable = '';
    this.maintHistory.set([]);
    this.auditHistory.set([]);
  }
}
