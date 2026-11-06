import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movement, MOVEMENT_TYPE_LABELS, MovementStatus } from '../../../../../movements/domain/models/movement.model';

@Component({
  selector: 'app-reports-movements-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
        <thead class="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <tr>
            <th class="px-6 py-4">Fecha</th>
            <th class="px-6 py-4">ID Traslado</th>
            <th class="px-6 py-4">Tipo Movimiento</th>
            <th class="px-6 py-4">Equipos / SIM Cards</th>
            <th class="px-6 py-4">Origen</th>
            <th class="px-6 py-4">Destino</th>
            <th class="px-6 py-4">Responsable</th>
            <th class="px-6 py-4">Notas</th>
            <th class="px-6 py-4">Soportes</th>
            <th class="px-6 py-4 text-center">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          @for (m of movements; track m.id) {
            <tr [class.bg-slate-50]="isExpanded(m.id)" class="hover:bg-slate-50/50 transition-colors">
              <!-- Fecha -->
              <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                {{ m.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </td>
              <!-- ID -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-[11px] font-semibold border border-slate-200">
                  {{ m.id.slice(-8) }}
                </span>
              </td>
              <!-- Tipo -->
              <td class="px-6 py-4 font-semibold"
                  [class.text-rose-600]="m.type === 'BAJA_ACTIVO'"
                  [class.text-slate-700]="m.type !== 'BAJA_ACTIVO'">
                {{ getMovementTypeLabel(m.type) }}
              </td>
              <!-- Items -->
              <td class="px-6 py-4 max-w-xs">
                <div class="flex flex-col gap-1">
                  <!-- Activos -->
                  <div class="flex flex-wrap gap-1" *ngIf="m.activos && m.activos.length > 0">
                    @for (a of m.activos; track a.id) {
                      <span class="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100" title="{{ a.marca }} {{ a.modelo }}">
                        💻 {{ a.placa }}
                      </span>
                    }
                  </div>
                  <!-- SIM Cards -->
                  <div class="flex flex-wrap gap-1" *ngIf="m.simCards && m.simCards.length > 0">
                    @for (s of m.simCards; track s.id) {
                      <span class="text-[10px] font-extrabold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100" title="{{ s.operador }}">
                        📶 {{ s.numero }}
                      </span>
                    }
                  </div>
                </div>
              </td>
              <!-- Origen -->
              <td class="px-6 py-4 font-medium text-slate-600">
                {{ m.originLocation?.nombre || 'Bodega/Disponible' }}
              </td>
              <!-- Destino -->
              <td class="px-6 py-4 font-medium text-slate-600">
                {{ m.destinationLocation?.nombre || 'N/A' }}
              </td>
              <!-- Responsable -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2" *ngIf="m.responsible">
                  <div class="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                    {{ getInitials(m.responsible.nombre) }}
                  </div>
                  <span class="font-medium text-slate-700 truncate max-w-[120px]">{{ m.responsible.nombre }}</span>
                </div>
                <span *ngIf="!m.responsible" class="text-slate-400 italic">No asignado</span>
              </td>
              <!-- Notas -->
              <td class="px-6 py-4 max-w-[240px]">
                @if (m.notes && m.notes.trim()) {
                  <div class="flex items-center gap-2">
                    <!-- Botón Desplegable idéntico a Activos -->
                    <button 
                      type="button"
                      (click)="toggleExpand(m.id)"
                      class="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors shrink-0"
                      [title]="isExpanded(m.id) ? 'Ocultar observación' : 'Ver observación completa'">
                      <span class="text-[10px] font-bold select-none">{{ isExpanded(m.id) ? '▲' : '▼' }}</span>
                    </button>
                    <span 
                      (click)="toggleExpand(m.id)"
                      class="text-slate-600 italic text-xs leading-tight truncate block cursor-pointer hover:text-indigo-600 transition-colors" 
                      title="Clic para desplegar observación completa">
                      {{ m.notes }}
                    </span>
                  </div>
                } @else {
                  <span class="text-slate-300 font-mono text-[11px]">—</span>
                }
              </td>
              <!-- Soportes -->
              <td class="px-6 py-4 whitespace-nowrap">
                @if (m.documentUrl || m.evidenceUrl || m.receivedEvidenceUrl) {
                  <div class="flex flex-col gap-1">
                    @if (m.documentUrl) {
                      <a [href]="m.documentUrl" target="_blank" title="Ver Comodato / Acta de Soporte"
                         class="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded transition-all">
                        📋 Comodato ↗
                      </a>
                    }
                    @if (m.evidenceUrl) {
                      <a [href]="m.evidenceUrl" target="_blank" title="Ver Soporte Envío"
                         class="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-all">
                        🚚 Envío ↗
                      </a>
                    }
                    @if (m.receivedEvidenceUrl) {
                      <a [href]="m.receivedEvidenceUrl" target="_blank" title="Ver Soporte Recepción"
                         class="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-all">
                        📦 Recepción ↗
                      </a>
                    }
                  </div>
                } @else {
                  <span class="text-slate-300 font-mono text-[11px]">—</span>
                }
              </td>
              <!-- Estado -->
              <td class="px-6 py-4 text-center whitespace-nowrap">
                <span [class]="getMovementStatusClass(m.status)">
                  {{ getMovementStatusLabel(m.status) }}
                </span>
              </td>
            </tr>

            <!-- Sub-fila Acordeón de Nota Expandida -->
            @if (isExpanded(m.id) && m.notes) {
              <tr class="bg-indigo-50/30 border-b border-indigo-100/60 transition-all">
                <td colspan="10" class="px-8 py-3.5">
                  <div class="bg-white rounded-xl p-4 border border-indigo-100/80 shadow-xs flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 text-sm">
                      📝
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                          Observaciones / Justificación del Traslado (#{{ m.id.slice(-8) }})
                        </span>
                        <span class="text-[10px] font-medium text-slate-400">
                          Registrado: {{ m.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap select-text bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                        {{ m.notes }}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            }
          } @empty {
            <tr>
              <td colspan="10" class="px-6 py-12 text-center text-slate-400 font-medium">
                No se encontraron movimientos con los filtros aplicados.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ReportsMovementsTableComponent {
  @Input() movements: Movement[] = [];

  expandedMovementId = signal<string | null>(null);

  isExpanded(id: string): boolean {
    return this.expandedMovementId() === id;
  }

  toggleExpand(id: string): void {
    this.expandedMovementId.update(curr => (curr === id ? null : id));
  }

  getMovementTypeLabel(type: string): string {
    return MOVEMENT_TYPE_LABELS[type] || type;
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getMovementStatusLabel(status: MovementStatus): string {
    const labels: Record<MovementStatus, string> = {
      [MovementStatus.PENDING]: 'En Curso',
      [MovementStatus.EN_TRANSIT]: 'En Tránsito',
      [MovementStatus.RECEIVED]: 'Recibido',
      [MovementStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

  getMovementStatusClass(status: MovementStatus): string {
    const base = 'text-[10px] font-extrabold px-2 py-0.5 rounded-full border ';
    switch (status) {
      case MovementStatus.PENDING:
        return base + 'bg-amber-50 text-amber-600 border-amber-100';
      case MovementStatus.EN_TRANSIT:
        return base + 'bg-blue-50 text-blue-600 border-blue-100';
      case MovementStatus.RECEIVED:
        return base + 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case MovementStatus.CANCELLED:
        return base + 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return base + 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }
}
