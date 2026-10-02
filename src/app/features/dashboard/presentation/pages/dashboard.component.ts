import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';
import { DashboardMetrics, StateDistribution } from '../../domain/models/dashboard.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Resumen del Sistema</h2>
          <p class="text-sm text-slate-500 mt-1">Métricas clave e inventario de activos</p>
        </div>
      </div>

      <!-- Cargando -->
      <div *ngIf="loading()" class="text-center py-12 text-slate-400 text-sm">
        Cargando métricas…
      </div>

      <!-- Error -->
      <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
        {{ error() }}
      </div>

      <ng-container *ngIf="!loading() && !error()">

        <!-- Banner Principal: Resumen Detallado de Activos con Filtro Dinámico -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden border border-indigo-900/40">
          <!-- Background accent pattern -->
          <div class="absolute right-0 top-0 opacity-5 translate-x-12 -translate-y-12 scale-150 pointer-events-none">
            <svg class="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>

          <!-- Barra superior de filtros dinámicos (Tipo -> Modelo) -->
          <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-indigo-900/50">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-inner">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-indigo-300">Explorador Dinámico de Parque</span>
                  <span *ngIf="bannerTypeFilter() || bannerModelFilter()" 
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/25 text-indigo-200 border border-indigo-400/40">
                    FILTRADO
                  </span>
                </div>
                <p class="text-[11px] text-indigo-200/60 font-medium mt-0.5">Filtra por categoría o consulta un modelo específico al instante</p>
              </div>
            </div>

            <!-- Controles de filtrado -->
            <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <!-- Selector 1: Tipo -->
              <div class="relative flex-1 sm:flex-initial">
                <select [value]="bannerTypeFilter() ?? ''" 
                        (change)="onBannerTypeChange($any($event.target).value)"
                        class="w-full sm:w-auto appearance-none bg-slate-900/90 hover:bg-slate-800 text-xs text-white font-semibold pl-3 pr-8 py-2 rounded-xl border border-indigo-800/60 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer">
                  <option value="" class="bg-slate-900 text-slate-300">🌐 Todos los Tipos</option>
                  <option *ngFor="let t of availableBannerTypes()" [value]="t" class="bg-slate-900 text-white">
                    {{ t }}
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-indigo-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </div>
              </div>

              <!-- Selector 2: Modelo -->
              <div class="relative flex-1 sm:flex-initial">
                <select [value]="bannerModelFilter() ?? ''" 
                        [disabled]="!bannerTypeFilter()"
                        (change)="onBannerModelChange($any($event.target).value)"
                        class="w-full sm:w-auto appearance-none bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:cursor-not-allowed text-xs text-white font-semibold pl-3 pr-8 py-2 rounded-xl border border-indigo-800/60 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer">
                  <option value="" class="bg-slate-900 text-slate-300">
                    {{ bannerTypeFilter() ? '📱 Todos los Modelos (' + availableBannerModels().length + ')' : '📱 Selecciona Tipo primero' }}
                  </option>
                  <option *ngFor="let m of availableBannerModels()" [value]="m" class="bg-slate-900 text-white">
                    {{ m }}
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-indigo-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </div>
              </div>

              <!-- Botón Restablecer Filtro -->
              <button *ngIf="bannerTypeFilter() || bannerModelFilter()"
                      (click)="resetBannerFilter()"
                      title="Volver a la vista global"
                      class="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/80 border border-indigo-700/50 px-3 py-2 rounded-xl transition-all duration-200 group">
                <svg class="w-3.5 h-3.5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <span>Global</span>
              </button>
            </div>
          </div>

          <div class="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <!-- Col 1: Total & Descripción Dinámica -->
            <div class="md:col-span-4 text-center md:text-left flex flex-col justify-center h-full">
              <p class="text-xs font-bold uppercase tracking-wider text-indigo-300/80">{{ bannerTitle() }}</p>
              <p class="text-6xl md:text-7xl font-extrabold leading-none mt-3 text-white tracking-tight transition-all duration-300">{{ bannerTotalCount() }}</p>
              <p class="text-xs text-indigo-200/60 font-medium mt-3 max-w-xs leading-relaxed">{{ bannerSubtitle() }}</p>
            </div>

            <!-- Col 2: Donut Chart Dinámico -->
            <div class="md:col-span-4 flex justify-center items-center">
              <div class="relative w-40 h-40 flex justify-center items-center">
                <!-- SVG Donut Chart -->
                <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" stroke-width="10" opacity="0.3"></circle>
                  <ng-container *ngFor="let seg of bannerStatesLegend()">
                    <circle *ngIf="seg.count > 0"
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            [attr.stroke]="seg.color"
                            stroke-width="10"
                            [attr.stroke-dasharray]="seg.dashArray"
                            [attr.stroke-dashoffset]="seg.dashOffset"
                            class="transition-all duration-500 hover:stroke-[12px] cursor-pointer">
                    </circle>
                  </ng-container>
                </svg>
                
                <!-- Floating Total Count inside the Donut -->
                <div class="absolute flex flex-col items-center justify-center text-center px-2">
                  <span class="text-2xl font-black text-white leading-none transition-all duration-300">{{ bannerTotalCount() }}</span>
                  <span class="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5 truncate max-w-[90px]">{{ bannerDonutLabel() }}</span>
                </div>
              </div>
            </div>

            <!-- Col 3: Detailed Legend Table Dinámica -->
            <div class="md:col-span-4 bg-slate-950/45 rounded-xl p-4 border border-indigo-950/50 backdrop-blur-sm">
              <div class="flex flex-col gap-2.5">
                <div class="grid grid-cols-12 text-[9px] uppercase font-black tracking-widest text-indigo-300/60 border-b border-indigo-950/80 pb-1.5 mb-0.5">
                  <span class="col-span-6">Estado</span>
                  <span class="col-span-3 text-right">Cant.</span>
                  <span class="col-span-3 text-right">Porc.</span>
                </div>
                <div *ngFor="let item of bannerStatesLegend()" class="grid grid-cols-12 items-center text-xs font-semibold">
                  <div class="col-span-6 flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.backgroundColor]="item.color"></span>
                    <span class="truncate text-slate-200 text-[11px]">{{ item.label }}</span>
                  </div>
                  <span class="col-span-3 text-right font-bold text-slate-100 text-[11px]">{{ item.count }}</span>
                  <span class="col-span-3 text-right text-indigo-300/80 text-[11px]">{{ item.percentage }}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Fila de KPIs de Alerta y Operación (6 columnas sincronizadas) -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Métricas Operativas</h3>
            <span *ngIf="activeFilterName()" 
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Filtro activo: {{ activeFilterName() }}
            </span>
          </div>
          <span *ngIf="!activeFilterName()" class="text-[11px] text-slate-400 font-medium">Consolidado general de inventario</span>
          <span *ngIf="activeFilterName()" class="text-[11px] text-indigo-600 font-bold">Métricas específicas para {{ activeFilterName() }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          
          <!-- KPI 1: Tasa de Utilización -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-600 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa de Utilización</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600">En uso</span>
              </div>
              <div class="flex items-end justify-between mt-3">
                <div>
                  <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ utilizationRate() }}%</p>
                  <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ asignadoCount() }} {{ activeFilterName() ? activeFilterName() : 'activos' }} en operación</p>
                </div>
                <!-- Radial Progress Indicator -->
                <div class="relative w-10 h-10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                    <path class="text-slate-100" stroke="currentColor" stroke-width="3.5" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="text-blue-600 transition-all duration-500" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none"
                          [attr.stroke-dasharray]="utilizationRate() + ', 100'"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="absolute text-[8px] font-black text-slate-700">{{ utilizationRate() }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI 2: Disponibles -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibles</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600">En bodega</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ disponibleCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Equipos {{ activeFilterName() ? activeFilterName() + ' ' : '' }}listos en bodega</p>
              </div>
            </div>
          </div>
 
          <!-- KPI 3: En Mantenimiento -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Mantenimiento</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600">Alerta técnica</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ mantenimientoCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName() ? activeFilterName() + ' en' : 'Dispositivos en' }} reparación técnica</p>
              </div>
            </div>
          </div>
 
          <!-- KPI 4: Dados de Baja -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-slate-400 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dados de Baja</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-600">Descartados</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ bajaCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName() ? activeFilterName() + ' descartados' : 'Historial total de equipos dados de baja' }}</p>
              </div>
            </div>
          </div>
 
          <!-- KPI 5: Rechazado / Novedad -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-red-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rechazado / Novedad</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-50 text-red-600">Rechazados</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ rechazadoCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName() ? activeFilterName() + ' con reporte' : 'Equipos rechazados o con novedades reportadas' }}</p>
              </div>
            </div>
          </div>
 
          <!-- KPI 6: En Tránsito -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Tránsito</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600">En tránsito</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight transition-all duration-300">{{ enTransitoCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ activeFilterName() ? activeFilterName() + ' en traslado' : 'Equipos en traslado y pendientes por recibir' }}</p>
              </div>
            </div>
          </div>
 
        </div>

        <!-- Sección de Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- Gráfico principal: Inventario por Tipo (con Drill-down)   -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div class="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <div class="flex items-center gap-3">
                  <button *ngIf="drillDownType()" 
                          (click)="clearDrillDown()"
                          class="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all duration-200 group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                    </svg>
                    Volver a Tipos
                  </button>
                  <div>
                    <h3 class="text-base font-bold text-slate-800">
                      {{ drillDownType() ? '🔍 Modelos de ' + drillDownType() : 'Inventario por tipo 📊' }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {{ drillDownType() 
                          ? 'Desglose de modelos dentro del tipo "' + drillDownType() + '"' 
                          : 'Distribución de equipos disponibles vs asignados — Haz clic en una barra para ver los modelos' }}
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Leyenda de 2 colores -->
              <div class="flex items-center gap-4 text-xs font-bold">
                <div class="flex items-center gap-1.5">
                  <div class="h-3 w-3 rounded-md bg-emerald-500"></div>
                  <span class="text-slate-600">Disponible (Bodega)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="h-3 w-3 rounded-md bg-indigo-600"></div>
                  <span class="text-slate-600">Asignado</span>
                </div>
              </div>
            </div>

            <!-- Gráfico de barras apiladas (Stacked) -->
            <div class="flex items-end justify-between md:justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2 overflow-x-auto min-w-0 chart-transition"
                 [class.chart-entering]="chartAnimating()">
              <div *ngFor="let item of activeChartData()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group relative"
                   [class.cursor-pointer]="!drillDownType()"
                   (click)="onBarClick(item.key)">
                
                <!-- Info popup al pasar el mouse -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded-lg p-2 absolute mb-64 shadow-xl z-20 pointer-events-none whitespace-nowrap">
                  <p class="font-bold border-b border-slate-700 pb-1 mb-1">{{ item.key }}</p>
                  <p class="flex items-center justify-between gap-3 text-emerald-400">Bodega: <span class="font-extrabold">{{ item.disponible }}</span></p>
                  <p class="flex items-center justify-between gap-3 text-indigo-300">Asignados: <span class="font-extrabold">{{ item.asignado }}</span></p>
                  <p *ngIf="!drillDownType()" class="text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-700">Clic para ver modelos →</p>
                </div>

                <!-- Barra stacked -->
                <div class="w-full flex flex-col justify-end bg-slate-100 rounded-lg overflow-hidden transition-all duration-300 group-hover:shadow-md"
                     [class.ring-2]="!drillDownType()"
                     [class.ring-transparent]="!drillDownType()"
                     [class.group-hover:ring-indigo-300]="!drillDownType()"
                     [style.height.px]="item.barHeight">
                  <!-- Segmento Asignado (Indigo) -->
                  <div *ngIf="item.asignado > 0"
                       class="bg-indigo-600 w-full transition-colors group-hover:bg-indigo-500"
                       [style.height.%]="item.asignadoHeight"
                       title="Asignado: {{ item.asignado }}">
                  </div>
                  <!-- Segmento Disponible/Bodega (Verde) -->
                  <div *ngIf="item.disponible > 0"
                       class="bg-emerald-500 w-full transition-colors group-hover:bg-emerald-400"
                       [style.height.%]="item.disponibleHeight"
                       title="Disponible: {{ item.disponible }}">
                  </div>
                </div>

                <!-- Label de dispositivo -->
                <span class="text-xs text-slate-600 font-bold text-center leading-tight mt-1 truncate w-full">{{ item.key }}</span>
                <span class="text-[10px] text-slate-400 font-extrabold">Total: {{ item.total }}</span>
              </div>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- Gráfico: Dispositivos en Mantenimiento (con Drill-down)   -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div class="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-amber-500">
            <div class="flex items-center justify-between mb-6">
              <div>
                <div class="flex items-center gap-3">
                  <button *ngIf="drillDownMant()" 
                          (click)="clearDrillDownMant()"
                          class="flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all duration-200 group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                    </svg>
                    Volver a Tipos
                  </button>
                  <div>
                    <h3 class="text-base font-bold text-amber-700">
                      {{ drillDownMant() ? '🔍 Modelos de ' + drillDownMant() + ' en mantenimiento' : '🔧 Dispositivos en Mantenimiento' }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {{ drillDownMant()
                          ? 'Desglose por modelo dentro del tipo "' + drillDownMant() + '"'
                          : 'Distribución de equipos en reparación o revisión técnica por tipo — Haz clic para ver modelos' }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <div class="h-3 w-3 rounded-md bg-amber-500"></div>
                <span class="text-slate-600">Equipos en Mantenimiento</span>
              </div>
            </div>

            <!-- Gráfico de barras -->
            <div *ngIf="activeMantData().length > 0; else noMantenimientos" 
                 class="flex items-end justify-between md:justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2 overflow-x-auto min-w-0 chart-transition"
                 [class.chart-entering]="chartAnimatingMant()">
              <div *ngFor="let item of activeMantData()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group relative"
                   [class.cursor-pointer]="!drillDownMant()"
                   (click)="onMantBarClick(item.key)">
                
                <!-- Tooltip -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded-lg p-2 absolute mb-64 shadow-xl z-20 pointer-events-none whitespace-nowrap">
                  <p class="font-bold border-b border-slate-700 pb-1 mb-1">{{ item.key }}</p>
                  <p class="flex items-center justify-between gap-3 text-amber-400">En mantenimiento: <span class="font-extrabold">{{ item.value }}</span></p>
                  <p *ngIf="!drillDownMant()" class="text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-700">Clic para ver modelos →</p>
                </div>

                <!-- Valor encima de la barra -->
                <span class="text-xs font-bold text-amber-700 opacity-80">{{ item.value }}</span>

                <!-- Barra de mantenimiento (Amber) -->
                <div class="w-full bg-amber-500 rounded-t-lg transition-all group-hover:bg-amber-400"
                     [class.ring-2]="!drillDownMant()"
                     [class.ring-transparent]="!drillDownMant()"
                     [class.group-hover:ring-amber-300]="!drillDownMant()"
                     [style.height.px]="item.barHeight">
                </div>

                <!-- Label -->
                <span class="text-xs text-slate-600 font-bold text-center leading-tight mt-1 truncate w-full">{{ item.key }}</span>
              </div>
            </div>

            <!-- Estado vacío para mantenimiento -->
            <ng-template #noMantenimientos>
              <div class="text-center py-12 text-slate-400 text-sm font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                ✅ No se registran equipos en mantenimiento en este momento.
              </div>
            </ng-template>
          </div>

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- Gráfico: Dispositivos en Baja (con Drill-down)            -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div class="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <div class="flex items-center gap-3">
                  <button *ngIf="drillDownBaja()" 
                          (click)="clearDrillDownBaja()"
                          class="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all duration-200 group">
                    <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                    </svg>
                    Volver a Tipos
                  </button>
                  <div>
                    <h3 class="text-base font-bold text-rose-700">
                      {{ drillDownBaja() ? '🔍 Modelos de ' + drillDownBaja() + ' dados de baja' : '📉 Dispositivos en Baja (Histórico)' }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {{ drillDownBaja()
                          ? 'Desglose por modelo dentro del tipo "' + drillDownBaja() + '"'
                          : 'Historial acumulado de descarte de equipos por tipo — Haz clic para ver modelos' }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <div class="h-3 w-3 rounded-md bg-rose-600"></div>
                <span class="text-slate-600">Equipos Dados de Baja</span>
              </div>
            </div>

            <!-- Gráfico de barras -->
            <div *ngIf="activeBajaData().length > 0; else noBajas" 
                 class="flex items-end justify-between md:justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2 overflow-x-auto min-w-0 chart-transition"
                 [class.chart-entering]="chartAnimatingBaja()">
              <div *ngFor="let item of activeBajaData()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group relative"
                   [class.cursor-pointer]="!drillDownBaja()"
                   (click)="onBajaBarClick(item.key)">
                
                <!-- Tooltip -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded-lg p-2 absolute mb-64 shadow-xl z-20 pointer-events-none whitespace-nowrap">
                  <p class="font-bold border-b border-slate-700 pb-1 mb-1">{{ item.key }}</p>
                  <p class="flex items-center justify-between gap-3 text-rose-400">Dados de baja: <span class="font-extrabold">{{ item.value }}</span></p>
                  <p *ngIf="!drillDownBaja()" class="text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-700">Clic para ver modelos →</p>
                </div>

                <!-- Valor encima de la barra -->
                <span class="text-xs font-bold text-rose-700 opacity-80">{{ item.value }}</span>

                <!-- Barra de baja (Crimson Rose) -->
                <div class="w-full bg-rose-600 rounded-t-lg transition-all group-hover:bg-rose-500"
                     [class.ring-2]="!drillDownBaja()"
                     [class.ring-transparent]="!drillDownBaja()"
                     [class.group-hover:ring-rose-300]="!drillDownBaja()"
                     [style.height.px]="item.barHeight">
                </div>

                <!-- Label -->
                <span class="text-xs text-slate-600 font-bold text-center leading-tight mt-1 truncate w-full">{{ item.key }}</span>
              </div>
            </div>

            <!-- Estado vacío para bajas -->
            <ng-template #noBajas>
              <div class="text-center py-12 text-slate-400 text-sm font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                ✅ No se registran equipos dados de baja en el sistema.
              </div>
            </ng-template>
          </div>

        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .chart-transition {
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .chart-entering {
      animation: chartSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes chartSlideIn {
      0% {
        opacity: 0;
        transform: translateX(24px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {

  metrics   = signal<DashboardMetrics | null>(null);
  loading   = signal(true);
  error     = signal<string | null>(null);

  /** Drill-down signals para las 3 gráficas */
  drillDownType = signal<string | null>(null);
  drillDownMant = signal<string | null>(null);
  drillDownBaja = signal<string | null>(null);

  /** Flags de animación para cada gráfica */
  chartAnimating     = signal(false);
  chartAnimatingMant = signal(false);
  chartAnimatingBaja = signal(false);

  // ── Filtros dinámicos del Banner Principal ──
  bannerTypeFilter  = signal<string | null>(null);
  bannerModelFilter = signal<string | null>(null);

  availableBannerTypes = computed(() => {
    const byType = this.metrics()?.stateDistributionByType;
    return byType ? Object.keys(byType).sort() : [];
  });

  availableBannerModels = computed(() => {
    const selectedType = this.bannerTypeFilter();
    if (!selectedType) return [];
    const byModel = this.metrics()?.stateDistributionByModel?.[selectedType];
    return byModel ? Object.keys(byModel).sort() : [];
  });

  activeBannerDistribution = computed<StateDistribution>(() => {
    const metrics = this.metrics();
    const type = this.bannerTypeFilter();
    const model = this.bannerModelFilter();

    if (type && model) {
      const modelDist = metrics?.stateDistributionByModel?.[type]?.[model];
      if (modelDist) return modelDist;
    }

    if (type) {
      const typeDist = metrics?.stateDistributionByType?.[type];
      if (typeDist) return typeDist;
    }

    return {
      total: metrics?.totalCount ?? 0,
      disponible: metrics?.disponibleCount ?? 0,
      asignado: metrics?.asignadoCount ?? 0,
      mantenimiento: metrics?.mantenimientoCount ?? 0,
      baja: metrics?.bajaCount ?? 0,
      enTransito: metrics?.enTransitoCount ?? 0,
      rechazado: metrics?.rechazadoCount ?? 0,
    };
  });

  bannerTotalCount = computed(() => this.activeBannerDistribution().total);

  bannerTitle = computed(() => {
    const type = this.bannerTypeFilter();
    const model = this.bannerModelFilter();
    if (type && model) return `Total ${model}`;
    if (type) return `Total ${type}`;
    return 'Total Productos Registrados';
  });

  bannerSubtitle = computed(() => {
    const type = this.bannerTypeFilter();
    const model = this.bannerModelFilter();
    if (type && model) return `Distribución operativa de ${model} (${type})`;
    if (type) return `Distribución consolidada de la categoría ${type}`;
    return 'Equipos y componentes activos registrados en la plataforma';
  });

  bannerDonutLabel = computed(() => {
    const model = this.bannerModelFilter();
    if (model) return model.length > 9 ? 'Equipos' : model;
    const type = this.bannerTypeFilter();
    if (type) return 'Equipos';
    return 'Activos';
  });

  bannerStatesLegend = computed(() => {
    const dist = this.activeBannerDistribution();
    const total = dist.total;

    const list = [
      { label: 'EN USO', count: dist.asignado, color: '#3b82f6' },
      { label: 'DISPONIBLE', count: dist.disponible, color: '#10b981' },
      { label: 'EN MANTENIMIENTO', count: dist.mantenimiento, color: '#f59e0b' },
      { label: 'DESCARTADOS', count: dist.baja, color: '#64748b' },
      { label: 'RECHAZADO / NOVEDAD', count: dist.rechazado, color: '#ef4444' },
      { label: 'EN TRÁNSITO', count: dist.enTransito, color: '#6366f1' }
    ];

    if (total === 0) {
      return list.map(item => ({
        ...item,
        percentage: 0,
        dashArray: `0 251.3`,
        dashOffset: 0
      }));
    }

    let accumulatedOffset = 0;
    const circumference = 251.3;

    return list.map(item => {
      const percentage = Math.round((item.count / total) * 1000) / 10;
      const arcLength = (item.count / total) * circumference;
      const dashArray = `${arcLength} ${circumference}`;
      const dashOffset = -accumulatedOffset;
      accumulatedOffset += arcLength;

      return {
        ...item,
        percentage,
        dashArray,
        dashOffset
      };
    });
  });

  // Computed properties sincronizadas con el filtro dinámico del Banner (o global si no hay filtro)
  totalProducts      = computed(() => this.activeBannerDistribution().total);
  disponibleCount    = computed(() => this.activeBannerDistribution().disponible);
  asignadoCount      = computed(() => this.activeBannerDistribution().asignado);
  mantenimientoCount = computed(() => this.activeBannerDistribution().mantenimiento);
  bajaCount          = computed(() => this.activeBannerDistribution().baja);
  enTransitoCount    = computed(() => this.activeBannerDistribution().enTransito);
  rechazadoCount     = computed(() => this.activeBannerDistribution().rechazado);
  activeFilterName   = computed(() => this.bannerModelFilter() ?? this.bannerTypeFilter() ?? null);

  statesLegend = computed(() => {
    const total = this.totalProducts();
    if (total === 0) return [];

    const list = [
      { label: 'EN USO', count: this.asignadoCount(), color: '#3b82f6' },
      { label: 'DISPONIBLE', count: this.disponibleCount(), color: '#10b981' },
      { label: 'EN MANTENIMIENTO', count: this.mantenimientoCount(), color: '#f59e0b' },
      { label: 'DESCARTADOS', count: this.bajaCount(), color: '#64748b' },
      { label: 'RECHAZADO / NOVEDAD', count: this.rechazadoCount(), color: '#ef4444' },
      { label: 'EN TRÁNSITO', count: this.enTransitoCount(), color: '#6366f1' }
    ];

    let accumulatedOffset = 0;
    const circumference = 251.3;

    return list.map(item => {
      const percentage = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0;
      const dashArray = `${total > 0 ? (item.count / total) * circumference : 0} ${circumference}`;
      const dashOffset = -accumulatedOffset;
      accumulatedOffset += total > 0 ? (item.count / total) * circumference : 0;

      return {
        ...item,
        percentage,
        dashArray,
        dashOffset
      };
    });
  });

  utilizationRate = computed(() => {
    const total = this.totalProducts() - this.bajaCount();
    if (total <= 0) return 0;
    return Math.round((this.asignadoCount() / total) * 100);
  });

  // ─────────────────────────────────────────────────
  // Gráfico principal: Disponible vs Asignado
  // ─────────────────────────────────────────────────

  deviceTypeStacked = computed(() => {
    const data = this.metrics()?.typeStacked ?? {};
    const entries = Object.entries(data);
    if (entries.length === 0) return [];
    
    const max = Math.max(...entries.map(([_, v]) => v.disponible + v.asignado), 1);

    return entries.map(([key, v]) => {
      const total = v.disponible + v.asignado;
      return {
        key,
        total,
        disponible: v.disponible,
        asignado: v.asignado,
        disponibleHeight: total > 0 ? Math.round((v.disponible / total) * 100) : 0,
        asignadoHeight: total > 0 ? Math.round((v.asignado / total) * 100) : 0,
        barHeight: Math.round((total / max) * 160)
      };
    });
  });

  modelDrillDownData = computed(() => {
    const selectedType = this.drillDownType();
    if (!selectedType) return [];

    const modelData = this.metrics()?.modelStacked?.[selectedType] ?? {};
    const entries = Object.entries(modelData);
    if (entries.length === 0) return [];

    const max = Math.max(...entries.map(([_, v]) => v.disponible + v.asignado), 1);

    return entries.map(([key, v]) => {
      const total = v.disponible + v.asignado;
      return {
        key,
        total,
        disponible: v.disponible,
        asignado: v.asignado,
        disponibleHeight: total > 0 ? Math.round((v.disponible / total) * 100) : 0,
        asignadoHeight: total > 0 ? Math.round((v.asignado / total) * 100) : 0,
        barHeight: Math.round((total / max) * 160)
      };
    }).sort((a, b) => b.total - a.total);
  });

  activeChartData = computed(() => {
    return this.drillDownType() ? this.modelDrillDownData() : this.deviceTypeStacked();
  });

  // ─────────────────────────────────────────────────
  // Gráfico de Mantenimiento (con drill-down)
  // ─────────────────────────────────────────────────

  mantenimientoDevices = computed(() => {
    const data = this.metrics()?.typeMantenimiento ?? {};
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    const max = Math.max(...Object.values(data), 1);

    return entries.map(([key, value]) => ({
      key,
      value,
      barHeight: Math.round((value / max) * 160)
    }));
  });

  mantModelDrillDown = computed(() => {
    const selectedType = this.drillDownMant();
    if (!selectedType) return [];

    const modelData = this.metrics()?.modelMantenimiento?.[selectedType] ?? {};
    const entries = Object.entries(modelData);
    if (entries.length === 0) return [];

    const max = Math.max(...Object.values(modelData), 1);

    return entries.map(([key, value]) => ({
      key,
      value,
      barHeight: Math.round((value / max) * 160)
    })).sort((a, b) => b.value - a.value);
  });

  activeMantData = computed(() => {
    return this.drillDownMant() ? this.mantModelDrillDown() : this.mantenimientoDevices();
  });

  // ─────────────────────────────────────────────────
  // Gráfico de Bajas (con drill-down)
  // ─────────────────────────────────────────────────

  bajaDevices = computed(() => {
    const data = this.metrics()?.typeBaja ?? {};
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    const max = Math.max(...Object.values(data), 1);

    return entries.map(([key, value]) => ({
      key,
      value,
      barHeight: Math.round((value / max) * 160)
    }));
  });

  bajaModelDrillDown = computed(() => {
    const selectedType = this.drillDownBaja();
    if (!selectedType) return [];

    const modelData = this.metrics()?.modelBaja?.[selectedType] ?? {};
    const entries = Object.entries(modelData);
    if (entries.length === 0) return [];

    const max = Math.max(...Object.values(modelData), 1);

    return entries.map(([key, value]) => ({
      key,
      value,
      barHeight: Math.round((value / max) * 160)
    })).sort((a, b) => b.value - a.value);
  });

  activeBajaData = computed(() => {
    return this.drillDownBaja() ? this.bajaModelDrillDown() : this.bajaDevices();
  });

  // ─────────────────────────────────────────────────

  constructor(
    private getDashboardMetricsUC: GetDashboardMetricsUseCase
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.getDashboardMetricsUC.execute().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error calculando métricas de inventario:', err);
        this.error.set('No se pudieron obtener las métricas. Verifica que el backend esté activo.');
        this.loading.set(false);
      }
    });
  }

  // ── Drill-down: Inventario Principal ──

  onBarClick(typeKey: string): void {
    if (this.drillDownType()) return;
    const modelData = this.metrics()?.modelStacked?.[typeKey];
    if (!modelData || Object.keys(modelData).length === 0) return;
    this.triggerAnimation('main');
    this.drillDownType.set(typeKey);
  }

  clearDrillDown(): void {
    this.triggerAnimation('main');
    this.drillDownType.set(null);
  }

  // ── Drill-down: Mantenimiento ──

  onMantBarClick(typeKey: string): void {
    if (this.drillDownMant()) return;
    const modelData = this.metrics()?.modelMantenimiento?.[typeKey];
    if (!modelData || Object.keys(modelData).length === 0) return;
    this.triggerAnimation('mant');
    this.drillDownMant.set(typeKey);
  }

  clearDrillDownMant(): void {
    this.triggerAnimation('mant');
    this.drillDownMant.set(null);
  }

  // ── Drill-down: Bajas ──

  onBajaBarClick(typeKey: string): void {
    if (this.drillDownBaja()) return;
    const modelData = this.metrics()?.modelBaja?.[typeKey];
    if (!modelData || Object.keys(modelData).length === 0) return;
    this.triggerAnimation('baja');
    this.drillDownBaja.set(typeKey);
  }

  clearDrillDownBaja(): void {
    this.triggerAnimation('baja');
    this.drillDownBaja.set(null);
  }

  // ── Filtros Banner Principal ──

  onBannerTypeChange(type: string): void {
    this.bannerTypeFilter.set(type ? type : null);
    this.bannerModelFilter.set(null);
  }

  onBannerModelChange(model: string): void {
    this.bannerModelFilter.set(model ? model : null);
  }

  resetBannerFilter(): void {
    this.bannerTypeFilter.set(null);
    this.bannerModelFilter.set(null);
  }

  // ── Utilidad de animación ──

  private triggerAnimation(chart: 'main' | 'mant' | 'baja'): void {
    const sig = chart === 'main' ? this.chartAnimating
              : chart === 'mant' ? this.chartAnimatingMant
              : this.chartAnimatingBaja;
    sig.set(true);
    setTimeout(() => sig.set(false), 400);
  }
}