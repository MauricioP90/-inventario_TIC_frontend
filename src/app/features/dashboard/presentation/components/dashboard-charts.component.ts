import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardMetrics } from '../../domain/models/dashboard.model';

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
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
                      class="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all duration-200 group cursor-pointer">
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
                      class="flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all duration-200 group cursor-pointer">
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
                      class="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all duration-200 group cursor-pointer">
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
  `,
  styles: [`
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
export class DashboardChartsComponent {
  @Input() set metrics(val: DashboardMetrics | null) {
    this._metrics.set(val);
  }
  get metrics(): DashboardMetrics | null {
    return this._metrics();
  }
  private _metrics = signal<DashboardMetrics | null>(null);

  /** Drill-down signals para las 3 gráficas */
  drillDownType = signal<string | null>(null);
  drillDownMant = signal<string | null>(null);
  drillDownBaja = signal<string | null>(null);

  /** Flags de animación para cada gráfica */
  chartAnimating     = signal(false);
  chartAnimatingMant = signal(false);
  chartAnimatingBaja = signal(false);

  // ── Gráfico principal: Disponible vs Asignado ──

  deviceTypeStacked = computed(() => {
    const data = this._metrics()?.typeStacked ?? {};
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

    const modelData = this._metrics()?.modelStacked?.[selectedType] ?? {};
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

  // ── Gráfico de Mantenimiento (con drill-down) ──

  mantenimientoDevices = computed(() => {
    const data = this._metrics()?.typeMantenimiento ?? {};
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

    const modelData = this._metrics()?.modelMantenimiento?.[selectedType] ?? {};
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

  // ── Gráfico de Bajas (con drill-down) ──

  bajaDevices = computed(() => {
    const data = this._metrics()?.typeBaja ?? {};
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

    const modelData = this._metrics()?.modelBaja?.[selectedType] ?? {};
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

  // ── Handlers de Drill-down ──

  onBarClick(typeKey: string): void {
    if (this.drillDownType()) return;
    const modelData = this._metrics()?.modelStacked?.[typeKey];
    if (!modelData || Object.keys(modelData).length === 0) return;
    this.triggerAnimation('main');
    this.drillDownType.set(typeKey);
  }

  clearDrillDown(): void {
    this.triggerAnimation('main');
    this.drillDownType.set(null);
  }

  onMantBarClick(typeKey: string): void {
    if (this.drillDownMant()) return;
    const modelData = this._metrics()?.modelMantenimiento?.[typeKey];
    if (!modelData || Object.keys(modelData).length === 0) return;
    this.triggerAnimation('mant');
    this.drillDownMant.set(typeKey);
  }

  clearDrillDownMant(): void {
    this.triggerAnimation('mant');
    this.drillDownMant.set(null);
  }

  onBajaBarClick(typeKey: string): void {
    if (this.drillDownBaja()) return;
    const modelData = this._metrics()?.modelBaja?.[typeKey];
    if (!modelData || Object.keys(modelData).length === 0) return;
    this.triggerAnimation('baja');
    this.drillDownBaja.set(typeKey);
  }

  clearDrillDownBaja(): void {
    this.triggerAnimation('baja');
    this.drillDownBaja.set(null);
  }

  private triggerAnimation(chart: 'main' | 'mant' | 'baja'): void {
    const sig = chart === 'main' ? this.chartAnimating
              : chart === 'mant' ? this.chartAnimatingMant
              : this.chartAnimatingBaja;
    sig.set(true);
    setTimeout(() => sig.set(false), 400);
  }
}
