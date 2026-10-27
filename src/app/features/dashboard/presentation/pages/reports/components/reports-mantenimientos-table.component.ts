import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceReport } from '../../../../../maintenance/domain/models/maintenance.model';
import { Activo } from '../../../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-reports-mantenimientos-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
        <thead class="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <tr>
            <th class="px-6 py-4">Fecha Cierre</th>
            <th class="px-6 py-4">Placa</th>
            <th class="px-6 py-4">Equipo</th>
            <th class="px-6 py-4">Falla Reportada / Diagnóstico</th>
            <th class="px-6 py-4">Modalidad</th>
            <th class="px-6 py-4">Técnico / Proveedor</th>
            <th class="px-6 py-4 text-right">Costo Estimado</th>
            <th class="px-6 py-4 text-right">Costo Final</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          @for (rep of mantenimientos; track rep.id) {
            <tr class="hover:bg-slate-50/50 transition-colors">
              <!-- Fecha Cierre -->
              <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                {{ rep.fechaCierre | date: 'dd/MM/yyyy' }}
              </td>
              <!-- Placa -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold">
                  {{ getActivoPlate(rep.activoId) }}
                </span>
              </td>
              <!-- Equipo -->
              <td class="px-6 py-4 font-semibold text-slate-700">
                {{ getActivoDetails(rep.activoId) }}
              </td>
              <!-- Falla / Diagnostico -->
              <td class="px-6 py-4 max-w-sm">
                <div class="line-clamp-2" [title]="rep.diagnostico || 'Sin diagnóstico registrado'">
                  <span class="font-medium text-slate-500">Diag:</span> {{ rep.diagnostico || 'Sin detalles' }}
                </div>
              </td>
              <!-- Modalidad -->
              <td class="px-6 py-4">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {{ rep.modalidad }}
                </span>
              </td>
              <!-- Tecnico -->
              <td class="px-6 py-4 font-medium text-slate-700">
                {{ rep.tecnicoResponsable || rep.proveedorServicio || 'No asignado' }}
              </td>
              <!-- Costo Estimado -->
              <td class="px-6 py-4 text-right font-semibold text-slate-500">
                {{ (rep.costoEstimado || 0) | currency: 'USD': 'symbol': '1.0-0' }}
              </td>
              <!-- Costo Final -->
              <td class="px-6 py-4 text-right font-bold text-slate-900">
                {{ (rep.costoFinal || 0) | currency: 'USD': 'symbol': '1.0-0' }}
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">
                No se encontraron reportes cerrados de mantenimiento con los filtros aplicados.
              </td>
            </tr>
          }
        </tbody>
        
        <!-- Summary Footer -->
        <tfoot class="bg-slate-50 border-t border-slate-200 font-bold" *ngIf="mantenimientos.length > 0">
          <tr>
            <td colspan="7" class="px-6 py-4 text-right text-slate-500 uppercase tracking-wider text-[10px]">
              Costo Total Acumulado en Soporte:
            </td>
            <td class="px-6 py-4 text-right text-base text-indigo-700 font-extrabold whitespace-nowrap border-l border-slate-200 bg-indigo-50/35">
              {{ totalCost | currency: 'USD': 'symbol': '1.0-0' }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `
})
export class ReportsMantenimientosTableComponent {
  @Input() mantenimientos: MaintenanceReport[] = [];
  @Input() activos: Activo[] = [];
  @Input() totalCost: number = 0;

  getActivoPlate(activoId: string): string {
    const act = this.activos.find(a => a.id === activoId);
    return act ? act.placa : '...';
  }

  getActivoDetails(activoId: string): string {
    const act = this.activos.find(a => a.id === activoId);
    return act ? `${act.marca} ${act.modelo}` : 'Cargando equipo...';
  }
}
