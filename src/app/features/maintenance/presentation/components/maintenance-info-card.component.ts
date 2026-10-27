import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceReport, EstadoFicha, ESTADO_FICHA_LABELS } from '../../domain/models/maintenance.model';
import { Activo } from '../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-maintenance-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
      <div class="flex justify-between items-center">
        <span class="text-slate-400 font-semibold">Estado Actual:</span>
        <span class="font-bold px-2 py-0.5 rounded text-white" [style.background-color]="estadoColor(report.estado)">
          {{ getEstadoLabel(report.estado) }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400 font-semibold">Modalidad:</span>
        <span class="font-bold text-slate-700">{{ report.modalidad }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400 font-semibold">Tipo:</span>
        <span class="font-bold text-slate-700">{{ report.tipoMantenimiento }}</span>
      </div>
      @if (activo) {
        <div class="border-t border-slate-200/60 pt-2 mt-2 space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Equipo Placa:</span>
            <span class="font-bold text-slate-800">{{ activo.placa }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Marca/Modelo:</span>
            <span class="text-slate-700">{{ activo.marca }} / {{ activo.modelo }}</span>
          </div>
          @if (isAdmin && activo.precioCompra) {
            <div class="flex justify-between text-indigo-600 font-semibold">
              <span>Precio de Compra:</span>
              <span>$ {{ activo.precioCompra | number:'1.2-2' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class MaintenanceInfoCardComponent {
  @Input({ required: true }) report!: MaintenanceReport;
  @Input() activo: Activo | null = null;
  @Input() isAdmin = false;

  getEstadoLabel(state: EstadoFicha): string {
    return ESTADO_FICHA_LABELS[state] || state;
  }

  estadoColor(state: EstadoFicha): string {
    const map: Record<EstadoFicha, string> = {
      [EstadoFicha.PENDIENTE_DIAGNOSTICO]: '#f59e0b',
      [EstadoFicha.EN_PROCESO]: '#3b82f6',
      [EstadoFicha.REQUIERE_AUTORIZACION]: '#ef4444',
      [EstadoFicha.ENVIADO_PROVEEDOR]: '#8b5cf6',
      [EstadoFicha.CERRADO]: '#10b981'
    };
    return map[state] || '#64748b';
  }
}
