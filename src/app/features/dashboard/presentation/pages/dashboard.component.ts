import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';
import { DashboardMetrics } from '../../domain/models/dashboard.model';

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

        <!-- Banner Principal: Resumen Detallado de Activos -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden border border-indigo-900/40">
          <!-- Background accent pattern -->
          <div class="absolute right-0 top-0 opacity-5 translate-x-12 -translate-y-12 scale-150 pointer-events-none">
            <svg class="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>

          <div class="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <!-- Col 1: Total -->
            <div class="md:col-span-4 text-center md:text-left flex flex-col justify-center h-full">
              <p class="text-xs font-bold uppercase tracking-wider text-indigo-300/80">Total Productos Registrados</p>
              <p class="text-6xl md:text-7xl font-extrabold leading-none mt-3 text-white tracking-tight">{{ totalProducts() }}</p>
              <p class="text-xs text-indigo-200/60 font-medium mt-3 max-w-xs">Equipos y componentes activos registrados en la plataforma</p>
            </div>

            <!-- Col 2: Donut Chart -->
            <div class="md:col-span-4 flex justify-center items-center">
              <div class="relative w-40 h-40 flex justify-center items-center">
                <!-- SVG Donut Chart -->
                <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" stroke-width="10" opacity="0.3"></circle>
                  <ng-container *ngFor="let seg of statesLegend()">
                    <circle *ngIf="seg.count > 0"
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            [attr.stroke]="seg.color"
                            stroke-width="10"
                            [attr.stroke-dasharray]="seg.dashArray"
                            [attr.stroke-dashoffset]="seg.dashOffset"
                            class="transition-all duration-300 hover:stroke-[12px] cursor-pointer">
                    </circle>
                  </ng-container>
                </svg>
                
                <!-- Floating Total Count inside the Donut -->
                <div class="absolute flex flex-col items-center justify-center text-center">
                  <span class="text-2xl font-black text-white leading-none">{{ totalProducts() }}</span>
                  <span class="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5">Activos</span>
                </div>
              </div>
            </div>

            <!-- Col 3: Detailed Legend Table -->
            <div class="md:col-span-4 bg-slate-950/45 rounded-xl p-4 border border-indigo-950/50 backdrop-blur-sm">
              <div class="flex flex-col gap-2.5">
                <div class="grid grid-cols-12 text-[9px] uppercase font-black tracking-widest text-indigo-300/60 border-b border-indigo-950/80 pb-1.5 mb-0.5">
                  <span class="col-span-6">Estado</span>
                  <span class="col-span-3 text-right">Cant.</span>
                  <span class="col-span-3 text-right">Porc.</span>
                </div>
                <div *ngFor="let item of statesLegend()" class="grid grid-cols-12 items-center text-xs font-semibold">
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

        <!-- Fila de KPIs de Alerta y Operación (5 columnas) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          
          <!-- KPI 1: Tasa de Utilización -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-600 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa de Utilización</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600">En uso</span>
              </div>
              <div class="flex items-end justify-between mt-3">
                <div>
                  <p class="text-3xl font-black text-slate-800 tracking-tight">{{ utilizationRate() }}%</p>
                  <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{{ asignadoCount() }} activos en operación</p>
                </div>
                <!-- Radial Progress Indicator -->
                <div class="relative w-10 h-10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                    <path class="text-slate-100" stroke="currentColor" stroke-width="3.5" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="text-blue-600" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none"
                          [attr.stroke-dasharray]="utilizationRate() + ', 100'"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="absolute text-[8px] font-black text-slate-700">{{ utilizationRate() }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI 2: En Mantenimiento -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Mantenimiento</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600">Alerta técnica</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight">{{ mantenimientoCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Dispositivos en reparación o revisión técnica</p>
              </div>
            </div>
          </div>

          <!-- KPI 3: Dados de Baja -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-slate-400 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dados de Baja</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-600">Descartados</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight">{{ bajaCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Historial total de equipos dados de baja</p>
              </div>
            </div>
          </div>

          <!-- KPI 4: Rechazado / Novedad -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-red-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rechazado / Novedad</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-50 text-red-600">Rechazados</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight">{{ rechazadoCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Equipos rechazados o con novedades reportadas</p>
              </div>
            </div>
          </div>

          <!-- KPI 5: En Tránsito -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Tránsito</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600">En tránsito</span>
              </div>
              <div class="mt-3">
                <p class="text-3xl font-black text-slate-800 tracking-tight">{{ enTransitoCount() }}</p>
                <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Equipos en traslado y pendientes por recibir</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Sección de Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <!-- Gráfico principal: Inventario por Tipo (Gráfico de Barras de 2 Colores / Stacked) -->
          <div class="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-bold text-slate-800">Inventario por tipo 📊</h3>
                <p class="text-xs text-slate-500 mt-0.5">Distribución de equipos disponibles vs asignados</p>
              </div>
              
              <!-- Leyenda de 2 colores (Verde y Morado/Índigo, sin naranja) -->
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
            <div class="flex items-end justify-between md:justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2 overflow-x-auto min-w-0">
              <div *ngFor="let item of deviceTypeStacked()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group relative">
                
                <!-- Info popup al pasar el mouse -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded-lg p-2 absolute mb-64 shadow-xl z-20 pointer-events-none">
                  <p class="font-bold border-b border-slate-700 pb-1 mb-1">{{ item.key }}</p>
                  <p class="flex items-center justify-between gap-3 text-emerald-400">Bodega: <span class="font-extrabold">{{ item.disponible }}</span></p>
                  <p class="flex items-center justify-between gap-3 text-indigo-300">Asignados: <span class="font-extrabold">{{ item.asignado }}</span></p>
                </div>

                <!-- Barra stacked -->
                <div class="w-full flex flex-col justify-end bg-slate-100 rounded-lg overflow-hidden transition-all duration-300 group-hover:shadow-md"
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

          <!-- Gráfico intermedio: Dispositivos en Mantenimiento -->
          <div class="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-amber-500">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-bold text-slate-800 text-amber-700">🔧 Dispositivos en Mantenimiento</h3>
                <p class="text-xs text-slate-500 mt-0.5">Distribución de equipos en reparación o revisión técnica por tipo</p>
              </div>
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <div class="h-3 w-3 rounded-md bg-amber-500"></div>
                <span class="text-slate-600">Equipos en Mantenimiento</span>
              </div>
            </div>

            <!-- Gráfico de barras simples amarillas para mantenimiento -->
            <div *ngIf="mantenimientoDevices().length > 0; else noMantenimientos" 
                 class="flex items-end justify-between md:justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2 overflow-x-auto min-w-0">
              <div *ngFor="let item of mantenimientoDevices()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group">
                
                <!-- Valor encima de la barra -->
                <span class="text-xs font-bold text-amber-700 opacity-80">{{ item.value }}</span>

                <!-- Barra de mantenimiento (Amber) -->
                <div class="w-full bg-amber-500 rounded-t-lg transition-all group-hover:bg-amber-400"
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

          <!-- Gráfico inferior: Dispositivos en Baja (Histórico) -->
          <div class="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-bold text-slate-800 text-rose-700">📉 Dispositivos en Baja (Histórico)</h3>
                <p class="text-xs text-slate-500 mt-0.5">Historial acumulado de descarte de equipos por tipo</p>
              </div>
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <div class="h-3 w-3 rounded-md bg-rose-600"></div>
                <span class="text-slate-600">Equipos Dados de Baja</span>
              </div>
            </div>

            <!-- Gráfico de barras simples rojas para bajas -->
            <div *ngIf="bajaDevices().length > 0; else noBajas" 
                 class="flex items-end justify-between md:justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2 overflow-x-auto min-w-0">
              <div *ngFor="let item of bajaDevices()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group">
                
                <!-- Valor encima de la barra -->
                <span class="text-xs font-bold text-rose-700 opacity-80">{{ item.value }}</span>

                <!-- Barra de baja (Crimson Rose) -->
                <div class="w-full bg-rose-600 rounded-t-lg transition-all group-hover:bg-rose-500"
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
  `]
})
export class DashboardComponent implements OnInit {

  metrics   = signal<DashboardMetrics | null>(null);
  loading   = signal(true);
  error     = signal<string | null>(null);

  // Computed properties
  totalProducts    = computed(() => this.metrics()?.totalCount ?? 0);
  disponibleCount  = computed(() => this.metrics()?.disponibleCount ?? 0);
  asignadoCount    = computed(() => this.metrics()?.asignadoCount ?? 0);
  mantenimientoCount = computed(() => this.metrics()?.mantenimientoCount ?? 0);
  bajaCount        = computed(() => this.metrics()?.bajaCount ?? 0);
  enTransitoCount  = computed(() => this.metrics()?.enTransitoCount ?? 0);
  rechazadoCount   = computed(() => this.metrics()?.rechazadoCount ?? 0);

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

  // Data agrupada para gráfico apilado (2 colores: Disponible vs Asignado)
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

  // Data agrupada para gráfico de mantenimiento
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

  // Data agrupada para gráfico de bajas
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
}