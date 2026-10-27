import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-4">
      <!-- Fila de Encabezado de KPIs -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Métricas Operativas</h3>
          <span *ngIf="activeFilterName" 
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            Filtro activo: {{ activeFilterName }}
          </span>
        </div>
        <span *ngIf="!activeFilterName" class="text-[11px] text-slate-400 font-medium">Consolidado general de inventario</span>
        <span *ngIf="activeFilterName" class="text-[11px] text-indigo-600 font-bold">Métricas específicas para {{ activeFilterName }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        
        <!-- KPI 1: Tasa de Utilización -->
        <a [routerLink]="['/products']"
           [queryParams]="getKpiQueryParams('OPERACION')"
           class="group bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-300 border-l-4 border-l-blue-600 flex flex-col justify-between cursor-pointer block">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa de Utilización</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600">En uso</span>
            </div>
            <div class="flex items-end justify-between mt-3">
              <div>
                <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ utilizationRate }}%</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ asignadoCount }} {{ activeFilterName ? activeFilterName : 'activos' }} en operación</p>
              </div>
              <!-- Radial Progress Indicator -->
              <div class="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                  <path class="text-slate-100" stroke="currentColor" stroke-width="3.5" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-blue-600 transition-all duration-500" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none"
                        [attr.stroke-dasharray]="utilizationRate + ', 100'"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div class="absolute text-[8px] font-black text-slate-700">{{ utilizationRate }}%</div>
              </div>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
            <span>Ver en Activos</span>
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </a>

        <!-- KPI 2: Disponibles -->
        <a [routerLink]="['/products']"
           [queryParams]="getKpiQueryParams('DISPONIBLE')"
           class="group bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-emerald-300 transition-all duration-300 border-l-4 border-l-emerald-500 flex flex-col justify-between cursor-pointer block">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibles</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600">En bodega</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ disponibleCount }}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Equipos {{ activeFilterName ? activeFilterName + ' ' : '' }}listos en bodega</p>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
            <span>Ver en Activos</span>
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </a>

        <!-- KPI 3: En Mantenimiento -->
        <a [routerLink]="['/products']"
           [queryParams]="getKpiQueryParams('MANTENIMIENTO')"
           class="group bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-amber-300 transition-all duration-300 border-l-4 border-l-amber-500 flex flex-col justify-between cursor-pointer block">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Mantenimiento</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600">Alerta técnica</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ mantenimientoCount }}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName ? activeFilterName + ' en' : 'Dispositivos en' }} reparación técnica</p>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-amber-600 transition-colors">
            <span>Ver en Activos</span>
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </a>

        <!-- KPI 4: Dados de Baja -->
        <a [routerLink]="['/products']"
           [queryParams]="getKpiQueryParams('BAJA')"
           class="group bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-slate-400 transition-all duration-300 border-l-4 border-l-slate-400 flex flex-col justify-between cursor-pointer block">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dados de Baja</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-600">Descartados</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ bajaCount }}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName ? activeFilterName + ' descartados' : 'Historial total de equipos dados de baja' }}</p>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
            <span>Ver en Activos</span>
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </a>

        <!-- KPI 5: Rechazado / Novedad -->
        <a [routerLink]="['/products']"
           [queryParams]="getKpiQueryParams('RECHAZADO')"
           class="group bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-red-300 transition-all duration-300 border-l-4 border-l-red-500 flex flex-col justify-between cursor-pointer block">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rechazado / Novedad</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-50 text-red-600">Rechazados</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ rechazadoCount }}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName ? activeFilterName + ' con reporte' : 'Equipos rechazados o con novedades reportadas' }}</p>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-red-600 transition-colors">
            <span>Ver en Activos</span>
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </a>

        <!-- KPI 6: En Tránsito -->
        <a [routerLink]="['/products']"
           [queryParams]="getKpiQueryParams('EN_TRANSITO')"
           class="group bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-300 border-l-4 border-l-indigo-500 flex flex-col justify-between cursor-pointer block">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Tránsito</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600">En tránsito</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ enTransitoCount }}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName ? activeFilterName + ' en traslado' : 'Equipos en traslado y pendientes por recibir' }}</p>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
            <span>Ver en Activos</span>
            <span class="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </a>
      </div>
    </div>
  `
})
export class DashboardKpisComponent {
  @Input() activeFilterName: string | null = null;
  @Input() utilizationRate = 0;
  @Input() asignadoCount = 0;
  @Input() disponibleCount = 0;
  @Input() mantenimientoCount = 0;
  @Input() bajaCount = 0;
  @Input() rechazadoCount = 0;
  @Input() enTransitoCount = 0;
  @Input() bannerTypeFilter: string | null = null;
  @Input() bannerModelFilter: string | null = null;

  getKpiQueryParams(estado: string): Record<string, string> {
    const params: Record<string, string> = { estado };
    if (this.bannerTypeFilter) {
      params['tipo'] = this.bannerTypeFilter;
    }
    if (this.bannerModelFilter) {
      params['modelo'] = this.bannerModelFilter;
    }
    return params;
  }
}
