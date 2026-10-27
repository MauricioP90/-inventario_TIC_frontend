import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activo } from '../../../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-reports-altas-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
        <thead class="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <tr>
            <th class="px-6 py-4">Fecha Ingreso</th>
            <th class="px-6 py-4">Placa / Identificador</th>
            <th class="px-6 py-4">Tipo</th>
            <th class="px-6 py-4">Marca / Modelo</th>
            <th class="px-6 py-4">Serial / Número</th>
            <th class="px-6 py-4">Ubicación Inicial</th>
            <th class="px-6 py-4">Factura Adjunta</th>
            <th class="px-6 py-4" *ngIf="isAdmin">Valor Compra</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          @for (a of altas; track a.id) {
            <tr class="hover:bg-slate-50/50 transition-colors">
              <!-- Fecha Ingreso -->
              <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                {{ a.fechaIngreso | date: 'dd/MM/yyyy' }}
              </td>
              <!-- Placa -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-indigo-600 font-bold bg-indigo-50/30 px-2 py-0.5 rounded border border-indigo-100/50">
                  {{ a.placa }}
                </span>
              </td>
              <!-- Tipo -->
              <td class="px-6 py-4 font-semibold text-slate-700">
                {{ typeMap[a.tipoActivoId]?.label || a.tipoActivoId }}
              </td>
              <!-- Marca / Modelo -->
              <td class="px-6 py-4 font-medium text-slate-700">
                {{ a.marca }} <span class="text-slate-400 font-normal">{{ a.modelo }}</span>
              </td>
              <!-- Serial -->
              <td class="px-6 py-4 font-mono text-slate-500">
                {{ a.serial || 'N/A' }}
              </td>
              <!-- Ubicación -->
              <td class="px-6 py-4 font-semibold text-slate-600">
                {{ a.location?.nombre || 'Bodega Principal' }}
              </td>
              <!-- Factura -->
              <td class="px-6 py-4 whitespace-nowrap">
                @if (a.facturaUrl) {
                  <a [href]="a.facturaUrl" target="_blank" title="Ver Factura"
                     class="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-all">
                    📄 Factura ↗
                  </a>
                } @else {
                  <span class="text-slate-300 font-mono text-[11px]">—</span>
                }
              </td>
              <!-- Valor de Compra (Admin only) -->
              <td class="px-6 py-4 font-bold text-slate-800 whitespace-nowrap" *ngIf="isAdmin">
                {{ (a.precioCompra || 0) | currency: 'USD': 'symbol': '1.0-0' }}
              </td>
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="isAdmin ? 8 : 7" class="px-6 py-12 text-center text-slate-400 font-medium">
                No se encontraron registros de altas con los filtros aplicados.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ReportsAltasTableComponent {
  @Input() altas: Activo[] = [];
  @Input() typeMap: Record<string, any> = {};
  @Input() isAdmin: boolean = false;
}
