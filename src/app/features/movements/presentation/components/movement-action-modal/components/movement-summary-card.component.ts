import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movement, MOVEMENT_TYPE_LABELS } from '../../../../domain/models/movement.model';

@Component({
  selector: 'app-movement-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs" *ngIf="movement">
      <div class="flex justify-between">
        <span class="text-slate-500 font-medium">Tipo:</span>
        <span class="font-bold text-slate-800"
              [class.text-rose-600]="movement.type === 'BAJA_ACTIVO'">
          {{ getMovementTypeLabel(movement.type) }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500 font-medium">Origen:</span>
        <span class="font-bold text-slate-800">{{ movement.originLocation?.nombre || 'N/A' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500 font-medium">Destino:</span>
        <span class="font-bold text-slate-800">{{ movement.destinationLocation?.nombre || 'N/A' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500 font-medium">Responsable:</span>
        <span class="font-bold text-slate-800">{{ movement.responsible?.nombre || 'N/A' }}</span>
      </div>
      @if (movement.notes) {
        <div class="pt-1.5 border-t border-slate-200/60 mt-1">
          <span class="text-slate-500 font-medium block mb-0.5 text-xs">Notas / Motivo de Rechazo:</span>
          <span class="font-semibold text-rose-600 block leading-relaxed bg-rose-50/50 p-2 rounded-lg border border-rose-100/50 text-xs max-h-24 overflow-y-auto">{{ movement.notes }}</span>
        </div>
      }
      <div class="pt-1.5 border-t border-slate-200/60 mt-1">
        <span class="text-slate-500 font-medium block mb-1">Equipos en traslado:</span>
        <div class="space-y-1">
          @for (act of movement.activos; track act.id) {
            <div class="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-100 font-mono text-[10px]">
              <span class="text-slate-800 font-bold">{{ act.placa }}</span>
              <span class="text-slate-500">{{ act.marca }} (S/N: {{ act.serial || 'N/A' }})</span>
            </div>
          }
          @for (sim of movement.simCards; track sim.id) {
            <div class="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-100 font-mono text-[10px]">
              <span class="text-purple-800 font-bold">{{ sim.numero }}</span>
              <span class="text-slate-500">{{ sim.operador }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class MovementSummaryCardComponent {
  @Input() movement: Movement | null = null;

  getMovementTypeLabel(type: string): string {
    return (MOVEMENT_TYPE_LABELS as Record<string, string>)[type] || type;
  }
}
