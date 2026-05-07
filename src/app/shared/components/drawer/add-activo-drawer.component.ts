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

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        @if (toast()) {
          <div [class]="toast()!.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 leading-relaxed'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 leading-relaxed'">
            {{ toast()!.message }}
          </div>
        }

        <!-- Tipo de Dispositivo -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Tipo de Dispositivo <span class="text-red-500">*</span></label>
          <select [(ngModel)]="tipo" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar tipo</option>
            @for (type of metadata()?.types; track type.id) {
              <option [value]="type.id">{{ type.label }}</option>
            }
          </select>
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
            [disabled]="!!(activo && activo.estado !== 'BODEGA')" 
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
            
            @if (activo && activo.estado !== 'BODEGA') {
              <option [value]="locationId">{{ locationMap()[locationId]?.nombre || 'Cargando...' }}</option>
            } @else {
              <option value="" disabled>Seleccionar bodega</option>
              @for (bodega of metadata()?.bodegas; track bodega.id) {
                <option [value]="bodega.id">{{ bodega.nombre }}</option>
              }
            }
          </select>
          
          @if (activo && activo.estado !== 'BODEGA') {
            <p class="text-[10px] text-amber-600 font-medium mt-1">
              ⚠️ Para cambiar la ubicación de un equipo en operación, use el módulo de Movimientos.
            </p>
          }
        </div>

        <!-- Estado -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Estado <span class="text-red-500">*</span></label>
          <select [(ngModel)]="estado" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar estado</option>
            @for (status of metadata()?.statuses; track status.id) {
              <option [value]="status.id">{{ status.label }}</option>
            }
          </select>
        </div>

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
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

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
  private http = inject(HttpClient);

  @Input() open = false;
  @Input() set activo(val: Activo | null) {
    this._activo = val;
    if (val) {
      this.populateForm(val);
    } else {
      this.resetForm();
    }
  }
  get activo() { return this._activo; }
  private _activo: Activo | null = null;

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

  tipo = '';
  marca = '';
  modelo = '';
  serial = '';
  placa = '';
  estado = '';
  locationId = '';
  responsibleId = '';
  fechaIngreso = '';
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
    if (a.fechaIngreso) {
      const d = new Date(a.fechaIngreso);
      this.fechaIngreso = d.toISOString().split('T')[0];
    }
    this.facturaUrl.set(a.facturaUrl || null);
    this.fileName = a.facturaUrl ? 'Factura cargada' : '';
  }

  close() {
    this.openChange.emit(false);
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
      facturaUrl: this.facturaUrl() ?? undefined
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

  private resetForm() {
    this.tipo = '';
    this.marca = '';
    this.modelo = '';
    this.serial = '';
    this.placa = '';
    this.estado = '';
    this.locationId = '';
    this.responsibleId = '';
    this.fechaIngreso = '';
    this.fileName = '';
    this.facturaUrl.set(null);
  }
}
