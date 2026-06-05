import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';
import { DashboardMetrics } from '../../domain/models/dashboard.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6">

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

        <!-- Banner Principal: Total Productos (Color Indigo de la App, Cero Naranja) -->
        <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
          <div class="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12 scale-150">
            <svg class="w-72 h-72" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div class="relative z-10 text-center">
            <p class="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Productos Registrados</p>
            <p class="text-6xl font-extrabold leading-none mt-2">{{ totalProducts() }}</p>
            <p class="text-xs text-indigo-100 font-medium mt-3 opacity-90">Equipos y componentes activos en la plataforma</p>
          </div>
        </div>

        <!-- Fila de KPIs de Alerta y Operación -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- KPI: Tasa de Operación -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Utilización</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">En uso</span>
            </div>
            <div class="flex items-end justify-between mt-3">
              <div>
                <p class="text-3xl font-extrabold text-slate-800">{{ utilizationRate() }}%</p>
                <p class="text-[11px] text-slate-500 font-medium mt-1">{{ asignadoCount() }} activos en operación</p>
              </div>
              <div class="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin-slow"></div>
            </div>
          </div>

          <!-- KPI: Equipos en Mantenimiento (Alerta Púrpura) -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow border-l-4 border-l-violet-500">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">En Mantenimiento</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600">Alerta técnica</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-extrabold text-slate-800">{{ mantenimientoCount() }}</p>
              <p class="text-[11px] text-slate-500 font-medium mt-1">Dispositivos en reparación o revisión técnica</p>
            </div>
          </div>

          <!-- KPI: Equipos de Baja (Alerta Histórica Roja) -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow border-l-4 border-l-rose-500">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados de Baja</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">Descartados</span>
            </div>
            <div class="mt-3">
              <p class="text-3xl font-extrabold text-slate-800">{{ bajaCount() }}</p>
              <p class="text-[11px] text-slate-500 font-medium mt-1">Historial total de equipos dados de baja</p>
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
            <div class="flex items-end justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2">
              <div *ngFor="let item of deviceTypeStacked()"
                   class="flex flex-col items-center gap-2 flex-1 max-w-[120px] group">
                
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
                 class="flex items-end justify-around h-64 px-4 gap-6 border-b border-slate-100 pb-2">
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