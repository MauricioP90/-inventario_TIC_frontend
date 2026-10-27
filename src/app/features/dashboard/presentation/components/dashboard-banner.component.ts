import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardMetrics, StateDistribution } from '../../domain/models/dashboard.model';

@Component({
  selector: 'app-dashboard-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
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
              <span *ngIf="bannerTypeFilter || bannerModelFilter" 
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
            <select [value]="bannerTypeFilter ?? ''" 
                    (change)="onTypeChange($any($event.target).value)"
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
            <select [value]="bannerModelFilter ?? ''" 
                    [disabled]="!bannerTypeFilter"
                    (change)="onModelChange($any($event.target).value)"
                    class="w-full sm:w-auto appearance-none bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:cursor-not-allowed text-xs text-white font-semibold pl-3 pr-8 py-2 rounded-xl border border-indigo-800/60 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer">
              <option value="" class="bg-slate-900 text-slate-300">
                {{ bannerTypeFilter ? '📱 Todos los Modelos (' + availableBannerModels().length + ')' : '📱 Selecciona Tipo primero' }}
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
          <button *ngIf="bannerTypeFilter || bannerModelFilter"
                  (click)="resetFilter()"
                  title="Volver a la vista global"
                  class="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/80 border border-indigo-700/50 px-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer">
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
  `
})
export class DashboardBannerComponent {
  @Input() set metrics(val: DashboardMetrics | null) {
    this._metrics.set(val);
  }
  get metrics(): DashboardMetrics | null {
    return this._metrics();
  }
  private _metrics = signal<DashboardMetrics | null>(null);

  @Input() bannerTypeFilter: string | null = null;
  @Input() bannerModelFilter: string | null = null;

  @Output() typeFilterChange = new EventEmitter<string | null>();
  @Output() modelFilterChange = new EventEmitter<string | null>();

  availableBannerTypes = computed(() => {
    const byType = this._metrics()?.stateDistributionByType;
    return byType ? Object.keys(byType).sort() : [];
  });

  availableBannerModels = computed(() => {
    const selectedType = this.bannerTypeFilter;
    if (!selectedType) return [];
    const byModel = this._metrics()?.stateDistributionByModel?.[selectedType];
    return byModel ? Object.keys(byModel).sort() : [];
  });

  activeBannerDistribution = computed<StateDistribution>(() => {
    const m = this._metrics();
    const type = this.bannerTypeFilter;
    const model = this.bannerModelFilter;

    if (type && model) {
      const modelDist = m?.stateDistributionByModel?.[type]?.[model];
      if (modelDist) return modelDist;
    }

    if (type) {
      const typeDist = m?.stateDistributionByType?.[type];
      if (typeDist) return typeDist;
    }

    return {
      total: m?.totalCount ?? 0,
      disponible: m?.disponibleCount ?? 0,
      asignado: m?.asignadoCount ?? 0,
      mantenimiento: m?.mantenimientoCount ?? 0,
      baja: m?.bajaCount ?? 0,
      enTransito: m?.enTransitoCount ?? 0,
      rechazado: m?.rechazadoCount ?? 0,
    };
  });

  bannerTotalCount = computed(() => this.activeBannerDistribution().total);

  bannerTitle = computed(() => {
    const type = this.bannerTypeFilter;
    const model = this.bannerModelFilter;
    if (type && model) return `Total ${model}`;
    if (type) return `Total ${type}`;
    return 'Total Productos Registrados';
  });

  bannerSubtitle = computed(() => {
    const type = this.bannerTypeFilter;
    const model = this.bannerModelFilter;
    if (type && model) return `Distribución operativa de ${model} (${type})`;
    if (type) return `Distribución consolidada de la categoría ${type}`;
    return 'Equipos y componentes activos registrados en la plataforma';
  });

  bannerDonutLabel = computed(() => {
    const model = this.bannerModelFilter;
    if (model) return model.length > 9 ? 'Equipos' : model;
    const type = this.bannerTypeFilter;
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

  onTypeChange(type: string): void {
    this.typeFilterChange.emit(type ? type : null);
    this.modelFilterChange.emit(null);
  }

  onModelChange(model: string): void {
    this.modelFilterChange.emit(model ? model : null);
  }

  resetFilter(): void {
    this.typeFilterChange.emit(null);
    this.modelFilterChange.emit(null);
  }
}
