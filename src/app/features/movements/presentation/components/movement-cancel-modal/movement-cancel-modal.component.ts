import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Movement } from '../../../domain/models/movement.model';

@Component({
  selector: 'app-movement-cancel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (movement) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-slate-100">
          <div class="p-5 border-b border-rose-100 bg-rose-50/70 flex justify-between items-center">
            <h3 class="font-bold text-rose-900 text-base flex items-center gap-2">
              <span>🚫</span> Anular Traslado #{{ movement.id.slice(-6).toUpperCase() }}
            </h3>
            <button (click)="close()" class="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center shadow-xs cursor-pointer">
              ✕
            </button>
          </div>
          
          <div class="p-6 space-y-4">
            <div class="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p class="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Advertencia de Auditoría:
              </p>
              <p class="leading-relaxed text-amber-800">
                El traslado quedará registrado como <strong class="font-bold text-rose-700">ANULADO</strong> en la auditoría histórica y los equipos/SIMs involucrados se liberarán de inmediato en su sede de origen.
              </p>
            </div>

            <div class="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p><span class="font-bold text-slate-700">Origen:</span> {{ movement.originLocation?.nombre || 'Sede Origen' }}</p>
              <p><span class="font-bold text-slate-700">Destino:</span> {{ movement.destinationLocation?.nombre || 'Sede Destino' }}</p>
              <p><span class="font-bold text-slate-700">Equipos/SIMs:</span> {{ movement.activoIds.length }} equipo(s) / chip(s)</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Motivo de la Anulación *
              </label>
              <textarea [ngModel]="reason()" (ngModelChange)="reason.set($event)" rows="3"
                        placeholder="Ej: Error al seleccionar sede destino / Digitación equivocada de activo..."
                        class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"></textarea>
              <p class="text-[11px] text-slate-400 italic">El motivo quedará guardado permanentemente para trazabilidad.</p>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" (click)="close()" [disabled]="isCancelling"
                    class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
              Cerrar
            </button>
            <button type="button" (click)="confirm()" [disabled]="isCancelling || !reason().trim()"
                    class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200/50 transition-all flex items-center gap-2 cursor-pointer">
              @if (isCancelling) {
                <span class="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                Anulando...
              } @else {
                <span>Confirmar Anulación</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class MovementCancelModalComponent {
  @Input() movement: Movement | null = null;
  @Input() isCancelling = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<string>();

  reason = signal('');

  close() {
    this.reason.set('');
    this.onClose.emit();
  }

  confirm() {
    if (this.reason().trim()) {
      this.onConfirm.emit(this.reason().trim());
    }
  }
}
