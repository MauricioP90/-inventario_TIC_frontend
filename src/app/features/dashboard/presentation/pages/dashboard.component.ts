import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';
import { DashboardMetrics, StateDistribution } from '../../domain/models/dashboard.model';
import { DashboardBannerComponent } from '../components/dashboard-banner.component';
import { DashboardKpisComponent } from '../components/dashboard-kpis.component';
import { DashboardChartsComponent } from '../components/dashboard-charts.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardBannerComponent,
    DashboardKpisComponent,
    DashboardChartsComponent
  ],
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
      @if (loading()) {
        <div class="text-center py-12 text-slate-400 text-sm">
          Cargando métricas…
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {{ error() }}
        </div>
      }

      @if (!loading() && !error()) {
        <!-- Banner Principal: Resumen Detallado de Activos con Filtro Dinámico -->
        <app-dashboard-banner
          [metrics]="metrics()"
          [bannerTypeFilter]="bannerTypeFilter()"
          [bannerModelFilter]="bannerModelFilter()"
          (typeFilterChange)="onBannerTypeChange($event)"
          (modelFilterChange)="onBannerModelChange($event)"
        />

        <!-- Fila de KPIs de Alerta y Operación (6 columnas sincronizadas) -->
        <app-dashboard-kpis
          [activeFilterName]="activeFilterName()"
          [utilizationRate]="utilizationRate()"
          [asignadoCount]="asignadoCount()"
          [disponibleCount]="disponibleCount()"
          [mantenimientoCount]="mantenimientoCount()"
          [bajaCount]="bajaCount()"
          [rechazadoCount]="rechazadoCount()"
          [enTransitoCount]="enTransitoCount()"
          [bannerTypeFilter]="bannerTypeFilter()"
          [bannerModelFilter]="bannerModelFilter()"
        />

        <!-- Sección de Gráficos con Drill-down -->
        <app-dashboard-charts
          [metrics]="metrics()"
        />
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private getDashboardMetricsUC = inject(GetDashboardMetricsUseCase);

  metrics = signal<DashboardMetrics | null>(null);
  loading = signal(true);
  error   = signal<string | null>(null);

  // Filtros dinámicos sincronizados
  bannerTypeFilter  = signal<string | null>(null);
  bannerModelFilter = signal<string | null>(null);

  activeBannerDistribution = computed<StateDistribution>(() => {
    const m = this.metrics();
    const type = this.bannerTypeFilter();
    const model = this.bannerModelFilter();

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

  totalProducts      = computed(() => this.activeBannerDistribution().total);
  disponibleCount    = computed(() => this.activeBannerDistribution().disponible);
  asignadoCount      = computed(() => this.activeBannerDistribution().asignado);
  mantenimientoCount = computed(() => this.activeBannerDistribution().mantenimiento);
  bajaCount          = computed(() => this.activeBannerDistribution().baja);
  enTransitoCount    = computed(() => this.activeBannerDistribution().enTransito);
  rechazadoCount     = computed(() => this.activeBannerDistribution().rechazado);
  activeFilterName   = computed(() => this.bannerModelFilter() ?? this.bannerTypeFilter() ?? null);

  utilizationRate = computed(() => {
    const total = this.totalProducts() - this.bajaCount();
    if (total <= 0) return 0;
    return Math.round((this.asignadoCount() / total) * 100);
  });

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
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

  onBannerTypeChange(type: string | null): void {
    this.bannerTypeFilter.set(type);
    this.bannerModelFilter.set(null);
  }

  onBannerModelChange(model: string | null): void {
    this.bannerModelFilter.set(model);
  }
}