import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Movement, MovementStatus } from '../../../domain/models/movement.model';

@Component({
    selector: 'app-movement-item',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
      <!-- Info del Envío -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">
            Traslado #{{ movement.id.slice(-6).toUpperCase() }}
          </span>
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            {{ movement.originLocation?.nombre || 'Origen' }} 
            <lucide-icon name="arrow-right" size="14" class="text-slate-400"></lucide-icon>
            {{ movement.destinationLocation?.nombre || 'Destino' }}
          </h3>
        </div>
        <div class="text-right">
          <p class="text-[11px] text-slate-400">Creado el</p>
          <p class="text-xs font-semibold text-slate-600">{{ movement.createdAt | date:'shortDate' }}</p>
        </div>
      </div>

      <!-- VISUAL TIMELINE -->
      <div class="relative pt-4 pb-8">
        <!-- Línea de Fondo -->
        <div class="absolute top-8 left-0 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        
        <!-- Línea de Progreso Dinámica -->
        <div class="absolute top-8 left-0 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-700 ease-in-out"
             [style.width.%]="getStatusProgress()"></div>

        <!-- Nodos del Timeline -->
        <div class="relative z-10 flex justify-between items-center px-1">
          
          <!-- Paso 1: Registrado -->
          <div class="flex flex-col items-center gap-2">
            <div [class]="'w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-colors ' + 
                 (getStatusIndex() >= 0 ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500')">
              <lucide-icon name="package" size="14"></lucide-icon>
            </div>
            <span class="text-[10px] font-bold text-slate-600">Registrado</span>
          </div>

          <!-- Paso 2: En Tránsito -->
          <div class="flex flex-col items-center gap-2">
            <div [class]="'w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-colors ' + 
                 (getStatusIndex() >= 1 ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500')">
              <lucide-icon name="truck" size="14"></lucide-icon>
            </div>
            <span class="text-[10px] font-bold text-slate-600">En Tránsito</span>
          </div>

          <!-- Paso 3: Recibido -->
          <div class="flex flex-col items-center gap-2">
            <div [class]="'w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-colors ' + 
                 (getStatusIndex() >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')">
              <lucide-icon name="check-circle" size="14"></lucide-icon>
            </div>
            <span class="text-[10px] font-bold text-slate-600">Recibido</span>
          </div>

        </div>
      </div>

      <!-- Footer con Acciones -->
      <div class="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
        <div class="flex -space-x-2">
           <!-- Aquí podríamos poner las mini-fotos de los activos más adelante -->
           <span class="text-[10px] text-slate-400 ml-4 italic">{{ movement.activoIds.length }} activos en viaje</span>
        </div>

        <div class="flex gap-2">
          @if (movement.status === 'PENDING') {
            <button (click)="onDispatch.emit(movement.id)"
                    class="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              Despachar
            </button>
          }
          @if (movement.status === 'EN_TRANSIT') {
            <button (click)="onReceive.emit(movement.id)"
                    class="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">
              Recibir
            </button>
          }
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class MovementItemComponent {
    @Input({ required: true }) movement!: Movement;
    @Output() onDispatch = new EventEmitter<string>();
    @Output() onReceive = new EventEmitter<string>();

    getStatusIndex(): number {
        const orders: Record<string, number> = {
            [MovementStatus.PENDING]: 0,
            [MovementStatus.EN_TRANSIT]: 1,
            [MovementStatus.RECEIVED]: 2,
            [MovementStatus.CANCELLED]: -1
        };
        return orders[this.movement.status] ?? 0;
    }

    getStatusProgress(): number {
        const idx = this.getStatusIndex();
        if (idx < 0) return 0;
        return (idx / 2) * 100; // 0, 50, 100
    }
}
