import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceReport } from '../../domain/models/maintenance.model';

@Component({
  selector: 'app-maintenance-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-t border-slate-100 pt-4 space-y-3">
      <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Línea de Tiempo del Mantenimiento</h4>
      
      <div class="relative pl-6 space-y-4 border-l border-slate-200">
        <!-- Apertura -->
        <div class="relative">
          <div class="absolute -left-[30px] top-1.5 bg-indigo-500 rounded-full h-3 w-3 border-2 border-white"></div>
          <p class="text-xs font-bold text-slate-700">Ficha Creada</p>
          <p class="text-[10px] text-slate-400">
            {{ report.fechaApertura ? (report.fechaApertura | date:'short') : '—' }}
          </p>
        </div>

        <!-- Diagnóstico / Inicio -->
        @if (report.fechaInicioInterno) {
          <div class="relative">
            <div class="absolute -left-[30px] top-1.5 bg-blue-500 rounded-full h-3 w-3 border-2 border-white"></div>
            <p class="text-xs font-bold text-slate-700">Diagnóstico Realizado</p>
            <p class="text-[10px] text-slate-500 mt-0.5">Diagnóstico: {{ report.diagnostico }}</p>
            <p class="text-[10px] text-slate-400">
              {{ report.fechaInicioInterno | date:'short' }}
            </p>
          </div>
        }

        <!-- Escalación -->
        @if (report.escalaAProveedor) {
          <div class="relative">
            <div class="absolute -left-[30px] top-1.5 bg-purple-500 rounded-full h-3 w-3 border-2 border-white"></div>
            <p class="text-xs font-bold text-purple-700">Escalado a Proveedor</p>
            <p class="text-[10px] text-slate-500 mt-0.5">Motivo: {{ report.motivoEscalacion }}</p>
            @if (report.soporteProveedorUrl) {
              <a [href]="report.soporteProveedorUrl" target="_blank" class="text-[10px] text-indigo-600 font-bold block hover:underline">Ver cotización proveedor 📄</a>
            }
            <p class="text-[10px] text-slate-400">
              {{ report.fechaEscalacion | date:'short' }}
            </p>
          </div>
        }

        <!-- Soporte de Autorización -->
        @if (report.soporteAutorizacionUrl) {
          <div class="relative">
            <div class="absolute -left-[30px] top-1.5 bg-red-500 rounded-full h-3 w-3 border-2 border-white"></div>
            <p class="text-xs font-bold text-red-700">Autorización Adjuntada</p>
            <a [href]="report.soporteAutorizacionUrl" target="_blank" class="text-[10px] text-indigo-600 font-bold block hover:underline">Ver soporte de autorización 📄</a>
          </div>
        }

        <!-- Cierre -->
        @if (report.fechaCierre) {
          <div class="relative">
            <div class="absolute -left-[30px] top-1.5 bg-emerald-500 rounded-full h-3 w-3 border-2 border-white"></div>
            <p class="text-xs font-bold text-emerald-700">Ficha Cerrada</p>
            <p class="text-[10px] text-slate-500 mt-0.5">Resultado: <span class="font-bold">{{ report.resultadoFinal }}</span></p>
            <p class="text-[10px] text-slate-500">Acciones: {{ report.accionesRealizadas }}</p>
            @if (report.costoFinal) {
              <p class="text-[10px] text-indigo-600 font-bold">Costo Final: $ {{ report.costoFinal | number:'1.2-2' }}</p>
            }
            <p class="text-[10px] text-slate-400">
              {{ report.fechaCierre | date:'short' }}
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class MaintenanceTimelineComponent {
  @Input({ required: true }) report!: MaintenanceReport;
}
