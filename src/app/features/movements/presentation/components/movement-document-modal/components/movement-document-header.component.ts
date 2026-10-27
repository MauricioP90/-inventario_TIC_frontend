import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-movement-document-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
      <!-- Título y Consecutivo -->
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
          📄
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-base text-slate-900 leading-tight">Documento Oficial de Traslado</h3>
            @if (consecutivo) {
              <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-100">
                {{ consecutivo }}
              </span>
            }
          </div>
          <p class="text-xs text-slate-500">Vista previa imprimible para actas, comodatos y constancias de entrega</p>
        </div>
      </div>

      <!-- Acciones: Imprimir + Botón Cerrar -->
      <div class="flex items-center gap-2.5">
        <button 
          (click)="print.emit()"
          class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Imprimir / Guardar PDF
        </button>

        <button 
          (click)="close.emit()"
          title="Cerrar ventana"
          class="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-200 transition-all cursor-pointer">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class MovementDocumentHeaderComponent {
  @Input() consecutivo: string = '';
  @Output() print = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
