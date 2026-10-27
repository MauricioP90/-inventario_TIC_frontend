import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activo } from '../../../../features/inventory/domain/models/activo.model';
import { FileUploadService } from '../../../../core/services/file-upload.service';

@Component({
  selector: 'app-activo-factura-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-slate-700">Factura / Soporte <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
      
      @if (facturaUrl) {
        <div class="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl transition-all shadow-sm">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-800 truncate">{{ fileName || 'Factura cargada' }}</p>
              <a [href]="facturaUrl" target="_blank" class="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                Ver / Descargar archivo
                <svg class="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
          
          <div class="flex items-center gap-1.5 shrink-0">
            <label class="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs" title="Cambiar por otro archivo">
              Reemplazar
              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event)" />
            </label>
            @if (!activo) {
              <button type="button" (click)="removeFactura()" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Quitar archivo adjunto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            }
          </div>
        </div>
      } @else {
        <label class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
          @if (uploadingFile()) {
            <div class="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            <span class="text-sm text-slate-500 font-medium">Subiendo archivo...</span>
          } @else {
            <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/>
            </svg>
            <span class="text-sm text-slate-600 font-medium">Arrastra o haz clic para subir factura/soporte</span>
            <span class="text-xs text-slate-400">PDF, JPG, PNG (máx. 5MB)</span>
          }
          <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event)" />
        </label>
      }

      <!-- Justificación Obligatoria de Auditoría -->
      @if (activo && (facturaUrl !== (activo.facturaUrl || null) || (precioCompra ?? null) !== (activo.precioCompra ?? null))) {
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 mt-2 animate-fade-in">
          <label class="block text-xs font-bold text-amber-900">
            Justificación de Auditoría <span class="text-red-500">*</span>
          </label>
          <p class="text-[11px] text-amber-700">Por seguridad contable, ingresa el motivo del cambio o reemplazo de la factura o valor de compra.</p>
          <textarea 
            [ngModel]="justification" 
            (ngModelChange)="justificationChange.emit($event)"
            rows="2" 
            placeholder="Ej: Corrección de soporte emitido por proveedor o actualización de factura..." 
            class="w-full p-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder:text-amber-400/80"></textarea>
        </div>
      }
    </div>
  `
})
export class ActivoFacturaSectionComponent {
  private fileUploadService = inject(FileUploadService);

  @Input() activo: Activo | null = null;
  @Input() facturaUrl: string | null = null;
  @Input() fileName: string = '';
  @Input() precioCompra: number | null = null;
  @Input() justification: string = '';

  @Output() facturaUrlChange = new EventEmitter<string | null>();
  @Output() fileNameChange = new EventEmitter<string>();
  @Output() justificationChange = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();

  uploadingFile = signal(false);

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const selectedName = file.name;
    this.fileNameChange.emit(selectedName);
    this.uploadingFile.set(true);

    this.fileUploadService.upload(file, 'facturas').subscribe({
      next: (res) => {
        this.facturaUrlChange.emit(res.url);
        this.uploadingFile.set(false);
      },
      error: (err: any) => {
        this.uploadingFile.set(false);
        this.uploadError.emit(err.message || 'Error al subir el archivo.');
      }
    });
  }

  removeFactura() {
    this.facturaUrlChange.emit(null);
    this.fileNameChange.emit('');
  }
}
