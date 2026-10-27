import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movement } from '../../../../domain/models/movement.model';

@Component({
  selector: 'app-movement-route-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5" *ngIf="movement">
      <div class="flex items-center justify-between mb-10 relative px-4">
        <div class="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
        <div class="absolute top-1/2 left-0 h-1.5 bg-indigo-500 -z-10 -translate-y-1/2 transition-all rounded-full" [style.width]="getRouteProgress()"></div>
        
        <div class="flex flex-col items-center gap-2">
          <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 border-indigo-500 shadow-md">
            🏢
          </div>
          <span class="text-[10px] font-bold text-slate-600">Origen</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 shadow-md transition-colors" [class.border-indigo-500]="isEnTransitOrReceived()" [class.border-slate-200]="!isEnTransitOrReceived()">
            🚛
          </div>
          <span class="text-[10px] font-bold text-slate-600">En Tránsito</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 shadow-md transition-colors" [class.border-emerald-500]="isReceived()" [class.border-slate-200]="!isReceived()">
            🎯
          </div>
          <span class="text-[10px] font-bold text-slate-600">Destino</span>
        </div>
      </div>

      <div class="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-xs space-y-3">
        <p class="flex justify-between">
          <span class="text-slate-500">ID Traslado:</span> 
          <span class="font-bold text-slate-800">{{ movement.id.slice(-8) }}</span>
        </p>
        <p class="flex justify-between">
          <span class="text-slate-500">Origen:</span> 
          <span class="font-bold text-slate-800">{{ movement.originLocation?.nombre || 'N/A' }}</span>
        </p>
        <p class="flex justify-between">
          <span class="text-slate-500">Destino:</span> 
          <span class="font-bold text-slate-800">{{ movement.destinationLocation?.nombre || 'N/A' }}</span>
        </p>
        <p class="flex justify-between">
          <span class="text-slate-500">Responsable:</span> 
          <span class="font-bold text-slate-800">{{ movement.responsible?.nombre || 'N/A' }}</span>
        </p>
        
        <div class="border-t border-indigo-100/50 pt-2 space-y-1.5">
          @if (movement.type === 'SIM_TRASLADO') {
            <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">SIM Cards Trasladadas:</p>
            @for (sim of movement.simCards; track sim.id) {
              <div class="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/30 flex flex-col gap-0.5">
                <p class="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>📱 Número: {{ sim.numero }}</span>
                  <span class="text-[10px] text-purple-600 font-medium uppercase font-bold">{{ sim.operador }}</span>
                </p>
                <p class="text-[10px] text-slate-500 font-mono">ICCID: {{ sim.iccid || 'N/A' }}</p>
              </div>
            }
          } @else {
            <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Equipos Trasladados:</p>
            @for (act of movement.activos; track act.id) {
              <div class="bg-white/80 p-2.5 rounded-lg border border-indigo-100/30 flex flex-col gap-0.5">
                <p class="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>💻 Placa: {{ act.placa }}</span>
                  <span class="text-[10px] text-slate-500 font-medium">{{ act.marca }} {{ act.modelo }}</span>
                </p>
                <p class="text-[10px] text-slate-500 font-mono">S/N: {{ act.serial || 'N/A' }}</p>
                @if (act.simCards && act.simCards.length > 0) {
                  <p class="text-[10px] text-purple-600 font-bold flex items-center gap-1 mt-0.5">
                    <span>📱 SIM Cards:</span>
                    <span>{{ getSimCardsNumbers(act.simCards) }}</span>
                  </p>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class MovementRouteViewComponent {
  @Input() movement: Movement | null = null;

  getRouteProgress(): string {
    if (!this.movement) return '0%';
    const status = this.movement.status;
    return status === 'RECEIVED' ? '100%' : (status === 'EN_TRANSIT' ? '50%' : '0%');
  }

  isEnTransitOrReceived(): boolean {
    return !!this.movement && ['EN_TRANSIT', 'RECEIVED'].includes(this.movement.status);
  }

  isReceived(): boolean {
    return this.movement?.status === 'RECEIVED';
  }

  getSimCardsNumbers(simCards: any[]): string {
    if (!simCards || simCards.length === 0) return '';
    return simCards.map((s: any) => s.numero).join(' - ');
  }
}
