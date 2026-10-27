import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activo-history-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <!-- Historial de Mantenimientos -->
      <div class="border-t border-slate-200 pt-5 space-y-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de Mantenimientos</h4>
        
        @if (maintHistory.length === 0) {
          <p class="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
            Este activo no registra mantenimientos anteriores.
          </p>
        } @else {
          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            @for (hist of maintHistory; track hist.id) {
              <div class="bg-slate-50/50 border border-slate-150 rounded-xl p-3 text-xs space-y-2 hover:bg-slate-50 transition-colors">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-700 font-mono">#{{ hist.id.substring(0, 8) }}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white" 
                    [class]="hist.estado === 'CERRADO' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-amber-600 border-amber-100 bg-amber-50'">
                    {{ hist.estado }}
                  </span>
                </div>
                
                <div class="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-500">
                  <div><span class="font-medium text-slate-400">Tipo:</span> {{ hist.tipoMantenimiento }}</div>
                  <div><span class="font-medium text-slate-400">Modalidad:</span> {{ hist.modalidad }}</div>
                  @if (hist.tecnicoResponsable || hist.proveedorServicio) {
                    <div class="col-span-2">
                      <span class="font-medium text-slate-400">Resp/Téc:</span> {{ hist.tecnicoResponsable || hist.proveedorServicio }}
                    </div>
                  }
                  @if (hist.fechaApertura) {
                    <div class="col-span-2 text-[10px] text-slate-400">
                      Abierto el: {{ hist.fechaApertura | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  }
                </div>

                @if (hist.diagnostico) {
                  <div class="bg-white border border-slate-100 rounded-lg p-2 mt-1">
                    <span class="font-bold text-slate-400 text-[10px] block uppercase">Diagnóstico</span>
                    <p class="text-slate-600 italic text-[11px] leading-relaxed mt-0.5">{{ hist.diagnostico }}</p>
                  </div>
                }

                @if (hist.accionesRealizadas) {
                  <div class="bg-white border border-slate-100 rounded-lg p-2 mt-1">
                    <span class="font-bold text-slate-400 text-[10px] block uppercase">Acciones Realizadas</span>
                    <p class="text-slate-600 text-[11px] leading-relaxed mt-0.5">{{ hist.accionesRealizadas }}</p>
                  </div>
                }

                @if (hist.resultadoFinal) {
                  <div class="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-100 mt-2">
                    <span class="text-slate-400">Resultado Final:</span>
                    <span [class]="hist.resultadoFinal === 'REPARADO' ? 'text-emerald-600' : 'text-rose-600'">
                      {{ hist.resultadoFinal }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Historial de Auditoría de Facturas/Soportes -->
      <div class="border-t border-slate-200 pt-5 space-y-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>📜 Traza de Auditoría de Facturas</span>
          <span class="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold">{{ auditHistory.length }}</span>
        </h4>
        
        @if (auditHistory.length === 0) {
          <p class="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
            No hay modificaciones de factura o precio registradas para este activo.
          </p>
        } @else {
          <div class="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            @for (audit of auditHistory; track audit.id) {
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-slate-700">{{ audit.changedByUser || 'Usuario' }}</span>
                  <span class="text-slate-400 font-mono text-[10px]">{{ audit.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                
                <div class="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                  <span class="font-bold text-slate-400 text-[10px] uppercase block">Motivo Registrado</span>
                  <p class="italic text-slate-700 mt-0.5">{{ audit.justification }}</p>
                </div>

                <div class="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                  @if (audit.previousFacturaUrl) {
                    <a [href]="audit.previousFacturaUrl" target="_blank" class="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                      📄 Ver Factura Anterior ↗
                    </a>
                  } @else {
                    <span class="text-slate-400">Sin factura previa</span>
                  }
                  @if (audit.previousPrecioCompra !== undefined && audit.previousPrecioCompra !== null && audit.previousPrecioCompra !== audit.newPrecioCompra) {
                    <span class="text-slate-500">
                      <s>{{ audit.previousPrecioCompra | currency:'USD':'symbol':'1.0-0' }}</s> → <strong>{{ audit.newPrecioCompra | currency:'USD':'symbol':'1.0-0' }}</strong>
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ActivoHistorySectionComponent {
  @Input() maintHistory: any[] = [];
  @Input() auditHistory: any[] = [];
}
