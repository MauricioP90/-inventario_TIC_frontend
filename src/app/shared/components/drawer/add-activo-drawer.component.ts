import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateActivoUseCase } from '../../../features/inventory/application/use-cases/create-activo.use-case';

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
          <h2 class="text-base font-bold text-slate-800">Nuevo Activo</h2>
          <p class="text-xs text-slate-500 mt-0.5">Completa los datos del equipo a registrar.</p>
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
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5'">
            {{ toast()!.message }}
          </div>
        }

        <!-- Tipo de Dispositivo -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Tipo de Dispositivo</label>
          <select [(ngModel)]="tipo" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar tipo</option>
            <option value="Laptop">Laptop</option>
            <option value="Celular">Celular</option>
            <option value="Tablet">Tablet</option>
          </select>
        </div>

        <!-- Marca -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Marca</label>
          <input type="text" [(ngModel)]="marca" placeholder="Ej: Dell Latitude 5540"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Modelo -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Modelo</label>
          <input type="text" [(ngModel)]="modelo" placeholder="Ej: Dell Latitude 5540"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Número de Serie -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Número de Serie</label>
          <input type="text" [(ngModel)]="serial" placeholder="Ej: SN-DL5540-XYZ"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Placa -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Placa</label>
          <input type="text" [(ngModel)]="placa" placeholder="Ej: FLM-0010"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Ubicación -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Ubicación</label>
          <select [(ngModel)]="locationId" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar ubicación</option>
            <option value="550e8400-e29b-41d4-a716-446655440000">Bodega Central Bogotá (BOG-01)</option>
          </select>
        </div>

        <!-- Estado -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Estado</label>
          <select [(ngModel)]="estado" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar estado</option>
            <option value="BODEGA">En Bodega</option>
            <option value="OPERACION">En Operación</option>
            <option value="REPARACION">En Reparación</option>
          </select>
        </div>

        <!-- Responsable -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">ID Responsable</label>
          <input type="text" [(ngModel)]="responsibleId" placeholder="Ej: RESP-001"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Fecha Ingreso -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Fecha de Ingreso</label>
          <input type="date" [(ngModel)]="fechaIngreso"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <!-- Factura / Soporte -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Factura / Soporte</label>
          <label class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
            <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/>
            </svg>
            <span class="text-sm text-slate-500">{{ fileName || 'Arrastra o haz clic para subir archivo' }}</span>
            <span class="text-xs text-slate-400">PDF, JPG, PNG</span>
            <input type="file" class="hidden" accept=".pdf,.jpg,.png,.jpeg" (change)="onFileChange($event)" />
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 shrink-0">
        <button (click)="handleSave()"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors">
          Guardar Activo
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AddActivoDrawerComponent {
  private createActivoUseCase = inject(CreateActivoUseCase);
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  tipo = '';
  marca = '';
  modelo = '';
  serial = '';
  placa = '';
  estado = '';
  locationId = '550e8400-e29b-41d4-a716-446655440000';
  responsibleId = '77f1f7d5-d14c-474c-87d2-646c1a843e93';
  fechaIngreso = '';
  fileName = '';
  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  close() {
    this.openChange.emit(false);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fileName = input.files?.[0]?.name ?? '';
  }

  handleSave() {
    this.toast.set(null);
    if (!this.tipo || !this.marca || !this.modelo || !this.serial || !this.placa || !this.estado || !this.locationId || !this.responsibleId || !this.fechaIngreso) {
      this.toast.set({ type: 'error', message: 'Por favor completa todos los campos obligatorios.' });
      return;
    }

    const payload = {
      tipoActivoId: this.tipo,
      marca: this.marca,
      modelo: this.modelo,
      serial: this.serial,
      placa: this.placa,
      estado: this.estado as any,
      locationId: this.locationId,
      responsibleId: this.responsibleId,
      fechaIngreso: this.fechaIngreso
    };

    this.createActivoUseCase.execute(payload).subscribe({
      next: () => {
        this.toast.set({ type: 'success', message: `Activo "${this.placa}" guardado exitosamente.` });
        this.resetForm();
        setTimeout(() => {
          this.toast.set(null);
          this.close();
          this.saved.emit();
        }, 1200);
      },
      error: (err) => {
        console.error('Error al guardar activo:', err);
        this.toast.set({ type: 'error', message: 'Hubo un error al conectar con el servidor.' });
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
  }
}
