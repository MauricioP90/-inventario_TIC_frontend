import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movement, MovementStatus, MovementType } from '../../../domain/models/movement.model';
import { MovementTypePipe } from '../../../../../shared/pipes/movement-type.pipe';

@Component({
  selector: 'app-movement-item',
  standalone: true,
  imports: [CommonModule, MovementTypePipe],
  template: `
    <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
      <!-- Header: ID & Fecha -->
      <div class="flex justify-between items-start mb-4">
        <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" [ngClass]="typeBadgeClass">
          {{ movement.type | movementTypeLabel }} #{{ movement.id.slice(-6).toUpperCase() }}
        </span>
        <div class="text-right">
          <p class="text-[10px] text-slate-400 uppercase font-bold">Fecha</p>
          <p class="text-xs font-semibold text-slate-600">{{ movement.createdAt | date:'dd/MM/yyyy' }}</p>
        </div>
      </div>

      <!-- Ruta: Origen -> Destino -->
      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 min-w-0">
          <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Origen</p>
          <p class="text-sm font-bold text-slate-800 line-clamp-2 leading-tight" [title]="movement.originLocation?.nombre || 'Sede Origen'">
            {{ movement.originLocation?.nombre || 'Sede Origen' }}
          </p>
        </div>
        <div class="flex items-center justify-center">
          <svg class="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Destino</p>
          <p class="text-sm font-bold text-slate-800 line-clamp-2 leading-tight" [title]="movement.destinationLocation?.nombre || 'Sede Destino'">
            {{ movement.destinationLocation?.nombre || 'Sede Destino' }}
          </p>
        </div>
      </div>

      <!-- Info Adicional -->
      <div class="grid grid-cols-2 gap-4 mb-6 py-3 border-y border-slate-50">
        <div>
          @if (movement.type === 'SIM_TRASLADO') {
            <p class="text-[10px] text-slate-400 uppercase font-bold">SIM Cards</p>
            <p class="text-xs font-bold text-slate-700 flex items-center gap-1">
              <svg class="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ movement.simCardIds?.length || 0 }} chips
            </p>
          } @else {
            <p class="text-[10px] text-slate-400 uppercase font-bold">Activos</p>
            <p class="text-xs font-bold text-slate-700 flex items-center gap-1">
              <svg class="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ movement.activoIds.length }} equipos
            </p>
          }
        </div>
        <div>
          <p class="text-[10px] text-slate-400 uppercase font-bold">Estado</p>
          <span [class]="statusClass">{{ statusLabel }}</span>
        </div>
      </div>

      <!-- Notes / Rejection Reason -->
      @if (movement.notes) {
        <div class="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
          <p class="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Notas / Observaciones</p>
          <p class="text-xs text-slate-600 italic leading-relaxed">{{ movement.notes }}</p>
        </div>
      }

      <!-- Acciones -->
      <div class="flex gap-2">
        @if (movement.status === 'PENDING') {
          <button (click)="onDispatch.emit(movement)"
                  class="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 flex items-center justify-center gap-2">
            Despachar
          </button>
        }
        @if (movement.status === 'EN_TRANSIT') {
          <button (click)="onReceive.emit(movement)"
                  class="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-100 flex items-center justify-center gap-2">
            Recibir
          </button>
          @if (movement.magicLinkToken) {
            <button (click)="onCopyMagicLink.emit(movement)" title="Copiar Enlace Mágico para recepción externa"
                    class="px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-all flex items-center justify-center border border-indigo-200">
              🔗
            </button>
          }
        }
        <button (click)="onViewRoute.emit(movement)"
                class="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center">
          Ver Ruta
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class MovementItemComponent {
  @Input({ required: true }) movement!: Movement;
  @Output() onDispatch = new EventEmitter<Movement>();
  @Output() onReceive = new EventEmitter<Movement>();
  @Output() onViewRoute = new EventEmitter<Movement>();
  @Output() onCopyMagicLink = new EventEmitter<Movement>();

  get typeBadgeClass(): string {
    if (this.movement.type === MovementType.RETURN_BY_REJECTION) {
      return 'text-rose-600 bg-rose-50 border border-rose-100';
    }
    return 'text-indigo-500 bg-indigo-50 border border-indigo-50';
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      [MovementStatus.PENDING]: 'Pendiente',
      [MovementStatus.EN_TRANSIT]: 'Transito',
      [MovementStatus.RECEIVED]: 'Recibido',
      [MovementStatus.CANCELLED]: 'Cancelado',
    };
    return labels[this.movement.status] ?? this.movement.status;
  }

  get statusClass(): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full ';
    const classes: Record<string, string> = {
      [MovementStatus.PENDING]: base + 'bg-amber-100 text-amber-700',
      [MovementStatus.EN_TRANSIT]: base + 'bg-blue-100 text-blue-700',
      [MovementStatus.RECEIVED]: base + 'bg-emerald-100 text-emerald-700',
      [MovementStatus.CANCELLED]: base + 'bg-slate-100 text-slate-500',
    };
    return classes[this.movement.status] ?? base + 'bg-slate-100 text-slate-500';
  }
}
