import { Component, Input, signal } from '@angular/core';
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
            <tr [class.bg-slate-50]="isExpanded(rep.id)" class="hover:bg-slate-50/50 transition-colors">
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
                <div class="flex items-center gap-2">
                  <span class="truncate block max-w-[180px] text-xs text-slate-600" [title]="rep.diagnostico || 'Sin diagnóstico'">
                    <span class="font-medium text-slate-500">Diag:</span> {{ rep.diagnostico || 'Sin detalles' }}
                  </span>
                  @if (rep.diagnostico || rep.accionesRealizadas || rep.repuestosUsados || rep.motivoEscalacion) {
                    <button
                      type="button"
                      (click)="toggleExpand(rep.id)"
                      class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-0.5"
                      [class.bg-amber-600]="isExpanded(rep.id)"
                      [class.text-white]="isExpanded(rep.id)"
                      [class.border-amber-600]="isExpanded(rep.id)"
                      [class.bg-slate-50]="!isExpanded(rep.id)"
                      [class.text-amber-700]="!isExpanded(rep.id)"
                      [class.border-slate-200]="!isExpanded(rep.id)"
                      [class.hover:bg-amber-50]="!isExpanded(rep.id)"
                      [title]="isExpanded(rep.id) ? 'Ocultar detalles' : 'Ver ficha técnica completa'">
                      <span>{{ isExpanded(rep.id) ? '▲' : '▼' }}</span>
                      <span>{{ isExpanded(rep.id) ? 'Cerrar' : 'Ficha' }}</span>
                    </button>
                  }
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

            <!-- Sub-fila Acordeón de Diagnóstico y Detalle Técnico -->
            @if (isExpanded(rep.id)) {
              <tr class="bg-amber-50/25 border-b border-amber-100/60 transition-all">
                <td colspan="8" class="px-8 py-3.5">
                  <div class="bg-white rounded-xl p-4 border border-amber-200/70 shadow-xs space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-sm">🔧</span>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                          Ficha Técnica de Mantenimiento · Placa {{ getActivoPlate(rep.activoId) }} (Ficha #{{ rep.id.slice(-8) }})
                        </span>
                      </div>
                      <span class="text-[10px] font-medium text-slate-400">
                        Fecha Cierre: {{ rep.fechaCierre | date: 'dd/MM/yyyy' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <!-- Diagnóstico -->
                      <div class="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                        <span class="text-[10px] font-bold uppercase text-slate-500 block mb-1">Diagnóstico / Falla Detectada</span>
                        <p class="text-slate-700 font-normal leading-relaxed whitespace-pre-wrap select-text">
                          {{ rep.diagnostico || 'Sin diagnóstico registrado' }}
                        </p>
                      </div>

                      <!-- Acciones Realizadas -->
                      <div class="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                        <span class="text-[10px] font-bold uppercase text-slate-500 block mb-1">Acciones y Solución Aplicada</span>
                        <p class="text-slate-700 font-normal leading-relaxed whitespace-pre-wrap select-text">
                          {{ rep.accionesRealizadas || 'Sin acciones registradas' }}
                        </p>
                      </div>
                    </div>

                    @if (rep.repuestosUsados || rep.motivoEscalacion || rep.referenciaOrdenServicio) {
                      <div class="text-xs pt-1 flex flex-wrap gap-4 text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                        @if (rep.repuestosUsados) {
                          <span>
                            <strong class="text-amber-900">Repuestos:</strong> {{ rep.repuestosUsados }}
                          </span>
                        }
                        @if (rep.motivoEscalacion) {
                          <span>
                            <strong class="text-amber-900">Motivo Escalación:</strong> {{ rep.motivoEscalacion }}
                          </span>
                        }
                        @if (rep.referenciaOrdenServicio) {
                          <span>
                            <strong class="text-amber-900">Ref. Orden:</strong> {{ rep.referenciaOrdenServicio }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </td>
              </tr>
            }
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

  expandedReportId = signal<string | null>(null);

  isExpanded(id: string): boolean {
    return this.expandedReportId() === id;
  }

  toggleExpand(id: string): void {
    this.expandedReportId.update(curr => (curr === id ? null : id));
  }

  getActivoPlate(activoId: string): string {
    const act = this.activos.find(a => a.id === activoId);
    return act ? act.placa : '...';
  }

  getActivoDetails(activoId: string): string {
    const act = this.activos.find(a => a.id === activoId);
    return act ? `${act.marca} ${act.modelo}` : 'Cargando equipo...';
  }
}
